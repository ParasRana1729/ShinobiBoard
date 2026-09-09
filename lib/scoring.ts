import { baseRankIndex } from "./ranks";
import type { BoardRow, BoardSort } from "./types";

/**
 * Spec §4 Leaderboard default server order:
 * weekly counted solves desc → weekly hards desc → XP desc → streak desc →
 * earlier last solve. Frozen rows sink to bottom (still visible, §7.3).
 * Pinned rows float above everything (§4), preserving relative order.
 */
export function orderLeaderboard(rows: BoardRow[]): BoardRow[] {
  const pinned = rows.filter((r) => r.pinned);
  const rest = rows.filter((r) => !r.pinned);
  const cmp = (a: BoardRow, b: BoardRow) => {
    const af = a.sync_status === "frozen" ? 1 : 0;
    const bf = b.sync_status === "frozen" ? 1 : 0;
    if (af !== bf) return af - bf;
    if (b.weekly_count !== a.weekly_count) return b.weekly_count - a.weekly_count;
    if (b.weekly_hards !== a.weekly_hards) return b.weekly_hards - a.weekly_hards;
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.streak !== a.streak) return b.streak - a.streak;
    const at = a.last_solved_at ? Date.parse(a.last_solved_at) : Number.MAX_SAFE_INTEGER;
    const bt = b.last_solved_at ? Date.parse(b.last_solved_at) : Number.MAX_SAFE_INTEGER;
    return at - bt; // earlier last solve first
  };
  pinned.sort(cmp);
  rest.sort(cmp);
  return [...pinned, ...rest];
}

/** Sort-dropdown re-orders (§4): weekly / streak / XP / base rank. Frozen still sinks. */
export function orderBySort(rows: BoardRow[], sort: BoardSort): BoardRow[] {
  if (sort === "weekly") return orderLeaderboard(rows);
  const pinned = rows.filter((r) => r.pinned);
  const rest = rows.filter((r) => !r.pinned);
  const frozenLast = (a: BoardRow, b: BoardRow) =>
    (a.sync_status === "frozen" ? 1 : 0) - (b.sync_status === "frozen" ? 1 : 0);
  const cmp = (a: BoardRow, b: BoardRow): number => {
    const f = frozenLast(a, b);
    if (f !== 0) return f;
    switch (sort) {
      case "streak":
        if (b.streak !== a.streak) return b.streak - a.streak;
        break;
      case "xp":
        if (b.xp !== a.xp) return b.xp - a.xp;
        break;
      case "base_rank": {
        const d = baseRankIndex(b.base_rank) - baseRankIndex(a.base_rank);
        if (d !== 0) return d;
        if (b.xp !== a.xp) return b.xp - a.xp;
        break;
      }
    }
    // deterministic fallback = leaderboard order
    if (b.weekly_count !== a.weekly_count) return b.weekly_count - a.weekly_count;
    return b.xp - a.xp;
  };
  pinned.sort(cmp);
  rest.sort(cmp);
  return [...pinned, ...rest];
}

/** Assign group_rank #N after ordering (1-based, pinned included in numbering). */
export function withGroupRank(rows: BoardRow[]): BoardRow[] {
  return rows.map((r, i) => ({ ...r, group_rank: i + 1 }));
}

export interface TitleCandidate {
  user_id: string;
  weekly_count: number;
  weekly_hards: number;
  prev_weekly_count: number;
  xp: number;
  streak: number;
  last_solved_at: string | null;
  sync_status: string;
  goal: number;
}

/** Hokage §5: weekly #1 + meets group goal + non-frozen. Input pre-sorted by leaderboard order. */
export function pickHokage(cands: TitleCandidate[]): TitleCandidate | null {
  const top = cands[0];
  if (!top) return null;
  if (top.sync_status === "frozen") return null;
  if (top.weekly_count < top.goal) return null;
  return top;
}

/** Itachi §5: most counted hards; tie → weekly total → XP → streak. */
export function pickItachi(cands: TitleCandidate[]): TitleCandidate | null {
  const eligible = cands.filter((c) => c.sync_status !== "frozen" && c.weekly_hards > 0);
  if (!eligible.length) return null;
  eligible.sort(
    (a, b) =>
      b.weekly_hards - a.weekly_hards ||
      b.weekly_count - a.weekly_count ||
      b.xp - a.xp ||
      b.streak - a.streak
  );
  return eligible[0];
}

/**
 * Rock Lee §5: qualifier = prev week 0 counted AND current week ≥ 15.
 * Winner = largest delta (== current week among qualifiers); tie → Itachi tie-break.
 * No qualifier → vacant (null).
 */
export function pickRockLee(cands: TitleCandidate[]): TitleCandidate | null {
  const q = cands.filter(
    (c) => c.sync_status !== "frozen" && c.prev_weekly_count === 0 && c.weekly_count >= 15
  );
  if (!q.length) return null;
  q.sort(
    (a, b) =>
      b.weekly_count - a.weekly_count ||
      b.weekly_hards - a.weekly_hards ||
      b.xp - a.xp ||
      b.streak - a.streak
  );
  return q[0];
}
