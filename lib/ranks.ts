import { BASE_LADDER, XP_BY_DIFFICULTY } from "./constants";
import type { Difficulty } from "./types";

export function baseRankForXp(xp: number): string {
  let rank: string = BASE_LADDER[0].rank;
  for (const tier of BASE_LADDER) {
    if (xp >= tier.minXp) rank = tier.rank;
    else break;
  }
  return rank;
}

export function xpToNext(xp: number): { next: string | null; needed: number } {
  for (const tier of BASE_LADDER) {
    if (xp < tier.minXp) return { next: tier.rank, needed: tier.minXp - xp };
  }
  return { next: null, needed: 0 }; // Kage max
}

export function baseRankIndex(rank: string): number {
  const i = BASE_LADDER.findIndex((t) => t.rank === rank);
  return i === -1 ? 0 : i;
}

export interface ScoreInput {
  difficulty: Difficulty;
  /** true when user never had an AC of this slug before (first-ever). */
  isFirstEver: boolean;
  /** streak value AT solve time (after streak update). */
  streakAtSolve: number;
}

/**
 * Spec §5 XP (first-ever only + streak bonus):
 * - Easy 5 / Medium 15 / Hard 40 only on first-ever AC of slug per user.
 * - +2 per counted weekly solve while streak >= 3 at solve time
 *   (applies even to cross-week repeats).
 * - Re-submits same week: 0 XP, 0 weekly (caller must skip non-counted).
 */
export function scoreCountedSolve(input: ScoreInput): number {
  const { difficulty, isFirstEver, streakAtSolve } = input;
  let xp = 0;
  if (isFirstEver) xp += XP_BY_DIFFICULTY[difficulty];
  if (streakAtSolve >= 3) xp += 2;
  return xp;
}
