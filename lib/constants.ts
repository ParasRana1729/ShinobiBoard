/** Spec constants — single source of truth for tunables. */

export const GLOBAL_DEFAULT_GOAL = Number(
  process.env.DEFAULT_WEEKLY_GOAL ?? 7
); // spec §6: weekly default 7 (configurable 1–50)

export const GROUP_GOAL_MIN = 1;
export const GROUP_GOAL_MAX = 50;

export const SQUAD_MIN = 3;
export const SQUAD_MAX = 15;
export const CLUB_MAX = 150;
export const DUEL_SIZE = 2;

export const SYNC_INTERVAL_MIN = 60;
export const SYNC_JITTER_MIN = 10;
export const SYNC_BATCH_SIZE = Number(process.env.SYNC_BATCH_SIZE ?? 20);
export const SYNC_CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 5);
export const MANUAL_REFRESH_COOLDOWN_MIN = 10; // per target profile (shared)
export const MANUAL_REFRESH_VIEWER_HOURLY_CAP = 10; // per viewer anti-abuse

export const STALE_AFTER_HOURS = 24;
export const FROZEN_AFTER_HOURS = 48;

export const VERIFY_CODE_TTL_MIN = 30;
export const VERIFY_CODE_PREFIX = "SB-";

export const DUEL_INVITE_TTL_DAYS = 7;

export const NUDGE_PER_DAY = 1;

export const BOARD_TOP_N = 50;
export const ROSTER_PAGE_SIZE = 50;
export const RECENT_SOLVES_LIMIT = 5;
export const ACTIVITY_DOTS_DAYS = 7;
export const FEED_RETENTION_DAYS = 30;
export const FEED_CAP_PER_GROUP = 200;

export const XP_BY_DIFFICULTY = { Easy: 5, Medium: 15, Hard: 40 } as const;
export const PRACTICE_XP_BY_DIFFICULTY = { Easy: 1, Medium: 4, Hard: 10 } as const;

export const STREAK_BONUS_TIERS = [
  { minStreak: 30, bonus: 5 },
  { minStreak: 14, bonus: 4 },
  { minStreak: 7, bonus: 3 },
  { minStreak: 3, bonus: 2 },
] as const;

export const BASE_LADDER = [
  { rank: "Academy", minXp: 0 },
  { rank: "Genin", minXp: 150 },
  { rank: "Chunin", minXp: 500 },
  { rank: "Jonin", minXp: 1200 },
  { rank: "ANBU", minXp: 2500 },
  { rank: "Kage", minXp: 4500 },
  { rank: "Sage", minXp: 7500 },
] as const;

export const TITLE_META = {
  hokage: { label: "Hokage", durationDays: 7, badge: "🔥" },
  itachi: { label: "Itachi", durationDays: 3, badge: "🐦" },
  rock_lee: { label: "Rock Lee", durationDays: 3, badge: "💪" },
} as const;
