export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyDuelInvite } from "@/lib/duel";
import { Swords, Flame, Trophy, ShieldAlert, CheckCircle2, ArrowRight, Zap, Target } from "lucide-react";
import { BASE_LADDER } from "@/lib/constants";

export default async function DuelAcceptPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect(`/login?next=/duel/accept?token=${encodeURIComponent(searchParams.token ?? "")}`);
  }

  const token = searchParams.token;
  if (!token) {
    return (
      <main className="mx-auto max-w-xl py-20 px-4">
        <div className="rounded-2xl border border-red-500/20 bg-surface-base p-8 text-center shadow-xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Missing Duel Token</h1>
          <p className="mt-2 text-sm text-text-secondary">
            This challenge link appears incomplete or malformed. Ask your rival to regenerate an invitation link.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-elevated px-5 py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface-elevated/80"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Verify token signature & expiry
  let payload: { jti: string; from: string } | null = null;
  try {
    payload = verifyDuelInvite(token);
  } catch {
    return (
      <main className="mx-auto max-w-xl py-20 px-4">
        <div className="rounded-2xl border border-amber-500/20 bg-surface-base p-8 text-center shadow-xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Duel Scroll Expired or Invalid</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Duel tokens expire 7 days after issuance or may have already been consumed. Request a fresh challenge link from your rival.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-elevated px-5 py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface-elevated/80"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const db = createServiceClient();
  const { data: inv } = await db.from("duel_invites").select("*").eq("jti", payload.jti).single();
  const invite = inv as unknown as null | {
    jti: string;
    from_user: string;
    expires_at: string;
    used_at: string | null;
    group_id: string | null;
  };

  if (invite?.used_at && invite.group_id) {
    return (
      <main className="mx-auto max-w-xl py-20 px-4">
        <div className="rounded-2xl border border-shinobi-teal/30 bg-surface-base p-8 text-center shadow-xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-shinobi-teal/40 bg-shinobi-teal/10 text-shinobi-teal">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Duel Already Active</h1>
          <p className="mt-2 text-sm text-text-secondary">
            This 1:1 challenge scroll has already been accepted and initialized.
          </p>
          <div className="mt-6">
            <Link
              href={`/groups/${invite.group_id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-shinobi-gold px-5 py-2.5 text-xs font-bold text-black transition hover:bg-shinobi-gold/90"
            >
              Enter Duel Arena <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Self-duel guard
  if (payload.from === data.user.id) {
    return (
      <main className="mx-auto max-w-xl py-20 px-4">
        <div className="rounded-2xl border border-shinobi-gold/30 bg-surface-base p-8 text-center shadow-xl shadow-black/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-shinobi-gold/30 bg-shinobi-gold/10 text-shinobi-gold">
            <Swords className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Shadow Clone Warning</h1>
          <p className="mt-2 text-sm text-text-secondary">
            You cannot challenge yourself to a duel. Copy and share this challenge link with an engineer you want to battle head-to-head.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-full rounded-xl border border-white/10 bg-surface-card p-3 font-mono text-xs text-text-muted select-all break-all">
              {typeof window !== "undefined" ? window.location.href : `/duel/accept?token=${token}`}
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-elevated px-5 py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface-elevated/80"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Fetch challenger and viewer profiles
  const { data: challengerProfile } = await db
    .from("profiles")
    .select("auth_user_id, display_name, lc_username, avatar_url, xp, base_rank, streak, weekly_count")
    .eq("auth_user_id", payload.from)
    .single();

  const { data: viewerProfile } = await db
    .from("profiles")
    .select("auth_user_id, display_name, lc_username, avatar_url, xp, base_rank, streak, weekly_count")
    .eq("auth_user_id", data.user.id)
    .single();

  const challenger = challengerProfile ?? {
    auth_user_id: payload.from,
    display_name: "Challenger",
    lc_username: null,
    avatar_url: null,
    xp: 0,
    base_rank: "Academy",
    streak: 0,
    weekly_count: 0,
  };

  const viewer = viewerProfile ?? {
    auth_user_id: data.user.id,
    display_name: data.user.user_metadata?.full_name ?? "You",
    lc_username: null,
    avatar_url: data.user.user_metadata?.avatar_url ?? null,
    xp: 0,
    base_rank: "Academy",
    streak: 0,
    weekly_count: 0,
  };

  return (
    <main className="mx-auto max-w-4xl py-12 px-4 sm:px-6">
      {/* Top Banner Tag */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-shinobi-gold/30 bg-shinobi-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-shinobi-gold">
          <Swords className="h-3.5 w-3.5 animate-pulse" /> Versus Protocol Engaged
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
          Head-to-Head 1:1 Duel
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-lg mx-auto">
          You have been summoned to a high-stakes LeetCode duel. Daily W/L/D head-to-head tracking with zero manual logging.
        </p>
      </div>

      {/* Versus Combatants Grid */}
      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-[1fr,auto,1fr]">
        {/* Challenger Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950/20 via-surface-base to-surface-card p-6 shadow-xl shadow-black/40">
          <div className="absolute top-0 right-0 rounded-bl-xl border-b border-l border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Challenger
          </div>

          <div>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-red-500/40 bg-surface-elevated text-xl font-black text-red-400 shadow-inner">
                {challenger.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={challenger.avatar_url}
                    alt={challenger.display_name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  challenger.display_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-text-primary">{challenger.display_name}</h2>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="font-mono text-shinobi-gold">@{challenger.lc_username || "unlinked"}</span>
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                  <Zap className="h-3 w-3 text-shinobi-teal" /> {challenger.base_rank}
                </div>
              </div>
            </div>

            {/* Challenger Stats */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Total XP</span>
                <p className="mt-0.5 font-mono text-base font-bold text-shinobi-gold">{challenger.xp.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Streak</span>
                <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-base font-bold text-shinobi-flame">
                  <Flame className="h-3.5 w-3.5 fill-shinobi-flame/30" />
                  {challenger.streak}d
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Week Solves</span>
                <p className="mt-0.5 font-mono text-base font-bold text-text-primary">{challenger.weekly_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center VS Emblem */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-surface-elevated text-xl font-black italic tracking-tighter text-shinobi-gold shadow-2xl shadow-shinobi-gold/10">
            VS
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-shinobi-gold opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-shinobi-gold" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-text-muted">
            <Target className="h-3 w-3 text-shinobi-gold" /> 7-day duel clock
          </div>
        </div>

        {/* Viewer Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-shinobi-teal/30 bg-gradient-to-b from-teal-950/20 via-surface-base to-surface-card p-6 shadow-xl shadow-black/40">
          <div className="absolute top-0 right-0 rounded-bl-xl border-b border-l border-shinobi-teal/30 bg-shinobi-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-shinobi-teal">
            You (Rival)
          </div>

          <div>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-shinobi-teal/40 bg-surface-elevated text-xl font-black text-shinobi-teal shadow-inner">
                {viewer.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewer.avatar_url}
                    alt={viewer.display_name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  viewer.display_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-text-primary">{viewer.display_name}</h2>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="font-mono text-shinobi-gold">@{viewer.lc_username || "unlinked"}</span>
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                  <Zap className="h-3 w-3 text-shinobi-teal" /> {viewer.base_rank}
                </div>
              </div>
            </div>

            {/* Viewer Stats */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Total XP</span>
                <p className="mt-0.5 font-mono text-base font-bold text-shinobi-gold">{viewer.xp.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Streak</span>
                <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-base font-bold text-shinobi-flame">
                  <Flame className="h-3.5 w-3.5 fill-shinobi-flame/30" />
                  {viewer.streak}d
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-surface-elevated/40 p-2.5">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Week Solves</span>
                <p className="mt-0.5 font-mono text-base font-bold text-text-primary">{viewer.weekly_count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stakes and Rules Box */}
      <div className="mt-8 rounded-2xl border border-white/[0.08] bg-surface-base/80 p-5 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
          <Trophy className="h-4 w-4 text-shinobi-gold" /> Duel Ground Rules
        </h3>
        <ul className="mt-3 grid gap-2.5 text-xs text-text-secondary sm:grid-cols-3">
          <li className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-surface-card p-3">
            <span className="font-mono text-shinobi-gold font-bold">01</span>
            <span>Hourly automated sync directly from LeetCode. Zero manual submission logging.</span>
          </li>
          <li className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-surface-card p-3">
            <span className="font-mono text-shinobi-gold font-bold">02</span>
            <span>Daily W / L / D recorded based on problems solved before 23:59 UTC each day.</span>
          </li>
          <li className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-surface-card p-3">
            <span className="font-mono text-shinobi-gold font-bold">03</span>
            <span>Streak shields and prestige ranks update live as both rivals solve problems.</span>
          </li>
        </ul>
      </div>

      {/* Action Controls */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={`/api/duels/accept?token=${encodeURIComponent(token)}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-shinobi-gold px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-shinobi-gold/20 transition hover:bg-shinobi-gold/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Swords className="h-4 w-4" />
          Accept Challenge & Enter Arena
        </a>
        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-elevated px-6 py-3.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-elevated/80 hover:text-text-primary"
        >
          Decline Duel
        </Link>
      </div>
    </main>
  );
}
