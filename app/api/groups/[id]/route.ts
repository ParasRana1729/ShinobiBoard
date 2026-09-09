import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, forbidden, json, notFound, unauthorized } from "@/lib/http";
import { GROUP_GOAL_MAX, GROUP_GOAL_MIN } from "@/lib/constants";

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  goal: z.number().int().min(GROUP_GOAL_MIN).max(GROUP_GOAL_MAX).optional(),
  invite_enabled: z.boolean().optional(),
});

async function ownerCheck(db: ReturnType<typeof createServiceClient>, groupId: string, userId: string) {
  const { data } = await db.from("groups").select("*").eq("id", groupId).single();
  const group = data as unknown as null | { id: string; owner_id: string | null; type: string };
  if (!group) return { error: notFound("Group not found") as Response };
  if (group.owner_id !== userId) return { error: forbidden("Owner only (no co-mods v1)") as Response };
  return { group };
}

/** PATCH /api/groups/[id] — owner: rename, set goal 1–50, close/open invites (§9). */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Nothing valid to update (name 1–80, goal 1–50, invite_enabled bool)");
  const db = createServiceClient();
  const { group, error } = await ownerCheck(db, params.id, userId);
  if (error) return error;
  void group;

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name.trim();
  if (parsed.data.goal !== undefined) update.goal = parsed.data.goal;
  if (parsed.data.invite_enabled !== undefined) {
    update.invite_enabled = parsed.data.invite_enabled;
    if (!parsed.data.invite_enabled) update.code = null; // close nulls code (§3.1)
  }
  // Reopening without a code mints a fresh one.
  if (parsed.data.invite_enabled === true) {
    const { data: g } = await db.from("groups").select("code").eq("id", params.id).single();
    if (g && !(g as { code: string | null }).code) {
      const { generateInviteCode } = await import("@/lib/invite");
      update.code = generateInviteCode();
    }
  }
  const { data: updated, error: uErr } = await db.from("groups").update(update).eq("id", params.id).select("*").single();
  if (uErr) return badRequest(uErr.message);
  return json({ group: updated });
}

export const POST = PATCH;

/** DELETE /api/groups/[id] — owner deletes club; duel archives (§9). Squads delete via last-leave. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  const { group, error } = await ownerCheck(db, params.id, userId);
  if (error) return error;
  if (group!.type === "duel") {
    await db.from("groups").update({ invite_enabled: false }).eq("id", params.id);
    return json({ ok: true, archived: true });
  }
  if (group!.type === "squad") return badRequest("Squads delete when the last member leaves");
  await db.from("groups").delete().eq("id", params.id);
  return json({ ok: true });
}
