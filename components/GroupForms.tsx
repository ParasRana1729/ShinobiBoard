"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Key, Users, Target, Loader2, ArrowRight, Shield } from "lucide-react";

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"squad" | "club">("squad");
  const [goal, setGoal] = useState(7);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, goal }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Create failed");
        return;
      }
      router.push(`/groups/${j.group.id}`);
    } catch {
      setMsg("Connection error, please try again.");
    } finally {
      setBusy(false);
    }
  }

  const goalPresets = [5, 7, 10, 14, 20];

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-card p-5 sm:p-6 shadow-tactile-card backdrop-blur-md flex flex-col justify-between"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-shinobi-gold/50 to-transparent" />

      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-tactile-inset">
            <PlusCircle className="h-5 w-5 text-shinobi-gold" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold tracking-tight text-text-primary sm:text-base">Create Squad / Club</h2>
            <p className="text-xs text-text-secondary">Establish a new grind circle with custom goals</p>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Squad Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. blind-75-fall-26"
              className="w-full rounded-xl border border-white/[0.1] bg-ink/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              required
              maxLength={80}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Circle Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("squad")}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  type === "squad"
                    ? "border-amber-500/40 bg-amber-950/20 text-white"
                    : "border-white/[0.06] bg-ink/50 text-slate-400 hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Private Squad</span>
                </div>
                <span className="mt-1 text-[10px] text-slate-400">Invite-only · 3–15 members</span>
              </button>

              <button
                type="button"
                onClick={() => setType("club")}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${
                  type === "club"
                    ? "border-amber-500/40 bg-amber-950/20 text-white"
                    : "border-white/[0.06] bg-ink/50 text-slate-400 hover:border-white/[0.15]"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-300">
                  <Users className="h-3.5 w-3.5" />
                  <span>Public Club</span>
                </div>
                <span className="mt-1 text-[10px] text-slate-400">Discoverable · Cap 150</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Target className="h-3.5 w-3.5 text-amber-400" />
                <span>Weekly Goal ({goal} solves/week)</span>
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={goal}
                onChange={(e) => setGoal(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-14 rounded-lg border border-white/[0.1] bg-ink/80 px-2 py-0.5 text-right font-mono text-xs text-amber-300 focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {goalPresets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setGoal(p)}
                  className={`flex-1 rounded-lg border py-1 text-xs font-mono transition-all ${
                    goal === p
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-300 font-bold"
                      : "border-white/[0.06] bg-ink/40 text-slate-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="btn-tactile-primary w-full py-2.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          <span>Create Group</span>
        </button>

        {msg && <p className="mt-2 text-center text-xs font-medium text-rose-400">{msg}</p>}
      </div>
    </form>
  );
}

export function JoinGroupForm() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Join failed");
        return;
      }
      router.push(`/groups/${j.group.id}`);
    } catch {
      setMsg("Connection error, please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-card p-5 sm:p-6 shadow-tactile-card backdrop-blur-md flex flex-col justify-between"
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-shinobi-teal/50 to-transparent" />

      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-tactile-inset">
            <Key className="h-5 w-5 text-shinobi-teal" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold tracking-tight text-text-primary sm:text-base">Join with Code</h2>
            <p className="text-xs text-text-secondary">Enter an 8-character squad or club invite code</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 font-mono">
            Invite Code
          </label>
          <div className="relative">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7X9K2M4P"
              maxLength={8}
              className="w-full rounded-xl border border-white/[0.08] bg-ink/80 px-3.5 py-2.5 font-mono text-base tracking-widest text-center text-shinobi-teal placeholder-slate-600 shadow-tactile-inset focus:border-shinobi-teal focus:outline-none focus:ring-1 focus:ring-shinobi-teal transition-all uppercase"
              required
            />
          </div>
          <p className="mt-2 text-[11px] text-text-muted font-mono">
            Case-insensitive, single active code per group without 0/O/1/I.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={busy || code.trim().length !== 8}
          className="btn-tactile-secondary w-full py-2.5 border-shinobi-teal/40 bg-teal-950/30 text-teal-300 hover:bg-teal-900/40 hover:border-shinobi-teal/60 disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          <span>Join Squad</span>
        </button>

        {msg && <p className="mt-2 text-center text-xs font-medium text-rose-400">{msg}</p>}
      </div>
    </form>
  );
}
