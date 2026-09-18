"use client";

import { useState } from "react";
import { getRankProgress } from "@/lib/ranks";
import RankAvatar from "./RankAvatar";
import { Zap, HelpCircle, ChevronRight, CheckCircle2, ShieldCheck, Flame, Share2, Copy, Check, ExternalLink, X } from "lucide-react";

interface RankProgressCardProps {
  xp: number;
  streak?: number;
  weeklyCount?: number;
  weeklyGoal?: number;
  username?: string | null;
  className?: string;
}

export default function RankProgressCard({
  xp,
  streak = 0,
  weeklyCount = 0,
  weeklyGoal = 7,
  username = null,
  className = "",
}: RankProgressCardProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
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
          <div className="mt-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-shinobi-gold transition hover:text-[#c94427]"
            >
              <Share2 className="h-3 w-3" />
              <span>Share Dossier</span>
            </button>
            <span className="text-sumi/20">·</span>
            <button
              onClick={() => setShowFormulaModal(!showFormulaModal)}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-text-muted transition hover:text-shinobi-gold"
            >
              <HelpCircle className="h-3 w-3" />
              <span>XP Rules</span>
            </button>
          </div>
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

      {/* Share Shinobi Dossier Card Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-2xl border border-sumi/15 bg-surface-card p-6 shadow-tactile-card space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sumi/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-shinobi-gold/30 bg-shinobi-gold/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-shinobi-gold">
                    Shinobi Passport
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    Live SVG Embed
                  </span>
                </div>
                <h3 className="mt-1 font-heading text-xl font-bold text-text-primary">
                  Share Your Shinobi Dossier
                </h3>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Embed your live rank, streak flame, and LeetCode solve split in your GitHub README or website.
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                type="button"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition"
                aria-label="Close share modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live SVG Card Preview */}
            <div className="rounded-xl border border-sumi/10 bg-surface-base p-3 overflow-hidden flex justify-center">
              {username ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/users/${encodeURIComponent(username)}/card.svg`}
                  alt="Shinobi Dossier Live Preview"
                  className="w-full max-w-[500px] rounded-lg shadow-tactile-card"
                />
              ) : (
                <div className="py-8 text-center text-xs text-text-muted">
                  Link your LeetCode username in settings to generate your live dossier card.
                </div>
              )}
            </div>

            {/* Embed Snippets & Copy Controls */}
            {username && (
              <div className="space-y-3">
                {/* GitHub Markdown Embed */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-text-primary mb-1.5">
                    <span>GitHub README Markdown</span>
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== "undefined" ? window.location.origin : "https://shinobiboard.vercel.app";
                        const md = `[![Shinobi Dossier](${origin}/api/users/${encodeURIComponent(username)}/card.svg)](${origin})`;
                        navigator.clipboard.writeText(md);
                        setCopiedType("markdown");
                        setTimeout(() => setCopiedType(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-sumi/15 bg-surface-elevated px-2 py-0.5 text-[11px] font-mono text-text-secondary hover:text-shinobi-gold hover:border-shinobi-gold/30 transition"
                    >
                      {copiedType === "markdown" ? (
                        <>
                          <Check className="h-3 w-3 text-shinobi-teal" />
                          <span className="text-shinobi-teal">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rounded-lg border border-sumi/10 bg-surface-elevated p-2.5 font-mono text-[11px] text-text-muted break-all select-all">
                    {`[![Shinobi Dossier](${typeof window !== "undefined" ? window.location.origin : "https://shinobiboard.vercel.app"}/api/users/${encodeURIComponent(username)}/card.svg)](${typeof window !== "undefined" ? window.location.origin : "https://shinobiboard.vercel.app"})`}
                  </div>
                </div>

                {/* Direct Image URL */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-text-primary mb-1.5">
                    <span>Direct Image URL</span>
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== "undefined" ? window.location.origin : "https://shinobiboard.vercel.app";
                        const url = `${origin}/api/users/${encodeURIComponent(username)}/card.svg`;
                        navigator.clipboard.writeText(url);
                        setCopiedType("url");
                        setTimeout(() => setCopiedType(null), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-sumi/15 bg-surface-elevated px-2 py-0.5 text-[11px] font-mono text-text-secondary hover:text-shinobi-gold hover:border-shinobi-gold/30 transition"
                    >
                      {copiedType === "url" ? (
                        <>
                          <Check className="h-3 w-3 text-shinobi-teal" />
                          <span className="text-shinobi-teal">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rounded-lg border border-sumi/10 bg-surface-elevated p-2.5 font-mono text-[11px] text-text-muted break-all select-all">
                    {`${typeof window !== "undefined" ? window.location.origin : "https://shinobiboard.vercel.app"}/api/users/${encodeURIComponent(username)}/card.svg`}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-sumi/10 pt-4 text-xs text-text-muted">
              <span>Automatically updates on verified LeetCode syncs</span>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="btn-tactile-secondary py-1.5 px-3"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
