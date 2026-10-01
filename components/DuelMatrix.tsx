"use client";

import type { DuelMatrixData, Difficulty } from "@/lib/types";
import { Swords, Trophy, ExternalLink, Flame, CheckCircle2, Minus } from "lucide-react";

function DifficultyBadge({ diff }: { diff: Difficulty }) {
  if (diff === "Easy") {
    return (
      <span className="rounded border border-shinobi-teal/30 bg-shinobi-teal/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-teal">
        Easy
      </span>
    );
  }
  if (diff === "Hard") {
    return (
      <span className="rounded border border-shinobi-flame/30 bg-shinobi-flame/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-flame">
        Hard
      </span>
    );
  }
  return (
    <span className="rounded border border-sumi/20 bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-secondary">
      Med
    </span>
  );
}

export function DuelMatrix({
  matrix,
  viewerId,
}: {
  matrix: DuelMatrixData;
  viewerId: string;
}) {
  const { userA, userB, lead, days, mutualSlugs } = matrix;
  const isUserA = viewerId === userA.id;

  const leaderName =
    lead.leaderId === null
      ? null
      : lead.leaderId === userA.id
      ? userA.name
      : userB.name;

  const viewerIsLeading = lead.leaderId !== null && lead.leaderId === viewerId;
  const opponentIsLeading =
    lead.leaderId !== null && (isUserA ? lead.leaderId === userB.id : lead.leaderId === userA.id);

  return (
    <div className="rounded-2xl border border-sumi/15 bg-surface-card p-5 shadow-tactile-card space-y-4">
      {/* Header: Title & Lead Meter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sumi/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-shinobi-gold/30 bg-shinobi-gold/10 text-shinobi-gold shadow-tactile-card">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2">
              <span>7-Day Duel Matrix</span>
              <span className="font-mono text-xs font-normal text-text-muted">
                UTC Week
              </span>
            </h3>
            <p className="text-xs text-text-muted">
              {userA.name} <span className="text-shinobi-gold font-bold">vs</span> {userB.name}
            </p>
          </div>
        </div>

        {/* Lead Meter Pill */}
        <div className="flex items-center gap-2">
          {lead.leaderId === null ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-sumi/20 bg-surface-elevated px-3 py-1.5 font-mono text-xs text-text-secondary">
              <Minus className="h-3.5 w-3.5 text-text-muted" />
              <span>Tied Deadlock (0 diff)</span>
            </div>
          ) : viewerIsLeading ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-shinobi-teal/30 bg-shinobi-teal/10 px-3 py-1.5 font-mono text-xs font-bold text-shinobi-teal">
              <Trophy className="h-3.5 w-3.5 text-shinobi-teal" />
              <span>You lead by +{lead.diff} {lead.diff === 1 ? "solve" : "solves"}</span>
            </div>
          ) : opponentIsLeading ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-shinobi-flame/30 bg-shinobi-flame/10 px-3 py-1.5 font-mono text-xs font-bold text-shinobi-flame">
              <Flame className="h-3.5 w-3.5 text-shinobi-flame" />
              <span>{leaderName} leads by +{lead.diff}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-shinobi-gold/30 bg-shinobi-gold/10 px-3 py-1.5 font-mono text-xs font-bold text-shinobi-gold">
              <Trophy className="h-3.5 w-3.5 text-shinobi-gold" />
              <span>{leaderName} leads by +{lead.diff}</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Timeline Matrix */}
      <div className="overflow-x-auto pb-1 board-scroll">
        <div className="grid min-w-[560px] grid-cols-7 gap-2">
          {days.map((d) => {
            const todayUtc = new Date().toISOString().slice(0, 10);
            const isToday = d.date === todayUtc;

            return (
              <div
                key={d.date}
                className={`flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all ${
                  isToday
                    ? "border-shinobi-gold/40 bg-shinobi-gold/5 shadow-tactile-card"
                    : "border-sumi/10 bg-surface-elevated"
                }`}
              >
                {/* Day Header */}
                <div className="w-full border-b border-sumi/10 pb-1.5">
                  <span className={`font-mono text-xs font-bold ${isToday ? "text-shinobi-gold" : "text-text-secondary"}`}>
                    {d.dayLabel}
                  </span>
                  <div className="font-mono text-[9px] text-text-muted">
                    {d.date.slice(5)}
                  </div>
                </div>

                {/* Score Clash */}
                <div className="my-2.5 flex items-center justify-center gap-1.5 font-mono text-sm font-bold">
                  <span
                    className={
                      d.winner === "A"
                        ? "text-shinobi-gold font-extrabold"
                        : "text-text-secondary"
                    }
                  >
                    {d.solvesA}
                  </span>
                  <span className="text-text-muted text-xs">:</span>
                  <span
                    className={
                      d.winner === "B"
                        ? "text-shinobi-gold font-extrabold"
                        : "text-text-secondary"
                    }
                  >
                    {d.solvesB}
                  </span>
                </div>

                {/* Winner Outcome Badge */}
                <div className="w-full">
                  {d.winner === "none" ? (
                    <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[9px] text-text-muted">
                      —
                    </span>
                  ) : d.winner === "tie" ? (
                    <span className="inline-block rounded border border-sumi/20 bg-surface-card px-1.5 py-0.5 font-mono text-[9px] font-bold text-text-secondary">
                      TIE
                    </span>
                  ) : (d.winner === "A" && isUserA) || (d.winner === "B" && !isUserA) ? (
                    <span className="inline-block truncate max-w-full rounded border border-shinobi-teal/40 bg-shinobi-teal/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-shinobi-teal">
                      WIN (+{Math.abs(d.solvesA - d.solvesB)})
                    </span>
                  ) : (
                    <span className="inline-block truncate max-w-full rounded border border-shinobi-flame/30 bg-shinobi-flame/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-shinobi-flame">
                      {d.winner === "A" ? userA.name.slice(0, 6) : userB.name.slice(0, 6)} AC
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mutual Clash Section (Problems Both Rivals Solved This Week) */}
      <div className="rounded-xl border border-sumi/10 bg-surface-elevated p-3 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-text-secondary">
            <CheckCircle2 className="h-3.5 w-3.5 text-shinobi-teal" />
            <span>Mutual Clash Solves This Week</span>
          </div>
          <span className="font-mono text-[11px] font-bold text-text-primary">
            {mutualSlugs.length} {mutualSlugs.length === 1 ? "problem" : "problems"}
          </span>
        </div>

        {mutualSlugs.length === 0 ? (
          <p className="text-[11px] text-text-muted italic">
            No overlapping problems solved yet this week — solve the same LeetCode problem to trigger a head-to-head clash!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {mutualSlugs.map((p) => (
              <a
                key={p.slug}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 rounded-lg border border-sumi/15 bg-surface-card px-2.5 py-1 text-xs hover:border-shinobi-gold/40 transition-all"
              >
                <DifficultyBadge diff={p.diff} />
                <span className="truncate max-w-[160px] font-medium text-text-secondary group-hover:text-text-primary">
                  {p.title ?? p.slug}
                </span>
                <ExternalLink className="h-3 w-3 text-text-muted group-hover:text-shinobi-gold" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
