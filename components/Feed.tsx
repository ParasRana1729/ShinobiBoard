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
  hokage: { icon: Crown, color: "text-shinobi-gold", label: "Hokage", badge: "bg-shinobi-gold/10 border-shinobi-gold/30 text-shinobi-gold" },
  title_awarded: { icon: Crown, color: "text-shinobi-gold", label: "Title", badge: "bg-shinobi-gold/10 border-shinobi-gold/30 text-shinobi-gold" },
  weekly_winner: { icon: Crown, color: "text-shinobi-gold", label: "Winner", badge: "bg-shinobi-gold/10 border-shinobi-gold/30 text-shinobi-gold" },
  rank_up: { icon: Zap, color: "text-text-primary", label: "Rank Up", badge: "bg-sumi/10 border-sumi/20 text-text-primary" },
  goal_hit: { icon: Target, color: "text-shinobi-teal", label: "Goal Hit", badge: "bg-shinobi-teal/10 border-shinobi-teal/30 text-shinobi-teal" },
  nudge: { icon: Bell, color: "text-text-secondary", label: "Nudge", badge: "bg-sumi/5 border-sumi/20 text-text-secondary" },
  overtook: { icon: TrendingUp, color: "text-shinobi-flame", label: "Climbed", badge: "bg-shinobi-flame/10 border-shinobi-flame/30 text-shinobi-flame" },
  comeback: { icon: Zap, color: "text-shinobi-gold", label: "Comeback", badge: "bg-shinobi-gold/10 border-shinobi-gold/30 text-shinobi-gold" },
  member_joined: { icon: UserPlus, color: "text-shinobi-teal", label: "Joined", badge: "bg-shinobi-teal/10 border-shinobi-teal/30 text-shinobi-teal" },
  member_left: { icon: UserMinus, color: "text-text-muted", label: "Left", badge: "bg-sumi/5 border-sumi/15 text-text-muted" },
  frozen: { icon: Snowflake, color: "text-text-muted", label: "Frozen", badge: "bg-sumi/5 border-sumi/20 text-text-muted" },
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
    <div className="relative flex flex-col rounded-2xl border border-sumi/15 bg-surface-card p-5  ">
      <div className="flex items-center justify-between pb-3 border-b border-sumi/10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-shinobi-teal" />
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text-primary">Live Squad Activity</h3>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          title="Refresh activity"
          className="rounded-lg p-1.5 text-text-muted hover:bg-sumi/[0.08] hover:text-text-primary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-shinobi-gold" : ""}`} />
        </button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-2 max-h-[540px] board-scroll">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted">
            <Activity className="h-8 w-8 text-text-muted mb-2 opacity-50" />
            <p className="text-xs font-medium">No activity yet</p>
            <p className="text-[11px] text-text-muted mt-0.5">Solve a problem to trigger the first squad event</p>
          </div>
        )}

        {events.map((e) => {
          const config = EVENT_CONFIG[e.type] ?? {
            icon: Activity,
            color: "text-text-muted",
            label: e.type.replace("_", " "),
            badge: "bg-sumi/5 border-sumi/15 text-text-muted",
          };
          const Icon = config.icon;

          return (
            <div
              key={e.id}
              className="group relative flex items-start gap-3 rounded-xl border border-sumi/10 bg-surface-elevated p-3 hover:border-sumi/15 hover:bg-surface-elevated transition-all"
            >
              <div className={`mt-0.5 rounded-lg border p-1.5 ${config.badge}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-primary leading-snug font-medium">{e.text}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted font-mono">
                  <span className="uppercase tracking-wider">{config.label}</span>
                  <span>·</span>
                  <span>{timeAgo(e.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-sumi/10 text-center">
        <span className="text-[10px] text-text-muted font-mono">
          Last 30 days · Cap 200 · Realtime channel
        </span>
      </div>
    </div>
  );
}
