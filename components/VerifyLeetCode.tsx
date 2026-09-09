"use client";

import { useState } from "react";

export function VerifyLeetCode({ current }: { current: string | null }) {
  const [username, setUsername] = useState(current ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [dispute, setDispute] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(path: string, body: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? "Request failed");
    return j;
  }

  async function link() {
    setBusy(true);
    setMsg(null);
    try {
      const j = await post("/api/verify/link", { leetcode_username: username.trim() });
      setMsg(`Linked @${j.lc_username} — first sync running.`);
      window.location.reload();
    } catch (e) {
      const m = (e as Error).message;
      setMsg(m);
      if (m.startsWith("Claimed")) setDispute(true);
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setBusy(true);
    setMsg(null);
    try {
      const j = await post("/api/verify/start", { leetcode_username: username.trim() });
      setCode(j.code);
      setMsg(`Paste ${j.code} into your LeetCode Profile → About, then click Verify ownership.`);
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
      const j = await post("/api/verify/confirm", { leetcode_username: username.trim() });
      setMsg(`Ownership proven — @${j.lc_username} is now yours. You can remove the code.`);
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
      await post("/api/verify/unlink", {});
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
      {!current && (
        <p className="mt-1 text-sm text-slate-300">
          Type your public LeetCode username and link — no About edit needed.
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {!current && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="leetcode_username"
            className="flex-1 rounded-lg border border-slate-600 bg-ink px-3 py-2 text-sm"
          />
        )}
        {!current && (
          <button onClick={link} disabled={busy || !username.trim()} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            Link
          </button>
        )}
        {current && (
          <button onClick={unlink} disabled={busy} className="rounded-lg border border-red-500/60 px-4 py-2 text-sm text-red-300">
            Unlink
          </button>
        )}
      </div>
      {!current && !dispute && (
        <button onClick={() => setDispute(true)} className="mt-2 text-xs text-slate-400 underline">
          Username claimed by someone else? Prove ownership
        </button>
      )}
      {(dispute || current) && !current && (
        <div className="mt-3 rounded-lg border border-slate-700 p-3">
          <p className="text-xs text-slate-300">
            Dispute path: we issue a one-time code — paste it into your LeetCode About to take over the name.
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={start} disabled={busy || !username.trim()} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold">
              Get code
            </button>
            <button onClick={confirmLink} disabled={busy || !username.trim()} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold">
              Verify ownership
            </button>
          </div>
        </div>
      )}
      {code && (
        <p className="mt-3 rounded-lg bg-black/40 p-3 font-mono text-lg text-amber-300">{code}</p>
      )}
      {msg && <p className="mt-2 text-sm text-slate-200">{msg}</p>}
    </div>
  );
}
