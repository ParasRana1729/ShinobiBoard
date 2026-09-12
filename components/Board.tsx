"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";
import type { BoardRow, BoardSort } from "@/lib/types";
import { getRankMeta } from "@/lib/ranks";
import RankAvatar from "./RankAvatar";
import BoardSkeleton from "./BoardSkeleton";
import {
  Trophy,
  Users,
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
  Academy: { label: "Academy", emblem: "🎒", badgeColor: "border-sumi/15 bg-surface-elevated text-text-muted" },
  Genin: { label: "Genin", emblem: "🍃", badgeColor: "border-shinobi-teal/30 bg-shinobi-teal/10 text-shinobi-teal" },
  Chunin: { label: "Chunin", emblem: "⭐", badgeColor: "border-sumi/20 bg-surface-elevated text-text-primary" },
  Jonin: { label: "Jonin", emblem: "⚔️", badgeColor: "border-sumi/25 bg-surface-elevated text-text-primary" },
  ANBU: { label: "ANBU", emblem: "🎭", badgeColor: "border-sumi/30 bg-surface-elevated text-text-primary" },
  Kage: { label: "Kage", emblem: "👑", badgeColor: "border-shinobi-gold/30 bg-shinobi-gold/10 text-shinobi-gold" },
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
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
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
    } catch {
      setMsg({ text: "Failed to connect to board service", error: true });
    } finally {
      setLoading(false);
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sumi/15 bg-surface-card/90 p-3  ">
        {/* Left: View Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-sumi/15 bg-surface-elevated p-1 ">
            <button
              onClick={() => setView("leaderboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                view === "leaderboard"
                  ? "bg-shinobi-gold text-black shadow-tactile-btn"
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
                  ? "bg-shinobi-gold text-black shadow-tactile-btn"
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
              className="appearance-none rounded-xl border border-sumi/15 bg-surface-elevated py-1.5 pl-3 pr-8 text-xs font-medium text-text-primary  focus:border-shinobi-gold focus:outline-none"
            >
              <option value="weekly">Sort: Weekly Solves</option>
              <option value="streak">Sort: Longest Streak</option>
              <option value="xp">Sort: Total XP</option>
              <option value="base_rank">Sort: Base Rank</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
          </div>
        </div>

        {/* Right: Filters & Search */}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-[280px]">
          {/* Filter Chips */}
          <div className="flex rounded-xl border border-sumi/15 bg-ink/70 p-1 text-xs">
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
                    ? "bg-surface-elevated text-text-primary border border-sumi/20"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={searchRequired ? "Search required (club > 50)" : "Search ninja or @leetcode…"}
              className="w-full rounded-xl border border-sumi/15 bg-surface-elevated py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder-text-muted focus:border-sumi/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {view === "custom" && (
        <p className="text-[11px] text-text-muted italic">
          💡 Custom View: Drag and drop cards to organize your personal priority board. Stored per viewer.
        </p>
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

      {/* Cards Board Grid / Horizontal Scroll */}
      {loading && rows.length === 0 ? (
        <BoardSkeleton count={Math.min(memberCount || 3, 4)} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-sumi/15 bg-surface-card p-12 text-center text-text-muted shadow-tactile-card my-3">
          <Trophy className="mx-auto h-10 w-10 text-text-muted mb-2 opacity-50" />
          <p className="text-sm font-semibold text-text-secondary">No shinobi cards found</p>
          <p className="mt-1 text-xs text-text-muted">
            {q ? `No members matched "${q}". Try adjusting your search.` : filter !== "all" ? `No members match the "${filter}" filter.` : "This squad is currently waiting for members to join."}
          </p>
        </div>
      ) : (
        <div className="board-scroll flex gap-4 overflow-x-auto pb-4 pt-1 max-md:flex-col">
          {rows.map((r, index) => {
          const rankMeta = RANK_CONFIG[r.base_rank] ?? RANK_CONFIG.Academy;
          const isHokage = r.titles.some((t) => t.title === "hokage");
          const isFrozen = r.sync_status === "frozen";
          const isRateLimited = r.sync_status === "rate_limited";
          const isTop3 = index < 3 && !isFrozen && view === "leaderboard";
          const goalMet = r.weekly_count >= goal;

          // Podium border styling
          let cardBorder = "border-sumi/15 hover:border-sumi/25";
          if (isTop3 && index === 0) {
            cardBorder = "border-shinobi-gold/60 hover:border-shinobi-gold";
          } else if (isTop3 && index === 1) {
            cardBorder = "border-sumi/35 hover:border-sumi/50";
          } else if (isTop3 && index === 2) {
            cardBorder = "border-sumi/25 hover:border-sumi/40";
          } else if (isFrozen) {
            cardBorder = "border-sumi/10 bg-surface-elevated/40 opacity-70";
          }

          return (
            <div
              key={r.user_id}
              draggable={view === "custom"}
              onDragStart={() => setDragId(r.user_id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(r.user_id)}
              className={`relative flex w-72 shrink-0 flex-col justify-between rounded-2xl border bg-surface-card p-4 transition-all max-md:w-full ${cardBorder} ${
                r.pinned ? "ring-1 ring-shinobi-gold" : ""
              }`}
            >
              {/* Card Header: Drag handle, Rank, Avatar, Title */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {view === "custom" && (
                      <GripVertical className="h-4 w-4 text-text-muted cursor-grab active:cursor-grabbing" />
                    )}

                    {/* Avatar with Anime Rank Emblem */}
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${r.user_id}`}
                        alt=""
                        className={`h-10 w-10 rounded-xl object-cover border ${
                          isHokage
                            ? "border-shinobi-gold"
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-heading font-bold text-text-primary tracking-tight">
                          {r.display_name}
                        </p>
                      </div>
                      <p className="truncate font-mono text-[11px] text-text-muted">
                        @{r.lc_username ?? "unlinked"}
                      </p>
                    </div>
                  </div>

                  {/* Rank Position */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono text-xs font-black ${
                        index === 0 && !isFrozen
                          ? "text-shinobi-gold font-extrabold text-sm"
                          : index === 1
                          ? "text-text-secondary"
                          : index === 2
                          ? "text-text-secondary"
                          : "text-text-muted"
                      }`}
                    >
                      #{r.group_rank || index + 1}
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-text-muted">
                      {r.base_rank}
                    </span>
                  </div>
                </div>

                {/* Badges / Active Titles */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">
                      Weekly Solves
                    </span>
                    <span className="font-mono font-bold text-text-primary">
                      <span className={goalMet ? "text-shinobi-teal" : "text-shinobi-gold"}>{r.weekly_count}</span>
                      <span className="text-text-muted"> / {goal}</span>
                    </span>
                  </div>
                  <ProgressBar value={r.weekly_count} goal={goal} />
                </div>

                {/* Streak & Last Solved */}
                <div className="mt-3 rounded-xl border border-sumi/10 bg-surface-elevated p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                      <Flame className="h-3.5 w-3.5 text-shinobi-flame fill-shinobi-flame/30" />
                      <span>Streak</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-shinobi-flame">
                      {r.streak} {r.streak === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div className="border-t border-sumi/10 pt-1.5 flex items-center justify-between gap-1 text-[11px]">
                    {r.last_solved_slug ? (
                      <>
                        <span className="truncate text-text-secondary max-w-[130px]" title={r.last_solved_slug}>
                          {r.last_solved_slug}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          {r.last_solved_diff && <DifficultyBadge diff={r.last_solved_diff} />}
                          <span className="text-[10px] text-text-muted">{timeAgo(r.last_solved_at)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-text-muted italic">No solves recorded yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Actions Toolbar */}
              <div className="mt-3.5 flex items-center justify-between border-t border-sumi/10 pt-3">
                <button
                  onClick={() => openCard(r.user_id)}
                  className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
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

              {/* Expanded Card Drawer */}
              {expanded === r.user_id && (
                <div className="mt-3 border-t border-sumi/15 pt-3 text-xs space-y-3 animate-in fade-in duration-200">
                  {!detail ? (
                    <div className="py-4 text-center text-text-muted font-mono text-xs">
                      Fetching shinobi profile…
                    </div>
                  ) : (
                    <>
                      {/* 7-Day Activity Sparkline */}
                      <div>
                        <p className="text-[11px] font-semibold text-text-secondary mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-shinobi-teal" />
                          <span>7-Day Activity (UTC)</span>
                        </p>
                        <div className="flex gap-1">
                          {detail.dots.map((d) => (
                            <div
                              key={d.day}
                              title={`${d.day}: ${d.count} solves`}
                              className={`flex-1 h-5 rounded-md flex items-center justify-center font-mono text-[9px] font-bold ${
                                d.count > 0
                                  ? "bg-shinobi-teal text-ink border border-shinobi-teal"
                                  : "bg-surface-elevated text-text-muted border border-sumi/10"
                              }`}
                            >
                              {d.count > 0 ? d.count : ""}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* E/M/H Breakdown */}
                      <div className="rounded-xl border border-sumi/10 bg-surface-elevated p-2.5">
                        <p className="text-[11px] font-semibold text-text-secondary mb-1.5 flex items-center gap-1">
                          <Layers className="h-3 w-3 text-text-secondary" />
                          <span>All-Time Solves ({detail.split.total} distinct)</span>
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                          <div className="rounded-lg bg-surface border border-sumi/15 p-1">
                            <span className="block text-[10px] text-shinobi-teal font-bold">Easy</span>
                            <span className="text-xs text-text-primary font-black">{detail.split.Easy}</span>
                          </div>
                          <div className="rounded-lg bg-surface border border-sumi/15 p-1">
                            <span className="block text-[10px] text-text-secondary font-bold">Med</span>
                            <span className="text-xs text-text-primary font-black">{detail.split.Medium}</span>
                          </div>
                          <div className="rounded-lg bg-surface border border-sumi/15 p-1">
                            <span className="block text-[10px] text-shinobi-flame font-bold">Hard</span>
                            <span className="text-xs text-text-primary font-black">{detail.split.Hard}</span>
                          </div>
                        </div>
                      </div>

                      {/* Character Dossier & Base Rank XP Target */}
                      <div className="flex items-center gap-3 rounded-xl border border-sumi/10 bg-surface-elevated p-2.5">
                        <RankAvatar rank={r.base_rank} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-text-primary">
                              {getRankMeta(r.base_rank).character}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-shinobi-gold">
                              {r.base_rank}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted truncate">
                            {getRankMeta(r.base_rank).characterTitle}
                          </p>
                          <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-text-muted border-t border-sumi/10 pt-1">
                            <span>{r.xp.toLocaleString()} XP</span>
                            <span className="text-shinobi-gold font-semibold">
                              {detail.xp_to_next.next
                                ? `+${detail.xp_to_next.needed} XP to ${detail.xp_to_next.next}`
                                : "MAX (Kage)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Duel W/L/D if duel group */}
                      {isDuel && detail.duel_record && (
                        <div className="rounded-xl border border-sumi/15 bg-surface-elevated p-2.5">
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

                      {/* Recent 5 Solves List */}
                      <div>
                        <p className="text-[11px] font-semibold text-text-secondary mb-1">
                          Recent Counted Solves
                        </p>
                        <ul className="space-y-1">
                          {detail.recent.length === 0 && (
                            <li className="text-[11px] text-text-muted italic">No recent solves</li>
                          )}
                          {detail.recent.slice(0, 5).map((s) => (
                            <li
                              key={s.slug + s.solved_at}
                              className="flex items-center justify-between gap-1.5 rounded-lg border border-sumi/10 bg-surface-elevated px-2 py-1 text-[11px]"
                            >
                              <span className="truncate text-text-primary" title={s.title ?? s.slug}>
                                {s.title ?? s.slug}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <DifficultyBadge diff={s.diff} />
                                <span className="font-mono text-[9px] text-text-muted">{s.lang}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sync Diagnostics */}
                      <div className="border-t border-sumi/10 pt-2 text-[10px] text-text-muted">
                        <p>{detail.sync_label}</p>
                        {detail.fix_hint && (
                          <p className="mt-0.5 text-shinobi-gold font-medium">💡 {detail.fix_hint}</p>
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
