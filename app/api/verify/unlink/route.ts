import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";

/** POST /api/verify/unlink — releases username immediately, keeps solve history (§7.1). */
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const db = createServiceClient();
  await db
    .from("profiles")
    .update({ lc_username: null, sync_status: "stale", frozen_reason: null, retry_at: null })
    .eq("auth_user_id", userId);
  await db.from("verification_codes").delete().eq("user_id", userId);
  return json({ ok: true });
}
