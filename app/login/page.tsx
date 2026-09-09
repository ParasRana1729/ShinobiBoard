"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-3xl font-extrabold">Enter the village 🍃</h1>
      <p className="mt-2 text-sm text-slate-300">Google only in v1. No password, no spam.</p>
      <button
        onClick={signIn}
        disabled={busy}
        className="mt-8 w-full rounded-lg bg-amber-400 px-5 py-3 font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
      >
        {busy ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </main>
  );
}
