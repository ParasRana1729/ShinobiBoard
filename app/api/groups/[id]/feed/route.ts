import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { forbidden, json, notFound, unauthorized } from "@/lib/http";

/** GET /api/groups/[id]/feed — group events, newest first (retention 30d, cap 200 via trigger). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const db = createServiceClient();
  const { data: group } = await db.from("groups").select("type, invite_enabled").eq("id", params.id).single();
  if (!group) return notFound("Group not found");
  const g = group as { type: string; invite_enabled: boolean };
  if (g.type !== "club" || !g.invite_enabled) {
    const { data: mem } = await db.from("memberships").select("*").eq("group_id", params.id).eq("user_id", viewerId).single();
    if (!mem) return forbidden("Members only");
  }
  const { data } = await db.from("events").select("*").eq("group_id", params.id).order("created_at", { ascending: false }).limit(100);
  return json({ events: data ?? [] });
}
