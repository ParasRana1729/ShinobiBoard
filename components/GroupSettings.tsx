"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Copy,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Trash2,
  Swords,
  Lock,
  Unlock,
  Target,
  Edit2,
  Loader2,
  Share2
} from "lucide-react";

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
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [name, setName] = useState("");
  const [newGoal, setNewGoal] = useState(goal);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function call(path: string, body?: unknown, method = "POST") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ text: "Updated successfully!" });
        router.refresh();
      } else {
        setMsg({ text: j.error ?? "Operation failed", error: true });
      }
      return j;
    } catch {
      setMsg({ text: "Network error", error: true });
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isOwner) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const promptMsg = type === "duel" ? "End this duel? Match history will be archived." : "Leave this squad? You will need an invite code to rejoin.";
            if (confirm(promptMsg)) call(`/api/groups/${groupId}/leave`);
          }}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-950/20 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/30 hover:border-rose-500/40 transition-all disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{type === "duel" ? "End Duel" : "Leave Squad"}</span>
        </button>
        {msg && <span className={`text-xs ${msg.error ? "text-rose-400" : "text-emerald-400"}`}>{msg.text}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Invite Code Pill */}
        {code && (
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-surface p-1 pl-2.5">
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Code:</span>
            <span className="font-mono text-xs font-bold text-amber-300">{code}</span>
            <button
              onClick={copyCode}
              title="Copy invite code"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {/* Quick actions */}
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            editing
              ? "border-amber-500/40 bg-amber-950/30 text-amber-300"
              : "border-white/[0.08] bg-surface text-slate-300 hover:border-white/[0.18]"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {editing && (
        <div className="mt-2 rounded-2xl border border-white/[0.1] bg-surface/95 p-4 shadow-2xl backdrop-blur-md">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">Owner Command Center</h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Rename */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Rename</label>
              <div className="flex gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New group name"
                  className="flex-1 rounded-lg border border-white/[0.1] bg-ink/90 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => call(`/api/groups/${groupId}`, { name }, "PATCH")}
                  disabled={busy || !name.trim()}
                  className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-semibold hover:bg-white/[0.15] transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Change Goal */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Weekly Goal (1–50)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newGoal}
                  onChange={(e) => setNewGoal(Number(e.target.value))}
                  className="w-20 rounded-lg border border-white/[0.1] bg-ink/90 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => call(`/api/groups/${groupId}`, { goal: newGoal }, "PATCH")}
                  disabled={busy}
                  className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-semibold hover:bg-white/[0.15] transition-colors disabled:opacity-50"
                >
                  Set Goal
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            {/* Regen code */}
            {type !== "duel" && (
              <button
                onClick={() => call(`/api/groups/${groupId}/regen-code`)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-ink/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-white/[0.2] transition-colors"
                title="Regen invalidates previous code immediately"
              >
                <RefreshCw className="h-3 w-3 text-cyan-400" />
                <span>Rotate Code</span>
              </button>
            )}

            {/* Toggle Invites */}
            {type !== "duel" && (
              <button
                onClick={() => call(`/api/groups/${groupId}`, { invite_enabled: !inviteEnabled }, "PATCH")}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-ink/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-white/[0.2] transition-colors"
              >
                {inviteEnabled ? <Lock className="h-3 w-3 text-amber-400" /> : <Unlock className="h-3 w-3 text-emerald-400" />}
                <span>{inviteEnabled ? "Close Invites" : "Open Invites"}</span>
              </button>
            )}

            {/* Leave / Transfer */}
            <button
              onClick={() => {
                if (confirm("Leave this group? Ownership will automatically transfer to the oldest member.")) {
                  call(`/api/groups/${groupId}/leave`);
                }
              }}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-950/20 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-900/30 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Leave (Transfer)</span>
            </button>

            {/* Delete Club */}
            {type === "club" && (
              <button
                onClick={() => {
                  if (confirm("Permanently delete this public club? This cannot be undone.")) {
                    call(`/api/groups/${groupId}`, undefined, "DELETE");
                  }
                }}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-rose-600/40 bg-rose-950/40 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-900/50 transition-colors ml-auto"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete Club</span>
              </button>
            )}
          </div>

          {msg && (
            <p className={`mt-2.5 text-xs font-medium ${msg.error ? "text-rose-400" : "text-emerald-400"}`}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DuelButtons({ groupId }: { groupId?: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/duels/invite", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Failed to create duel invite");
      } else {
        const fullLink = `${window.location.origin}/duel/accept?token=${j.token}`;
        setLink(fullLink);
        setMsg("Invite minted! Share this single-use link with your rival (expires in 7 days).");
      }
    } catch {
      setMsg("Connection error");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/90 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Swords className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white sm:text-base">1:1 Duel Arena</h2>
            <p className="text-xs text-slate-400">Head-to-head rivalry with daily W/L/D tracking</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Challenge a rival to a 1:1 grudge match. Compare solve counts daily, protect your lead, and settle who grinds harder.
        </p>

        {link && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-ink/90 p-3">
            <p className="text-[10px] font-semibold uppercase text-rose-300 mb-1">Single-use Challenge Link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                className="w-full truncate rounded bg-white/[0.05] px-2 py-1 font-mono text-[11px] text-slate-300 select-all"
              />
              <button
                onClick={copyLink}
                className="flex shrink-0 items-center gap-1 rounded-md bg-white/[0.08] px-2.5 py-1 text-xs font-semibold hover:bg-white/[0.15] transition-colors"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <button
          onClick={create}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/50 hover:border-rose-500/60 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
          <span>{link ? "Generate Another Duel Link" : "Challenge Rival"}</span>
        </button>

        {msg && <p className="mt-2 text-center text-xs text-slate-400 leading-normal">{msg}</p>}
      </div>
    </div>
  );
}
