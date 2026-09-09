"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";

export interface FeedEvent {
  id: string;
  type: string;
  text: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export function Feed({ groupId, initial }: { groupId: string; initial: FeedEvent[] }) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);

  async function refresh() {
    const res = await fetch(`/api/groups/${groupId}/feed`);
    if (res.ok) {
      const j = await res.json();
      setEvents(j.events ?? []);
    }
  }

  // Realtime: one channel per group (§11) — new feed events push instantly.
  // Per-instance topic suffix (see Board.tsx): supabase-js reuses channels by
  // topic and .on() after .subscribe() throws when Board + Feed collide.
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`group:${groupId}:feed:${Math.random().toString(36).slice(2, 10)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `group_id=eq.${groupId}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return (
    <div className="rounded-xl border border-slate-700 bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Squad feed</h3>
        <button onClick={refresh} className="text-xs text-slate-300 underline">refresh</button>
      </div>
      <ul className="mt-2 max-h-96 space-y-2 overflow-y-auto text-sm">
        {events.length === 0 && <li className="text-slate-400">No events yet — solve something! 🍜</li>}
        {events.map((e) => (
          <li key={e.id} className="rounded-lg bg-black/30 px-3 py-2">
            <span className="mr-2 inline-block rounded bg-slate-700 px-1.5 py-0.5 text-[10px] uppercase">{e.type.replace("_", " ")}</span>
            <span>{e.text}</span>
            <span className="ml-2 text-xs text-slate-400">{timeAgo(e.created_at)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">Retention 30 days · cap 200/group · realtime via group channel</p>
    </div>
  );
}
