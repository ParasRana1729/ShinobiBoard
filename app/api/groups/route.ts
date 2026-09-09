import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { generateInviteCode } from "@/lib/invite";
import { GLOBAL_DEFAULT_GOAL, GROUP_GOAL_MAX, GROUP_GOAL_MIN } from "@/lib/constants";
import { postEvent } from "@/lib/server/events";

const CreateBody = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["squad", "club"]),
  goal: z.number().int().min(GROUP_GOAL_MIN).max(GROUP_GOAL_MAX).optional(),
});

/** GET /api/groups — my memberships. POST /api/groups — create squad/club (§3, §9). */
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  const { data } = await db
    .from("memberships")
    .select("role, joined_at, groups(id, name, type, goal, member_count, invite_enabled)")
    .eq("user_id", userId);
  return json({ groups: data ?? [] });
}

export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = CreateBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("name (1–80) + type squad|club required, goal 1–50");
  const { name, type } = parsed.data;
  const goal = parsed.data.goal ?? GLOBAL_DEFAULT_GOAL;

  const db = createServiceClient();
  const { data: profile } = await db.from("profiles").select("display_name").eq("auth_user_id", userId).single();
  if (!profile) return badRequest("Create your profile first (sign in again)");

  const code = generateInviteCode(); // single active code per group
  const { data: group, error } = await db
    .from("groups")
    .insert({ type, name: name.trim(), code, invite_enabled: true, goal, owner_id: userId, member_count: 0 })
    .select("*")
    .single();
  if (error || !group) return badRequest(error?.message ?? "Create failed");
  const g = group as { id: string };
  const { error: mErr } = await db.from("memberships").insert({ user_id: userId, group_id: g.id, role: "owner" });
  if (mErr) {
    await db.from("groups").delete().eq("id", g.id);
    return badRequest(mErr.message);
  }
  await postEvent(db, g.id, "member_joined", `🎉 Group created — invite code ${(group as { code: string }).code}`, userId, {});
  return json({ group }, 201);
}
