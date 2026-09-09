import { createServiceClient } from "@/lib/supabase/server";
import { isCronAuthorized, json } from "@/lib/http";
import { dueProfiles, runPool, syncUser } from "@/lib/server/sync-engine";
import { SYNC_BATCH_SIZE, SYNC_CONCURRENCY } from "@/lib/constants";

/**
 * Hourly poll worker (spec §7.2): profiles with last_sync_at > 60min ago
 * (jitter ±10min), batch 20, concurrency 5. Triggered by Vercel Cron.
 * Also exposed as /api/sync/poll (same handler) — Edge/Node worker, not one-shot for all users.
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return json({ error: "Cron unauthorized" }, 401);
  const db = createServiceClient();
  const ids = await dueProfiles(db, SYNC_BATCH_SIZE);
  const results: Record<string, number> = { ok: 0, rate_limited: 0, frozen: 0, error: 0 };
  await runPool(ids, SYNC_CONCURRENCY, async (id) => {
    const r = await syncUser(db, id);
    results[r.status === "ok" ? "ok" : r.status in results ? r.status : "error"] =
      (results[r.status] ?? 0) + 1;
  });
  return json({ ok: true, polled: ids.length, results, batch: SYNC_BATCH_SIZE, concurrency: SYNC_CONCURRENCY });
}
