import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BASE_LADDER } from "@/lib/constants";
import { getRankMeta } from "@/lib/ranks";

export default async function Home() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <main className="mx-auto max-w-3xl space-y-20 py-16">
      <section>
        <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">ShinobiBoard</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight text-text-primary sm:text-5xl">
          Solo LeetCode grind dies after week 1. Your squad won&apos;t let it.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-text-secondary">
          Hourly sync from public LeetCode profiles. Weekly goals, ranks, and 1:1 duels — no manual logging.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-tactile-primary px-5 py-2.5 text-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-tactile-primary px-5 py-2.5 text-sm">
              Sign in with Google
            </Link>
          )}
          <Link href="/discover" className="btn-tactile-secondary px-5 py-2.5 text-sm">
            Browse clubs
          </Link>
        </div>
      </section>

      <section className="border border-sumi/15 bg-surface-card p-5 sm:p-6">
        <div className="flex items-baseline justify-between border-b border-sumi/15 pb-3">
          <h2 className="font-heading text-lg text-text-primary">Hidden Leaf grinders</h2>
          <span className="font-mono text-[11px] text-text-muted">Goal 7 / week</span>
        </div>
        <ul className="divide-y divide-sumi/10">
          {[
            { n: 1, name: "Itachi Uchiha", handle: "@itachi_code", goal: "12 / 7", streak: "24d" },
            { n: 2, name: "Kakashi Hatake", handle: "@copy_ninja", goal: "8 / 7", streak: "18d" },
            { n: 3, name: "Sasuke Uchiha", handle: "@last_uchiha", goal: "5 / 7", streak: "4d" },
          ].map((row) => (
            <li key={row.n} className="flex items-baseline justify-between gap-4 py-3">
              <div className="min-w-0">
                <span className="font-mono text-xs text-text-muted">#{row.n}</span>
                <span className="ml-3 text-sm text-text-primary">{row.name}</span>
                <span className="ml-2 font-mono text-[11px] text-text-muted">{row.handle}</span>
              </div>
              <div className="shrink-0 font-mono text-[11px] text-text-secondary">
                {row.goal} · {row.streak}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl text-text-primary">Three ways to compete</h2>
        <ol className="mt-6 space-y-6">
          <li className="border-t border-sumi/15 pt-4">
            <p className="font-mono text-[11px] text-text-muted">01</p>
            <h3 className="mt-1 font-heading text-xl text-text-primary">Private squads</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Invite-code only, 3–15 people. Custom weekly goals, personal card order, two pins.
            </p>
          </li>
          <li className="border-t border-sumi/15 pt-4">
            <p className="font-mono text-[11px] text-text-muted">02</p>
            <h3 className="mt-1 font-heading text-xl text-text-primary">Public clubs</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Discover and join instantly. Caps at 150; waitlist after that.
            </p>
          </li>
          <li className="border-t border-sumi/15 pt-4">
            <p className="font-mono text-[11px] text-text-muted">03</p>
            <h3 className="mt-1 font-heading text-xl text-text-primary">1:1 duels</h3>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              A 7-day invite link. Daily win / loss / draw against one rival.
            </p>
          </li>
        </ol>
      </section>

      <section>
        <h2 className="font-heading text-2xl text-text-primary">Ranks</h2>
        <p className="mt-2 text-sm text-text-secondary">
          XP on first-ever solves only: Easy 5, Medium 15, Hard 40. +2 while streak is 3 or more.
        </p>
        <div className="mt-6 divide-y divide-sumi/10 border-y border-sumi/15">
          {BASE_LADDER.map((tier) => {
            const meta = getRankMeta(tier.rank);
            return (
              <div key={tier.rank} className="flex items-baseline justify-between gap-4 py-2.5">
                <div>
                  <span className="text-sm text-text-primary">{tier.rank}</span>
                  <span className="ml-2 text-xs text-text-muted">{meta.character}</span>
                </div>
                <span className="font-mono text-xs text-text-secondary">{tier.minXp.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-2xl text-text-primary">Weekly titles</h2>
        <dl className="mt-6 space-y-4">
          <div className="border-t border-sumi/15 pt-4">
            <dt className="text-sm font-medium text-text-primary">Hokage</dt>
            <dd className="mt-1 text-sm text-text-secondary">Most counted solves in the week, if you hit the group goal. Holds 7 days.</dd>
          </div>
          <div className="border-t border-sumi/15 pt-4">
            <dt className="text-sm font-medium text-text-primary">Itachi</dt>
            <dd className="mt-1 text-sm text-text-secondary">Most hard problems that week. Holds 3 days.</dd>
          </div>
          <div className="border-t border-sumi/15 pt-4">
            <dt className="text-sm font-medium text-text-primary">Rock Lee</dt>
            <dd className="mt-1 text-sm text-text-secondary">Best comeback: zero last week, then at least 15 this week. Holds 3 days.</dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-sumi/15 pt-10">
        <h2 className="font-heading text-2xl text-text-primary">How it stays honest</h2>
        <ul className="mt-4 space-y-2 text-sm text-text-secondary">
          <li>Hourly GraphQL sync. No self-reported solves.</li>
          <li>One LeetCode name per account. Claimed names go through a dispute flow.</li>
          <li>Weeks run Monday–Sunday UTC. Titles fire Monday 00:05 UTC.</li>
          <li>Same slug twice in one week: zero extra weekly count, zero extra XP.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard" className="btn-tactile-primary px-5 py-2.5 text-sm">
              Go to dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-tactile-primary px-5 py-2.5 text-sm">
              Sign in with Google
            </Link>
          )}
          <Link href="/discover" className="btn-tactile-secondary px-5 py-2.5 text-sm">
            Explore clubs
          </Link>
        </div>
      </section>

      <footer className="border-t border-sumi/15 pt-6 text-xs text-text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>ShinobiBoard</span>
          <div className="flex gap-4">
            <Link href="/discover" className="hover:text-text-primary">
              Clubs
            </Link>
            <Link href="/dashboard" className="hover:text-text-primary">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-text-primary">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
