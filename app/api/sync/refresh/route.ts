import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, rateLimited, unauthorized } from "@/lib/http";
import { syncUser } from "@/lib/server/sync-engine";
import { MANUAL_REFRESH_COOLDOWN_MIN, MANUAL_REFRESH_VIEWER_HOURLY_CAP } from "@/lib/constants";

const Body = z.object({ user_id: z.string().uuid() });

/**
 * POST /api/sync/refresh — manual Refresh button (§7.2).
 * Cooldown 10 min per TARGET profile (shared) + 10/hour per VIEWER anti-abuse.
 * Any member may refresh any card.
 */
export async function POST(req: Request) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("user_id required");
  const targetId = parsed.data.user_id;

  const db = createServiceClient();

  // Viewer must share a group with target (or be the target).
  if (viewerId !== targetId) {
    const { data: mine } = await db.from("memberships").select("group_id").eq("user_id", viewerId);
    const myGroups = new Set((mine ?? []).map((m) => (m as { group_id: string }).group_id));
    const { data: theirs } = await db.from("memberships").select("group_id").eq("user_id", targetId);
    const shared = (theirs ?? []).some((m) => myGroups.has((m as { group_id: string }).group_id));
    if (!shared) return badRequest("You can only refresh cards in your groups");
  }

  // Shared per-target cooldown: last successful/attempted sync <10min ago?
  const { data: target } = await db.from("profiles").select("last_sync_at").eq("auth_user_id", targetId).single();
  const lastSync = (target as { last_sync_at: string | null } | null)?.last_sync_at;
  if (lastSync && Date.now() - Date.parse(lastSync) < MANUAL_REFRESH_COOLDOWN_MIN * 60_000) {
    const waitMin = Math.ceil((MANUAL_REFRESH_COOLDOWN_MIN * 60_000 - (Date.now() - Date.parse(lastSync))) / 60_000);
    return rateLimited(`Cooldown — retry in ~${waitMin}m (shared 10-min per profile)`, waitMin * 60);
  }

  // Per-viewer anti-abuse: 10 refreshes/hour.
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db
    .from("sync_logs")
    .select("id", { count: "exact", head: true })
    .eq("requested_by", viewerId)
    .gt("started_at", hourAgo);
  if ((count ?? 0) >= MANUAL_REFRESH_VIEWER_HOURLY_CAP) {
    return rateLimited("Hourly refresh limit reached (10/hour)", 3600);
  }

  const result = await syncUser(db, targetId, { requestedBy: viewerId, force: true });
  if (result.status === "rate_limited") {
    return rateLimited("LeetCode busy — retry shortly (not frozen)", 300);
  }
  return json({ ok: true, ...result });
}
