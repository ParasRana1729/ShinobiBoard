/**
 * Sync-engine pure helpers (spec §7.2 / §7.3).
 * DB writes + LeetCode fetches live in API routes; this module keeps the
 * policy decisions unit-testable without env.
 */
import { FROZEN_AFTER_HOURS, STALE_AFTER_HOURS } from "./constants";
import type { Difficulty, SyncStatus } from "./types";
import { weekStartUTC } from "./week";

/** Exponential backoff for 403/429: 5m → 30m → 2h (capped). Arg = consecutive failures. */
export function backoffMs(consecutiveFailures: number): number {
  const steps = [5 * 60_000, 30 * 60_000, 2 * 3_600_000];
  return steps[Math.min(Math.max(consecutiveFailures, 0), steps.length - 1)];
}

export interface HealthInput {
  lastSyncAtMs: number | null;
  nowMs?: number;
  /** previous status — rate_limited pins until success, never freezes (§7.3). */
  prevStatus?: SyncStatus;
  /** true when last failure was auth-class (not-found/private/claimed). */
  authError?: boolean;
}

/**
 * Stale policy §7.3:
 * <24h = live · 24–48h = stale (still ranked) · >48h OR auth error = frozen.
 * 403/429 rate-limit = NOT frozen: stays live/rate_limited with retry_at.
 */
export function syncHealth(input: HealthInput): {
  status: SyncStatus;
  frozenReason: string | null;
} {
  const now = input.nowMs ?? Date.now();
  if (input.authError) return { status: "frozen", frozenReason: "auth_error" };
  if (input.prevStatus === "rate_limited")
    return { status: "rate_limited", frozenReason: null };
  if (input.lastSyncAtMs == null) return { status: "stale", frozenReason: null };
  const hours = (now - input.lastSyncAtMs) / 3_600_000;
  if (hours > FROZEN_AFTER_HOURS) return { status: "frozen", frozenReason: "stale_48h" };
  if (hours > STALE_AFTER_HOURS) return { status: "stale", frozenReason: null };
  return { status: "live", frozenReason: null };
}

/** Card sync-health label (§4 expanded): Live · 12m ago / Stale 26h / Frozen 52h · reason. */
export function syncHealthLabel(
  status: SyncStatus,
  lastSyncAt: string | null,
  frozenReason: string | null,
  retryAt: string | null,
  nowMs = Date.now()
): string {
  if (status === "rate_limited") {
    const retryIn = retryAt ? Math.max(1, Math.ceil((Date.parse(retryAt) - nowMs) / 60_000)) : 5;
    return `LeetCode busy — retry in ${retryIn}m`;
  }
  if (!lastSyncAt) return status === "frozen" ? `Frozen · ${frozenReason ?? "never synced"}` : "Stale · never synced";
  const h = (nowMs - Date.parse(lastSyncAt)) / 3_600_000;
  const ago = h < 1 ? `${Math.max(1, Math.round(h * 60))}m ago` : `${Math.round(h)}h ago`;
  if (status === "live") return `Live · ${ago}`;
  if (status === "stale") return `Stale ${ago}`;
  return `Frozen ${ago} · ${frozenReason ?? "stale"}`;
}

/** Cursor = max(solved_at, submission_id). True when submission is newer. */
export function isNewerThanCursor(
  tsSec: number,
  submissionId: string,
  cursorTs: number,
  cursorId: string
): boolean {
  if (tsSec !== cursorTs) return tsSec > cursorTs;
  return submissionId > cursorId;
}

export interface SubmissionLike {
  submissionId: string;
  slug: string;
  timestampSec: number;
  lang: string;
}

/** Map a raw submission to a solves row (difficulty resolved separately). */
export function toSolveRow(
  userId: string,
  s: SubmissionLike,
  diff: Difficulty,
  title: string | null
) {
  const solvedAt = new Date(s.timestampSec * 1000).toISOString();
  return {
    submission_id: s.submissionId,
    user_id: userId,
    slug: s.slug,
    diff,
    lang: s.lang,
    title,
    solved_at: solvedAt,
    week_start: weekStartUTC(solvedAt),
  };
}

/**
 * Partition fetched submissions into counted vs ignored for the CURRENT week.
 * Counted = distinct slug per UTC week (re-submits same week = 0 extra, §5).
 * `seenSlugsThisWeek` = slugs already counted this week (from DB).
 */
export function partitionCounted<T extends { slug: string }>(
  submissions: T[],
  seenSlugsThisWeek: Set<string>
): { counted: T[]; duplicates: T[] } {
  const counted: T[] = [];
  const duplicates: T[] = [];
  const seen = new Set(seenSlugsThisWeek);
  for (const s of submissions) {
    if (seen.has(s.slug)) duplicates.push(s);
    else {
      seen.add(s.slug);
      counted.push(s);
    }
  }
  return { counted, duplicates };
}

/** Inline guide hint for frozen/rate-limited cards (§7.3). */
export function fixHint(status: SyncStatus, frozenReason: string | null): string {
  if (status === "rate_limited") return "Retry shortly — no action needed";
  if (frozenReason === "auth_error" || frozenReason === "claimed") return "Fix username / Re-verify";
  if (frozenReason === "private") return "Set profile Public";
  if (status === "frozen") return "Retry sync";
  if (status === "stale") return "Sync to refresh";
  return "";
}
