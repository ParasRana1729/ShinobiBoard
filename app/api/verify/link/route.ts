import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { fetchMatchedUser } from "@/lib/leetcode";
import { weekStartUTC } from "@/lib/week";

const Body = z.object({ leetcode_username: z.string().min(1).max(30) });

/**
 * POST /api/verify/link — instant link (§7.1 fast path).
 * Validates existence + public stats, requires the username to be unclaimed,
 * then links immediately (fresh cursor, 7-day backfill). The About-code
 * start/confirm flow remains for disputes (usernames claimed by someone else).
 */
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("leetcode_username required");
  const username = parsed.data.leetcode_username.trim();

  try {
    await fetchMatchedUser(username);
  } catch (e) {
    return badRequest((e as Error).message);
  }

  const db = createServiceClient();
  const { data: claimed } = await db.from("profiles").select("auth_user_id").eq("lc_username", username).single();
  if (claimed && (claimed as { auth_user_id: string }).auth_user_id !== userId) {
    return badRequest("Claimed by another account — unlink it there, or prove ownership below", { code: "claimed" });
  }

  const sevenDaysAgoSec = Math.floor(Date.now() / 1000) - 7 * 86_400;
  const { error } = await db
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
  if (error) return badRequest(error.message);
  await db.from("verification_codes").delete().eq("user_id", userId);

  try {
    const { syncUser } = await import("@/lib/server/sync-engine");
    await syncUser(db, userId);
  } catch {
    /* sync is best-effort on link */
  }

  return json({ ok: true, lc_username: username });
}
