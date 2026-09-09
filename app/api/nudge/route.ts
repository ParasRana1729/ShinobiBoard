import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { postEvent } from "@/lib/server/events";

const Body = z.object({ to_user: z.string().uuid(), group_id: z.string().uuid() });

/**
 * POST /api/nudge — Nudge button (§4/§8): 1/day per (from, to, group).
 * In-app only v1: creates feed event + inbox item (nudges row), no push.
 */
export async function POST(req: Request) {
  const from = await getAuthUserId();
  if (!from) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("to_user + group_id required");
  const { to_user, group_id } = parsed.data;
  if (to_user === from) return badRequest("You can't nudge yourself");

  const db = createServiceClient();
  // Both must be members of the group.
  const { data: ms } = await db.from("memberships").select("user_id").eq("group_id", group_id).in("user_id", [from, to_user]);
  if ((ms ?? []).length < 2) return badRequest("Nudges only work between group members");

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await db.from("nudges").insert({ from_user: from, to_user, group_id, day: today });
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return badRequest("Already nudged today — 1/day per friend per group");
    }
    return badRequest(error.message);
  }

  const { data: p } = await db.from("profiles").select("display_name").eq("auth_user_id", from).single();
  const name = (p as { display_name: string } | null)?.display_name ?? "Someone";
  await postEvent(db, group_id, "nudge", `👉 ${name} nudged you — protect the streak!`, from, { to_user });
  return json({ ok: true }, 201);
}
