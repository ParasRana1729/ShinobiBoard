import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

/**
 * DELETE /api/account (§9): releases lc_username, transfers owned groups to
 * oldest member (or deletes if empty / archives duels), anonymizes display
 * name in past events, deletes auth user. Solve history is retained under an
 * anonymized profile row so duel/group history stays intact.
 */
export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();

  const { data: owned } = await db.from("groups").select("id, type").eq("owner_id", userId);
  for (const g of (owned ?? []) as { id: string; type: string }[]) {
    const { data: rest } = await db
      .from("memberships")
      .select("user_id, joined_at")
      .eq("group_id", g.id)
      .neq("user_id", userId)
      .order("joined_at", { ascending: true });
    const others = (rest ?? []) as { user_id: string }[];
    if (g.type === "duel") {
      await db.from("groups").update({ invite_enabled: false, owner_id: null }).eq("id", g.id);
    } else if (others.length === 0) {
      await db.from("groups").delete().eq("id", g.id);
    } else {
      await db.from("groups").update({ owner_id: others[0].user_id }).eq("id", g.id);
      await db.from("memberships").update({ role: "owner" }).eq("group_id", g.id).eq("user_id", others[0].user_id);
    }
  }

  await db.from("memberships").delete().eq("user_id", userId);
  await db.from("member_pins").delete().or(`viewer_id.eq.${userId},pinned_user_id.eq.${userId}`);
  await db.from("custom_orders").delete().or(`viewer_id.eq.${userId},target_user_id.eq.${userId}`);
  await db.from("group_waitlist").delete().eq("user_id", userId);
  await db.from("verification_codes").delete().eq("user_id", userId);
  // Anonymize past events (keep rows, drop attribution).
  await db.from("events").update({ actor_id: null }).eq("actor_id", userId);
  // Retain solves under anonymized profile; release username.
  await db
    .from("profiles")
    .update({ lc_username: null, display_name: "Deleted Shinobi", avatar_url: null, sync_status: "frozen", frozen_reason: "account_deleted" })
    .eq("auth_user_id", userId);

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
