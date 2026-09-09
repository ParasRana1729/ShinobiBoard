import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Swords,
  Flame,
  Trophy,
  ShieldCheck,
  Zap,
  ArrowRight,
  Users,
  Terminal,
  Crown,
  Sparkles,
  Compass,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { BASE_LADDER } from "@/lib/constants";

export default async function Home() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-24">
      {/* ─── Hero Section ────────────────────────────────────────────────────────── */}
      <section className="relative pt-6 pb-8 text-center sm:pt-12">
        {/* Glow ambient background behind hero */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-96 w-full -translate-x-1/2 max-w-4xl opacity-25 blur-3xl bg-gradient-to-r from-shinobi-gold/20 via-shinobi-teal/10 to-shinobi-flame/20" />

        {/* Top telemetry tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-shinobi-gold/30 bg-shinobi-gold/10 px-4 py-1.5 text-xs font-semibold text-shinobi-gold backdrop-blur-sm shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-shinobi-gold animate-pulse" />
          <span className="uppercase tracking-widest text-[11px] font-mono">ShinobiBoard v1.1</span>
          <span className="text-white/20">|</span>
          <span className="text-text-secondary text-[11px]">Real-Time LeetCode Arena</span>
        </div>

        {/* Main headline */}
        <h1 className="mt-8 text-4xl font-black tracking-tight text-text-primary sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.08]">
          Solo LeetCode grind dies after week 1.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-shinobi-gold via-amber-200 to-shinobi-flame">
            Your squad won&apos;t let it.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
          Zero manual logging. Direct LeetCode GraphQL synchronization, RPG rank progressions from Academy to Kage, weekly prestige titles, and 1:1 rival duels.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-shinobi-gold px-8 py-4 text-sm font-bold text-black shadow-xl shadow-shinobi-gold/20 transition duration-150 hover:bg-shinobi-gold/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Enter Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-shinobi-gold px-8 py-4 text-sm font-bold text-black shadow-xl shadow-shinobi-gold/20 transition duration-150 hover:bg-shinobi-gold/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In with Google <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/discover"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-elevated/70 px-7 py-4 text-sm font-semibold text-text-secondary backdrop-blur-sm transition duration-150 hover:border-white/20 hover:bg-surface-elevated hover:text-text-primary"
          >
            <Compass className="h-4 w-4 text-shinobi-teal" />
            Browse Public Clubs
          </Link>
        </div>

        {/* Telemetry Micro-Pill */}
        <div className="mt-8 inline-flex items-center gap-4 rounded-xl border border-white/[0.06] bg-surface-base/60 px-4 py-2 text-[11px] font-mono text-text-muted">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-shinobi-gold" /> Hourly Background Sync
          </span>
          <span className="text-white/20">•</span>
          <span>Mon–Sun UTC Reset</span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-shinobi-teal" /> Anti-Squat Verified
          </span>
        </div>
      </section>

      {/* ─── Interactive Mockup Showcase ────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-surface-base/80 p-5 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Mock window top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-amber-500/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary">Hidden Leaf Senior Grinders</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-text-muted">
                7 / 15 Shinobi
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-card px-2.5 py-1 text-xs text-text-secondary">
              <Flame className="h-3.5 w-3.5 text-shinobi-flame" />
              <span>Squad Goal: 7/week</span>
            </div>
            <div className="rounded-lg border border-shinobi-gold/30 bg-shinobi-gold/10 px-2.5 py-1 text-[11px] font-bold text-shinobi-gold">
              LIVE SPRINT
            </div>
          </div>
        </div>

        {/* Mock Leaderboard Showcase Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: 1st Place Podium */}
          <div className="relative rounded-2xl border border-shinobi-gold/40 bg-gradient-to-b from-shinobi-gold/10 via-surface-card to-surface-card p-5 shadow-lg shadow-shinobi-gold/5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 rounded-full border border-shinobi-gold/40 bg-shinobi-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-shinobi-gold">
                <Crown className="h-3 w-3" /> #1 Hokage
              </span>
              <span className="font-mono text-xs font-bold text-shinobi-gold">3,420 XP</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-shinobi-gold/50 bg-shinobi-gold/20 text-base font-black text-shinobi-gold">
                IU
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">Itachi Uchiha</p>
                <p className="font-mono text-xs text-text-muted">@itachi_code</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px] uppercase tracking-wider text-text-muted border-t border-white/[0.06] pt-3">
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Goal</span>
                <span className="font-mono text-xs font-bold text-text-primary">12 / 7</span>
              </div>
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Hards</span>
                <span className="font-mono text-xs font-bold text-shinobi-flame">3 Hard</span>
              </div>
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Streak</span>
                <span className="font-mono text-xs font-bold text-shinobi-flame">🔥 24d</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Weekly Target</span>
                <span className="text-shinobi-gold font-bold">171%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-shinobi-gold rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Card 2: 2nd Place */}
          <div className="rounded-2xl border border-white/10 bg-surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-slate-400/30 bg-slate-400/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                #2 Contender
              </span>
              <span className="font-mono text-xs font-bold text-shinobi-gold">2,850 XP</span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-base font-black text-text-primary">
                KH
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">Kakashi Hatake</p>
                <p className="font-mono text-xs text-text-muted">@copy_ninja</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[10px] uppercase tracking-wider text-text-muted border-t border-white/[0.06] pt-3">
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Goal</span>
                <span className="font-mono text-xs font-bold text-text-primary">8 / 7</span>
              </div>
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Hards</span>
                <span className="font-mono text-xs font-bold text-shinobi-flame">1 Hard</span>
              </div>
              <div className="rounded-lg bg-surface-base p-1.5">
                <span className="block text-text-muted">Streak</span>
                <span className="font-mono text-xs font-bold text-shinobi-flame">🔥 18d</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Weekly Target</span>
                <span className="text-shinobi-teal font-bold">114%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-shinobi-teal rounded-full w-full" />
              </div>
            </div>
          </div>

          {/* Feed Preview */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-surface-base p-5">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <span className="h-2 w-2 rounded-full bg-shinobi-teal animate-pulse" />
                  Live Squad Feed
                </span>
                <span className="text-[10px] font-mono text-text-muted">Realtime</span>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="rounded-xl border border-white/[0.04] bg-surface-card p-2 text-xs">
                  <span className="font-semibold text-text-primary">Kakashi</span>
                  <span className="text-text-muted"> solved </span>
                  <span className="font-mono text-shinobi-flame">Alien Dictionary (Hard)</span>
                  <span className="ml-1 text-[10px] font-bold text-shinobi-gold">+40 XP</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-card p-2 text-xs">
                  <span className="font-semibold text-text-primary">Itachi</span>
                  <span className="text-text-muted"> hit </span>
                  <span className="font-bold text-shinobi-flame">🔥 24-day streak</span>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-surface-card p-2 text-xs">
                  <span className="font-semibold text-text-primary">Sasuke</span>
                  <span className="text-text-muted"> challenged </span>
                  <span className="text-text-primary font-semibold">Itachi</span>
                  <span className="text-text-muted"> to a </span>
                  <span className="font-bold text-shinobi-gold">1:1 Duel</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
              <span className="text-[11px] text-text-muted">Syncing directly with LeetCode GraphQL</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Game Modes / Pillars ────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-shinobi-teal/30 bg-shinobi-teal/10 px-3.5 py-1 text-xs font-semibold text-shinobi-teal">
            <Sparkles className="h-3.5 w-3.5" /> Built for Competitive Developers
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            Accountability Engineered for Speed
          </h2>
          <p className="mt-2 text-sm text-text-secondary max-w-xl mx-auto">
            Three distinct game modes designed to turn solitary algorithmic grind into an exhilarating team habit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Pillar 1: Private Squads */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-base p-7 transition hover:border-shinobi-gold/40 hover:bg-surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-shinobi-gold/30 bg-shinobi-gold/10 text-shinobi-gold">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text-primary">Private Squads</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Invite-code protected for 3 to 15 peers. Set custom weekly problem goals (1–50), drag-and-drop your personal viewer order, and pin up to 2 study partners.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-shinobi-gold">
              <span>Code-only admission</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 2: Public Battle Clubs */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-base p-7 transition hover:border-shinobi-teal/40 hover:bg-surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-shinobi-teal/30 bg-shinobi-teal/10 text-shinobi-teal">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text-primary">Public Battle Clubs</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Open discovery clubs scaling up to 150 engineers. Instant join with real-time capacity meters for university cohorts, blind 75 marathons, and FAANG interview prep.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-shinobi-teal">
              <span>Instant 1-click join</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* Pillar 3: 1:1 Rival Duels */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-surface-base p-7 transition hover:border-shinobi-flame/40 hover:bg-surface-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-shinobi-flame/30 bg-shinobi-flame/10 text-shinobi-flame">
              <Swords className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-text-primary">1:1 Rival Duels</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Generate a 7-day cryptographic challenge link. Daily Head-to-Head Win/Loss/Draw tracking, solve difference tiebreaker, and zero hiding from your rival.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-shinobi-flame">
              <span>Cryptographic challenge tokens</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Shinobi Rank Ladder Progression ─────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-surface-base/80 p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shinobi-gold">
              <Zap className="h-4 w-4" /> Progression Engine
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-text-primary">
              The 7 Shinobi Ranks
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Gain XP strictly on first-ever solves (+5 Easy, +15 Medium, +40 Hard) with +2 XP bonus per solve when streak ≥ 3.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
            <span>Formula:</span>
            <code className="rounded bg-surface-elevated px-2 py-0.5 text-shinobi-teal">XP = DiffXP(first) + 2·(streak≥3)</code>
          </div>
        </div>

        {/* 7-Tier Rank Road */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {BASE_LADDER.map((tier, idx) => (
            <div
              key={tier.rank}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-center ${
                idx === BASE_LADDER.length - 1
                  ? "border-shinobi-gold/50 bg-gradient-to-b from-shinobi-gold/15 to-surface-card"
                  : idx >= 4
                  ? "border-shinobi-teal/30 bg-surface-card"
                  : "border-white/[0.06] bg-surface-elevated/40"
              }`}
            >
              <div>
                <span className="font-mono text-[10px] text-text-muted">STAGE 0{idx + 1}</span>
                <h4 className="mt-1 text-sm font-bold text-text-primary">{tier.rank}</h4>
              </div>
              <div className="mt-4 border-t border-white/[0.06] pt-2">
                <span className="font-mono text-xs font-extrabold text-shinobi-gold">
                  {tier.minXp.toLocaleString()} XP
                </span>
                <span className="block text-[10px] text-text-muted">threshold</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Prestige Title System ──────────────────────────────────────────── */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-shinobi-gold/30 bg-gradient-to-b from-shinobi-gold/10 via-surface-base to-surface-base p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shinobi-gold/20 text-shinobi-gold">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Hokage of the Leaf</h3>
              <p className="text-[11px] font-mono text-shinobi-gold">Top Weekly Solves</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-secondary">
            Granted to the supreme solver of the week in every squad. Awarded automatically every Monday at 00:05 UTC.
          </p>
        </div>

        <div className="rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-500/10 via-surface-base to-surface-base p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Itachi (Master of Hards)</h3>
              <p className="text-[11px] font-mono text-red-400">Most Hard Solves</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-secondary">
            Reserved for developers who tackle the most demanding algorithmic challenges. 1 holder per squad per week.
          </p>
        </div>

        <div className="rounded-3xl border border-shinobi-flame/30 bg-gradient-to-b from-shinobi-flame/10 via-surface-base to-surface-base p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-shinobi-flame/20 text-shinobi-flame">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary">Rock Lee (Relentless)</h3>
              <p className="text-[11px] font-mono text-shinobi-flame">Longest Active Streak</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-text-secondary">
            Honors sheer consistency. When you show up and submit every day without breaking chain, you hold the title.
          </p>
        </div>
      </section>

      {/* ─── Technical Architecture / Developer Spec ───────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-surface-base p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shinobi-teal">
          <Terminal className="h-4 w-4" /> Architecture & Anti-Cheat Spec
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-text-primary">
          Designed for Integrity & Zero Overhead
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.04] bg-surface-card p-4">
            <CheckCircle2 className="h-4 w-4 text-shinobi-teal" />
            <h4 className="mt-2 text-xs font-bold text-text-primary">Headless GraphQL Sync</h4>
            <p className="mt-1 text-[11px] text-text-muted">
              Syncs with LeetCode every hour via Vercel Cron. Zero manual solve submissions.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-surface-card p-4">
            <CheckCircle2 className="h-4 w-4 text-shinobi-teal" />
            <h4 className="mt-2 text-xs font-bold text-text-primary">Anti-Squat Verification</h4>
            <p className="mt-1 text-[11px] text-text-muted">
              Unique verification tokens in LeetCode About section prevent profile squatting.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-surface-card p-4">
            <CheckCircle2 className="h-4 w-4 text-shinobi-teal" />
            <h4 className="mt-2 text-xs font-bold text-text-primary">Mon–Sun UTC Week Cycle</h4>
            <p className="mt-1 text-[11px] text-text-muted">
              Deterministic weekly windows. Resets every Monday 00:05 UTC with title evaluation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-surface-card p-4">
            <CheckCircle2 className="h-4 w-4 text-shinobi-teal" />
            <h4 className="mt-2 text-xs font-bold text-text-primary">Zero Resubmit Spam</h4>
            <p className="mt-1 text-[11px] text-text-muted">
              Difficulty XP is awarded strictly on first-ever AC per problem slug.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Bottom Call to Action ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-shinobi-gold/30 bg-gradient-to-b from-shinobi-gold/10 via-surface-base to-surface-base p-10 text-center shadow-2xl">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
            Claim Your Ninja Headband
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">
            Create a private squad with your engineering team, join a public grind club, or challenge your arch-rival to a 1:1 duel.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-shinobi-gold px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-shinobi-gold/20 transition hover:bg-shinobi-gold/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-shinobi-gold px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-shinobi-gold/20 transition hover:bg-shinobi-gold/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started with Google <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/discover"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface-elevated px-6 py-3.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-elevated/80 hover:text-text-primary"
            >
              Explore Battle Clubs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary">ShinobiBoard</span>
          <span>· LeetCode Board v1.1</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/discover" className="hover:text-text-primary transition">
            Clubs
          </Link>
          <Link href="/dashboard" className="hover:text-text-primary transition">
            Dashboard
          </Link>
          <Link href="/login" className="hover:text-text-primary transition">
            Sign In
          </Link>
        </div>
      </footer>
    </main>
  );
}
