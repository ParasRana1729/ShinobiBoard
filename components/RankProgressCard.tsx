"use client";

import { useState } from "react";
import { getRankProgress } from "@/lib/ranks";
import RankAvatar from "./RankAvatar";
import { Zap, HelpCircle, ChevronRight, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

interface RankProgressCardProps {
  xp: number;
  streak?: number;
  weeklyCount?: number;
  weeklyGoal?: number;
  className?: string;
}

export default function RankProgressCard({
  xp,
  streak = 0,
  weeklyCount = 0,
  weeklyGoal = 7,
  className = "",
}: RankProgressCardProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const progress = getRankProgress(xp);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b ${progress.currentMeta.accentBg} p-6 shadow-xl shadow-black/40 backdrop-blur-xl ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <RankAvatar
            rank={progress.currentRank}
            size="xl"
            showGlow
            showBadge
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${progress.currentMeta.badgeColor}`}
              >
                {progress.currentRank}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">
                Lv. {progress.level}
              </span>
            </div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-text-primary sm:text-2xl">
              {progress.currentMeta.character}
            </h2>
            <p className="text-xs font-medium text-text-secondary">
              {progress.currentMeta.characterTitle}
            </p>
          </div>
        </div>

        {/* Total XP Big Tally */}
        <div className="text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Total Shinobi XP
          </span>
          <p className="font-mono text-2xl font-black tracking-tight text-shinobi-gold sm:text-3xl">
            {xp.toLocaleString()} <span className="text-sm font-bold text-text-muted">XP</span>
          </p>
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            type="button"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-text-muted transition hover:text-shinobi-gold"
          >
            <HelpCircle className="h-3 w-3" />
            <span>XP Rules & Multipliers</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Next Rank */}
      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-surface-elevated/60 p-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-primary">
              {progress.isMaxRank ? "Supreme Rank Achieved" : `Progress to ${progress.nextRank}`}
            </span>
            {!progress.isMaxRank && progress.nextMeta && (
              <span className="text-[11px] text-text-muted">
                ({progress.nextMeta.character})
              </span>
            )}
          </div>
          <span className="font-mono font-bold text-shinobi-gold">
            {progress.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08] p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-shinobi-gold via-amber-300 to-shinobi-flame transition-all duration-500 shadow-sm shadow-shinobi-gold/30"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-text-muted">
          <span>{progress.currentTierMin.toLocaleString()} XP</span>
          <span>
            {progress.isMaxRank
              ? "Max Prestige"
              : `${progress.needed.toLocaleString()} XP needed`}
          </span>
          <span>{progress.nextTierMin ? `${progress.nextTierMin.toLocaleString()} XP` : "MAX"}</span>
        </div>
      </div>

      {/* Tagline / Lore Quote */}
      <p className="mt-4 italic text-xs text-text-muted/90">
        &ldquo;{progress.currentMeta.tagline}&rdquo;
      </p>

      {/* XP Rules Breakdown Panel (Expandable) */}
      {showFormulaModal && (
        <div className="mt-5 rounded-2xl border border-shinobi-gold/30 bg-surface-base/95 p-5 shadow-2xl transition animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-shinobi-gold">
              <Zap className="h-4 w-4" /> Points & XP Engine Spec
            </h3>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Close ✕
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-surface-card p-3">
              <span className="font-bold text-text-primary block">First-Ever Solves</span>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-text-secondary">
                <li className="flex justify-between">
                  <span className="text-emerald-400">Easy:</span>
                  <span className="font-bold text-text-primary">+5 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-blue-400">Medium:</span>
                  <span className="font-bold text-text-primary">+15 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-red-400">Hard:</span>
                  <span className="font-bold text-text-primary">+40 XP</span>
                </li>
              </ul>
              <span className="mt-2 block text-[10px] text-text-muted">
                Awarded only on the first Accepted submission of a problem slug.
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Streak Bonus (≥ 3 Days)</span>
              <div className="mt-2 flex items-center gap-2 text-shinobi-flame">
                <Flame className="h-4 w-4" />
                <span className="font-mono text-sm font-black">+2 XP per solve</span>
              </div>
              <span className="mt-2 block text-[10px] text-text-muted">
                Applies to all counted weekly solves (even cross-week repeats) while streak is active.
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Weekly Goal Credit</span>
              <p className="mt-1 text-[11px] text-text-secondary">
                Counted solves advance your squad goal bar. Solves reset every Monday at 00:05 UTC.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Anti-Farm Integrity</span>
              <p className="mt-1 text-[11px] text-text-secondary">
                Re-submitting the same problem in the same week awards 0 XP and 0 weekly count.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
