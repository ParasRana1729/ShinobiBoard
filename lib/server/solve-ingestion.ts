/**
 * Deep Solve Ingestion and Freshness Engine (spec §5, §7.2, §7.3).
 *
 * Encapsulates solve ingestion, intra-week deduplication, chronological streak
 * accrual, spaced-repetition practice XP, difficulty caching, cursor progression,
 * and account freshness state transitions behind a single deep interface.
 *
 * Architecture:
 * - Module: SolveIngestor
 * - Seams: StorageAdapter (Supabase / In-Memory) and UpstreamAdapter (LeetCode / Mock)
 */

import type { Difficulty, Profile, SyncStatus } from "../types";
import { backoffMs, isNewerThanCursor, syncHealth, toSolveRow } from "../sync";
import { nextStreak, utcDayString, weekStartUTC } from "../week";
import { baseRankForXp, scoreCountedSolve } from "../ranks";
import {
  fetchMatchedUser,
  fetchQuestionDifficulty,
  fetchRecentAc,
  getDailyCodingChallenge,
  LeetCodeError,
  type RecentAc,
} from "../leetcode";
import type { createServiceClient } from "../supabase/server";

export interface SyncResult {
  user_id: string;
  status: string;
  fetched: number;
  counted: number;
  xp_gained: number;
}

export interface ProblemDifficultyMeta {
  difficulty: Difficulty;
  title: string | null;
  updatedAt: string;
}

export interface UserGroupGoal {
  groupId: string;
  name: string;
  goal: number;
}

export interface SolveRecord {
  submission_id: string;
  user_id: string;
  slug: string;
  diff: Difficulty;
  lang: string;
  title: string | null;
  solved_at: string;
  week_start: string;
}

export interface SyncLogEntry {
  user_id: string;
  requested_by: string | null;
  status: string;
  error?: string;
  fetched: number;
}

/**
 * Storage Adapter Seam:
 * Mediates reading and persisting profiles, solves, difficulty cache, and logs.
 */
export interface StorageAdapter {
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, updates: Partial<Profile>): Promise<void>;
  getExistingSlugs(userId: string, slugs: string[]): Promise<Set<string>>;
  getWeekSlugs(userId: string, weekStart: string): Promise<Map<string, Difficulty>>;
  upsertSolve(row: SolveRecord): Promise<boolean>;
  getCachedDifficulty(slug: string): Promise<ProblemDifficultyMeta | null>;
  setCachedDifficulty(slug: string, title: string | null, difficulty: Difficulty): Promise<void>;
  getRecentRateLimitCount(userId: string): Promise<number>;
  recordSyncLog(entry: SyncLogEntry): Promise<void>;
  getUserGroups(userId: string): Promise<UserGroupGoal[]>;
  hasGoalEventThisWeek(groupId: string, userId: string, weekStart: string): Promise<boolean>;
  postEvent(
    groupId: string,
    type: string,
    text: string,
    actorId: string | null,
    payload?: Record<string, unknown>
  ): Promise<void>;
  postEventToUserGroups(
    userId: string,
    type: string,
    text: string,
    payload?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * Upstream Adapter Seam:
 * Mediates external communication with LeetCode GraphQL endpoints.
 */
export interface UpstreamAdapter {
  fetchMatchedUser(username: string): Promise<{ username: string; aboutMe: string | null }>;
  fetchRecentAc(username: string, limit: number): Promise<RecentAc[]>;
  fetchQuestionDifficulty(slug: string): Promise<{ title: string; difficulty: Difficulty }>;
  getDailyCodingChallenge(): Promise<{
    date: string;
    question: { title: string; titleSlug: string; difficulty: Difficulty };
  } | null>;
}

const META_TTL_MS = 30 * 24 * 3_600_000; // 30-day problem_meta refresh
const FROZEN_BACKFILL_LIMIT = 100;

/**
 * Deep Solve Ingestor:
 * Single interface (`ingestUserSolves`), hiding the state machine, streak logic,
 * deduplication, difficulty resolution, and scoring calculations behind the seam.
 */
export class SolveIngestor {
  constructor(
    private storage: StorageAdapter,
    private upstream: UpstreamAdapter
  ) {}

  private async resolveDifficulty(slug: string): Promise<{ diff: Difficulty; title: string | null }> {
    const cached = await this.storage.getCachedDifficulty(slug);
    if (cached && Date.now() - Date.parse(cached.updatedAt) < META_TTL_MS) {
      return { diff: cached.difficulty, title: cached.title };
    }
    const q = await this.upstream.fetchQuestionDifficulty(slug);
    await this.storage.setCachedDifficulty(slug, q.title, q.difficulty);
    return { diff: q.difficulty, title: q.title };
  }

  private async markRateLimited(userId: string, err: LeetCodeError, requestedBy?: string): Promise<void> {
    const count = await this.storage.getRecentRateLimitCount(userId);
    const retryAt = new Date(Date.now() + backoffMs(count)).toISOString();
    await this.storage.updateProfile(userId, {
      sync_status: "rate_limited" as SyncStatus,
      retry_at: retryAt,
    });
    await this.storage.recordSyncLog({
      user_id: userId,
      requested_by: requestedBy ?? null,
      status: "rate_limited",
      error: err.message,
      fetched: 0,
    });
  }

  private async markFrozen(
    userId: string,
    reason: string,
    status: "auth_error" | "not_found" | "private" | "error",
    requestedBy?: string
  ): Promise<void> {
    await this.storage.updateProfile(userId, {
      sync_status: "frozen" as SyncStatus,
      frozen_reason: reason,
      retry_at: null,
    });
    await this.storage.recordSyncLog({
      user_id: userId,
      requested_by: requestedBy ?? null,
      status,
      error: reason,
      fetched: 0,
    });
    await this.storage.postEventToUserGroups(
      userId,
      "frozen",
      `❄️ @${userId.slice(0, 8)} froze — ${reason}`,
      { reason }
    );
  }

  /**
   * Primary module interface:
   * Ingests recent LeetCode solves for a user, updates streak chronologically,
   * accrues XP with practice XP and dynamic streak bonus, advances composite cursor,
   * and transitions freshness status.
   */
  async ingestUserSolves(
    authUserId: string,
    opts: { requestedBy?: string; force?: boolean; now?: Date } = {}
  ): Promise<SyncResult> {
    const now = opts.now ?? new Date();
    const profile = await this.storage.getProfile(authUserId);

    if (!profile || !profile.lc_username) {
      await this.markFrozen(authUserId, "no_username", "error", opts.requestedBy);
      return { user_id: authUserId, status: "error", fetched: 0, counted: 0, xp_gained: 0 };
    }

    let recent: RecentAc[];
    try {
      // Cheap liveness/auth probe first
      await this.upstream.fetchMatchedUser(profile.lc_username);
      recent = await this.upstream.fetchRecentAc(profile.lc_username, 50);
    } catch (e) {
      if (e instanceof LeetCodeError && e.kind === "rate_limited") {
        await this.markRateLimited(authUserId, e, opts.requestedBy);
        return { user_id: authUserId, status: "rate_limited", fetched: 0, counted: 0, xp_gained: 0 };
      }
      if (e instanceof LeetCodeError && (e.kind === "not_found" || e.kind === "private")) {
        const reason = e.kind === "not_found" ? "username_not_found" : "private";
        await this.markFrozen(authUserId, reason, e.kind, opts.requestedBy);
        return { user_id: authUserId, status: "frozen", fetched: 0, counted: 0, xp_gained: 0 };
      }
      await this.markRateLimited(
        authUserId,
        new LeetCodeError("network", (e as Error).message),
        opts.requestedBy
      );
      return { user_id: authUserId, status: "rate_limited", fetched: 0, counted: 0, xp_gained: 0 };
    }

    const wasFrozen = profile.sync_status === "frozen";
    let fresh = recent.filter((s) =>
      isNewerThanCursor(s.timestampSec, s.submissionId, profile.sync_cursor_ts, profile.sync_cursor_id)
    );
    if (wasFrozen) fresh = fresh.slice(0, FROZEN_BACKFILL_LIMIT);

    // Process oldest-first so streak and XP accrue chronologically
    fresh.sort((a, b) => a.timestampSec - b.timestampSec || (a.submissionId < b.submissionId ? -1 : 1));

    if (fresh.length === 0) {
      const nowMs = now.getTime();
      const health = syncHealth({ lastSyncAtMs: nowMs, nowMs, prevStatus: undefined });
      const yesterday = new Date(nowMs - 86_400_000).toISOString().slice(0, 10);
      const brokenStreak = profile.streak_last_date && profile.streak_last_date < yesterday;

      await this.storage.updateProfile(authUserId, {
        last_sync_at: now.toISOString(),
        sync_status: health.status,
        frozen_reason: null,
        retry_at: null,
        ...(brokenStreak && profile.streak > 0 ? { streak: 0 } : {}),
      });

      await this.storage.recordSyncLog({
        user_id: authUserId,
        requested_by: opts.requestedBy ?? null,
        status: "ok",
        fetched: 0,
      });

      return { user_id: authUserId, status: "ok", fetched: 0, counted: 0, xp_gained: 0 };
    }

    // Deduplication lookups
    const slugs = [...new Set(fresh.map((s) => s.slug))];
    const everSeen = await this.storage.getExistingSlugs(authUserId, slugs);

    const thisWeek = weekStartUTC(now);
    const existingWeekMap = await this.storage.getWeekSlugs(authUserId, thisWeek);
    const seenThisWeek = new Set(existingWeekMap.keys());

    let streak = profile.streak;
    let streakLast = profile.streak_last_date;
    let xpGain = 0;
    let counted = 0;
    let cursorTs = profile.sync_cursor_ts;
    let cursorId = profile.sync_cursor_id;
    const batchSeenEver = new Set<string>();

    for (const sub of fresh) {
      let meta: { diff: Difficulty; title: string | null };
      try {
        meta = await this.resolveDifficulty(sub.slug);
      } catch {
        continue; // skip unknown slug
      }

      const row = toSolveRow(authUserId, sub, meta.diff, meta.title);
      const ok = await this.storage.upsertSolve(row);
      if (!ok) continue;

      if (isNewerThanCursor(sub.timestampSec, sub.submissionId, cursorTs, cursorId)) {
        cursorTs = sub.timestampSec;
        cursorId = sub.submissionId;
      }

      // Advance streak chronologically for each solve
      const solveDay = utcDayString(row.solved_at);
      const nxt = nextStreak(streak, streakLast, solveDay);
      streak = nxt.streak;
      streakLast = nxt.streak_last_date;

      const isFirstEver = !everSeen.has(sub.slug) && !batchSeenEver.has(sub.slug);
      if (isFirstEver) {
        batchSeenEver.add(sub.slug);
      }

      // Intra-week deduplication vs cross-week repeat scoring (§5)
      const solveWeek = weekStartUTC(row.solved_at);
      if (solveWeek === thisWeek) {
        if (!seenThisWeek.has(sub.slug)) {
          seenThisWeek.add(sub.slug);
          counted++;
          xpGain += scoreCountedSolve({ difficulty: meta.diff, isFirstEver, streakAtSolve: streak });
        }
      } else if (isFirstEver) {
        xpGain += scoreCountedSolve({ difficulty: meta.diff, isFirstEver: true, streakAtSolve: streak });
      }
    }

    // Recompute weekly aggregates from source of truth
    const finalWeekMap = await this.storage.getWeekSlugs(authUserId, thisWeek);
    const weeklyCount = finalWeekMap.size;
    const weeklyHards = [...finalWeekMap.values()].filter((d) => d === "Hard").length;

    const curProfile = (await this.storage.getProfile(authUserId)) ?? profile;
    const curXp = curProfile.xp;
    const newXp = curXp + xpGain;
    const newRank = baseRankForXp(newXp);
    const prevRank = curProfile.base_rank ?? "Academy";

    await this.storage.updateProfile(authUserId, {
      xp: newXp,
      base_rank: newRank,
      streak,
      streak_last_date: streakLast,
      weekly_count: weeklyCount,
      weekly_hards: weeklyHards,
      week_start: thisWeek,
      last_sync_at: now.toISOString(),
      sync_status: "live" as SyncStatus,
      frozen_reason: null,
      retry_at: null,
      sync_cursor_ts: cursorTs,
      sync_cursor_id: cursorId,
    });

    await this.storage.recordSyncLog({
      user_id: authUserId,
      requested_by: opts.requestedBy ?? null,
      status: "ok",
      fetched: fresh.length,
    });

    if (newRank !== prevRank) {
      await this.storage.postEventToUserGroups(
        authUserId,
        "rank_up",
        `⚔️ Rank up → ${newRank}!`,
        { from: prevRank, to: newRank }
      );
    }

    if (counted > 0) {
      try {
        const userGroups = await this.storage.getUserGroups(authUserId);
        for (const g of userGroups) {
          if (weeklyCount < g.goal) continue;
          const already = await this.storage.hasGoalEventThisWeek(g.groupId, authUserId, thisWeek);
          if (already) continue;
          await this.storage.postEvent(
            g.groupId,
            "goal_hit",
            `🎯 Weekly goal smashed: ${weeklyCount}/${g.goal} in ${g.name}!`,
            authUserId,
            { weekly_count: weeklyCount, goal: g.goal, week: thisWeek }
          );
        }
      } catch {
        /* feed is advisory */
      }
    }

    // Daily Shinobi Bounty feed event
    if (fresh.length > 0) {
      try {
        const daily = await this.upstream.getDailyCodingChallenge();
        if (daily) {
          const todayUtc = now.toISOString().slice(0, 10);
          const solvedBounty = fresh.find((s) => {
            if (s.slug !== daily.question.titleSlug) return false;
            const sDay = new Date(s.timestampSec * 1000).toISOString().slice(0, 10);
            return sDay === todayUtc;
          });
          if (solvedBounty) {
            await this.storage.postEventToUserGroups(
              authUserId,
              "goal_hit",
              `🎯 Claimed today's Shinobi Bounty: ${daily.question.title}!`,
              { bounty: true, slug: daily.question.titleSlug, title: daily.question.title }
            );
          }
        }
      } catch {
        /* feed is advisory */
      }
    }

    return { user_id: authUserId, status: "ok", fetched: fresh.length, counted, xp_gained: xpGain };
  }
}

/**
 * Production Storage Adapter:
 * Uses Supabase Service Role client.
 */
type Db = ReturnType<typeof createServiceClient>;

export class SupabaseStorageAdapter implements StorageAdapter {
  constructor(private db: Db) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data } = await this.db.from("profiles").select("*").eq("auth_user_id", userId).single();
    return (data as Profile) ?? null;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
    await this.db.from("profiles").update(updates).eq("auth_user_id", userId);
  }

  async getExistingSlugs(userId: string, slugs: string[]): Promise<Set<string>> {
    if (!slugs.length) return new Set();
    const { data } = await this.db.from("solves").select("slug").eq("user_id", userId).in("slug", slugs);
    return new Set(((data ?? []) as { slug: string }[]).map((r) => r.slug));
  }

  async getWeekSlugs(userId: string, weekStart: string): Promise<Map<string, Difficulty>> {
    const { data } = await this.db
      .from("solves")
      .select("slug, diff")
      .eq("user_id", userId)
      .eq("week_start", weekStart);
    const map = new Map<string, Difficulty>();
    for (const r of (data ?? []) as { slug: string; diff: Difficulty }[]) {
      if (!map.has(r.slug)) map.set(r.slug, r.diff);
    }
    return map;
  }

  async upsertSolve(row: SolveRecord): Promise<boolean> {
    const { error } = await this.db.from("solves").upsert(row, { onConflict: "submission_id" });
    return !error;
  }

  async getCachedDifficulty(slug: string): Promise<ProblemDifficultyMeta | null> {
    const { data } = await this.db.from("problem_meta").select("*").eq("slug", slug).single();
    if (!data) return null;
    const row = data as { difficulty: Difficulty; title: string | null; updated_at: string };
    return { difficulty: row.difficulty, title: row.title, updatedAt: row.updated_at };
  }

  async setCachedDifficulty(slug: string, title: string | null, difficulty: Difficulty): Promise<void> {
    await this.db.from("problem_meta").upsert({
      slug,
      title,
      difficulty,
      updated_at: new Date().toISOString(),
    });
  }

  async getRecentRateLimitCount(userId: string): Promise<number> {
    const { count } = await this.db
      .from("sync_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "rate_limited")
      .gt("started_at", new Date(Date.now() - 24 * 3_600_000).toISOString());
    return count ?? 0;
  }

  async recordSyncLog(entry: SyncLogEntry): Promise<void> {
    await this.db.from("sync_logs").insert(entry);
  }

  async getUserGroups(userId: string): Promise<UserGroupGoal[]> {
    const { data } = await this.db
      .from("memberships")
      .select("group_id, groups(id, name, goal)")
      .eq("user_id", userId);
    const groups: UserGroupGoal[] = [];
    for (const m of (data ?? []) as { group_id: string; groups: { id: string; name: string; goal: number } | { id: string; name: string; goal: number }[] }[]) {
      const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
      if (g) groups.push({ groupId: m.group_id, name: g.name, goal: g.goal });
    }
    return groups;
  }

  async hasGoalEventThisWeek(groupId: string, userId: string, weekStart: string): Promise<boolean> {
    const { data } = await this.db
      .from("events")
      .select("id")
      .eq("group_id", groupId)
      .eq("type", "goal_hit")
      .eq("actor_id", userId)
      .gte("created_at", new Date(weekStart + "T00:00:00Z").toISOString())
      .limit(1);
    return !!(data && data.length > 0);
  }

  async postEvent(
    groupId: string,
    type: string,
    text: string,
    actorId: string | null = null,
    payload: Record<string, unknown> = {}
  ): Promise<void> {
    const { postEvent } = await import("./events");
    await postEvent(this.db, groupId, type as any, text, actorId, payload);
  }

  async postEventToUserGroups(
    userId: string,
    type: string,
    text: string,
    payload: Record<string, unknown> = {}
  ): Promise<void> {
    const { postEventToUserGroups } = await import("./events");
    await postEventToUserGroups(this.db, userId, type as any, text, payload);
  }
}

/**
 * Production Live LeetCode Adapter:
 * Uses real LeetCode GraphQL client.
 */
export class LiveLeetCodeAdapter implements UpstreamAdapter {
  fetchMatchedUser(username: string) {
    return fetchMatchedUser(username);
  }
  fetchRecentAc(username: string, limit: number) {
    return fetchRecentAc(username, limit);
  }
  fetchQuestionDifficulty(slug: string) {
    return fetchQuestionDifficulty(slug);
  }
  getDailyCodingChallenge() {
    return getDailyCodingChallenge();
  }
}

/**
 * In-Memory Storage Adapter for Unit Tests:
 * Fulfills the storage seam without external dependencies.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  profiles = new Map<string, Profile>();
  solves: SolveRecord[] = [];
  problemMeta = new Map<string, ProblemDifficultyMeta>();
  syncLogs: SyncLogEntry[] = [];
  groups: UserGroupGoal[] = [];
  events: {
    groupId: string;
    type: string;
    text: string;
    actorId: string | null;
    payload?: Record<string, unknown>;
    createdAt: string;
  }[] = [];

  async getProfile(userId: string): Promise<Profile | null> {
    const p = this.profiles.get(userId);
    return p ? { ...p } : null;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
    const cur = this.profiles.get(userId);
    if (cur) {
      this.profiles.set(userId, { ...cur, ...updates });
    }
  }

  async getExistingSlugs(userId: string, slugs: string[]): Promise<Set<string>> {
    const match = new Set<string>();
    const slugSet = new Set(slugs);
    for (const s of this.solves) {
      if (s.user_id === userId && slugSet.has(s.slug)) {
        match.add(s.slug);
      }
    }
    return match;
  }

  async getWeekSlugs(userId: string, weekStart: string): Promise<Map<string, Difficulty>> {
    const map = new Map<string, Difficulty>();
    for (const s of this.solves) {
      if (s.user_id === userId && s.week_start === weekStart) {
        if (!map.has(s.slug)) map.set(s.slug, s.diff);
      }
    }
    return map;
  }

  async upsertSolve(row: SolveRecord): Promise<boolean> {
    const idx = this.solves.findIndex(
      (s) => s.submission_id === row.submission_id
    );
    if (idx >= 0) {
      this.solves[idx] = row;
    } else {
      this.solves.push(row);
    }
    return true;
  }

  async getCachedDifficulty(slug: string): Promise<ProblemDifficultyMeta | null> {
    return this.problemMeta.get(slug) ?? null;
  }

  async setCachedDifficulty(slug: string, title: string | null, difficulty: Difficulty): Promise<void> {
    this.problemMeta.set(slug, {
      difficulty,
      title,
      updatedAt: new Date().toISOString(),
    });
  }

  async getRecentRateLimitCount(userId: string): Promise<number> {
    return this.syncLogs.filter(
      (l) => l.user_id === userId && l.status === "rate_limited"
    ).length;
  }

  async recordSyncLog(entry: SyncLogEntry): Promise<void> {
    this.syncLogs.push(entry);
  }

  async getUserGroups(_userId: string): Promise<UserGroupGoal[]> {
    return [...this.groups];
  }

  async hasGoalEventThisWeek(groupId: string, userId: string, weekStart: string): Promise<boolean> {
    const startMs = Date.parse(weekStart + "T00:00:00Z");
    return this.events.some(
      (e) =>
        e.groupId === groupId &&
        e.type === "goal_hit" &&
        e.actorId === userId &&
        Date.parse(e.createdAt) >= startMs
    );
  }

  async postEvent(
    groupId: string,
    type: string,
    text: string,
    actorId: string | null,
    payload?: Record<string, unknown>
  ): Promise<void> {
    this.events.push({
      groupId,
      type,
      text,
      actorId,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  async postEventToUserGroups(
    userId: string,
    type: string,
    text: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    for (const g of this.groups) {
      await this.postEvent(g.groupId, type, text, userId, payload);
    }
  }
}

/**
 * Fixture Upstream Adapter for Unit Tests:
 * Provides deterministic submissions and controlled error simulation.
 */
export class FixtureLeetCodeAdapter implements UpstreamAdapter {
  recentSolves: RecentAc[] = [];
  difficulties = new Map<string, { title: string; difficulty: Difficulty }>();
  dailyBounty: { date: string; question: { title: string; titleSlug: string; difficulty: Difficulty } } | null = null;
  errorToThrow: Error | null = null;

  async fetchMatchedUser(username: string) {
    if (this.errorToThrow) throw this.errorToThrow;
    return { username, aboutMe: "verified" };
  }

  async fetchRecentAc(_username: string, _limit: number) {
    if (this.errorToThrow) throw this.errorToThrow;
    return [...this.recentSolves];
  }

  async fetchQuestionDifficulty(slug: string) {
    const d = this.difficulties.get(slug);
    if (!d) return { title: slug, difficulty: "Medium" as Difficulty };
    return d;
  }

  async getDailyCodingChallenge() {
    return this.dailyBounty;
  }
}
