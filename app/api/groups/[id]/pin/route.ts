import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, forbidden, json, unauthorized } from "@/lib/http";

const Body = z.object({ user_id: z.string().uuid(), pinned: z.boolean() });

/** POST /api/groups/[id]/pin — personal pins, max 2 per membership per group (§4). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("user_id + pinned required");
  if (parsed.data.user_id === viewerId) return badRequest("You can't pin yourself");

  const db = createServiceClient();
  const { data: mem } = await db.from("memberships").select("*").eq("group_id", params.id).eq("user_id", viewerId).single();
  if (!mem) return forbidden("Members only");

  if (parsed.data.pinned) {
    const { error } = await db.from("member_pins").insert({
      viewer_id: viewerId,
      pinned_user_id: parsed.data.user_id,
      group_id: params.id,
    });
    if (error) {
      if (error.message.includes("PIN_LIMIT")) return badRequest("Pin limit: at most 2 pinned cards per group");
      if (error.message.includes("duplicate")) return json({ ok: true, note: "Already pinned" });
      return badRequest(error.message);
    }
  } else {
    await db.from("member_pins").delete().eq("viewer_id", viewerId).eq("pinned_user_id", parsed.data.user_id).eq("group_id", params.id);
  }
  return json({ ok: true });
}
