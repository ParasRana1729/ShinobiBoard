import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, notFound, unauthorized } from "@/lib/http";
import { postEvent } from "@/lib/server/events";

/**
 * POST /api/groups/[id]/join — instant join for OPEN public clubs (§3/§9).
 * Squads/duels must use code/link paths.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  const { data: grow } = await db.from("groups").select("*").eq("id", params.id).single();
  const group = grow as unknown as null | {
    id: string; type: string; name: string; invite_enabled: boolean; member_count: number;
  };
  if (!group) return notFound("Group not found");
  if (group.type !== "club" || !group.invite_enabled) return badRequest("Only open public clubs allow instant join");
  const { data: existing } = await db.from("memberships").select("*").eq("user_id", userId).eq("group_id", group.id).single();
  if (existing) return json({ joined: false, note: "Already a member" });
  if (group.member_count >= 150) {
    await db.from("group_waitlist").upsert({ user_id: userId, group_id: group.id });
    return json({ joined: false, waitlisted: true }, 202);
  }
  const { error } = await db.from("memberships").insert({ user_id: userId, group_id: group.id, role: "member" });
  if (error) return badRequest(error.message);
  await postEvent(db, group.id, "member_joined", `👋 New member joined ${group.name}`, userId, {});
  return json({ joined: true }, 201);
}
