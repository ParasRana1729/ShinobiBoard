"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Zap, Swords, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const authError = searchParams.get("error");

  const [error, setError] = useState<string | null>(
    authError === "oauth" ? "Authentication cancelled or failed. Please try again." : null
  );
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (next) {
        redirectUrl.searchParams.set("next", next);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl.toString() },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Top back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to ShinobiBoard
        </Link>
      </div>

      {/* Main Auth Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface-card p-8 shadow-tactile-card backdrop-blur-xl">
        {/* Subtle top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-shinobi-gold/50 to-transparent" />

        {/* Brand Crest */}
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-shinobi-gold/30 bg-gradient-to-b from-shinobi-gold/15 to-transparent text-shinobi-gold shadow-tactile-inset">
            <span className="font-mono text-2xl font-black">忍</span>
          </div>
          <h1 className="mt-4 font-heading text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            Enter the Village
          </h1>
          <p className="mt-2 text-xs text-text-secondary">
            Competitive LeetCode squads, hourly automated sync, and weekly Hokage prestige.
          </p>
        </div>

        {/* Auth CTA */}
        <div className="mt-8">
          <button
            onClick={signIn}
            disabled={busy}
            type="button"
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-surface-elevated px-5 py-3.5 text-sm font-semibold text-text-primary shadow-tactile-btn transition duration-150 hover:border-shinobi-gold/40 hover:bg-surface-hover active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-shinobi-gold" />
                <span>Redirecting to Google…</span>
              </>
            ) : (
              <>
                {/* Google G SVG */}
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Security & Privacy note */}
        <div className="mt-6 border-t border-white/[0.06] pt-5 text-center">
          <p className="text-[11px] leading-relaxed text-text-muted">
            Google OAuth only. Zero passwords stored. Only public LeetCode solve counts and timestamps are fetched via GraphQL.
          </p>
        </div>
      </div>

      {/* Feature Checklist Below */}
      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-white/[0.06] bg-surface-base/50 p-3 backdrop-blur-sm">
          <ShieldCheck className="mx-auto h-4 w-4 text-shinobi-teal" />
          <span className="mt-1 block text-[11px] font-medium text-text-secondary">Anti-Squat</span>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-surface-base/50 p-3 backdrop-blur-sm">
          <Zap className="mx-auto h-4 w-4 text-shinobi-gold" />
          <span className="mt-1 block text-[11px] font-medium text-text-secondary">Hourly Sync</span>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-surface-base/50 p-3 backdrop-blur-sm">
          <Swords className="mx-auto h-4 w-4 text-shinobi-flame" />
          <span className="mt-1 block text-[11px] font-medium text-text-secondary">1:1 Duels</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-shinobi-gold" /> Loading authentication...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
