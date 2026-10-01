export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Compass, Users, Target, Search, ArrowRight } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-2xl border border-sumi/15 bg-surface-card p-6 sm:p-8 shadow-tactile-card">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Topic Circles & Scale Preps
          </span>
        </div>

        <h1 className="mt-3 font-heading text-3xl sm:text-4xl text-text-primary flex items-center gap-3">
          <Compass className="h-7 w-7 text-shinobi-gold" />
          <span>Discover Public Clubs</span>
        </h1>

        <p className="mt-2 max-w-xl text-xs sm:text-sm text-text-secondary leading-relaxed">
          Join public grinding clubs with up to 150 members. Climb the squad leaderboard, hit collective goals, and stay accountable alongside other engineers.
        </p>

        {/* Search Input */}
        <form className="mt-6 flex flex-col sm:flex-row max-w-lg gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search by club name (e.g. blind-75)…"
              className="w-full rounded-xl border border-sumi/15 bg-ink py-2.5 pl-10 pr-9 text-xs text-text-primary placeholder-text-muted focus:border-shinobi-gold focus:outline-none focus:ring-1 focus:ring-shinobi-gold transition-colors"
            />
            {searchParams.q && (
              <Link
                href="/discover"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                title="Clear search"
              >
                ✕
              </Link>
            )}
          </div>
          <button
            type="submit"
            className="btn-tactile-primary px-5 py-2.5"
          >
            Search
          </button>
        </form>

        {/* Popular Topic Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[11px] text-text-muted">Popular topics:</span>
          {["blind-75", "neetcode", "leetcode-hard", "faang-prep"].map((tag) => (
            <Link
              key={tag}
              href={`/discover?q=${tag}`}
              className="rounded-lg border border-sumi/15 bg-surface-elevated/70 px-2.5 py-1 font-mono text-[11px] text-text-secondary hover:text-shinobi-gold hover:border-shinobi-gold/30 transition-all"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Showing <span className="font-bold text-text-primary">{clubs?.length ?? 0}</span> open public clubs
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
                className="group relative flex flex-col justify-between rounded-2xl border border-sumi/15 bg-surface-card p-5 shadow-tactile-card hover:border-shinobi-gold/40 transition-all min-h-[190px]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="border border-sumi/20 bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-text-secondary uppercase">
                      Club
                    </span>

                    <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                      <Target className="h-3.5 w-3.5 text-shinobi-gold" />
                      <span>{c.goal} solves/wk</span>
                    </span>
                  </div>

                  <h3 className="mt-3 font-heading text-base font-bold text-text-primary group-hover:text-shinobi-gold transition-colors">
                    {c.name}
                  </h3>

                  {/* Capacity meter */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-text-muted">Roster Capacity</span>
                      <span className={isFull ? "font-bold text-shinobi-gold" : "font-bold text-text-primary"}>
                        {count} / 150
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? "bg-shinobi-gold" : "bg-shinobi-teal"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-sumi/10 pt-3">
                  <Link
                    href={`/groups/${c.id}`}
                    className="btn-tactile-secondary w-full"
                  >
                    <span>View Club Board</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {(clubs ?? []).length === 0 && (
            <div className="rounded-2xl border border-sumi/15 bg-surface-card p-12 text-center text-text-muted sm:col-span-2 lg:col-span-3 shadow-tactile-card space-y-3">
              <Compass className="mx-auto h-10 w-10 text-text-muted mb-2 opacity-50" />
              <p className="text-sm font-semibold text-text-secondary">No open public clubs found</p>
              <p className="mt-1 text-xs text-text-muted max-w-sm mx-auto">
                {searchParams.q
                  ? `No clubs matched "${searchParams.q}". Try clearing the search or create a new club from your dashboard.`
                  : "No public clubs are currently active. Be the pioneer and launch the first public grinding club!"}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                {searchParams.q && (
                  <Link href="/discover" className="btn-tactile-secondary py-1.5 px-3 text-xs">
                    Clear Search
                  </Link>
                )}
                <Link href="/dashboard" className="btn-tactile-primary py-1.5 px-4 text-xs">
                  Create Club in Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
