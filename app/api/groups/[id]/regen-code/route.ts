import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, forbidden, json, notFound, unauthorized } from "@/lib/http";
import { generateInviteCode } from "@/lib/invite";

/** POST /api/groups/[id]/regen-code — owner rotates invite; old dies immediately (§3.1). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  const { data } = await db.from("groups").select("*").eq("id", params.id).single();
  const group = data as unknown as null | { owner_id: string | null; type: string };
  if (!group) return notFound("Group not found");
  if (group.owner_id !== userId) return forbidden("Owner only");
  if (group.type === "duel") return badRequest("Duels use expiring links, not codes");
  const code = generateInviteCode();
  const { error } = await db.from("groups").update({ code, invite_enabled: true }).eq("id", params.id);
  if (error) return badRequest(error.message);
  return json({ code });
}
