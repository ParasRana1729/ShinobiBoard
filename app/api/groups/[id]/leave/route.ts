import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { postEvent } from "@/lib/server/events";

/**
 * POST /api/groups/[id]/leave (§9).
 * Allowed for all. Owner leaving transfers to oldest member; last member
 * leaving deletes squad/club; duel ending archives it (history retained).
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  const { data: grow } = await db.from("groups").select("*").eq("id", params.id).single();
  const group = grow as unknown as null | { id: string; type: string; name: string; owner_id: string | null };
  if (!group) return notFound("Group not found");
  const { data: mem } = await db.from("memberships").select("*").eq("user_id", userId).eq("group_id", group.id).single();
  if (!mem) return badRequest("Not a member");

  await db.from("memberships").delete().eq("user_id", userId).eq("group_id", group.id);
  await db.from("member_pins").delete().or(`viewer_id.eq.${userId},pinned_user_id.eq.${userId}`).eq("group_id", group.id);
  await postEvent(db, group.id, "member_left", `🚪 A member left ${group.name}`, userId, {});

  const { data: remaining } = await db
    .from("memberships")
    .select("user_id, joined_at")
    .eq("group_id", group.id)
    .order("joined_at", { ascending: true });
  const rest = (remaining ?? []) as { user_id: string; joined_at: string }[];

  if (group.type === "duel") {
    await db.from("groups").update({ invite_enabled: false }).eq("id", group.id);
    return json({ ok: true, note: "Duel ended — history retained, rematch creates a new duel row" });
  }
  if (rest.length === 0) {
    await db.from("groups").delete().eq("id", group.id);
    return json({ ok: true, note: "Last member left — group deleted" });
  }
  if (group.owner_id === userId) {
    await db.from("groups").update({ owner_id: rest[0].user_id }).eq("id", group.id);
    await db.from("memberships").update({ role: "owner" }).eq("user_id", rest[0].user_id).eq("group_id", group.id);
    return json({ ok: true, note: "Ownership transferred to oldest member" });
  }
  return json({ ok: true });
}
