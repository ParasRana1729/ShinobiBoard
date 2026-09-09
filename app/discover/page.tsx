export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Compass, Users, Target, Search, ArrowRight, Shield, Sparkles } from "lucide-react";

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
    <main className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 uppercase tracking-widest">
            Topic Circles & Scale Preps
          </span>
        </div>

        <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <Compass className="h-8 w-8 text-amber-400" />
          <span>Discover Public Clubs</span>
        </h1>

        <p className="mt-2 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
          Join public grinding clubs with up to 150 members. Climb the squad leaderboard, hit collective goals, and stay accountable alongside other engineers.
        </p>

        {/* Search Input */}
        <form className="mt-6 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search by club name (e.g. blind-75)…"
              className="w-full rounded-xl border border-white/[0.1] bg-ink/90 py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-black shadow-glow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Clubs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <span className="font-bold text-white">{clubs?.length ?? 0}</span> open public clubs
          </span>
          <span className="font-mono text-[11px]">Cap: 150 members/club</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(clubs ?? []).map((c) => {
            const count = c.member_count ?? 0;
            const isFull = count >= 150;
            const pct = Math.min(100, Math.round((count / 150) * 100));

            return (
              <div
                key={c.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-surface p-5 shadow-lg hover:border-amber-400/40 hover:shadow-glow transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 uppercase">
                      Club
                    </span>

                    <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                      <Target className="h-3.5 w-3.5 text-amber-400" />
                      <span>{c.goal} solves/wk</span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {c.name}
                  </h3>

                  {/* Capacity meter */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Roster Capacity</span>
                      <span className={isFull ? "font-bold text-rose-400" : "font-bold text-white"}>
                        {count} / 150
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/[0.06] pt-3">
                  <Link
                    href={`/groups/${c.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-ink/60 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400/50 hover:bg-amber-950/20 hover:text-amber-300 transition-all"
                  >
                    <span>View Club Board</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {(clubs ?? []).length === 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-surface p-12 text-center text-slate-400 sm:col-span-2 lg:col-span-3">
              <Compass className="mx-auto h-10 w-10 text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-300">No open public clubs found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try searching with different keywords or create a new club from your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
