"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/week";
import { createClient } from "@/lib/supabase/client";
import {
  Crown,
  ShieldAlert,
  Target,
  Bell,
  TrendingUp,
  UserPlus,
  UserMinus,
  Snowflake,
  RefreshCw,
  Zap,
  Activity
} from "lucide-react";

export interface FeedEvent {
  id: string;
  type: string;
  text: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

const EVENT_CONFIG: Record<
  string,
  { icon: typeof Crown; color: string; label: string; badge: string }
> = {
  hokage: { icon: Crown, color: "text-amber-400", label: "Hokage", badge: "bg-amber-950/40 border-amber-500/30 text-amber-300" },
  title_awarded: { icon: Crown, color: "text-amber-400", label: "Title", badge: "bg-amber-950/40 border-amber-500/30 text-amber-300" },
  weekly_winner: { icon: Crown, color: "text-amber-400", label: "Winner", badge: "bg-amber-950/40 border-amber-500/30 text-amber-300" },
  rank_up: { icon: Zap, color: "text-violet-400", label: "Rank Up", badge: "bg-violet-950/40 border-violet-500/30 text-violet-300" },
  goal_hit: { icon: Target, color: "text-emerald-400", label: "Goal Hit", badge: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" },
  nudge: { icon: Bell, color: "text-cyan-400", label: "Nudge", badge: "bg-cyan-950/40 border-cyan-500/30 text-cyan-300" },
  overtook: { icon: TrendingUp, color: "text-orange-400", label: "Climbed", badge: "bg-orange-950/40 border-orange-500/30 text-orange-300" },
  comeback: { icon: Zap, color: "text-yellow-400", label: "Comeback", badge: "bg-yellow-950/40 border-yellow-500/30 text-yellow-300" },
  member_joined: { icon: UserPlus, color: "text-blue-400", label: "Joined", badge: "bg-blue-950/40 border-blue-500/30 text-blue-300" },
  member_left: { icon: UserMinus, color: "text-slate-400", label: "Left", badge: "bg-slate-800/40 border-slate-700 text-slate-300" },
  frozen: { icon: Snowflake, color: "text-sky-300", label: "Frozen", badge: "bg-sky-950/40 border-sky-500/30 text-sky-300" },
};

export function Feed({ groupId, initial }: { groupId: string; initial: FeedEvent[] }) {
  const [events, setEvents] = useState<FeedEvent[]>(initial);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/feed`);
      if (res.ok) {
        const j = await res.json();
        setEvents(j.events ?? []);
      }
    } finally {
      setRefreshing(false);
    }
  }

  // Realtime subscription via Supabase channel per group
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
    <div className="relative flex flex-col rounded-2xl border border-white/[0.08] bg-surface/90 p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Squad Activity</h3>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          title="Refresh activity"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 max-h-[540px] board-scroll">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <Activity className="h-8 w-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-medium">No activity yet</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Solve a problem to trigger the first squad event</p>
          </div>
        )}

        {events.map((e) => {
          const config = EVENT_CONFIG[e.type] ?? {
            icon: Activity,
            color: "text-slate-400",
            label: e.type.replace("_", " "),
            badge: "bg-slate-800/40 border-slate-700 text-slate-400",
          };
          const Icon = config.icon;

          return (
            <div
              key={e.id}
              className="group relative flex items-start gap-3 rounded-xl border border-white/[0.04] bg-ink/50 p-3 hover:border-white/[0.1] hover:bg-ink/80 transition-all"
            >
              <div className={`mt-0.5 rounded-lg border p-1.5 ${config.badge}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 leading-snug font-medium">{e.text}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="uppercase tracking-wider">{config.label}</span>
                  <span>·</span>
                  <span>{timeAgo(e.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
        <span className="text-[10px] text-slate-500 font-mono">
          Last 30 days · Cap 200 · Realtime channel
        </span>
      </div>
    </div>
  );
}
