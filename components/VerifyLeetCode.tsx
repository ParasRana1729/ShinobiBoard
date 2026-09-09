"use client";

import { useState } from "react";

export function VerifyLeetCode({ current }: { current: string | null }) {
  const [username, setUsername] = useState(current ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leetcode_username: username.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Verification failed");
      setCode(j.code);
      setMsg(`Paste ${j.code} into your LeetCode Profile → About, then click Verify.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmLink() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leetcode_username: username.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Verification failed");
      setMsg(`Linked @${j.lc_username} — first sync running. You can remove the code now.`);
      setCode(null);
      window.location.reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm("Unlink LeetCode username? History stays, cursor resets (7-day backfill on relink).")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/verify/unlink", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Unlink failed");
      window.location.reload();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-card p-5">
      <h2 className="font-bold">LeetCode identity {current ? `· @${current}` : "· not linked"}</h2>
      <p className="mt-1 text-sm text-slate-300">
        Anti-squat check: we verify you own the username via a one-time code in your LeetCode About.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="leetcode_username"
          className="flex-1 rounded-lg border border-slate-600 bg-ink px-3 py-2 text-sm"
        />
        <button onClick={start} disabled={busy || !username.trim()} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
          Get code
        </button>
        <button onClick={confirmLink} disabled={busy || !username.trim()} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold">
          Verify
        </button>
        {current && (
          <button onClick={unlink} disabled={busy} className="rounded-lg border border-red-500/60 px-4 py-2 text-sm text-red-300">
            Unlink
          </button>
        )}
      </div>
      {code && (
        <p className="mt-3 rounded-lg bg-black/40 p-3 font-mono text-lg text-amber-300">{code}</p>
      )}
      {msg && <p className="mt-2 text-sm text-slate-200">{msg}</p>}
    </div>
  );
}
