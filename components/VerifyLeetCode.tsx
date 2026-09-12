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
    <div className="relative overflow-hidden rounded-2xl border border-sumi/15 bg-surface-card p-5 sm:p-6 shadow-tactile-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sumi/15 bg-surface-elevated">
            {current ? (
              <ShieldCheck className="h-5 w-5 text-shinobi-teal" />
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
          <div className="flex items-center gap-1.5 rounded-full border border-shinobi-teal/30 bg-shinobi-teal/10 px-2.5 py-0.5 text-xs font-semibold text-shinobi-teal font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-shinobi-teal" />
            <span>Linked</span>
          </div>
        )}
      </div>

      {current ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sumi/10 bg-surface-elevated p-3.5 ">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-shinobi-gold">@{current}</span>
            <a
              href={`https://leetcode.com/${current}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-sumi/[0.08] px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-sumi/10 hover:text-text-primary transition-colors font-mono"
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
                className="w-full rounded-xl border border-sumi/15 bg-surface-elevated py-2.5 pl-8 pr-3.5 font-mono text-sm text-text-primary placeholder-text-muted focus:border-shinobi-gold focus:outline-none focus:ring-1 focus:ring-shinobi-gold transition-all"
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
              className="mt-2.5 text-xs text-text-muted hover:text-shinobi-gold transition-colors"
            >
              Username claimed by another account? <span className="underline font-semibold">Prove ownership</span>
            </button>
          )}

          {dispute && (
            <div className="mt-3.5 rounded-xl border border-sumi/15 bg-surface-elevated p-4">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-shinobi-gold" />
                <div className="text-xs text-text-secondary leading-relaxed">
                  <p className="font-semibold text-text-primary">Ownership Challenge</p>
                  <p className="mt-0.5">
                    Generate a single-use dispute code, paste it into your LeetCode profile&apos;s <b>About Me</b>, and click verify.
                  </p>
                </div>
              </div>

              {code && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-sumi/15 bg-surface p-2.5">
                  <span className="font-mono text-base font-bold tracking-wider text-shinobi-gold">{code}</span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 rounded-md bg-sumi/10 px-2.5 py-1 text-xs font-semibold text-text-primary hover:bg-sumi/15 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-shinobi-teal" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy code"}</span>
                  </button>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={start}
                  disabled={busy || !username.trim()}
                  className="btn-tactile-secondary flex-1 py-2 text-xs disabled:opacity-50"
                >
                  {code ? "Regenerate Code" : "1. Get Dispute Code"}
                </button>
                <button
                  onClick={confirmLink}
                  disabled={busy || !username.trim() || !code}
                  className="btn-tactile-primary flex-1 py-2 text-xs disabled:opacity-50"
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
              ? "border border-shinobi-flame/30 bg-shinobi-flame/10 text-shinobi-flame"
              : "border border-shinobi-teal/30 bg-shinobi-teal/10 text-shinobi-teal"
          }`}
        >
          {msg.error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
}
