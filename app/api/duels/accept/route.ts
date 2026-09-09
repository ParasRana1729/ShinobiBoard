import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { verifyDuelInvite } from "@/lib/duel";
import { GLOBAL_DEFAULT_GOAL } from "@/lib/constants";
import { postEvent } from "@/lib/server/events";

/**
 * GET /api/duels/accept?token=… — consume single-use duel invite (§3.1).
 * Guards: no self-duel, max 1 active duel per pair (re-use existing),
 * 7-day expiry, single-use jti ledger. Either side can end later (leave).
 */
export async function GET(req: Request) {
  const userId = await getAuthUserId();
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!userId) return NextResponse.redirect(new URL(`/login?next=/duel/accept?token=${encodeURIComponent(token)}`, url.origin));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  let payload: { jti: string; from: string };
  try {
    payload = verifyDuelInvite(token);
  } catch {
    return NextResponse.json({ error: "Invalid or expired duel link" }, { status: 400 });
  }
  if (payload.from === userId) {
    return NextResponse.json({ error: "No self-duels — send it to a rival" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: inv } = await db.from("duel_invites").select("*").eq("jti", payload.jti).single();
  const invite = inv as unknown as null | {
    jti: string; from_user: string; expires_at: string; used_at: string | null; group_id: string | null;
  };
  if (!invite || invite.from_user !== payload.from) {
    return NextResponse.json({ error: "Unknown duel invite" }, { status: 400 });
  }
  if (invite.used_at && invite.group_id) {
    return NextResponse.redirect(new URL(`/groups/${invite.group_id}`, url.origin));
  }
  if (Date.parse(invite.expires_at) < Date.now()) {
    return NextResponse.json({ error: "Duel link expired (7 days)" }, { status: 400 });
  }

  // Max 1 active duel per pair — re-use existing instead of duplicate.
  const { data: myDuels } = await db.from("memberships").select("group_id").eq("user_id", userId);
  const myDuelIds = new Set((myDuels ?? []).map((m) => (m as { group_id: string }).group_id));
  if (myDuelIds.size) {
    const { data: pairRows } = await db.from("memberships").select("group_id").eq("user_id", payload.from);
    const shared = ((pairRows ?? []) as { group_id: string }[]).map((m) => m.group_id).filter((g) => myDuelIds.has(g));
    if (shared.length) {
      const { data: duels } = await db.from("groups").select("id").in("id", shared).eq("type", "duel");
      if (duels && duels.length) {
        const existingId = (duels[0] as { id: string }).id;
        await db.from("duel_invites").update({ used_at: new Date().toISOString(), used_by: userId, group_id: existingId }).eq("jti", payload.jti);
        return NextResponse.redirect(new URL(`/groups/${existingId}`, url.origin));
      }
    }
  }

  // Create fresh duel row (exactly 2 users).
  const { data: a } = await db.from("profiles").select("display_name").eq("auth_user_id", payload.from).single();
  const { data: b } = await db.from("profiles").select("display_name").eq("auth_user_id", userId).single();
  const an = (a as { display_name: string } | null)?.display_name ?? "A";
  const bn = (b as { display_name: string } | null)?.display_name ?? "B";
  const { data: g, error } = await db
    .from("groups")
    .insert({
      type: "duel",
      name: `${an} vs ${bn}`,
      code: null,
      invite_enabled: false,
      goal: GLOBAL_DEFAULT_GOAL,
      owner_id: payload.from,
      member_count: 0,
    })
    .select("*")
    .single();
  if (error || !g) return NextResponse.json({ error: "Could not create duel" }, { status: 500 });
  const gid = (g as { id: string }).id;
  await db.from("memberships").insert([
    { user_id: payload.from, group_id: gid, role: "owner" },
    { user_id: userId, group_id: gid, role: "member" },
  ]);
  await db.from("duel_invites").update({ used_at: new Date().toISOString(), used_by: userId, group_id: gid }).eq("jti", payload.jti);
  await postEvent(db, gid, "member_joined", `⚔️ Duel started: ${an} vs ${bn} — daily W/L/D on the line`, userId, {});
  return NextResponse.redirect(new URL(`/groups/${gid}`, url.origin));
}
