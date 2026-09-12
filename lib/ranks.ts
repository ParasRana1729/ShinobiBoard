import { BASE_LADDER, XP_BY_DIFFICULTY, PRACTICE_XP_BY_DIFFICULTY } from "./constants";
import type { Difficulty } from "./types";

export interface RankMeta {
  rank: string;
  character: string;
  characterTitle: string;
  title: string;
  tagline: string;
  minXp: number;
  nextXp: number | null;
  image: string;
  badgeColor: string;
  textColor: string;
  glowColor: string;
  borderColor: string;
  accentBg: string;
}

export const RANK_METAS: Record<string, RankMeta> = {
  Academy: {
    rank: "Academy",
    character: "Konohamaru Sarutobi",
    characterTitle: "Academy Student",
    title: "Academy Initiate",
    tagline: "Starting from scratch. Dreaming of becoming Hokage one day.",
    minXp: 0,
    nextXp: 150,
    image: "/ranks/academy.jpg",
    badgeColor: "border-sumi/20 text-text-secondary",
    textColor: "text-text-secondary",
    glowColor: "transparent",
    borderColor: "border-sumi/20",
    accentBg: "from-surface-card to-surface-card",
  },
  Genin: {
    rank: "Genin",
    character: "Naruto Uzumaki",
    characterTitle: "Genin Rookie (Team 7)",
    title: "Genin Shinobi",
    tagline: "Wearing the Leaf headband. Ready to grind arrays and loops until midnight.",
    minXp: 150,
    nextXp: 500,
    image: "/ranks/genin.jpg",
    badgeColor: "border-sumi/20 text-text-secondary",
    textColor: "text-text-secondary",
    glowColor: "transparent",
    borderColor: "border-sumi/20",
    accentBg: "from-surface-card to-surface-card",
  },
  Chunin: {
    rank: "Chunin",
    character: "Shikamaru Nara",
    characterTitle: "Chunin Tactician",
    title: "Chunin Strategist",
    tagline: "Tactical Trees, Graphs, BFS/DFS & Recursion.",
    minXp: 500,
    nextXp: 1200,
    image: "/ranks/chunin.jpg",
    badgeColor: "border-sumi/20 text-text-secondary",
    textColor: "text-text-secondary",
    glowColor: "transparent",
    borderColor: "border-sumi/20",
    accentBg: "from-surface-card to-surface-card",
  },
  Jonin: {
    rank: "Jonin",
    character: "Kakashi Hatake",
    characterTitle: "Jonin Commander",
    title: "Jonin Leader",
    tagline: "Lightning execution on Dynamic Programming & Backtracking.",
    minXp: 1200,
    nextXp: 2500,
    image: "/ranks/jonin.jpg",
    badgeColor: "border-sumi/20 text-text-secondary",
    textColor: "text-text-secondary",
    glowColor: "transparent",
    borderColor: "border-sumi/20",
    accentBg: "from-surface-card to-surface-card",
  },
  ANBU: {
    rank: "ANBU",
    character: "Itachi Uchiha",
    characterTitle: "ANBU Black Ops",
    title: "ANBU Shadow Elite",
    tagline: "Operating in the dark corners of LeetCode Hard problems.",
    minXp: 2500,
    nextXp: 4500,
    image: "/ranks/anbu.jpg",
    badgeColor: "border-sumi/20 text-shinobi-gold",
    textColor: "text-shinobi-gold",
    glowColor: "transparent",
    borderColor: "border-sumi/25",
    accentBg: "from-surface-card to-surface-card",
  },
  Kage: {
    rank: "Kage",
    character: "Minato Namikaze",
    characterTitle: "Kage Grandmaster",
    title: "Hokage Sovereign",
    tagline: "Supreme master of algorithms. Protector of the code village.",
    minXp: 4500,
    nextXp: 7500,
    image: "/ranks/kage.jpg",
    badgeColor: "border-shinobi-gold/40 text-shinobi-gold",
    textColor: "text-shinobi-gold",
    glowColor: "transparent",
    borderColor: "border-shinobi-gold/40",
    accentBg: "from-surface-card to-surface-card",
  },
  Sage: {
    rank: "Sage",
    character: "Jiraiya",
    characterTitle: "Toad Sage (Sennin)",
    title: "Sage Legend",
    tagline: "Master of Senjutsu, deep intuition, and pinnacle algorithmic wisdom.",
    minXp: 7500,
    nextXp: null,
    image: "/ranks/sage.jpg",
    badgeColor: "border-orange-500/40 text-orange-400",
    textColor: "text-orange-400",
    glowColor: "rgba(249, 115, 22, 0.2)",
    borderColor: "border-orange-500/40",
    accentBg: "from-surface-card to-surface-card",
  },
};

export function getRankMeta(rank: string): RankMeta {
  return RANK_METAS[rank] ?? RANK_METAS.Academy;
}

export interface RankProgress {
  currentRank: string;
  currentMeta: RankMeta;
  nextRank: string | null;
  nextMeta: RankMeta | null;
  currentTierMin: number;
  nextTierMin: number | null;
  xpInTier: number;
  tierSpan: number;
  percentage: number;
  needed: number;
  isMaxRank: boolean;
  level: number;
}

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

/**
 * Detailed level and progress breakdown across the 6 Shinobi tiers.
 * Level formula: level = Math.floor(xp / 100) + 1 (smooth gamer leveling).
 */
export function getRankProgress(xp: number): RankProgress {
  const safeXp = Math.max(0, xp);
  const currentRank = baseRankForXp(safeXp);
  const currentMeta = getRankMeta(currentRank);
  const currentIndex = baseRankIndex(currentRank);
  const nextTier = BASE_LADDER[currentIndex + 1] ?? null;

  const currentTierMin = currentMeta.minXp;
  const level = Math.floor(safeXp / 100) + 1;

  if (!nextTier) {
    return {
      currentRank,
      currentMeta,
      nextRank: null,
      nextMeta: null,
      currentTierMin,
      nextTierMin: null,
      xpInTier: safeXp - currentTierMin,
      tierSpan: 1,
      percentage: 100,
      needed: 0,
      isMaxRank: true,
      level,
    };
  }

  const nextRank = nextTier.rank;
  const nextMeta = getRankMeta(nextRank);
  const nextTierMin = nextTier.minXp;
  const tierSpan = nextTierMin - currentTierMin;
  const xpInTier = Math.max(0, safeXp - currentTierMin);
  const percentage = Math.min(100, Math.max(0, Math.round((xpInTier / tierSpan) * 100)));
  const needed = Math.max(0, nextTierMin - safeXp);

  return {
    currentRank,
    currentMeta,
    nextRank,
    nextMeta,
    currentTierMin,
    nextTierMin,
    xpInTier,
    tierSpan,
    percentage,
    needed,
    isMaxRank: false,
    level,
  };
}

export interface ScoreInput {
  difficulty: Difficulty;
  /** true when user never had an AC of this slug before (first-ever). */
  isFirstEver: boolean;
  /** streak value AT solve time (after streak update). */
  streakAtSolve: number;
}

/**
 * Tiered dynamic streak bonus:
 * - 1-2 days: +0 XP (warming up)
 * - 3-6 days: +2 XP (consistency habit)
 * - 7-13 days: +3 XP (1-week milestone)
 * - 14-29 days: +4 XP (2-week discipline)
 * - 30+ days: +5 XP (1-month master streak)
 */
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 5;
  if (streak >= 14) return 4;
  if (streak >= 7) return 3;
  if (streak >= 3) return 2;
  return 0;
}

/**
 * Balanced XP Scoring:
 * - First-ever AC of slug: Easy 5 / Medium 15 / Hard 40
 * - Spaced repetition practice (cross-week repeat): Easy 1 / Medium 4 / Hard 10
 * - Dynamic streak bonus: +2 to +5 XP depending on streak length
 * - Intra-week repeat: 0 XP, 0 weekly count (enforced by sync engine caller)
 */
export function scoreCountedSolve(input: ScoreInput): number {
  const { difficulty, isFirstEver, streakAtSolve } = input;
  let xp = 0;
  if (isFirstEver) {
    xp += XP_BY_DIFFICULTY[difficulty];
  } else {
    xp += PRACTICE_XP_BY_DIFFICULTY[difficulty];
  }
  xp += getStreakBonus(streakAtSolve);
  return xp;
}
