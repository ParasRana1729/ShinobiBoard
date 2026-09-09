export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Board } from "@/components/Board";
import { Feed } from "@/components/Feed";
import { GroupSettings } from "@/components/GroupSettings";
import { JoinClubButton } from "@/components/JoinClubButton";
import { ArrowLeft, Users, Target, Shield, Swords, Lock, Compass } from "lucide-react";

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("*").eq("id", params.id).single();
  if (!group) notFound();

  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("group_id", params.id)
    .eq("user_id", data.user.id)
    .single();

  // Public clubs: visible + joinable without membership. Others require membership.
  if (!membership && !(group.type === "club" && group.invite_enabled)) {
    return (
      <main className="mx-auto max-w-md py-20 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-surface text-amber-400 shadow-xl">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-white">{group.name}</h1>
        <p className="text-xs text-slate-400">
          This is a private squad or duel arena. You need a valid 8-character invite code or signed challenge link to enter.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-surface px-4 py-2 text-xs font-semibold text-slate-300 hover:border-white/[0.2] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </main>
    );
  }

  const [{ data: events }, { data: members }] = await Promise.all([
    supabase.from("events").select("*").eq("group_id", params.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("memberships").select("user_id").eq("group_id", params.id),
  ]);

  const isOwner = membership?.role === "owner" || group.owner_id === data.user.id;
  const isDuel = group.type === "duel";
  const isClub = group.type === "club";

  return (
    <main className="space-y-6 py-6">
      {/* Back to Dashboard Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Group Command Bar Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface-card p-6 shadow-tactile-card backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isDuel
                    ? "border-rose-500/30 bg-rose-950/40 text-rose-300"
                    : isClub
                    ? "border-amber-500/30 bg-amber-950/40 text-amber-300"
                    : "border-indigo-500/30 bg-indigo-950/40 text-indigo-300"
                }`}
              >
                {isDuel ? "1:1 Duel" : isClub ? "Public Club" : "Private Squad"}
              </span>

              <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                <Target className="h-3.5 w-3.5 text-shinobi-gold" />
                <span>Goal: {group.goal} solves/week</span>
              </span>

              <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                <Users className="h-3.5 w-3.5 text-text-muted" />
                <span>{members?.length ?? group.member_count} members</span>
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
              {group.name}
            </h1>
          </div>

          <GroupSettings
            groupId={group.id}
            isOwner={isOwner}
            inviteEnabled={group.invite_enabled}
            code={group.code}
            goal={group.goal}
            type={group.type}
          />
        </div>
      </div>

      {/* Non-member joining banner for public clubs */}
      {!membership && (
        <JoinClubButton groupId={group.id} memberCount={group.member_count} />
      )}

      {/* Board & Live Activity Feed layout */}
      {(membership || isClub) && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <Board
              groupId={group.id}
              goal={group.goal}
              viewerId={data.user.id}
              memberCount={group.member_count}
              isDuel={isDuel}
            />
          </div>

          <div className="xl:sticky xl:top-20 xl:self-start">
            <Feed
              groupId={group.id}
              initial={(events ?? []).map((e) => ({
                id: e.id,
                type: e.type,
                text: e.text,
                actor_id: e.actor_id,
                payload: (e.payload as Record<string, unknown>) ?? {},
                created_at: e.created_at,
              }))}
            />
          </div>
        </div>
      )}
    </main>
  );
}
