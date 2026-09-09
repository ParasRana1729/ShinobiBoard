import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { CLUB_MAX, SQUAD_MAX } from "@/lib/constants";
import { postEvent } from "@/lib/server/events";

const Body = z.object({ code: z.string().min(8).max(8) });

/** POST /api/groups/join — join squad/club by 8-char invite code (§3.1). Duels join via JWT only. */
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("8-char invite code required");

  const db = createServiceClient();
  const { data: grow } = await db.from("groups").select("*").eq("code", parsed.data.code.trim()).single();
  const group = grow as unknown as null | {
    id: string; type: string; name: string; invite_enabled: boolean; member_count: number;
  };
  if (!group || !group.invite_enabled) return badRequest("Invalid or closed invite code");
  if (group.type === "duel") return badRequest("Duels join via duel link only");

  const { data: existing } = await db
    .from("memberships")
    .select("*")
    .eq("user_id", userId)
    .eq("group_id", group.id)
    .single();
  if (existing) return json({ group, joined: false, note: "Already a member" });

  const cap = group.type === "club" ? CLUB_MAX : SQUAD_MAX;
  if (group.member_count >= cap) {
    if (group.type === "club") {
      await db.from("group_waitlist").upsert({ user_id: userId, group_id: group.id });
      return json({ group, joined: false, waitlisted: true, note: "Club full (150) — waitlisted" }, 202);
    }
    return badRequest("Squad is full (15)");
  }

  const { error } = await db.from("memberships").insert({ user_id: userId, group_id: group.id, role: "member" });
  if (error) return badRequest(error.message);
  const { data: p } = await db.from("profiles").select("display_name").eq("auth_user_id", userId).single();
  await postEvent(db, group.id, "member_joined", `👋 ${(p as { display_name: string } | null)?.display_name ?? "Someone"} joined ${group.name}`, userId, {});
  return json({ group, joined: true }, 201);
}
