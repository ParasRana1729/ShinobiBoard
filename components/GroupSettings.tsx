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
          className="btn-tactile-danger"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{type === "duel" ? "End Duel" : "Leave Squad"}</span>
        </button>
        {msg && <span className={`text-xs ${msg.error ? "text-shinobi-flame" : "text-shinobi-teal"}`}>{msg.text}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Invite Code Pill */}
        {code && (
          <div className="flex items-center gap-1.5 rounded-xl border border-sumi/15 bg-surface p-1 pl-2.5">
            <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">Code:</span>
            <span className="font-mono text-xs font-bold text-shinobi-gold">{code}</span>
            <button
              onClick={copyCode}
              title="Copy invite code"
              className="rounded-lg p-1 text-text-muted hover:bg-sumi/10 hover:text-text-primary transition-colors"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-shinobi-teal" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        {/* Quick actions */}
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            editing
              ? "border-sumi/40 bg-surface-elevated text-text-primary"
              : "border-sumi/15 bg-surface text-text-secondary hover:border-sumi/30"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {editing && (
        <div className="mt-2 rounded-2xl border border-sumi/15 bg-surface-card p-4 shadow-tactile-card">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-text-primary mb-3">Owner Command Center</h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Rename */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-text-muted mb-1">Rename</label>
              <div className="flex gap-1.5">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New group name"
                  className="flex-1 rounded-lg border border-sumi/15 bg-surface-elevated px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:border-sumi/40 focus:outline-none"
                />
                <button
                  onClick={() => call(`/api/groups/${groupId}`, { name }, "PATCH")}
                  disabled={busy || !name.trim()}
                  className="rounded-lg bg-sumi/10 px-3 py-1.5 text-xs font-semibold hover:bg-sumi/15 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Change Goal */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-text-muted mb-1">Weekly Goal (1–50)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newGoal}
                  onChange={(e) => setNewGoal(Number(e.target.value))}
                  className="w-20 rounded-lg border border-sumi/15 bg-surface-elevated px-2.5 py-1.5 text-xs text-text-primary focus:border-sumi/40 focus:outline-none"
                />
                <button
                  onClick={() => call(`/api/groups/${groupId}`, { goal: newGoal }, "PATCH")}
                  disabled={busy}
                  className="rounded-lg bg-sumi/10 px-3 py-1.5 text-xs font-semibold hover:bg-sumi/15 transition-colors disabled:opacity-50"
                >
                  Set Goal
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-sumi/10 pt-3">
            {/* Regen code */}
            {type !== "duel" && (
              <button
                onClick={() => call(`/api/groups/${groupId}/regen-code`)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-sumi/15 bg-surface-elevated px-2.5 py-1.5 text-xs text-text-secondary hover:border-sumi/25 transition-colors"
                title="Regen invalidates previous code immediately"
              >
                <RefreshCw className="h-3 w-3 text-text-muted" />
                <span>Rotate Code</span>
              </button>
            )}

            {/* Toggle Invites */}
            {type !== "duel" && (
              <button
                onClick={() => call(`/api/groups/${groupId}`, { invite_enabled: !inviteEnabled }, "PATCH")}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-sumi/15 bg-surface-elevated px-2.5 py-1.5 text-xs text-text-secondary hover:border-sumi/25 transition-colors"
              >
                {inviteEnabled ? <Lock className="h-3 w-3 text-shinobi-gold" /> : <Unlock className="h-3 w-3 text-shinobi-teal" />}
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
              className="flex items-center gap-1.5 rounded-lg border border-shinobi-flame/30 bg-shinobi-flame/10 px-2.5 py-1.5 text-xs text-shinobi-flame hover:bg-shinobi-flame/20 transition-colors"
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
                className="flex items-center gap-1.5 rounded-lg border border-shinobi-flame/40 bg-shinobi-flame/10 px-2.5 py-1.5 text-xs text-shinobi-flame hover:bg-shinobi-flame/20 transition-colors ml-auto"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete Club</span>
              </button>
            )}
          </div>

          {msg && (
            <p className={`mt-2.5 text-xs font-medium ${msg.error ? "text-shinobi-flame" : "text-shinobi-teal"}`}>
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
    <div className="relative overflow-hidden rounded-2xl border border-sumi/15 bg-surface-card p-5 sm:p-6 flex flex-col justify-between shadow-tactile-card">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sumi/15 bg-surface-elevated">
            <Swords className="h-5 w-5 text-shinobi-flame" />
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold tracking-tight text-text-primary sm:text-base">1:1 Duel Arena</h2>
            <p className="text-xs text-text-secondary">Head-to-head rivalry with daily W/L/D tracking</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-text-secondary leading-relaxed">
          Challenge a rival to a 1:1 grudge match. Compare solve counts daily, protect your lead, and settle who grinds harder.
        </p>

        {link && (
          <div className="mt-3 rounded-xl border border-sumi/15 bg-surface-elevated p-3">
            <p className="text-[10px] font-mono font-semibold uppercase text-text-secondary mb-1">Single-use Challenge Link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={link}
                className="w-full truncate rounded border border-sumi/10 bg-surface px-2 py-1 font-mono text-[11px] text-text-secondary select-all"
              />
              <button
                onClick={copyLink}
                className="flex shrink-0 items-center gap-1 rounded-md bg-sumi/10 px-2.5 py-1 text-xs font-semibold hover:bg-sumi/15 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-shinobi-teal" /> : <Copy className="h-3.5 w-3.5" />}
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
          className="btn-tactile-danger w-full py-2.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
          <span>{link ? "Generate Another Duel Link" : "Challenge Rival"}</span>
        </button>

        {msg && <p className="mt-2 text-center text-xs text-text-muted leading-normal">{msg}</p>}
      </div>
    </div>
  );
}
