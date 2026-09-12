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
      className={`relative overflow-hidden rounded-2xl border border-sumi/15 bg-surface-card p-6 shadow-tactile-card ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <RankAvatar
            rank={progress.currentRank}
            size="xl"
            showBadge
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${progress.currentMeta.badgeColor}`}
              >
                {progress.currentRank}
              </span>
              <span className="rounded-full border border-sumi/15 bg-sumi/[0.06] px-2 py-0.5 font-mono text-xs font-bold text-text-secondary">
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
      <div className="mt-6 rounded-2xl border border-sumi/10 bg-surface-elevated/60 p-4">
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
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-sumi/10 p-0.5">
          <div
            className="h-full rounded-full bg-shinobi-gold transition-all duration-500"
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
        <div className="mt-5 rounded-xl border border-sumi/15 bg-surface p-5 shadow-tactile-card transition animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-sumi/15 pb-3">
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
            <div className="rounded-xl border border-sumi/10 bg-surface-card p-3">
              <span className="font-bold text-text-primary block">First-Ever Solves</span>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-text-secondary">
                <li className="flex justify-between">
                  <span className="text-shinobi-teal">Easy:</span>
                  <span className="font-bold text-text-primary">+5 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-text-secondary">Medium:</span>
                  <span className="font-bold text-text-primary">+15 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-shinobi-flame">Hard:</span>
                  <span className="font-bold text-text-primary">+40 XP</span>
                </li>
              </ul>
              <span className="mt-2 block text-[10px] text-text-muted">
                Awarded on the first Accepted submission of each problem slug.
              </span>
            </div>

            <div className="rounded-xl border border-sumi/10 bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Spaced Practice (Repeats)</span>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-text-secondary">
                <li className="flex justify-between">
                  <span className="text-shinobi-teal">Repeat Easy:</span>
                  <span className="font-bold text-text-primary">+1 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-text-secondary">Repeat Medium:</span>
                  <span className="font-bold text-text-primary">+4 XP</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-shinobi-flame">Repeat Hard:</span>
                  <span className="font-bold text-text-primary">+10 XP</span>
                </li>
              </ul>
              <span className="mt-2 block text-[10px] text-text-muted">
                Awarded for re-solving in subsequent weeks to encourage spaced review.
              </span>
            </div>

            <div className="rounded-xl border border-sumi/10 bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Dynamic Streak Bonus</span>
              <div className="mt-2 space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between text-text-secondary">
                  <span>3–6 Days:</span>
                  <span className="font-bold text-shinobi-flame">+2 XP</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>7–13 Days:</span>
                  <span className="font-bold text-shinobi-flame">+3 XP</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>14–29 Days:</span>
                  <span className="font-bold text-shinobi-flame">+4 XP</span>
                </div>
                <div className="flex items-center justify-between text-text-secondary">
                  <span>30+ Days:</span>
                  <span className="font-bold text-shinobi-flame">+5 XP</span>
                </div>
              </div>
              <span className="mt-2 block text-[10px] text-text-muted">
                Applied to all counted solves while maintaining your daily streak.
              </span>
            </div>

            <div className="rounded-xl border border-sumi/10 bg-surface-card p-3">
              <span className="font-bold text-text-primary block">Anti-Farm Integrity</span>
              <p className="mt-1 text-[11px] text-text-secondary">
                Re-submitting the same problem in the same week awards 0 XP and 0 weekly count. Weekly sprints reset Mondays at 00:05 UTC.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
