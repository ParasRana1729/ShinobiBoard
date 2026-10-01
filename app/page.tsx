import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BASE_LADDER } from "@/lib/constants";
import { getRankMeta } from "@/lib/ranks";
import RankAvatar from "@/components/RankAvatar";
import {
  Crown,
  Swords,
  Users,
  Target,
  Flame,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Compass,
} from "lucide-react";

export default async function Home() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <main className="mx-auto max-w-4xl space-y-20 py-12">
      {/* Hero Section */}
      <section className="relative pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-shinobi-gold/30 bg-shinobi-gold/10 px-3 py-1 font-mono text-xs font-semibold text-shinobi-gold">
          <span className="flex h-1.5 w-1.5 rounded-full bg-shinobi-gold animate-pulse" />
          <span>Weekly Mon–Sun UTC Solve Sprints</span>
        </div>

        <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-[1.15]">
          Solve in public. <br className="hidden sm:inline" />
          <span className="text-shinobi-gold">Let the leaderboard keep score.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          High-density LeetCode accountability arena. Automatic hourly sync, Naruto-themed progression ranks, weekly Hokage crowns, and 1:1 rivalries — zero manual logging.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3.5">
          {user ? (
            <Link href="/dashboard" className="btn-tactile-primary px-6 py-3 text-sm">
              <span>Enter Dojo Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/login" className="btn-tactile-primary px-6 py-3 text-sm">
              <span>Sign in with Google</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link href="/discover" className="btn-tactile-secondary px-6 py-3 text-sm">
            <Compass className="h-4 w-4 text-shinobi-gold" />
            <span>Browse Public Clubs</span>
          </Link>
        </div>
      </section>

      {/* Interactive Leaderboard Preview Card */}
      <section className="relative overflow-hidden rounded-2xl border border-sumi/20 bg-surface-card p-6 shadow-tactile-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sumi/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-shinobi-teal" />
              <h2 className="font-heading text-base sm:text-lg font-bold text-text-primary">
                Konoha Elite Contenders Squad
              </h2>
            </div>
            <p className="mt-0.5 font-mono text-xs text-text-muted">
              Weekly Goal: 7 solves · Reset: Monday 00:05 UTC
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-sumi/15 bg-surface-elevated px-3 py-1 font-mono text-xs text-text-secondary">
            <Target className="h-3.5 w-3.5 text-shinobi-gold" />
            <span>Active Sprint</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {[
            {
              rankNum: 1,
              title: "Hokage",
              name: "Neal Wu",
              handle: "@neal_wu",
              characterRank: "Kage",
              solves: 14,
              goal: 7,
              streak: 42,
              hards: 6,
              xp: 4890,
              avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=neal",
              podium: "gold",
            },
            {
              rankNum: 2,
              title: "Itachi",
              name: "Alex Wice",
              handle: "@awice",
              characterRank: "ANBU",
              solves: 11,
              goal: 7,
              streak: 28,
              hards: 5,
              xp: 3420,
              avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=alex",
              podium: "silver",
            },
            {
              rankNum: 3,
              title: null,
              name: "Lee",
              handle: "@lee215",
              characterRank: "Jonin",
              solves: 9,
              goal: 7,
              streak: 19,
              hards: 2,
              xp: 2150,
              avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=lee",
              podium: "bronze",
            },
          ].map((solver) => {
            const meta = getRankMeta(solver.characterRank);
            return (
              <div
                key={solver.handle}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-3.5 transition-all ${
                  solver.podium === "gold"
                    ? "border-shinobi-gold/50 bg-gradient-to-r from-amber-950/30 to-surface-card shadow-tactile-podium"
                    : solver.podium === "silver"
                    ? "border-slate-400/30 bg-surface-elevated/70"
                    : "border-amber-800/30 bg-surface-elevated/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-black ${
                        solver.podium === "gold"
                          ? "text-shinobi-gold"
                          : solver.podium === "silver"
                          ? "text-slate-300"
                          : "text-amber-500"
                      }`}
                    >
                      #{solver.rankNum}
                    </span>
                    <RankAvatar rank={solver.characterRank} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-text-primary">
                        {solver.name}
                      </span>
                      {solver.title === "Hokage" && (
                        <span className="inline-flex items-center gap-1 rounded border border-shinobi-gold/40 bg-shinobi-gold/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-shinobi-gold">
                          <Crown className="h-3 w-3 fill-shinobi-gold" />
                          <span>Hokage</span>
                        </span>
                      )}
                      {solver.title === "Itachi" && (
                        <span className="inline-flex items-center gap-1 rounded border border-purple-500/40 bg-purple-500/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-purple-400">
                          <span>🐦 Itachi</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-text-muted">{solver.handle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1 text-shinobi-teal font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{solver.solves} solves</span>
                  </div>
                  <div className="flex items-center gap-1 text-shinobi-flame">
                    <Flame className="h-3.5 w-3.5 fill-shinobi-flame/30" />
                    <span>{solver.streak}d</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-text-muted">
                    <Zap className="h-3.5 w-3.5 text-shinobi-gold" />
                    <span>{solver.xp} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Battle Modes Grid */}
      <section className="space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-shinobi-gold">Battle Formats</span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Three arenas to prove your discipline
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-sumi/15 bg-surface-card p-5 shadow-tactile-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sumi/15 bg-surface-elevated text-shinobi-gold">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">Private Squads</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Invite-code only circles of 3–15 engineers. Custom weekly goals, personal drag-and-drop card ordering, and dual pinned focus cards.
            </p>
          </div>

          <div className="rounded-2xl border border-sumi/15 bg-surface-card p-5 shadow-tactile-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sumi/15 bg-surface-elevated text-shinobi-teal">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">Public Clubs</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Open discovery clubs capped at 150 members with automated waitlists. Ideal for university cohorts, Blind 75 study groups, and interview prep clubs.
            </p>
          </div>

          <div className="rounded-2xl border border-sumi/15 bg-surface-card p-5 shadow-tactile-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sumi/15 bg-surface-elevated text-shinobi-flame">
              <Swords className="h-5 w-5" />
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">1:1 Duel Arena</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Signed 7-day single-use challenge links. Daily win / loss / draw score clashes and mutual problem detection against your direct rival.
            </p>
          </div>
        </div>
      </section>

      {/* Ranks Ladder */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-shinobi-gold">Progression System</span>
            <h2 className="mt-1 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
              Seven tiers of shinobi mastery
            </h2>
          </div>
          <p className="text-xs font-mono text-text-muted">
            Easy +5 XP · Medium +15 XP · Hard +40 XP · Up to +5 XP streak bonus
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BASE_LADDER.map((tier) => {
            const meta = getRankMeta(tier.rank);
            return (
              <div
                key={tier.rank}
                className="flex items-center gap-3.5 rounded-xl border border-sumi/15 bg-surface-card p-3.5 shadow-tactile-card"
              >
                <RankAvatar rank={tier.rank} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-sm">{tier.rank}</span>
                    <span className="font-mono text-[11px] font-semibold text-shinobi-gold">
                      {tier.minXp.toLocaleString()} XP
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{meta.character}</p>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{meta.characterTitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly Titles */}
      <section className="space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-shinobi-gold">Weekly Honor</span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
            Prestige titles awarded every Monday 00:05 UTC
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-shinobi-gold/30 bg-surface-card p-5 shadow-tactile-card space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-shinobi-gold">
              <Crown className="h-4 w-4 fill-shinobi-gold" />
              <span>HOKAGE · 7-DAY REIGN</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">Squad Champion</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Awarded to the #1 solver of the week. Must hit the group goal and maintain active non-frozen status.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-surface-card p-5 shadow-tactile-card space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-purple-400">
              <span>🐦</span>
              <span>ITACHI · 3-DAY REIGN</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">Hard Problem Hunter</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Awarded to the solver who conquered the most LeetCode Hard problems in the preceding week.
            </p>
          </div>

          <div className="rounded-2xl border border-shinobi-teal/30 bg-surface-card p-5 shadow-tactile-card space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-shinobi-teal">
              <span>💪</span>
              <span>ROCK LEE · 3-DAY REIGN</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-text-primary">Comeback Titan</h3>
            <p className="text-xs leading-relaxed text-text-secondary">
              Awarded to the greatest comeback: 0 solves in the prior week, surged to 15+ solves in the current week.
            </p>
          </div>
        </div>
      </section>

      {/* Verification & Anti-Cheat */}
      <section className="rounded-2xl border border-sumi/15 bg-surface-card p-6 sm:p-8 shadow-tactile-card space-y-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-shinobi-gold">Integrity Guarantee</span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-text-primary">
            How ShinobiBoard keeps competition honest
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-shinobi-teal shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-text-primary">Direct GraphQL Verification</span>
              <p className="text-text-secondary mt-0.5 leading-relaxed">
                Submissions are fetched straight from LeetCode&apos;s GraphQL API. No manual logging or self-reported solves.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-shinobi-teal shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-text-primary">Ownership Dispute Codes</span>
              <p className="text-text-secondary mt-0.5 leading-relaxed">
                Handles are unique. Claiming an existing username requires placing an SB-XXXXXX code in your LeetCode About Me.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-shinobi-teal shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-text-primary">Strict Intra-Week Deduplication</span>
              <p className="text-text-secondary mt-0.5 leading-relaxed">
                Solving the same problem twice in the same UTC week yields zero additional XP and zero weekly count.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-shinobi-teal shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-text-primary">Deterministic Tiebreaker Hierarchy</span>
              <p className="text-text-secondary mt-0.5 leading-relaxed">
                Ties are resolved deterministically: Weekly Solves → Hards → XP → Streak → Earliest Solve Timestamp.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-sumi/10 pt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-text-muted font-mono">
            Ready to claim your place in the ninja registry?
          </p>
          <div className="flex gap-3">
            {user ? (
              <Link href="/dashboard" className="btn-tactile-primary px-5 py-2">
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-tactile-primary px-5 py-2">
                <span>Sign in with Google</span>
              </Link>
            )}
            <Link href="/discover" className="btn-tactile-secondary px-5 py-2">
              <span>Explore Clubs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sumi/15 pt-8 text-xs text-text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-shinobi-gold text-[10px] font-bold text-white">
              忍
            </span>
            <span className="font-heading font-semibold text-text-primary">ShinobiBoard</span>
            <span className="font-mono text-[11px]">v1.1 · Mon–Sun UTC</span>
          </div>

          <div className="flex gap-5">
            <Link href="/discover" className="hover:text-text-primary transition-colors">
              Clubs
            </Link>
            <Link href="/dashboard" className="hover:text-text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

