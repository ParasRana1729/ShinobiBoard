import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, forbidden, json, unauthorized } from "@/lib/http";

const Body = z.object({ ordered_user_ids: z.array(z.string().uuid()).min(1).max(200) });

/**
 * POST /api/groups/[id]/order — Custom view drag-reorder (§4).
 * Personal view only: stored per (viewer, group) in custom_orders;
 * mirrors a touch into memberships.personal_order for spec compat.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("ordered_user_ids (1–200 uuids) required");

  const db = createServiceClient();
  const { data: mem } = await db.from("memberships").select("*").eq("group_id", params.id).eq("user_id", viewerId).single();
  if (!mem) return forbidden("Members only");

  const { data: mrows } = await db.from("memberships").select("user_id").eq("group_id", params.id);
  const valid = new Set(((mrows ?? []) as { user_id: string }[]).map((m) => m.user_id));
  const ordered = parsed.data.ordered_user_ids.filter((id) => valid.has(id));

  const rows = ordered.map((id, i) => ({
    viewer_id: viewerId,
    group_id: params.id,
    target_user_id: id,
    position: i,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length) {
    const { error } = await db.from("custom_orders").upsert(rows);
    if (error) return badRequest(error.message);
  }
  await db.from("memberships").update({ personal_order: Date.now() % 1_000_000 }).eq("group_id", params.id).eq("user_id", viewerId);
  return json({ ok: true, saved: rows.length });
}
