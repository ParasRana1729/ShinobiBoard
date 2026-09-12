"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, ArrowRight, Clock } from "lucide-react";

export function JoinClubButton({ groupId, memberCount }: { groupId: string; memberCount: number }) {
  const [msg, setMsg] = useState<{ text: string; waitlisted?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function join() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ text: j.error ?? "Join request failed" });
      } else if (j.waitlisted) {
        setMsg({ text: "Club reached 150-member cap — you've been placed on the priority waitlist.", waitlisted: true });
      } else {
        router.refresh();
      }
    } catch {
      setMsg({ text: "Connection failed, retry." });
    } finally {
      setBusy(false);
    }
  }

  const isFull = memberCount >= 150;
  const pct = Math.min(100, Math.round((memberCount / 150) * 100));

  return (
    <div className="rounded-2xl border border-sumi/15 bg-surface-card p-4 sm:p-5 ">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-shinobi-teal" />
            <h3 className="font-heading text-sm font-bold text-text-primary">Public Club Membership</h3>
          </div>
          <p className="text-xs text-text-secondary">
            Open enrollment club · {memberCount} of 150 slots filled
          </p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-ink">
            <div className={`h-full rounded-full ${isFull ? "bg-shinobi-flame" : "bg-shinobi-teal"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          onClick={join}
          disabled={busy}
          className="btn-tactile-primary px-5 py-2.5 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFull ? (
            <Clock className="h-4 w-4" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          <span>{isFull ? "Join Priority Waitlist" : `Join Club (${memberCount}/150)`}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {msg && (
        <p className={`mt-3 text-xs font-medium ${msg.waitlisted ? "text-shinobi-gold" : "text-shinobi-flame"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
