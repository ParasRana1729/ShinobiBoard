"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

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
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="mt-8 rounded-2xl border border-sumi/15 bg-surface-card p-8 shadow-tactile-card">
        <h1 className="font-heading text-3xl text-text-primary">Sign in</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Google only. Public LeetCode solve counts, nothing else.
        </p>

        <button
          onClick={signIn}
          disabled={busy}
          type="button"
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-sumi/25 bg-surface-elevated px-5 py-3 text-sm font-medium text-text-primary hover:border-sumi/50 transition-colors disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            <>
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
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2 border border-shinobi-gold/30 bg-shinobi-gold/5 p-3 text-xs text-shinobi-gold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
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
            <Loader2 className="h-5 w-5 animate-spin" /> Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
