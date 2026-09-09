"use client";

import { useState } from "react";
import { Link2, CheckCircle2, AlertCircle, Copy, ExternalLink, ShieldCheck, KeyRound, Loader2, Unlink } from "lucide-react";

export function VerifyLeetCode({ current }: { current: string | null }) {
  const [username, setUsername] = useState(current ?? "");
  const [code, setCode] = useState<string | null>(null);
  const [dispute, setDispute] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
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
      setMsg({ text: `Linked @${j.lc_username} — first sync completed!` });
      window.location.reload();
    } catch (e) {
      const m = (e as Error).message;
      setMsg({ text: m, error: true });
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
      setMsg({ text: `Paste code into your LeetCode About section, then click 'Verify ownership'.` });
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function confirmLink() {
    setBusy(true);
    setMsg(null);
    try {
      const j = await post("/api/verify/confirm", { leetcode_username: username.trim() });
      setMsg({ text: `Ownership verified — @${j.lc_username} is now linked to your account!` });
      setCode(null);
      window.location.reload();
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    if (!window.confirm("Unlink LeetCode username? Your solve history is preserved, and relinking starts fresh 7-day backfill.")) return;
    setBusy(true);
    try {
      await post("/api/verify/unlink", {});
      window.location.reload();
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-card p-5 sm:p-6 shadow-tactile-card backdrop-blur-md">
      {/* Decorative accent top-border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-shinobi-gold/50 to-transparent" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-tactile-inset">
            {current ? (
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            ) : (
              <Link2 className="h-5 w-5 text-shinobi-gold" />
            )}
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold tracking-tight text-text-primary sm:text-base">
              LeetCode Connection
            </h2>
            <p className="text-xs text-text-secondary">
              {current ? "Identity verified & actively synced" : "Link your public LeetCode profile to compete"}
            </p>
          </div>
        </div>

        {current && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Linked</span>
          </div>
        )}
      </div>

      {current ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-ink/60 p-3.5 shadow-tactile-inset">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-shinobi-gold">@{current}</span>
            <a
              href={`https://leetcode.com/${current}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-white/[0.1] hover:text-white transition-colors font-mono"
            >
              <span>Profile</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <button
            onClick={unlink}
            disabled={busy}
            className="btn-tactile-danger py-1.5 px-3"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
            <span>Unlink</span>
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="leetcode_username"
                className="w-full rounded-xl border border-white/[0.08] bg-ink/80 py-2.5 pl-8 pr-3.5 font-mono text-sm text-text-primary placeholder-slate-600 shadow-tactile-inset focus:border-shinobi-gold focus:outline-none focus:ring-1 focus:ring-shinobi-gold transition-all"
              />
            </div>
            <button
              onClick={link}
              disabled={busy || !username.trim()}
              className="btn-tactile-primary px-5 py-2.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              <span>Link Account</span>
            </button>
          </div>

          {!dispute && (
            <button
              onClick={() => setDispute(true)}
              className="mt-2.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
            >
              Username claimed by another account? <span className="underline font-semibold">Prove ownership</span>
            </button>
          )}

          {dispute && (
            <div className="mt-3.5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-amber-300">Ownership Challenge</p>
                  <p className="mt-0.5">
                    Generate a single-use dispute code, paste it into your LeetCode profile&apos;s <b>About Me</b>, and click verify.
                  </p>
                </div>
              </div>

              {code && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/30 bg-ink/90 p-2.5">
                  <span className="font-mono text-base font-bold tracking-wider text-amber-300">{code}</span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-md bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/[0.15] transition-colors"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy code"}</span>
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={start}
                  disabled={busy || !username.trim()}
                  className="flex-1 rounded-lg border border-white/[0.15] bg-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                >
                  {code ? "Regenerate Code" : "1. Get Dispute Code"}
                </button>
                <button
                  onClick={confirmLink}
                  disabled={busy || !username.trim() || !code}
                  className="flex-1 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  2. Verify Ownership
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
            msg.error
              ? "border border-rose-500/30 bg-rose-950/40 text-rose-300"
              : "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {msg.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
}
