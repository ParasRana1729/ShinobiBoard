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
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-sumi/15 bg-surface-card text-shinobi-gold shadow-tactile-card">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-xl font-bold text-text-primary">{group.name}</h1>
        <p className="text-xs text-text-muted">
          This is a private squad or duel arena. You need a valid 8-character invite code or signed challenge link to enter.
        </p>
        <Link
          href="/dashboard"
          className="btn-tactile-secondary"
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
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-shinobi-gold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Group Command Bar Header */}
      <div className="rounded-2xl border border-sumi/15 bg-surface-card p-6 shadow-tactile-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  isDuel
                    ? "border-shinobi-gold/40 bg-shinobi-gold/10 text-shinobi-gold"
                    : isClub
                    ? "border-sumi/20 bg-surface-elevated text-text-secondary"
                    : "border-sumi/20 bg-surface-elevated text-text-primary"
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

            <h1 className="font-heading text-2xl sm:text-3xl text-text-primary">
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
