export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifyLeetCode } from "@/components/VerifyLeetCode";
import { CreateGroupForm, JoinGroupForm } from "@/components/GroupForms";
import { DuelButtons } from "@/components/GroupSettings";
import { xpToNext } from "@/lib/ranks";
import RankProgressCard from "@/components/RankProgressCard";
import { weekStartUTC, addDaysUTC, diffDaysUTC } from "@/lib/week";
import {
  Flame,
  Shield,
  Trophy,
  Target,
  Swords,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight
} from "lucide-react";

const RANK_BADGE: Record<string, { label: string; emblem: string; badge: string; border: string }> = {
  Academy: { label: "Academy", emblem: "🎒", badge: "bg-slate-800/40 text-slate-300 border-slate-700", border: "border-slate-700" },
  Genin: { label: "Genin", emblem: "🍃", badge: "bg-emerald-950/40 text-emerald-400 border-emerald-500/30", border: "border-emerald-500/30" },
  Chunin: { label: "Chunin", emblem: "⭐", badge: "bg-amber-950/40 text-amber-300 border-amber-500/30", border: "border-amber-500/30" },
  Jonin: { label: "Jonin", emblem: "⚔️", badge: "bg-indigo-950/40 text-indigo-300 border-indigo-500/30", border: "border-indigo-500/30" },
  ANBU: { label: "ANBU", emblem: "🎭", badge: "bg-purple-950/40 text-purple-300 border-purple-500/30", border: "border-purple-500/30" },
  Kage: { label: "Kage", emblem: "👑", badge: "bg-yellow-950/40 text-yellow-300 border-yellow-500/40 shadow-glow-gold", border: "border-yellow-500/40" },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("auth_user_id", data.user.id).single(),
    supabase.from("memberships").select("group_id, role, joined_at, groups(id, name, type, goal, member_count)").eq("user_id", data.user.id),
  ]);

  const currentWeek = weekStartUTC(new Date());
  const isRolled = profile?.week_start !== currentWeek;
  const currentWeeklyCount = isRolled ? 0 : (profile?.weekly_count ?? 0);
  const currentWeeklyHards = isRolled ? 0 : (profile?.weekly_hards ?? 0);

  const nextTier = xpToNext(profile?.xp ?? 0);
  const rankMeta = RANK_BADGE[profile?.base_rank ?? "Academy"] ?? RANK_BADGE.Academy;

  // Calculate XP progress bar percentage
  const currentXp = profile?.xp ?? 0;
  let xpPct = 100;
  if (nextTier.next) {
    const totalNeededForNext = currentXp + nextTier.needed;
    xpPct = Math.min(100, Math.max(5, Math.round((currentXp / Math.max(1, totalNeededForNext)) * 100)));
  }

  // Calculate days remaining in current UTC week (Mon–Sun)
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextMonday = addDaysUTC(currentWeek, 7);
  const daysRemainingInWeek = Math.max(1, diffDaysUTC(todayStr, nextMonday));

  const groupsList = (memberships ?? []).map((m: {
    group_id: string;
    role: string;
    groups: { id: string; name: string; type: string; goal: number; member_count: number } | { id: string; name: string; type: string; goal: number; member_count: number }[];
  }) => {
    const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
    return { ...m, group: g };
  }).filter((m) => m.group);

  return (
    <main className="space-y-8 py-6">
      {/* Top Banner Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              Dojo Headquarters
            </span>
            <span className="text-xs text-slate-500 font-mono">
              · UTC Week {currentWeek}
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Welcome back,</span>
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              {profile?.display_name ?? "Shinobi"}
            </span>
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            {daysRemainingInWeek} {daysRemainingInWeek === 1 ? "day" : "days"} left until the Monday 00:05 UTC Hokage reset. Protect your rank and squad standing.
          </p>
        </div>

        <Link
          href="/discover"
          className="btn-tactile-secondary"
        >
          <Compass className="h-3.5 w-3.5 text-shinobi-gold" />
          <span>Discover Public Clubs</span>
        </Link>
      </div>

      {/* Hero Ninja Dossier + Quests Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ninja Dossier Character Sheet & XP Engine (2 cols) */}
        <div className="lg:col-span-2">
          <RankProgressCard
            xp={profile?.xp ?? 0}
            streak={profile?.streak ?? 0}
            weeklyCount={currentWeeklyCount}
          />
        </div>

        {/* Missions & Gamified Quests (1 col) */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-surface-card p-6 shadow-tactile-card backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-shinobi-gold/[0.03] blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <Target className="h-4 w-4 text-shinobi-gold" />
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-text-primary">Active Objectives</h3>
            </div>

            <div className="mt-4 space-y-3">
              {/* Quest 1: Weekly Goal */}
              <div className="rounded-xl border border-white/[0.06] bg-surface-elevated/60 p-3.5 space-y-2 shadow-tactile-inset">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">Weekly Goal Pursuit</span>
                  <span className="font-mono text-xs font-bold text-shinobi-gold">{currentWeeklyCount}/7 solves</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink">
                  <div
                    className="h-full rounded-full bg-shinobi-gold"
                    style={{ width: `${Math.min(100, Math.round((currentWeeklyCount / 7) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted font-mono">Hokage title qualification requires hitting your goal</p>
              </div>

              {/* Quest 2: Streak Bonus */}
              <div className="rounded-xl border border-white/[0.04] bg-ink/50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Streak Amplifier</span>
                  <span className={`font-mono text-xs font-bold ${(profile?.streak ?? 0) >= 3 ? "text-emerald-400" : "text-slate-500"}`}>
                    {(profile?.streak ?? 0) >= 3 ? "Active (+2 XP)" : `${profile?.streak ?? 0}/3 days`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Earn +2 bonus XP per solve when streak is 3 or higher.
                </p>
              </div>

              {/* Quest 3: Hard Hunter */}
              <div className="rounded-xl border border-white/[0.04] bg-ink/50 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Itachi Contender</span>
                  <span className="font-mono text-xs font-bold text-rose-400">{currentWeeklyHards} hard solves</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Most hard problems solved wins the limited Itachi title on Monday.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
            <span className="text-[11px] text-slate-400">
              Reset every Mon 00:05 UTC · Anti-farming verified
            </span>
          </div>
        </div>
      </div>

      {/* LeetCode Verification Banner */}
      <VerifyLeetCode current={profile?.lc_username ?? null} />

      {/* My Groups & Circles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-shinobi-gold" />
              <span>Your Squads & Rivalries ({groupsList.length})</span>
            </h2>
            <p className="text-xs text-text-secondary">Circles you are actively competing in</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groupsList.map((m) => {
            const isDuel = m.group.type === "duel";
            const isClub = m.group.type === "club";

            return (
              <Link
                key={m.group_id}
                href={`/groups/${m.group.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-surface-card p-5 shadow-tactile-card hover:border-shinobi-gold/50 hover:shadow-glow transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        isDuel
                          ? "border-rose-500/30 bg-rose-950/40 text-rose-300"
                          : isClub
                          ? "border-amber-500/30 bg-amber-950/40 text-amber-300"
                          : "border-indigo-500/30 bg-indigo-950/40 text-indigo-300"
                      }`}
                    >
                      {m.group.type}
                    </span>

                    <span className="font-mono text-[10px] text-text-muted capitalize">
                      Role: {m.role}
                    </span>
                  </div>

                  <h3 className="mt-3 font-heading text-base font-bold text-text-primary group-hover:text-shinobi-gold transition-colors">
                    {m.group.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary font-mono">
                    <span>Goal: {m.group.goal}/wk</span>
                    <span>{m.group.member_count} {m.group.member_count === 1 ? "member" : "members"}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs font-semibold text-shinobi-gold">
                  <span>Enter Board</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}

          {groupsList.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-surface-card/60 p-8 text-center text-text-muted sm:col-span-2 lg:col-span-3 shadow-tactile-inset">
              <Shield className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-60" />
              <p className="font-heading text-sm font-semibold text-text-primary">No squads joined yet</p>
              <p className="mt-1 text-xs text-text-muted">Create a squad below, join with an invite code, or discover public clubs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions Toolbar Grid */}
      <div className="grid gap-6 lg:grid-cols-3 pt-2">
        <CreateGroupForm />
        <JoinGroupForm />
        <DuelButtons />
      </div>
    </main>
  );
}
