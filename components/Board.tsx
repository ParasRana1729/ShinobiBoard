"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";
import type { BoardRow, BoardSort } from "@/lib/types";

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

const RANK_EMBLEM: Record<string, string> = {
  Academy: "🎒",
  Genin: "🍃",
  Chunin: "⭐",
  Jonin: "⚔️",
  ANBU: "🎭",
  Kage: "👑",
};

function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, goal)) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-slate-700">
      <div className="h-full rounded bg-amber-400" style={{ width: `${pct}%` }} />
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
  const [msg, setMsg] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

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
      setRows(j.rows);
      setTotal(j.total);
      setPages(j.pages);
    } else {
      setMsg(j.error ?? "Board load failed");
    }
  }, [groupId, view, sort, filter, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: one channel per group (§11) — board + feed refresh on new events.
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`group:${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `group_id=eq.${groupId}` },
        () => load()
      )
      .subscribe();
    const t = setInterval(load, 30_000); // polling fallback (no presence v1)
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
    };
  }, [groupId, load]);

  async function openCard(userId: string) {
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
    if (!res.ok) setMsg(j.error ?? "Pin failed (max 2)");
    else load();
  }

  async function nudge(toUser: string) {
    const res = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user: toUser, group_id: groupId }),
    });
    const j = await res.json();
    setMsg(res.ok ? "Nudged! (in-app only v1 — no push)" : (j.error ?? "Nudge failed"));
  }

  async function refresh(targetId: string) {
    const res = await fetch("/api/sync/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: targetId }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Sync queued — ${j.fetched ?? 0} new` : (j.error ?? "Refresh failed"));
    load();
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
    <div>
      {/* Views — resolves order/sort conflict: drag only in Custom */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-slate-600 text-sm">
          {(["leaderboard", "custom"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 font-semibold capitalize ${view === v ? "bg-amber-400 text-black" : "text-slate-200"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as BoardSort)}
          className="rounded-lg border border-slate-600 bg-ink px-2 py-1.5 text-sm" title="Sort (Leaderboard view)">
          <option value="weekly">Sort: Weekly</option>
          <option value="streak">Sort: Streak</option>
          <option value="xp">Sort: XP</option>
          <option value="base_rank">Sort: Base rank</option>
        </select>
        <select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(1); }}
          className="rounded-lg border border-slate-600 bg-ink px-2 py-1.5 text-sm">
          <option value="all">Filter: All</option>
          <option value="stale">Stale only</option>
          <option value="frozen">Frozen</option>
          <option value="titles">Title holders</option>
        </select>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
          required={searchRequired} placeholder={searchRequired ? "Search required (club > 50) 🔍" : "Search name / lc_username"}
          className="min-w-52 flex-1 rounded-lg border border-slate-600 bg-ink px-3 py-1.5 text-sm" />
      </div>
      {view === "custom" && <p className="mt-1 text-xs text-slate-400">Custom = your personal drag-to-reorder view (stored as personal_order). Drag disabled in Leaderboard.</p>}
      {msg && <p className="mt-2 text-sm text-amber-200">{msg}</p>}

      {/* Trello-like horizontal board; vertical stack on mobile */}
      <div className="board-scroll mt-4 flex gap-3 overflow-x-auto pb-4 max-md:flex-col">
        {rows.map((r) => {
          const frozen = r.sync_status === "frozen";
          const title = r.titles[0];
          return (
            <div
              key={r.user_id}
              draggable={view === "custom"}
              onDragStart={() => setDragId(r.user_id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(r.user_id)}
              className={`w-64 shrink-0 rounded-xl border p-4 max-md:w-full ${frozen ? "border-slate-700 bg-card/50 opacity-60" : "border-slate-600 bg-card"} ${r.pinned ? "ring-1 ring-amber-400" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.avatar_url ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${r.user_id}`} alt=""
                    className="h-9 w-9 rounded-full bg-slate-700" />
                  <div>
                    <p className="text-sm font-bold leading-tight">{r.display_name}</p>
                    <p className="text-[11px] text-slate-400">@{r.lc_username ?? "—"}</p>
                  </div>
                </div>
                <span title="Base rank">{RANK_EMBLEM[r.base_rank] ?? "🎒"}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300">#{r.group_rank}</span>
                {r.pinned && <span title="Pinned">📌</span>}
                {title && <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">👑 {title.title}</span>}
                {frozen && <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px]">FROZEN</span>}
              </div>

              <div className="mt-2 text-xs text-slate-300">
                Weekly {r.weekly_count}/{goal}
              </div>
              <ProgressBar value={r.weekly_count} goal={goal} />

              <p className="mt-2 text-xs text-slate-300">
                🔥 {r.streak} · {r.last_solved_slug ? `${r.last_solved_slug} · ${r.last_solved_diff} · ${timeAgo(r.last_solved_at)}` : "no solves yet"}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                <button onClick={() => (expanded === r.user_id ? setExpanded(null) : openCard(r.user_id))}
                  className="rounded border border-slate-500 px-2 py-1">
                  {expanded === r.user_id ? "Collapse" : "Expand"}
                </button>
                {r.user_id !== viewerId && (
                  <button onClick={() => nudge(r.user_id)} className="rounded border border-slate-500 px-2 py-1">Nudge</button>
                )}
                <button onClick={() => refresh(r.user_id)} className="rounded border border-slate-500 px-2 py-1" title="Any member may refresh any card (10-min shared cooldown)">
                  Refresh
                </button>
                <button onClick={() => togglePin(r.user_id, r.pinned)} className="rounded border border-slate-500 px-2 py-1" title="Pin up to 2">
                  {r.pinned ? "Unpin" : "Pin"}
                </button>
              </div>

              {expanded === r.user_id && (
                <div className="mt-3 border-t border-slate-700 pt-2 text-xs">
                  {!detail ? <p className="text-slate-400">Loading…</p> : (
                    <>
                      <p className="font-semibold">Recent 5 counted solves</p>
                      <ul className="mt-1 space-y-1">
                        {detail.recent.length === 0 && <li className="text-slate-400">None yet</li>}
                        {detail.recent.map((s) => (
                          <li key={s.slug + s.solved_at} className="flex justify-between gap-2">
                            <span className="truncate">{s.title ?? s.slug}</span>
                            <span className="rounded bg-slate-700 px-1">{s.diff}</span>
                            <span className="text-slate-400">{s.lang}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 font-semibold">7-day activity (UTC)</p>
                      <div className="mt-1 flex gap-1">
                        {detail.dots.map((d) => (
                          <span key={d.day} title={`${d.day}: ${d.count}`}
                            className={`h-3 w-3 rounded-sm ${d.count > 0 ? "bg-emerald-400" : "bg-slate-700"}`} />
                        ))}
                      </div>
                      <p className="mt-2">
                        All-time E/M/H: {detail.split.Easy}/{detail.split.Medium}/{detail.split.Hard} · total {detail.split.total} (first-ever distinct slugs)
                      </p>
                      <p className="mt-1">Base {r.base_rank}{detail.xp_to_next.next ? ` · ${detail.xp_to_next.needed} XP to ${detail.xp_to_next.next}` : " · max"}</p>
                      {detail.titles.map((t) => (
                        <p key={t.title} className="text-yellow-300">👑 {t.title} · expires {timeAgo(t.expires_at).replace(" ago", "")} left</p>
                      ))}
                      {isDuel && detail.duel_record && (
                        <p className="mt-1">Duel record here W/L/D: {detail.duel_record.w}/{detail.duel_record.l}/{detail.duel_record.d}</p>
                      )}
                      <p className="mt-1 text-slate-300">Sync: {detail.sync_label}</p>
                      {detail.fix_hint && <p className="text-slate-400">💡 {detail.fix_hint}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rows.length === 0 && <p className="mt-4 text-sm text-slate-400">No cards match. Board renders pinned + Top 50 + search results.</p>}

      {/* Full roster pagination */}
      <div className="mt-2 flex items-center gap-3 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40">← Prev 50</button>
        <span className="text-slate-300">Page {page}/{pages} · {total} members</span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border border-slate-600 px-3 py-1 disabled:opacity-40">Next 50 →</button>
      </div>
    </div>
  );
}
