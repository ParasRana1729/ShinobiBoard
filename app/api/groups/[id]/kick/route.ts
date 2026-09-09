import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, forbidden, json, notFound, unauthorized } from "@/lib/http";

const Body = z.object({ user_id: z.string().uuid() });

/** POST /api/groups/[id]/kick — owner-only v1 (no co-mods). Public: anyone join, owner kicks. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("user_id required");
  if (parsed.data.user_id === userId) return badRequest("Use Leave instead of kicking yourself");

  const db = createServiceClient();
  const { data: grow } = await db.from("groups").select("owner_id").eq("id", params.id).single();
  const group = grow as unknown as null | { owner_id: string | null };
  if (!group) return notFound("Group not found");
  if (group.owner_id !== userId) return forbidden("Owner only");
  await db.from("memberships").delete().eq("user_id", parsed.data.user_id).eq("group_id", params.id);
  await db.from("member_pins").delete().or(`viewer_id.eq.${parsed.data.user_id},pinned_user_id.eq.${parsed.data.user_id}`).eq("group_id", params.id);
  return json({ ok: true });
}
