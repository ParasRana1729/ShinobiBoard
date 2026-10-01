"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";
import type { BoardRow, BoardSort, DailyBounty, DuelMatrixData } from "@/lib/types";
import { getRankMeta } from "@/lib/ranks";
import RankAvatar from "./RankAvatar";
import BoardSkeleton from "./BoardSkeleton";
import { DuelMatrix } from "./DuelMatrix";
import {
  Trophy,
  Target,
  SlidersHorizontal,
  Flame,
  Crown,
  Pin,
  RefreshCw,
  Bell,
  Search,
  ChevronDown,
  Swords,
  Snowflake,
  AlertTriangle,
  GripVertical,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

type View = "leaderboard" | "custom";
type Filter = "all" | "goal_achieved" | "active_today" | "hard_hunters" | "titles" | "stale" | "frozen";

interface Detail {
  recent: { title: string | null; slug: string; diff: string; lang: string; solved_at: string }[];
  dots: { day: string; count: number }[];
  split: { Easy: number; Medium: number; Hard: number; total: number };
  xp_to_next: { next: string | null; needed: number };
  titles: { title: string; expires_at: string }[];
  duel_record: { w: number; l: number; d: number } | null;
  sync_label: string;
  fix_hint: string;
}

const RANK_CONFIG: Record<string, { label: string; emblem: string; badgeColor: string }> = {
  Academy: { label: "Academy", emblem: "🎒", badgeColor: "border-slate-500/30 bg-slate-500/10 text-slate-400" },
  Genin: { label: "Genin", emblem: "🍃", badgeColor: "border-shinobi-teal/40 bg-shinobi-teal/10 text-shinobi-teal" },
  Chunin: { label: "Chunin", emblem: "⭐", badgeColor: "border-sky-500/40 bg-sky-500/10 text-sky-400" },
  Jonin: { label: "Jonin", emblem: "⚔️", badgeColor: "border-shinobi-violet/40 bg-shinobi-violet/10 text-shinobi-violet" },
  ANBU: { label: "ANBU", emblem: "🎭", badgeColor: "border-shinobi-crimson/40 bg-shinobi-crimson/10 text-shinobi-crimson" },
  Kage: { label: "Kage", emblem: "👑", badgeColor: "border-shinobi-amber/50 bg-shinobi-amber/15 text-shinobi-amber" },
  Sage: { label: "Sage", emblem: "🐸", badgeColor: "border-orange-500/50 bg-orange-500/15 text-orange-400" },
};

function DifficultyBadge({ diff }: { diff: string }) {
  if (diff === "Easy") {
    return <span className="rounded border border-shinobi-teal/30 bg-shinobi-teal/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-teal">Easy</span>;
  }
  if (diff === "Hard") {
    return <span className="rounded border border-shinobi-flame/30 bg-shinobi-flame/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-flame">Hard</span>;
  }
  return <span className="rounded border border-sumi/20 bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-secondary">Med</span>;
}

function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, goal)) * 100));
  const isComplete = value >= goal;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-elevated p-0.5 border border-sumi/10">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          isComplete
            ? "bg-shinobi-teal"
            : "bg-shinobi-gold"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Board({
  groupId,
  goal,
  viewerId,
  memberCount,
  isDuel,
}: {
  groupId: string;
  goal: number;
  viewerId: string;
  memberCount: number;
  isDuel: boolean;
}) {
  const [view, setView] = useState<View>("leaderboard");
  const [sort, setSort] = useState<BoardSort>("weekly");
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [inspectUser, setInspectUser] = useState<BoardRow | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [refreshingUser, setRefreshingUser] = useState<string | null>(null);
  const [dailyBounty, setDailyBounty] = useState<DailyBounty | null>(null);
  const [duelMatrix, setDuelMatrix] = useState<DuelMatrixData | null>(null);

  const searchRequired = memberCount > 50;
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search query by 250ms to prevent request thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const load = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const ac = new AbortController();
    abortControllerRef.current = ac;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        sort,
        filter,
        q: debouncedQuery,
        page: String(page),
      });
      const res = await fetch(`/api/groups/${groupId}/board?${params}`, {
        signal: ac.signal,
      });
      const j = await res.json();
      if (res.ok) {
        setRows(j.rows ?? []);
        setTotal(j.total ?? 0);
        setPages(j.pages ?? 1);
        setDailyBounty(j.daily_bounty ?? null);
        setDuelMatrix(j.duel_matrix ?? null);
      } else {
        setMsg({ text: j.error ?? "Board load failed", error: true });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setMsg({ text: "Failed to connect to board service", error: true });
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, view, sort, filter, debouncedQuery, page]);

  // Keep a stable ref to load to avoid re-subscribing realtime channels on filter/search changes
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    load();
  }, [load]);

  // Stable Realtime subscription via Supabase channel per group (NEVER torn down on search/filter changes)
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`group:${groupId}:board:${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `group_id=eq.${groupId}` },
        () => loadRef.current()
      )
      .subscribe();
    const t = setInterval(() => loadRef.current(), 30_000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [groupId]);

  // Sync inspectUser if rows refresh in background
  useEffect(() => {
    if (inspectUserId && rows.length > 0) {
      const refreshed = rows.find((r) => r.user_id === inspectUserId);
      if (refreshed) setInspectUser(refreshed);
    }
  }, [rows, inspectUserId]);

  const closeDrawer = useCallback(() => {
    setInspectUserId(null);
    setInspectUser(null);
    setDetail(null);
  }, []);

  // Lock body scroll when slide-over drawer is open
  useEffect(() => {
    if (inspectUserId) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [inspectUserId]);

  // Handle Escape key to close the inspect slide-over drawer
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
      }
    }
    if (inspectUserId) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [inspectUserId, closeDrawer]);

  async function openCard(userId: string, member?: BoardRow) {
    const target = member ?? rows.find((r) => r.user_id === userId) ?? null;
    setInspectUser(target);
    setInspectUserId(userId);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/member/${userId}`);
      if (res.ok) {
        setDetail(await res.json());
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  async function togglePin(userId: string, pinned: boolean) {
    // Optimistic toggle for instant tactile feedback
    setRows((prev) =>
      prev.map((r) => (r.user_id === userId ? { ...r, pinned: !pinned } : r))
    );
    try {
      const res = await fetch(`/api/groups/${groupId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, pinned: !pinned }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg({ text: j.error ?? "Pin limit reached (max 2)", error: true });
        load();
      } else {
        load();
      }
    } catch {
      setMsg({ text: "Pin operation failed", error: true });
      load();
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function nudge(toUser: string) {
    const res = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user: toUser, group_id: groupId }),
    });
    const j = await res.json();
    if (res.ok) {
      setMsg({ text: "Nudged! Notification logged to squad feed." });
    } else {
      setMsg({ text: j.error ?? "Nudge failed", error: true });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function refresh(targetId: string) {
    setRefreshingUser(targetId);
    try {
      const res = await fetch("/api/sync/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: targetId }),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg({ text: `Sync complete — ${j.fetched ?? 0} new solves indexed.` });
        load();
      } else {
        setMsg({ text: j.error ?? "Refresh cooldown active", error: true });
      }
    } finally {
      setRefreshingUser(null);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  async function persistOrder(orderedIds: string[]) {
    await fetch(`/api/groups/${groupId}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordered_user_ids: orderedIds }),
    });
  }

  function onDrop(targetId: string) {
    if (view !== "custom" || !dragId || dragId === targetId) return;
    const ids = rows.map((r) => r.user_id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setRows(ids.map((id) => rows.find((r) => r.user_id === id)!));
    persistOrder(ids);
    setDragId(null);
    setDragOverId(null);
  }

  const inspectedMember = inspectUser ?? (inspectUserId ? rows.find((r) => r.user_id === inspectUserId) ?? null : null);

  return (
    <div className="space-y-4">
      {/* Daily Shinobi Bounty Banner */}
      {dailyBounty && (
        <div className="relative overflow-hidden rounded-2xl border border-shinobi-gold/30 bg-surface-card p-4 shadow-tactile-card transition-all">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-shinobi-gold/40 bg-shinobi-gold/10 text-shinobi-gold shadow-tactile-card">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-shinobi-gold">
                    Daily Shinobi Bounty
                  </span>
                  <DifficultyBadge diff={dailyBounty.difficulty} />
                  <span className="font-mono text-[10px] text-text-muted">{dailyBounty.date}</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  {dailyBounty.title}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-xl border border-sumi/15 bg-surface-elevated px-3 py-1.5 font-mono text-xs text-text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 text-shinobi-teal" />
                <span>
                  {rows.filter((r) => r.bounty_completed).length} / {rows.length} Claimed
                </span>
              </div>

              <a
                href={dailyBounty.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              >
                <span>Solve on LeetCode</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar: Two-tier layout eliminating awkward filter wrapping */}
      <div className="space-y-3 rounded-2xl border border-sumi/15 bg-surface-card/90 p-3.5 shadow-tactile-card">
        {/* Tier 1: View Switchers, Sort dropdown & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-sumi/15 bg-surface-elevated p-1">
              <button
                onClick={() => setView("leaderboard")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  view === "leaderboard"
                    ? "bg-shinobi-gold text-white shadow-tactile-btn"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>Leaderboard</span>
              </button>
              <button
                onClick={() => setView("custom")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  view === "custom"
                    ? "bg-shinobi-gold text-white shadow-tactile-btn"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Custom Order</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as BoardSort)}
                className="appearance-none rounded-xl border border-sumi/15 bg-surface-elevated py-1.5 pl-3 pr-8 text-xs font-medium text-text-primary focus:border-shinobi-gold focus:outline-none"
              >
                <option value="weekly">Sort: Weekly Solves</option>
                <option value="streak">Sort: Longest Streak</option>
                <option value="xp">Sort: Total XP</option>
                <option value="base_rank">Sort: Base Rank</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
            </div>
          </div>

          {/* Search Bar with Instant Clear Button */}
          <div className="relative w-full sm:w-64 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchRequired ? "Search required (club > 50)" : "Search ninja or @leetcode…"}
              className="w-full rounded-xl border border-sumi/15 bg-surface-elevated py-1.5 pl-8 pr-8 text-xs text-text-primary placeholder-text-muted focus:border-shinobi-gold focus:outline-none focus:ring-1 focus:ring-shinobi-gold transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary transition-colors"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Filter Chips Rail (No awkward wrapping, smooth horizontal scroll on small screens) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-sumi/10 scrollbar-none">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted shrink-0 pr-1">Filter:</span>
          {(
            [
              { id: "all", label: "All" },
              { id: "goal_achieved", label: "Goal Met" },
              { id: "active_today", label: "Active Today" },
              { id: "hard_hunters", label: "Hard Hunters" },
              { id: "titles", label: "Titles" },
              { id: "stale", label: "Stale" },
              { id: "frozen", label: "Frozen" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                filter === f.id
                  ? "bg-shinobi-gold/20 text-shinobi-gold border border-shinobi-gold/40 shadow-sm"
                  : "bg-surface-elevated/70 text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-sumi/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {view === "custom" && (
        <div className="flex items-center gap-2 rounded-xl border border-sumi/15 bg-surface-elevated/70 px-3 py-2 text-[11px] text-text-secondary">
          <GripVertical className="h-3.5 w-3.5 text-shinobi-gold" />
          <span><b>Custom Roster View:</b> Drag and drop cards to organize your personal accountability list. Order saved automatically.</span>
        </div>
      )}

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium ${
            msg.error
              ? "border border-shinobi-flame/30 bg-shinobi-flame/10 text-shinobi-flame"
              : "border border-shinobi-teal/30 bg-shinobi-teal/10 text-shinobi-teal"
          }`}
        >
          {msg.error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Active sync indicator bar */}
      {loading && rows.length > 0 && (
        <div className="h-0.5 w-full bg-sumi/[0.06] overflow-hidden rounded-full my-2">
          <div className="h-full bg-shinobi-gold animate-pulse w-1/2" />
        </div>
      )}

      {/* 1:1 Duel Head-to-Head Comparison Matrix */}
      {isDuel && duelMatrix && (
        <DuelMatrix matrix={duelMatrix} viewerId={viewerId} />
      )}

      {/* Cards Board Grid */}
      {loading && rows.length === 0 ? (
        <BoardSkeleton count={Math.min(memberCount || 4, 6)} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-sumi/15 bg-surface-card p-12 text-center text-text-muted shadow-tactile-card my-3">
          <Trophy className="mx-auto h-10 w-10 text-text-muted mb-2 opacity-50" />
          <p className="text-sm font-semibold text-text-secondary">No shinobi cards found</p>
          <p className="mt-1 text-xs text-text-muted">
            {debouncedQuery
              ? `No members matched "${debouncedQuery}". Try adjusting your search.`
              : filter !== "all"
              ? `No members match the "${filter}" filter.`
              : "This squad is currently waiting for members to join."}
          </p>
          {(debouncedQuery || filter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="mt-3 btn-tactile-secondary py-1.5 px-3 text-xs"
            >
              Reset Filters & Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {rows.map((r, index) => {
            const rankMeta = RANK_CONFIG[r.base_rank] ?? RANK_CONFIG.Academy;
            const fullMeta = getRankMeta(r.base_rank);
            const isHokage = r.titles.some((t) => t.title === "hokage");
            const isFrozen = r.sync_status === "frozen";
            const isRateLimited = r.sync_status === "rate_limited";
            const isTop3 = index < 3 && !isFrozen && view === "leaderboard";
            const goalMet = r.weekly_count >= goal;
            const isDragTarget = dragOverId === r.user_id && dragId !== r.user_id;

            // Podium border and glow styling
            let cardBorder = "border-sumi/15 hover:border-sumi/30";
            let cardGlow = "";
            if (isDragTarget) {
              cardBorder = "border-dashed border-shinobi-teal ring-2 ring-shinobi-teal/50";
            } else if (isTop3 && index === 0) {
              cardBorder = "border-shinobi-gold/60 hover:border-shinobi-gold shadow-tactile-podium";
              cardGlow = "shadow-[0_0_24px_rgba(224,86,56,0.18)]";
            } else if (isTop3 && index === 1) {
              cardBorder = "border-slate-400/40 hover:border-slate-300";
            } else if (isTop3 && index === 2) {
              cardBorder = "border-amber-700/40 hover:border-amber-600";
            } else if (isFrozen) {
              cardBorder = "border-sumi/10";
            }

            const cardBg = isFrozen
              ? "bg-surface-elevated/40 opacity-70"
              : `bg-gradient-to-b ${fullMeta.accentBg}`;

            return (
              <div
                key={r.user_id}
                draggable={view === "custom"}
                onDragStart={() => setDragId(r.user_id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== r.user_id) setDragOverId(r.user_id);
                }}
                onDragLeave={() => {
                  if (dragOverId === r.user_id) setDragOverId(null);
                }}
                onDrop={() => onDrop(r.user_id)}
                className={`group relative flex w-full flex-col justify-between rounded-2xl border ${cardBg} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-tactile-card-hover ${cardBorder} ${cardGlow} ${
                  r.pinned ? "ring-1 ring-shinobi-gold/70" : ""
                }`}
              >
                <div>
                  {/* Card Header: Drag handle, Avatar, Names, Rank Position */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {view === "custom" && (
                        <GripVertical className="h-4 w-4 text-text-muted cursor-grab active:cursor-grabbing shrink-0" />
                      )}

                      {/* Avatar with Anime Rank Emblem */}
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${r.user_id}`}
                          alt=""
                          className={`h-10 w-10 rounded-xl object-cover border ${
                            isHokage
                              ? "border-shinobi-gold ring-1 ring-shinobi-gold/50"
                              : isTop3
                              ? "border-sumi/30"
                              : "border-sumi/15"
                          } bg-surface-elevated`}
                        />
                        <RankAvatar
                          rank={r.base_rank}
                          size="xs"
                          className="absolute -bottom-1 -right-1.5 z-10"
                        />
                        {r.pinned && (
                          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-shinobi-gold p-0.5 text-ink shadow-sm z-20">
                            <Pin className="h-2.5 w-2.5 fill-ink" />
                          </span>
                        )}
                      </div>

                      {/* Names */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-text-primary tracking-tight">
                          {r.display_name}
                        </p>
                        <p className="truncate font-mono text-[11px] text-text-muted">
                          @{r.lc_username ?? "unlinked"}
                        </p>
                      </div>
                    </div>

                    {/* Rank Position Podium Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      {index === 0 && !isFrozen && view === "leaderboard" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-shinobi-gold/50 bg-shinobi-gold/15 px-2 py-0.5 font-mono text-xs font-black text-shinobi-gold shadow-tactile-btn">
                          <Crown className="h-3 w-3 fill-shinobi-gold" />
                          <span>#1 HOKAGE</span>
                        </span>
                      ) : index === 1 && !isFrozen && view === "leaderboard" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-400/40 bg-slate-400/10 px-1.5 py-0.5 font-mono text-xs font-black text-slate-300">
                          <span>#2</span>
                        </span>
                      ) : index === 2 && !isFrozen && view === "leaderboard" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-700/40 bg-amber-800/15 px-1.5 py-0.5 font-mono text-xs font-black text-amber-500">
                          <span>#3</span>
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-text-muted">
                          #{r.group_rank || index + 1}
                        </span>
                      )}
                      <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-mono font-semibold ${fullMeta.textColor}`}>
                        {r.base_rank}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Active Titles */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {r.bounty_completed && (
                      <span
                        title="Completed Today's Shinobi Bounty"
                        className="inline-flex items-center gap-1 rounded-md border border-shinobi-gold/40 bg-shinobi-gold/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-gold shadow-tactile-card"
                      >
                        <Target className="h-3 w-3 text-shinobi-gold" />
                        <span>Bounty AC</span>
                      </span>
                    )}
                    {r.titles.map((t) => (
                      <span
                        key={t.title}
                        className="inline-flex items-center gap-1 rounded-md border border-shinobi-gold/30 bg-shinobi-gold/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-shinobi-gold shadow-tactile-card"
                      >
                        <Crown className="h-3 w-3 fill-shinobi-gold" />
                        <span className="capitalize">{t.title.replace("_", " ")}</span>
                      </span>
                    ))}

                    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${rankMeta.badgeColor}`}>
                      <span>{rankMeta.label}</span>
                    </span>

                    {isFrozen && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-sumi/20 bg-surface-elevated px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
                        <Snowflake className="h-2.5 w-2.5" />
                        <span>FROZEN</span>
                      </span>
                    )}

                    {isRateLimited && (
                      <span className="rounded-md border border-shinobi-gold/30 bg-shinobi-gold/10 px-1.5 py-0.5 text-[10px] font-medium text-shinobi-gold">
                        Sync Paused
                      </span>
                    )}
                  </div>

                  {/* Weekly Goal Progress */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-secondary flex items-center gap-1.5">
                        <span>Weekly Solves</span>
                        {goalMet && (
                          <span className="inline-flex items-center gap-1 rounded bg-shinobi-teal/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-shinobi-teal border border-shinobi-teal/30">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            <span>Goal Met</span>
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-text-primary">
                        <span className={goalMet ? "text-shinobi-teal" : "text-shinobi-gold"}>{r.weekly_count}</span>
                        <span className="text-text-muted"> / {goal}</span>
                      </span>
                    </div>
                    <ProgressBar value={r.weekly_count} goal={goal} />
                  </div>

                  {/* Streak & XP Metric Bar (Clean, uncluttered, no redundant problem slug) */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-sumi/10 bg-surface-elevated/70 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Flame className={`h-4 w-4 ${r.streak > 0 ? "text-shinobi-flame fill-shinobi-flame/30" : "text-text-muted"}`} />
                      <span className="text-[11px] font-semibold text-text-secondary">Streak</span>
                      <span className="font-mono text-xs font-bold text-shinobi-flame">
                        {r.streak}d
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      <Zap className="h-3.5 w-3.5 text-shinobi-gold" />
                      <span className="font-mono text-xs font-bold text-text-primary">
                        {r.xp.toLocaleString()} <span className="text-[10px] text-text-muted font-normal">XP</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Toolbar */}
                <div className="mt-3.5 flex items-center justify-between border-t border-sumi/10 pt-3">
                  <button
                    onClick={() => openCard(r.user_id, r)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-shinobi-gold hover:text-white transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Inspect Shinobi</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {r.user_id !== viewerId && (
                      <button
                        onClick={() => nudge(r.user_id)}
                        title="Nudge friend (1/day)"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-sumi/[0.08] hover:text-text-primary transition-colors"
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => refresh(r.user_id)}
                      disabled={refreshingUser === r.user_id}
                      title="Refresh profile stats (10-min shared cooldown)"
                      className="rounded-lg p-1.5 text-text-muted hover:bg-sumi/[0.08] hover:text-shinobi-gold transition-colors"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${refreshingUser === r.user_id ? "animate-spin text-shinobi-gold" : ""}`}
                      />
                    </button>

                    <button
                      onClick={() => togglePin(r.user_id, r.pinned)}
                      title={r.pinned ? "Unpin card" : "Pin card to top (max 2)"}
                      className={`rounded-lg p-1.5 transition-colors ${
                        r.pinned
                          ? "text-shinobi-gold bg-shinobi-gold/10 border border-shinobi-gold/30"
                          : "text-text-muted hover:bg-sumi/[0.08] hover:text-text-primary"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Shinobi Slide-Over Drawer */}
      {inspectUserId && inspectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-member-name"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={closeDrawer}
          />

          {/* Slide-over sheet */}
          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-sumi/20 bg-surface-card p-6 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-sumi/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inspectedMember.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${inspectedMember.user_id}`}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover border border-sumi/20 bg-surface-elevated"
                  />
                  <RankAvatar
                    rank={inspectedMember.base_rank}
                    size="sm"
                    className="absolute -bottom-1 -right-1 z-10"
                  />
                </div>
                <div>
                  <h3 id="drawer-member-name" className="font-heading text-lg font-bold text-text-primary">
                    {inspectedMember.display_name}
                  </h3>
                  {inspectedMember.lc_username ? (
                    <a
                      href={`https://leetcode.com/${inspectedMember.lc_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-shinobi-gold hover:underline"
                    >
                      <span>@{inspectedMember.lc_username}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-text-muted">@unlinked</span>
                  )}
                </div>
              </div>

              <button
                onClick={closeDrawer}
                aria-label="Close drawer"
                className="rounded-lg p-1.5 text-text-muted hover:bg-sumi/10 hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-4 flex items-center gap-2">
              {inspectedMember.user_id !== viewerId && (
                <button
                  onClick={() => nudge(inspectedMember.user_id)}
                  className="flex-1 btn-tactile-secondary py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <Bell className="h-3.5 w-3.5 text-shinobi-gold" />
                  <span>Nudge</span>
                </button>
              )}
              <button
                onClick={() => refresh(inspectedMember.user_id)}
                disabled={refreshingUser === inspectedMember.user_id}
                className="flex-1 btn-tactile-secondary py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshingUser === inspectedMember.user_id ? "animate-spin text-shinobi-gold" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => togglePin(inspectedMember.user_id, inspectedMember.pinned)}
                className={`btn-tactile-secondary py-1.5 text-xs inline-flex items-center justify-center gap-1.5 px-3 ${
                  inspectedMember.pinned ? "text-shinobi-gold border-shinobi-gold/40" : ""
                }`}
              >
                <Pin className="h-3.5 w-3.5" />
                <span>{inspectedMember.pinned ? "Pinned" : "Pin"}</span>
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="mt-5 space-y-4">
              {loadingDetail || !detail ? (
                <div className="py-12 text-center text-text-muted font-mono text-xs space-y-2">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-shinobi-gold border-t-transparent" />
                  <p>Fetching shinobi profile and records…</p>
                </div>
              ) : (
                <>
                  {/* 7-Day Activity Sparkline */}
                  <div className="rounded-xl border border-sumi/10 bg-surface-elevated/70 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-shinobi-teal" />
                      <span>7-Day Activity (UTC)</span>
                    </p>
                    <div className="flex gap-1.5">
                      {detail.dots.map((d) => (
                        <div
                          key={d.day}
                          title={`${d.day}: ${d.count} solves`}
                          className={`flex-1 h-7 rounded-md flex flex-col items-center justify-center font-mono text-[10px] font-bold ${
                            d.count > 0
                              ? "bg-shinobi-teal text-ink border border-shinobi-teal"
                              : "bg-surface-elevated text-text-muted border border-sumi/10"
                          }`}
                        >
                          <span>{d.count > 0 ? d.count : "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All-Time Solves Breakdown */}
                  <div className="rounded-xl border border-sumi/10 bg-surface-elevated/70 p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-text-secondary" />
                      <span>All-Time Solves ({detail.split.total} distinct)</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="rounded-lg bg-surface border border-sumi/15 p-2">
                        <span className="block text-[10px] text-shinobi-teal font-bold uppercase">Easy</span>
                        <span className="text-sm text-text-primary font-black">{detail.split.Easy}</span>
                      </div>
                      <div className="rounded-lg bg-surface border border-sumi/15 p-2">
                        <span className="block text-[10px] text-text-secondary font-bold uppercase">Med</span>
                        <span className="text-sm text-text-primary font-black">{detail.split.Medium}</span>
                      </div>
                      <div className="rounded-lg bg-surface border border-sumi/15 p-2">
                        <span className="block text-[10px] text-shinobi-flame font-bold uppercase">Hard</span>
                        <span className="text-sm text-text-primary font-black">{detail.split.Hard}</span>
                      </div>
                    </div>
                    {detail.split.total > 0 && (
                      <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full border border-sumi/10 bg-surface">
                        <div
                          style={{ width: `${(detail.split.Easy / detail.split.total) * 100}%` }}
                          className="bg-shinobi-teal"
                          title={`Easy: ${detail.split.Easy}`}
                        />
                        <div
                          style={{ width: `${(detail.split.Medium / detail.split.total) * 100}%` }}
                          className="bg-sky-400"
                          title={`Medium: ${detail.split.Medium}`}
                        />
                        <div
                          style={{ width: `${(detail.split.Hard / detail.split.total) * 100}%` }}
                          className="bg-shinobi-flame"
                          title={`Hard: ${detail.split.Hard}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Character Dossier & Base Rank XP Target */}
                  <div className="flex items-center gap-3.5 rounded-xl border border-sumi/10 bg-surface-elevated/70 p-3.5">
                    <RankAvatar rank={inspectedMember.base_rank} size="lg" showGlow />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">
                          {getRankMeta(inspectedMember.base_rank).character}
                        </span>
                        <span className={`font-mono text-xs font-bold ${getRankMeta(inspectedMember.base_rank).textColor}`}>
                          {inspectedMember.base_rank}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {getRankMeta(inspectedMember.base_rank).characterTitle}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono text-text-muted border-t border-sumi/10 pt-1.5">
                        <span>{inspectedMember.xp.toLocaleString()} XP</span>
                        <span className="text-shinobi-gold font-semibold">
                          {detail.xp_to_next.next
                            ? `+${detail.xp_to_next.needed} XP to ${detail.xp_to_next.next}`
                            : "MAX TIER (Sage)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duel W/L/D if duel group */}
                  {isDuel && detail.duel_record && (
                    <div className="rounded-xl border border-sumi/15 bg-surface-elevated/70 p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-semibold text-shinobi-flame">
                          <Swords className="h-3.5 w-3.5" />
                          <span>Duel Scoreboard</span>
                        </span>
                        <span className="font-mono font-bold text-text-primary">
                          <span className="text-shinobi-teal">{detail.duel_record.w}W</span> ·{" "}
                          <span className="text-shinobi-flame">{detail.duel_record.l}L</span> ·{" "}
                          <span className="text-text-muted">{detail.duel_record.d}D</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recent Solves List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-secondary">
                      Recent Counted Solves
                    </p>
                    <ul className="space-y-1.5">
                      {detail.recent.length === 0 && (
                        <li className="rounded-lg border border-sumi/10 bg-surface-elevated p-3 text-center text-xs text-text-muted italic">
                          No recent counted solves recorded
                        </li>
                      )}
                      {detail.recent.slice(0, 5).map((s) => (
                        <li
                          key={s.slug + s.solved_at}
                          className="flex items-center justify-between gap-2 rounded-lg border border-sumi/10 bg-surface-elevated/80 px-3 py-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <a
                              href={`https://leetcode.com/problems/${s.slug}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate font-medium text-text-primary hover:text-shinobi-gold transition-colors block"
                              title={s.title ?? s.slug}
                            >
                              {s.title ?? s.slug}
                            </a>
                            <span className="font-mono text-[10px] text-text-muted">{timeAgo(s.solved_at)}</span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <DifficultyBadge diff={s.diff} />
                            <span className="font-mono text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-sumi/10">
                              {s.lang}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sync Diagnostics */}
                  <div className="rounded-xl border border-sumi/10 bg-surface-elevated/40 p-3 text-[11px] text-text-muted space-y-1">
                    <p className="font-mono">{detail.sync_label}</p>
                    {detail.fix_hint && (
                      <p className="text-shinobi-gold font-medium">💡 {detail.fix_hint}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-xl border border-sumi/10 bg-surface/60 px-4 py-2 text-xs">
        <span className="text-text-muted">
          Showing page <span className="font-bold text-text-primary">{page}</span> of{" "}
          <span className="font-bold text-text-primary">{pages}</span> ·{" "}
          <span className="font-mono font-bold text-shinobi-gold">{total}</span> total members
        </span>

        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-sumi/15 bg-ink/70 px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-sumi/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-sumi/15 bg-ink/70 px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-sumi/10 disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
