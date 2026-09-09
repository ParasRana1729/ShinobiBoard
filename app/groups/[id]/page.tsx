export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Board } from "@/components/Board";
import { Feed } from "@/components/Feed";
import { GroupSettings } from "@/components/GroupSettings";
import { JoinClubButton } from "@/components/JoinClubButton";

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
      <main className="py-10">
        <h1 className="text-xl font-bold">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-300">Private squad or duel — you need an invite to view this board.</p>
      </main>
    );
  }

  const [{ data: events }, { data: members }] = await Promise.all([
    supabase.from("events").select("*").eq("group_id", params.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("memberships").select("user_id").eq("group_id", params.id),
  ]);

  const isOwner = membership?.role === "owner" || group.owner_id === data.user.id;

  return (
    <main className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">{group.type} · goal {group.goal}/week</p>
          <h1 className="text-2xl font-extrabold">{group.name}</h1>
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

      {!membership && (
        <JoinClubButton groupId={group.id} memberCount={group.member_count} />
      )}

      {(membership || group.type === "club") && (
        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
          <Board
            groupId={group.id}
            goal={group.goal}
            viewerId={data.user.id}
            memberCount={group.member_count}
            isDuel={group.type === "duel"}
          />
          <Feed
            groupId={group.id}
            initial={(events ?? []).map((e) => ({
              id: e.id, type: e.type, text: e.text, actor_id: e.actor_id,
              payload: e.payload ?? {}, created_at: e.created_at,
            }))}
          />
        </div>
      )}
      <p className="mt-4 hidden">{members?.length ?? 0} members</p>
    </main>
  );
}
