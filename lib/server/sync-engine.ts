/**
 * Server sync engine (spec §7.2 poll / §5 scoring / §7.3 stale policy).
 * Pure-policy helpers live in lib/sync.ts, lib/week.ts, lib/ranks.ts —
 * this module wires them to Supabase + LeetCode.
 */
import { createServiceClient } from "@/lib/supabase/server";
import {
  fetchMatchedUser,
  fetchQuestionDifficulty,
  fetchRecentAc,
  LeetCodeError,
  type RecentAc,
} from "@/lib/leetcode";
import { backoffMs, isNewerThanCursor, syncHealth, toSolveRow } from "@/lib/sync";
import { nextStreak, utcDayString, weekStartUTC } from "@/lib/week";
import { baseRankForXp, scoreCountedSolve } from "@/lib/ranks";
import type { Difficulty, SyncStatus } from "@/lib/types";
import { postEventToUserGroups } from "./events";

type Db = ReturnType<typeof createServiceClient>;

export interface SyncResult {
  user_id: string;
  status: string;
  fetched: number;
  counted: number;
  xp_gained: number;
}

const META_TTL_MS = 30 * 24 * 3_600_000; // problem_meta 30-day refresh
const FROZEN_BACKFILL_LIMIT = 100;

async function resolveDifficulty(
  db: Db,
  slug: string
): Promise<{ diff: Difficulty; title: string | null }> {
  const { data: cached } = await db.from("problem_meta").select("*").eq("slug", slug).single();
  if (cached && Date.now() - Date.parse((cached as { updated_at: string }).updated_at) < META_TTL_MS) {
    const c = cached as { difficulty: Difficulty; title: string };
    return { diff: c.difficulty, title: c.title };
  }
  const q = await fetchQuestionDifficulty(slug);
  await db.from("problem_meta").upsert({
    slug,
    title: q.title,
    difficulty: q.difficulty,
    updated_at: new Date().toISOString(),
  });
  return { diff: q.difficulty, title: q.title };
}

async function markRateLimited(db: Db, userId: string, err: LeetCodeError, requestedBy?: string) {
  // consecutive rate-limit count → backoff 5m → 30m → 2h. NOT frozen (§7.3).
  const { count } = await db
    .from("sync_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "rate_limited")
    .gt("started_at", new Date(Date.now() - 24 * 3_600_000).toISOString());
  const retryAt = new Date(Date.now() + backoffMs(count ?? 0)).toISOString();
  await db
    .from("profiles")
    .update({ sync_status: "rate_limited" as SyncStatus, retry_at: retryAt })
    .eq("auth_user_id", userId);
  await db.from("sync_logs").insert({
    user_id: userId,
    requested_by: requestedBy ?? null,
    status: "rate_limited",
    error: err.message,
    fetched: 0,
  });
}

async function markFrozen(
  db: Db,
  userId: string,
  reason: string,
  status: "auth_error" | "not_found" | "private" | "error",
  requestedBy?: string
) {
  await db
    .from("profiles")
    .update({
      sync_status: "frozen" as SyncStatus,
      frozen_reason: reason,
      retry_at: null,
    })
    .eq("auth_user_id", userId);
  await db.from("sync_logs").insert({
    user_id: userId,
    requested_by: requestedBy ?? null,
    status,
    error: reason,
    fetched: 0,
  });
  await postEventToUserGroups(db, userId, "frozen", `❄️ @${userId.slice(0, 8)} froze — ${reason}`, {
    reason,
  });
}

/**
 * Full sync for one profile. Idempotent; safe to run concurrently-ish
 * (cursor + submission_id upsert dedupe). Returns counted weekly solves.
 */
export async function syncUser(
  db: Db,
  authUserId: string,
  opts: { requestedBy?: string; force?: boolean } = {}
): Promise<SyncResult> {
  const { data: prow } = await db.from("profiles").select("*").eq("auth_user_id", authUserId).single();
  const profile = prow as unknown as null | {
    auth_user_id: string;
    lc_username: string | null;
    xp: number;
    streak: number;
    streak_last_date: string | null;
    week_start: string;
    sync_status: SyncStatus;
    sync_cursor_ts: number;
    sync_cursor_id: string;
  };
  if (!profile || !profile.lc_username) {
    await markFrozen(db, authUserId, "no_username", "error", opts.requestedBy);
    return { user_id: authUserId, status: "error", fetched: 0, counted: 0, xp_gained: 0 };
  }

  let recent: RecentAc[];
  try {
    // Cheap liveness/auth probe first (also refreshes nothing).
    await fetchMatchedUser(profile.lc_username);
    recent = await fetchRecentAc(profile.lc_username, 50);
  } catch (e) {
    if (e instanceof LeetCodeError && e.kind === "rate_limited") {
      await markRateLimited(db, authUserId, e, opts.requestedBy);
      return { user_id: authUserId, status: "rate_limited", fetched: 0, counted: 0, xp_gained: 0 };
    }
    if (e instanceof LeetCodeError && (e.kind === "not_found" || e.kind === "private")) {
      const reason = e.kind === "not_found" ? "username_not_found" : "private";
      await markFrozen(db, authUserId, reason, e.kind, opts.requestedBy);
      return { user_id: authUserId, status: "frozen", fetched: 0, counted: 0, xp_gained: 0 };
    }
    await markRateLimited(db, authUserId, new LeetCodeError("network", (e as Error).message), opts.requestedBy);
    return { user_id: authUserId, status: "rate_limited", fetched: 0, counted: 0, xp_gained: 0 };
  }

  const wasFrozen = profile.sync_status === "frozen";
  let fresh = recent.filter((s) =>
    isNewerThanCursor(s.timestampSec, s.submissionId, profile.sync_cursor_ts, profile.sync_cursor_id)
  );
  // Frozen backfill limit 100 (§7.2); live path is naturally ≤50/page.
  if (wasFrozen) fresh = fresh.slice(0, FROZEN_BACKFILL_LIMIT);
  // Process oldest-first so streak/XP accrue chronologically.
  fresh.sort((a, b) => a.timestampSec - b.timestampSec || (a.submissionId < b.submissionId ? -1 : 1));

  if (fresh.length === 0) {
    const now = Date.now();
    const health = syncHealth({ lastSyncAtMs: now, prevStatus: undefined });
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const brokenStreak = profile.streak_last_date && profile.streak_last_date < yesterday;
    await db
      .from("profiles")
      .update({
        last_sync_at: new Date(now).toISOString(),
        sync_status: health.status,
        frozen_reason: null,
        retry_at: null,
        ...(brokenStreak && profile.streak > 0 ? { streak: 0 } : {}),
      })
      .eq("auth_user_id", authUserId);
    await db.from("sync_logs").insert({
      user_id: authUserId,
      requested_by: opts.requestedBy ?? null,
      status: "ok",
      fetched: 0,
    });
    return { user_id: authUserId, status: "ok", fetched: 0, counted: 0, xp_gained: 0 };
  }

  // Batch slug lookups for first-ever + weekly-seen.
  const slugs = [...new Set(fresh.map((s) => s.slug))];
  const { data: existing } = await db.from("solves").select("slug").eq("user_id", authUserId).in("slug", slugs);
  const everSeen = new Set((existing ?? []).map((r) => (r as { slug: string }).slug));

  const thisWeek = weekStartUTC(new Date());
  const { data: weekRows } = await db
    .from("solves")
    .select("slug")
    .eq("user_id", authUserId)
    .eq("week_start", thisWeek);
  const seenThisWeek = new Set((weekRows ?? []).map((r) => (r as { slug: string }).slug));

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
      meta = await resolveDifficulty(db, sub.slug);
    } catch {
      continue; // unknown slug — skip, retry next poll (no cursor advance past it? advance anyway to avoid wedge)
    }
    const row = toSolveRow(authUserId, sub, meta.diff, meta.title);
    const { error: upErr } = await db.from("solves").upsert(row, { onConflict: "submission_id" });
    if (upErr) continue;

    // Advance cursor past everything we ingested.
    if (isNewerThanCursor(sub.timestampSec, sub.submissionId, cursorTs, cursorId)) {
      cursorTs = sub.timestampSec;
      cursorId = sub.submissionId;
    }

    // Advance streak chronologically for every solve.
    const solveDay = utcDayString(row.solved_at);
    const nxt = nextStreak(streak, streakLast, solveDay);
    streak = nxt.streak;
    streakLast = nxt.streak_last_date;

    const isFirstEver = !everSeen.has(sub.slug) && !batchSeenEver.has(sub.slug);
    if (isFirstEver) {
      batchSeenEver.add(sub.slug);
    }

    // Scoring: distinct slug per UTC week (§5). Cross-week repeats count weekly and earn practice XP.
    const solveWeek = weekStartUTC(row.solved_at);
    if (solveWeek === thisWeek) {
      if (!seenThisWeek.has(sub.slug)) {
        seenThisWeek.add(sub.slug);
        counted++;
        xpGain += scoreCountedSolve({ difficulty: meta.diff, isFirstEver, streakAtSolve: streak });
      }
    } else if (isFirstEver) {
      // Solves from previous week backfill earn base XP if first-ever
      xpGain += scoreCountedSolve({ difficulty: meta.diff, isFirstEver: true, streakAtSolve: streak });
    }
  }

  // Recompute weekly aggregates from source of truth (distinct slugs).
  const { data: allWeek } = await db
    .from("solves")
    .select("slug, diff")
    .eq("user_id", authUserId)
    .eq("week_start", thisWeek);
  const distinct = new Map<string, Difficulty>();
  for (const r of (allWeek ?? []) as { slug: string; diff: Difficulty }[]) {
    if (!distinct.has(r.slug)) distinct.set(r.slug, r.diff);
  }
  const weeklyCount = distinct.size;
  const weeklyHards = [...distinct.values()].filter((d) => d === "Hard").length;

  const { data: cur } = await db.from("profiles").select("xp, base_rank").eq("auth_user_id", authUserId).single();
  const curXp = (cur as { xp: number } | null)?.xp ?? profile.xp;
  const newXp = curXp + xpGain;
  const newRank = baseRankForXp(newXp);
  const prevRank = (cur as { base_rank: string } | null)?.base_rank ?? "Academy";

  const nowIso = new Date().toISOString();
  await db
    .from("profiles")
    .update({
      xp: newXp,
      base_rank: newRank,
      streak,
      streak_last_date: streakLast,
      weekly_count: weeklyCount,
      weekly_hards: weeklyHards,
      week_start: thisWeek,
      last_sync_at: nowIso,
      sync_status: "live" as SyncStatus,
      frozen_reason: null,
      retry_at: null,
      sync_cursor_ts: cursorTs,
      sync_cursor_id: cursorId,
    })
    .eq("auth_user_id", authUserId);

  await db.from("sync_logs").insert({
    user_id: authUserId,
    requested_by: opts.requestedBy ?? null,
    status: "ok",
    fetched: fresh.length,
  });

  if (newRank !== prevRank) {
    await postEventToUserGroups(db, authUserId, "rank_up", `⚔️ Rank up → ${newRank}!`, {
      from: prevRank,
      to: newRank,
    });
  }

  // Goal-hit feed (once per group per week): card bar = weekly_count / group_goal.
  if (counted > 0) {
    try {
      const { data: ugs } = await db
        .from("memberships")
        .select("group_id, groups(id, name, goal)")
        .eq("user_id", authUserId);
      const { postEvent } = await import("./events");
      for (const m of (ugs ?? []) as { group_id: string; groups: { name: string; goal: number } | { name: string; goal: number }[] }[]) {
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        if (!g || weeklyCount < g.goal) continue;
        const { data: already } = await db
          .from("events")
          .select("id")
          .eq("group_id", m.group_id)
          .eq("type", "goal_hit")
          .eq("actor_id", authUserId)
          .gte("created_at", new Date(thisWeek + "T00:00:00Z").toISOString())
          .limit(1);
        if (already && already.length) continue;
        await postEvent(db, m.group_id, "goal_hit",
          `🎯 Weekly goal smashed: ${weeklyCount}/${g.goal} in ${g.name}!`, authUserId,
          { weekly_count: weeklyCount, goal: g.goal, week: thisWeek });
      }
    } catch {
      /* feed is advisory */
    }
  }

  return { user_id: authUserId, status: "ok", fetched: fresh.length, counted, xp_gained: xpGain };
}

/** Hourly worker selection: last success >60min ago (jitter ±10min), oldest first, batch N. */
export async function dueProfiles(db: Db, batchSize: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data } = await db
    .from("profiles")
    .select("auth_user_id, last_sync_at")
    .not("lc_username", "is", null)
    .or(`last_sync_at.is.null,last_sync_at.lt.${cutoff}`)
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(batchSize * 3); // oversample, then jitter-filter
  const rows = (data ?? []) as { auth_user_id: string; last_sync_at: string | null }[];
  // ±10min jitter: skip ~1/6 randomly-adjacent? Deterministic: hash-based so cron is stable.
  const eligible = rows.filter((r) => {
    if (!r.last_sync_at) return true;
    const ageMin = (Date.now() - Date.parse(r.last_sync_at)) / 60_000;
    const jitter = hashJitter(r.auth_user_id); // -10..+10
    return ageMin >= 60 + jitter;
  });
  return eligible.slice(0, batchSize).map((r) => r.auth_user_id);
}

function hashJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 200;
  return (h % 21) - 10; // -10..+10
}

/** Run pool with concurrency N (spec §7.2: batch 20, concurrency 5). */
export async function runPool<T>(items: T[], concurrency: number, fn: (t: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      try {
        await fn(item);
      } catch {
        /* per-user errors already logged inside syncUser */
      }
    }
  });
  await Promise.all(workers);
}
