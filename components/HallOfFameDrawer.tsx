"use client";

import { useState, useCallback } from "react";
import RankAvatar from "./RankAvatar";
import { Trophy, Crown, X, Calendar, Shield, Zap, Sparkles } from "lucide-react";
import type { TitleHistoryEntry } from "@/app/api/groups/[id]/history/route";

const TITLE_CONFIG = {
  hokage: {
    label: "Hokage",
    duration: "7 Days",
    icon: "👑",
    badge: "border-shinobi-gold/40 bg-shinobi-gold/10 text-shinobi-gold",
    desc: "Weekly #1 Champion who met the group goal",
  },
  itachi: {
    label: "Itachi",
    duration: "3 Days",
    icon: "🐦",
    badge: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    desc: "Most counted LeetCode Hard solves",
  },
  rock_lee: {
    label: "Rock Lee",
    duration: "3 Days",
    icon: "💪",
    badge: "border-shinobi-teal/40 bg-shinobi-teal/10 text-shinobi-teal",
    desc: "Comeback award (0 solves prior → 15+ solves current)",
  },
};

export function HallOfFameDrawer({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TitleHistoryEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "hokage" | "itachi" | "rock_lee">("all");
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/history`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history ?? []);
      } else {
        setError(data.error ?? "Failed to load Hall of Fame");
      }
    } catch {
      setError("Network error loading Hall of Fame");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const handleOpen = () => {
    setOpen(true);
    loadHistory();
  };

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    return item.title === filter;
  });

  return (
    <>
      <button
        onClick={handleOpen}
        type="button"
        className="btn-tactile-secondary inline-flex items-center gap-1.5 text-xs"
        title="View historical Hokages, Itachi, and Rock Lee champions"
      >
        <Trophy className="h-3.5 w-3.5 text-shinobi-gold" />
        <span>Hall of Fame</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-sumi/15 bg-surface-card shadow-tactile-card animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-sumi/10 p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-shinobi-gold/30 bg-shinobi-gold/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-shinobi-gold">
                    Dojo Heritage
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    歴代の英雄
                  </span>
                </div>
                <h2 className="mt-1 font-heading text-2xl font-bold text-text-primary">
                  Scroll of Past Champions
                </h2>
                <p className="mt-0.5 text-xs text-text-secondary">
                  The permanent lineage of squad members who earned prestigious titles across Monday 00:05 UTC resets.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="rounded-lg p-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-sumi/10 bg-surface-elevated/40 px-6 py-3">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded px-2.5 py-1 font-mono text-xs font-semibold transition ${
                  filter === "all"
                    ? "bg-shinobi-gold text-white"
                    : "border border-sumi/15 bg-surface-elevated text-text-muted hover:text-text-primary"
                }`}
              >
                All Titles ({history.length})
              </button>
              {(["hokage", "itachi", "rock_lee"] as const).map((t) => {
                const cfg = TITLE_CONFIG[t];
                const count = history.filter((h) => h.title === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilter(t)}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-semibold transition ${
                      filter === t
                        ? "bg-surface-card border border-sumi/30 text-text-primary shadow-sm"
                        : "border border-sumi/15 bg-surface-elevated/60 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                    <span className="text-[10px] text-text-muted">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Champions List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 board-scroll">
              {loading && (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sumi/20 border-t-shinobi-gold" />
                  <p className="font-mono text-xs text-text-muted">Unrolling ancestral scroll...</p>
                </div>
              )}

              {!loading && error && (
                <div className="rounded-xl border border-shinobi-flame/30 bg-shinobi-flame/10 p-4 text-center text-xs text-shinobi-flame">
                  {error}
                </div>
              )}

              {!loading && !error && filteredHistory.length === 0 && (
                <div className="rounded-2xl border border-dashed border-sumi/15 bg-surface-elevated/30 py-16 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-sumi/15 bg-surface-card text-shinobi-gold shadow-tactile-card">
                    <Crown className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-text-primary">
                    No Champions Recorded Yet
                  </h3>
                  <p className="mx-auto max-w-xs text-xs text-text-muted">
                    Titles are awarded every Monday at 00:05 UTC. Grind hard this week to carve your name into the ancestral scroll!
                  </p>
                </div>
              )}

              {!loading && !error && filteredHistory.map((item) => {
                const cfg = TITLE_CONFIG[item.title];
                const grantDate = new Date(item.granted_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isCurrent = new Date(item.expires_at).getTime() > Date.now();

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sumi/10 bg-surface-elevated p-4 transition hover:border-sumi/25"
                  >
                    <div className="flex items-center gap-3.5">
                      <RankAvatar
                        rank={item.profile?.base_rank ?? "Academy"}
                        size="md"
                        showBadge
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-base font-bold text-text-primary">
                            {item.profile?.display_name ?? "Shinobi"}
                          </span>
                          {item.profile?.lc_username && (
                            <span className="font-mono text-xs text-text-muted">
                              @{item.profile.lc_username}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>Week of {grantDate}</span>
                          {item.stats?.weekly_count !== undefined && (
                            <>
                              <span>·</span>
                              <span className="text-shinobi-gold font-bold">
                                {item.stats.weekly_count} solves
                              </span>
                            </>
                          )}
                          {item.stats?.weekly_hards !== undefined && item.stats.weekly_hards > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-shinobi-flame font-bold">
                                {item.stats.weekly_hards} Hards
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="rounded border border-shinobi-teal/40 bg-shinobi-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-shinobi-teal uppercase tracking-wider">
                          Active Reign
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs font-bold ${cfg.badge}`}>
                        <span>{cfg.icon}</span>
                        <span>{cfg.label.toUpperCase()}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-sumi/10 p-4 text-xs text-text-muted">
              <span>Weekly sprint evaluates every Monday at 00:05 UTC</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-tactile-secondary py-1.5 px-4"
              >
                Close Scroll
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
