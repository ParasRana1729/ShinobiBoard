"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GroupSettings({
  groupId,
  isOwner,
  inviteEnabled,
  code,
  goal,
  type,
}: {
  groupId: string;
  isOwner: boolean;
  inviteEnabled: boolean;
  code: string | null;
  goal: number;
  type: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [newGoal, setNewGoal] = useState(goal);
  const router = useRouter();

  async function call(path: string, body?: unknown, method = "POST") {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Done ✓" : (j.error ?? "Failed"));
    if (res.ok) router.refresh();
    return j;
  }

  if (!isOwner) {
    return (
      <div className="flex gap-2">
        <button onClick={() => call(`/api/groups/${groupId}/leave`)} className="rounded-lg border border-slate-500 px-3 py-1.5 text-sm">
          {type === "duel" ? "End duel (history retained)" : "Leave group"}
        </button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-card p-4 text-sm">
      <h3 className="font-bold">Owner controls</h3>
      <p className="mt-1 text-slate-300">
        Invite: {inviteEnabled ? <span className="font-mono">{code}</span> : "closed"} · Goal {goal}/week
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rename group"
          className="rounded-lg border border-slate-600 bg-ink px-2 py-1.5 text-sm" />
        <button onClick={() => call(`/api/groups/${groupId}`, { name })} className="rounded border border-slate-500 px-2 py-1">Rename</button>
        <input type="number" min={1} max={50} value={newGoal} onChange={(e) => setNewGoal(Number(e.target.value))}
          className="w-20 rounded-lg border border-slate-600 bg-ink px-2 py-1.5 text-sm" title="Goal 1–50" />
        <button onClick={() => call(`/api/groups/${groupId}`, { goal: newGoal })} className="rounded border border-slate-500 px-2 py-1">Set goal</button>
        <button onClick={() => call(`/api/groups/${groupId}/regen-code`)} className="rounded border border-slate-500 px-2 py-1" title="Regen invalidates old immediately">
          Regen code
        </button>
        <button onClick={() => call(`/api/groups/${groupId}`, { invite_enabled: !inviteEnabled })} className="rounded border border-slate-500 px-2 py-1">
          {inviteEnabled ? "Close invites" : "Open invites"}
        </button>
        <button onClick={() => { if (confirm("Leave? Ownership transfers to oldest member.")) call(`/api/groups/${groupId}/leave`); }}
          className="rounded border border-slate-500 px-2 py-1">Leave</button>
        {type === "club" && (
          <button onClick={() => { if (confirm("Delete club forever?")) call(`/api/groups/${groupId}`, undefined, "DELETE"); }}
            className="rounded border border-red-500/60 px-2 py-1 text-red-300">Delete</button>
        )}
      </div>
      {msg && <p className="mt-2 text-slate-300">{msg}</p>}
    </div>
  );
}

export function DuelButtons({ groupId }: { groupId?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function create() {
    const res = await fetch("/api/duels/invite", { method: "POST" });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Failed");
    else {
      setLink(`${window.location.origin}/duel/accept?token=${j.token}`);
      setMsg("Share this single-use link (7-day expiry). Reuses existing duel for the same pair.");
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-card p-4 text-sm">
      <h3 className="font-bold">1:1 Duel</h3>
      <button onClick={create} className="mt-2 rounded-lg bg-amber-400 px-3 py-1.5 font-semibold text-black">Create duel invite</button>
      {link && <p className="mt-2 break-all font-mono text-xs text-amber-200">{link}</p>}
      {msg && !link && <p className="mt-2">{msg}</p>}
      {msg && link && <p className="mt-1 text-xs text-slate-400">{msg}</p>}
    </div>
  );
}
