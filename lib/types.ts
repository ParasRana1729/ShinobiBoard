export type Difficulty = "Easy" | "Medium" | "Hard";
export type SyncStatus = "live" | "stale" | "frozen" | "rate_limited";
export type GroupType = "squad" | "club" | "duel";
export type TitleKind = "hokage" | "itachi" | "rock_lee";
export type EventType =
  | "overtook"
  | "rank_up"
  | "hokage"
  | "title_awarded"
  | "weekly_winner"
  | "nudge"
  | "frozen"
  | "comeback"
  | "member_joined"
  | "member_left"
  | "goal_hit";

export interface Profile {
  auth_user_id: string;
  lc_username: string | null;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  base_rank: string;
  streak: number;
  streak_last_date: string | null;
  weekly_count: number;
  weekly_hards: number;
  week_start: string;
  last_sync_at: string | null;
  sync_status: SyncStatus;
  frozen_reason: string | null;
  retry_at: string | null;
  sync_cursor_ts: number;
  sync_cursor_id: string;
  created_at: string;
}

export interface Group {
  id: string;
  type: GroupType;
  name: string;
  code: string | null;
  invite_enabled: boolean;
  goal: number;
  owner_id: string | null;
  member_count: number;
  created_at: string;
}

export interface BoardRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  lc_username: string | null;
  xp: number;
  base_rank: string;
  streak: number;
  weekly_count: number;
  weekly_hards: number;
  last_solved_at: string | null;
  last_solved_slug: string | null;
  last_solved_diff: Difficulty | null;
  sync_status: SyncStatus;
  frozen_reason: string | null;
  last_sync_at: string | null;
  retry_at: string | null;
  pinned: boolean;
  group_rank: number;
  titles: { title: TitleKind; expires_at: string }[];
}

export type BoardSort = "weekly" | "streak" | "xp" | "base_rank";

export interface RecentSolve {
  submission_id: string;
  slug: string;
  title: string | null;
  diff: Difficulty;
  lang: string;
  solved_at: string;
}
