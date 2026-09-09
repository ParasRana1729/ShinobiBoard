import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { fetchMatchedUser } from "@/lib/leetcode";
import { weekStartUTC } from "@/lib/week";

const Body = z.object({ leetcode_username: z.string().min(1).max(30) });

/**
 * POST /api/verify/confirm — dispute path step 2 (§7.1).
 * Re-fetches aboutMe, requires code present → transfers the username to the
 * verifier. New username starts fresh cursor with 7-day backfill window.
 */
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("leetcode_username required");
  const username = parsed.data.leetcode_username.trim();

  const db = createServiceClient();
  const { data: vc } = await db.from("verification_codes").select("*").eq("user_id", userId).single();
  const challenge = vc as unknown as null | { code: string; lc_username: string; expires_at: string };
  if (!challenge || challenge.lc_username.toLowerCase() !== username.toLowerCase()) {
    return badRequest("No active code for this username — click Get code first");
  }
  if (Date.parse(challenge.expires_at) < Date.now()) return badRequest("Code expired — get a new one");

  let aboutMe: string | null = null;
  try {
    const mu = await fetchMatchedUser(username);
    aboutMe = mu.aboutMe;
  } catch (e) {
    return badRequest((e as Error).message);
  }
  if (!aboutMe || !aboutMe.includes(challenge.code)) {
    return badRequest("Code not found in LeetCode About — paste it, wait a few seconds, retry");
  }

  // Transfer ownership if previously claimed by another account (§7.1).
  const { data: claimed } = await db.from("profiles").select("auth_user_id").eq("lc_username", username).single();
  if (claimed && (claimed as { auth_user_id: string }).auth_user_id !== userId) {
    await db
      .from("profiles")
      .update({ lc_username: null, sync_status: "frozen", frozen_reason: "claimed_by_dispute" })
      .eq("auth_user_id", (claimed as { auth_user_id: string }).auth_user_id);
  }

  const sevenDaysAgoSec = Math.floor(Date.now() / 1000) - 7 * 86_400;
  await db
    .from("profiles")
    .update({
      lc_username: username,
      // fresh cursor → 7-day backfill only (§7.1 relink rule)
      sync_cursor_ts: sevenDaysAgoSec,
      sync_cursor_id: "",
      week_start: weekStartUTC(new Date()),
      weekly_count: 0,
      weekly_hards: 0,
      sync_status: "stale",
      frozen_reason: null,
      retry_at: null,
      last_sync_at: null,
    })
    .eq("auth_user_id", userId);
  await db.from("verification_codes").delete().eq("user_id", userId);

  try {
    const { syncUser } = await import("@/lib/server/sync-engine");
    await syncUser(db, userId);
  } catch {
    /* sync is best-effort on link */
  }

  return json({ ok: true, lc_username: username, note: "Code may now be removed from About" });
}
