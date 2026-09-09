import { BASE_LADDER, XP_BY_DIFFICULTY } from "./constants";
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
    character: "Naruto Uzumaki",
    characterTitle: "Academy Initiate",
    title: "Academy Student",
    tagline: "The journey of 1,000 algorithms begins with a single submit.",
    minXp: 0,
    nextXp: 150,
    image: "/ranks/academy.jpg",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    textColor: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.35)",
    borderColor: "border-amber-500/30",
    accentBg: "from-amber-500/15 via-surface-card to-surface-card",
  },
  Genin: {
    rank: "Genin",
    character: "Sasuke Uchiha",
    characterTitle: "Genin Operative",
    title: "Genin Shinobi",
    tagline: "Mastering Arrays, Two Pointers & Basic Data Structures.",
    minXp: 150,
    nextXp: 600,
    image: "/ranks/genin.jpg",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    textColor: "text-blue-400",
    glowColor: "rgba(96, 165, 250, 0.35)",
    borderColor: "border-blue-500/30",
    accentBg: "from-blue-500/15 via-surface-card to-surface-card",
  },
  Chunin: {
    rank: "Chunin",
    character: "Shikamaru Nara",
    characterTitle: "Chunin Tactician",
    title: "Chunin Strategist",
    tagline: "Tactical Trees, Graphs, BFS/DFS & Recursion.",
    minXp: 600,
    nextXp: 1500,
    image: "/ranks/chunin.jpg",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    textColor: "text-emerald-400",
    glowColor: "rgba(52, 211, 153, 0.35)",
    borderColor: "border-emerald-500/30",
    accentBg: "from-emerald-500/15 via-surface-card to-surface-card",
  },
  Jonin: {
    rank: "Jonin",
    character: "Kakashi Hatake",
    characterTitle: "Jonin Commander",
    title: "Jonin Leader",
    tagline: "Lightning execution on Dynamic Programming & Backtracking.",
    minXp: 1500,
    nextXp: 3000,
    image: "/ranks/jonin.jpg",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    textColor: "text-cyan-400",
    glowColor: "rgba(34, 211, 238, 0.35)",
    borderColor: "border-cyan-500/30",
    accentBg: "from-cyan-500/15 via-surface-card to-surface-card",
  },
  ANBU: {
    rank: "ANBU",
    character: "Itachi Uchiha",
    characterTitle: "ANBU Black Ops",
    title: "ANBU Shadow Elite",
    tagline: "Operating in the dark corners of LeetCode Hard problems.",
    minXp: 3000,
    nextXp: 5250,
    image: "/ranks/anbu.jpg",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
    textColor: "text-red-400",
    glowColor: "rgba(248, 113, 113, 0.35)",
    borderColor: "border-red-500/30",
    accentBg: "from-red-500/15 via-surface-card to-surface-card",
  },
  Kage: {
    rank: "Kage",
    character: "Minato Namikaze",
    characterTitle: "Kage Grandmaster",
    title: "Hokage Sovereign",
    tagline: "Supreme master of algorithms. Protector of the code village.",
    minXp: 5250,
    nextXp: null,
    image: "/ranks/kage.jpg",
    badgeColor: "bg-shinobi-gold/15 text-shinobi-gold border-shinobi-gold/40",
    textColor: "text-shinobi-gold",
    glowColor: "rgba(245, 197, 66, 0.45)",
    borderColor: "border-shinobi-gold/50",
    accentBg: "from-shinobi-gold/20 via-surface-card to-surface-card",
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
