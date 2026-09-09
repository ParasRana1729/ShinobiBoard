export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("groups")
    .select("id, name, goal, member_count, created_at")
    .eq("type", "club")
    .eq("invite_enabled", true)
    .order("member_count", { ascending: false })
    .limit(50);
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  const { data: clubs } = await query;

  return (
    <main className="py-10">
      <h1 className="text-2xl font-extrabold">Discover public clubs 🌍</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search clubs…"
          className="flex-1 rounded-lg border border-slate-600 bg-ink px-3 py-2 text-sm" />
        <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Search</button>
      </form>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(clubs ?? []).map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-700 bg-card p-4">
            <p className="font-bold">{c.name}</p>
            <p className="text-xs text-slate-400">{c.member_count}/150 · goal {c.goal}/wk</p>
            <Link href={`/groups/${c.id}`} className="mt-2 inline-block rounded border border-slate-500 px-3 py-1 text-sm">
              View / Join
            </Link>
          </div>
        ))}
        {(clubs ?? []).length === 0 && <p className="text-sm text-slate-400">No open clubs found.</p>}
      </div>
      <p className="mt-4 text-xs text-slate-500">Cap 150 members — waitlist beyond. Owner can close/regenerate code.</p>
    </main>
  );
}
