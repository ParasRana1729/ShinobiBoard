export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DuelAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=/duel/accept?token=${searchParams.token ?? ""}`);
  if (!searchParams.token) return <main className="py-10">Missing invite token.</main>;

  // Accept is a plain GET to the API route (verifies JWT + guards, then redirects to the duel).
  return (
    <main className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-extrabold">Duel challenge ⚔️</h1>
      <p className="mt-2 text-sm text-slate-300">Someone wants to grind 1:1. Accept to create (or reopen) your duel.</p>
      <a
        href={`/api/duels/accept?token=${encodeURIComponent(searchParams.token)}`}
        className="mt-6 inline-block rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-black"
      >
        Accept duel
      </a>
    </main>
  );
}
