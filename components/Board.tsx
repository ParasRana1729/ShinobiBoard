"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";
import type { BoardRow, BoardSort } from "@/lib/types";
import { getRankMeta } from "@/lib/ranks";
import RankAvatar from "./RankAvatar";
import {
  Trophy,
  SlidersHorizontal,
  Flame,
  Shield,
  Crown,
  Pin,
  RefreshCw,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
} from "lucide-react";

type View = "leaderboard" | "custom";
type Filter = "all" | "stale" | "frozen" | "titles";

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
  Academy: { label: "Academy", emblem: "🎒", badgeColor: "border-slate-700 bg-slate-800/40 text-slate-300" },
  Genin: { label: "Genin", emblem: "🍃", badgeColor: "border-emerald-500/30 bg-emerald-950/40 text-emerald-400" },
  Chunin: { label: "Chunin", emblem: "⭐", badgeColor: "border-amber-500/30 bg-amber-950/40 text-amber-300" },
  Jonin: { label: "Jonin", emblem: "⚔️", badgeColor: "border-indigo-500/30 bg-indigo-950/40 text-indigo-300" },
  ANBU: { label: "ANBU", emblem: "🎭", badgeColor: "border-purple-500/30 bg-purple-950/40 text-purple-300" },
  Kage: { label: "Kage", emblem: "👑", badgeColor: "border-yellow-500/40 bg-yellow-950/40 text-yellow-300 shadow-glow-gold" },
};

function DifficultyBadge({ diff }: { diff: string }) {
  if (diff === "Easy") {
    return <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">Easy</span>;
  }
  if (diff === "Hard") {
    return <span className="rounded border border-rose-500/30 bg-rose-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-400">Hard</span>;
  }
  return <span className="rounded border border-amber-500/30 bg-amber-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">Med</span>;
}

function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, goal)) * 100));
  const isComplete = value >= goal;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink/80 p-0.5 border border-white/[0.06]">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          isComplete
            ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-glow-emerald"
            : "bg-gradient-to-r from-amber-500 to-amber-400"
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
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [refreshingUser, setRefreshingUser] = useState<string | null>(null);

  const searchRequired = memberCount > 50;

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      view,
      sort,
      filter,
      q,
      page: String(page),
    });
    const res = await fetch(`/api/groups/${groupId}/board?${params}`);
    const j = await res.json();
    if (res.ok) {
      setRows(j.rows ?? []);
      setTotal(j.total ?? 0);
      setPages(j.pages ?? 1);
    } else {
      setMsg({ text: j.error ?? "Board load failed", error: true });
    }
  }, [groupId, view, sort, filter, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription via Supabase channel per group
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`group:${groupId}:board:${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `group_id=eq.${groupId}` },
        () => load()
      )
      .subscribe();
    const t = setInterval(load, 30_000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [groupId, load]);

  async function openCard(userId: string) {
    if (expanded === userId) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(userId);
    setDetail(null);
    const res = await fetch(`/api/groups/${groupId}/member/${userId}`);
    if (res.ok) setDetail(await res.json());
  }

  async function togglePin(userId: string, pinned: boolean) {
    const res = await fetch(`/api/groups/${groupId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, pinned: !pinned }),
    });
    const j = await res.json();
    if (!res.ok) setMsg({ text: j.error ?? "Pin limit reached (max 2)", error: true });
    else load();
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
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-surface/80 p-3.5 shadow-xl backdrop-blur-md">
        {/* Left: View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/[0.08] bg-ink/70 p-1">
            <button
              onClick={() => setView("leaderboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                view === "leaderboard"
                  ? "bg-amber-400 text-black shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setView("custom")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                view === "custom"
                  ? "bg-amber-400 text-black shadow-glow"
                  : "text-slate-400 hover:text-white"
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
              className="appearance-none rounded-xl border border-white/[0.08] bg-ink/70 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="weekly">Sort: Weekly Solves</option>
              <option value="streak">Sort: Longest Streak</option>
              <option value="xp">Sort: Total XP</option>
              <option value="base_rank">Sort: Base Rank</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
          </div>
        </div>

        {/* Right: Filters & Search */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-[280px]">
          {/* Filter Chips */}
          <div className="flex rounded-xl border border-white/[0.08] bg-ink/70 p-1 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "stale", label: "Stale" },
                { id: "frozen", label: "Frozen" },
                { id: "titles", label: "Titles" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilter(f.id);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  filter === f.id
                    ? "bg-white/[0.12] text-amber-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={searchRequired ? "Search required (club > 50)" : "Search ninja or @leetcode…"}
              className="w-full rounded-xl border border-white/[0.08] bg-ink/70 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {view === "custom" && (
        <p className="text-[11px] text-slate-400 italic">
          💡 Custom View: Drag and drop cards to organize your personal priority board. Stored per viewer.
        </p>
      )}

      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium ${
            msg.error
              ? "border border-rose-500/30 bg-rose-950/40 text-rose-300"
              : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {msg.error ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Cards Board Grid / Horizontal Scroll */}
      <div className="board-scroll flex gap-4 overflow-x-auto pb-4 pt-1 max-md:flex-col">
        {rows.map((r, index) => {
          const rankMeta = RANK_CONFIG[r.base_rank] ?? RANK_CONFIG.Academy;
          const isHokage = r.titles.some((t) => t.title === "hokage");
          const isFrozen = r.sync_status === "frozen";
          const isRateLimited = r.sync_status === "rate_limited";
          const isTop3 = index < 3 && !isFrozen && view === "leaderboard";
          const goalMet = r.weekly_count >= goal;

          // Podium border styling
          let cardBorder = "border-white/[0.08] hover:border-white/[0.2]";
          if (isTop3 && index === 0) {
            cardBorder = "border-amber-500/50 shadow-glow-gold hover:border-amber-400";
          } else if (isTop3 && index === 1) {
            cardBorder = "border-slate-400/40 shadow-lg hover:border-slate-300";
          } else if (isTop3 && index === 2) {
            cardBorder = "border-amber-700/40 shadow-lg hover:border-amber-600";
          } else if (isFrozen) {
            cardBorder = "border-slate-800 bg-ink/40 opacity-60";
          }

          return (
            <div
              key={r.user_id}
              draggable={view === "custom"}
              onDragStart={() => setDragId(r.user_id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(r.user_id)}
              className={`relative flex w-72 shrink-0 flex-col justify-between rounded-2xl border bg-surface/95 p-4 shadow-xl backdrop-blur-md transition-all max-md:w-full ${cardBorder} ${
                r.pinned ? "ring-1 ring-amber-400" : ""
              }`}
            >
              {/* Card Header: Drag handle, Rank, Avatar, Title */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {view === "custom" && (
                      <GripVertical className="h-4 w-4 text-slate-500 cursor-grab active:cursor-grabbing" />
                    )}

                    {/* Avatar with Anime Rank Emblem */}
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${r.user_id}`}
                        alt=""
                        className={`h-10 w-10 rounded-xl object-cover border ${
                          isHokage
                            ? "border-amber-400 shadow-glow"
                            : isTop3
                            ? "border-white/30"
                            : "border-white/[0.08]"
                        } bg-ink`}
                      />
                      <RankAvatar
                        rank={r.base_rank}
                        size="xs"
                        className="absolute -bottom-1 -right-1.5 z-10"
                      />
                      {r.pinned && (
                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 p-0.5 text-black shadow-sm z-20">
                          <Pin className="h-2.5 w-2.5 fill-black" />
                        </span>
                      )}
                    </div>

                    {/* Names */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-white tracking-tight">
                          {r.display_name}
                        </p>
                      </div>
                      <p className="truncate font-mono text-[11px] text-slate-400">
                        @{r.lc_username ?? "unlinked"}
                      </p>
                    </div>
                  </div>

                  {/* Rank Position */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono text-xs font-black ${
                        index === 0 && !isFrozen
                          ? "text-amber-400 font-extrabold text-sm"
                          : index === 1
                          ? "text-slate-300"
                          : index === 2
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      #{r.group_rank || index + 1}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                      {r.base_rank}
                    </span>
                  </div>
                </div>

                {/* Badges / Active Titles */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {r.titles.map((t) => (
                    <span
                      key={t.title}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 shadow-sm"
                    >
                      <Crown className="h-3 w-3 fill-amber-400" />
                      <span className="capitalize">{t.title.replace("_", " ")}</span>
                    </span>
                  ))}

                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${rankMeta.badgeColor}`}>
                    <span>{rankMeta.label}</span>
                  </span>

                  {isFrozen && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-950/40 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                      <Snowflake className="h-2.5 w-2.5" />
                      <span>FROZEN</span>
                    </span>
                  )}

                  {isRateLimited && (
                    <span className="rounded-md border border-amber-500/30 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                      Sync Paused
                    </span>
                  )}
                </div>

                {/* Weekly Goal Progress */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">
                      Weekly Solves
                    </span>
                    <span className="font-mono font-bold text-white">
                      <span className={goalMet ? "text-emerald-400" : "text-amber-400"}>{r.weekly_count}</span>
                      <span className="text-slate-500"> / {goal}</span>
                    </span>
                  </div>
                  <ProgressBar value={r.weekly_count} goal={goal} />
                </div>

                {/* Streak & Last Solved */}
                <div className="mt-3 rounded-xl border border-white/[0.04] bg-ink/60 p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                      <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                      <span>Streak</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-orange-400">
                      {r.streak} {r.streak === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div className="border-t border-white/[0.04] pt-1.5 flex items-center justify-between gap-1 text-[11px]">
                    {r.last_solved_slug ? (
                      <>
                        <span className="truncate text-slate-300 max-w-[130px]" title={r.last_solved_slug}>
                          {r.last_solved_slug}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {r.last_solved_diff && <DifficultyBadge diff={r.last_solved_diff} />}
                          <span className="text-[10px] text-slate-500">{timeAgo(r.last_solved_at)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-500 italic">No solves recorded yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Actions Toolbar */}
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <button
                  onClick={() => openCard(r.user_id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  <span>{expanded === r.user_id ? "Collapse" : "Inspect"}</span>
                  {expanded === r.user_id ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                <div className="flex items-center gap-1">
                  {r.user_id !== viewerId && (
                    <button
                      onClick={() => nudge(r.user_id)}
                      title="Nudge friend (1/day)"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-cyan-300 transition-colors"
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => refresh(r.user_id)}
                    disabled={refreshingUser === r.user_id}
                    title="Refresh profile stats (10-min shared cooldown)"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-amber-300 transition-colors"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${refreshingUser === r.user_id ? "animate-spin text-amber-400" : ""}`}
                    />
                  </button>

                  <button
                    onClick={() => togglePin(r.user_id, r.pinned)}
                    title={r.pinned ? "Unpin card" : "Pin card to top (max 2)"}
                    className={`rounded-lg p-1.5 transition-colors ${
                      r.pinned
                        ? "text-amber-400 bg-amber-950/40"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Card Drawer */}
              {expanded === r.user_id && (
                <div className="mt-3 border-t border-white/[0.08] pt-3 text-xs space-y-3 animate-in fade-in duration-200">
                  {!detail ? (
                    <div className="py-4 text-center text-slate-500 font-mono text-xs">
                      Fetching shinobi profile…
                    </div>
                  ) : (
                    <>
                      {/* 7-Day Activity Sparkline */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-emerald-400" />
                          <span>7-Day Activity (UTC)</span>
                        </p>
                        <div className="flex gap-1">
                          {detail.dots.map((d) => (
                            <div
                              key={d.day}
                              title={`${d.day}: ${d.count} solves`}
                              className={`flex-1 h-5 rounded-md flex items-center justify-center font-mono text-[9px] font-bold ${
                                d.count > 0
                                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-glow-emerald"
                                  : "bg-ink/60 text-slate-600 border border-white/[0.04]"
                              }`}
                            >
                              {d.count > 0 ? d.count : ""}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* E/M/H Breakdown */}
                      <div className="rounded-xl border border-white/[0.04] bg-ink/70 p-2.5">
                        <p className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-amber-400" />
                          <span>All-Time Solves ({detail.split.total} distinct)</span>
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                          <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-1">
                            <span className="block text-[10px] text-emerald-400 font-bold">Easy</span>
                            <span className="text-xs text-white font-black">{detail.split.Easy}</span>
                          </div>
                          <div className="rounded-lg bg-amber-950/30 border border-amber-500/20 p-1">
                            <span className="block text-[10px] text-amber-400 font-bold">Med</span>
                            <span className="text-xs text-white font-black">{detail.split.Medium}</span>
                          </div>
                          <div className="rounded-lg bg-rose-950/30 border border-rose-500/20 p-1">
                            <span className="block text-[10px] text-rose-400 font-bold">Hard</span>
                            <span className="text-xs text-white font-black">{detail.split.Hard}</span>
                          </div>
                        </div>
                      </div>

                      {/* Character Dossier & Base Rank XP Target */}
                      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-ink/70 p-2.5">
                        <RankAvatar rank={r.base_rank} size="md" showGlow />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              {getRankMeta(r.base_rank).character}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-amber-400">
                              {r.base_rank}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {getRankMeta(r.base_rank).characterTitle}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/[0.04] pt-1">
                            <span>{r.xp.toLocaleString()} XP</span>
                            <span className="text-amber-300 font-semibold">
                              {detail.xp_to_next.next
                                ? `+${detail.xp_to_next.needed} XP to ${detail.xp_to_next.next}`
                                : "MAX (Kage)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Duel W/L/D if duel group */}
                      {isDuel && detail.duel_record && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-semibold text-rose-300">
                              <Swords className="h-3.5 w-3.5" />
                              <span>Duel Scoreboard</span>
                            </span>
                            <span className="font-mono font-bold text-white">
                              <span className="text-emerald-400">{detail.duel_record.w}W</span> ·{" "}
                              <span className="text-rose-400">{detail.duel_record.l}L</span> ·{" "}
                              <span className="text-slate-400">{detail.duel_record.d}D</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recent 5 Solves List */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-300 mb-1">
                          Recent Counted Solves
                        </p>
                        <ul className="space-y-1">
                          {detail.recent.length === 0 && (
                            <li className="text-[11px] text-slate-500 italic">No recent solves</li>
                          )}
                          {detail.recent.slice(0, 5).map((s) => (
                            <li
                              key={s.slug + s.solved_at}
                              className="flex items-center justify-between gap-1.5 rounded-lg border border-white/[0.04] bg-ink/50 px-2 py-1 text-[11px]"
                            >
                              <span className="truncate text-slate-200" title={s.title ?? s.slug}>
                                {s.title ?? s.slug}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <DifficultyBadge diff={s.diff} />
                                <span className="font-mono text-[9px] text-slate-500">{s.lang}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sync Diagnostics */}
                      <div className="border-t border-white/[0.06] pt-2 text-[10px] text-slate-500">
                        <p>{detail.sync_label}</p>
                        {detail.fix_hint && (
                          <p className="mt-0.5 text-amber-300/80 font-medium">💡 {detail.fix_hint}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-surface p-12 text-center text-slate-400 shadow-xl">
          <Trophy className="mx-auto h-10 w-10 text-slate-600 mb-2 opacity-50" />
          <p className="text-sm font-semibold text-slate-300">No shinobi cards found</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or filter chips.</p>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface/60 px-4 py-2 text-xs">
        <span className="text-slate-400">
          Showing page <span className="font-bold text-white">{page}</span> of{" "}
          <span className="font-bold text-white">{pages}</span> ·{" "}
          <span className="font-mono font-bold text-amber-400">{total}</span> total members
        </span>

        <div className="flex items-center gap-1.5">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-ink/70 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-ink/70 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] disabled:opacity-40"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
