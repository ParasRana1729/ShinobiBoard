/**
 * Server sync engine (spec §7.2 poll / §5 scoring / §7.3 stale policy).
 * Thin operational facade delegating to the deep SolveIngestor module.
 */
import { createServiceClient } from "@/lib/supabase/server";
import {
  SolveIngestor,
  SupabaseStorageAdapter,
  LiveLeetCodeAdapter,
  type SyncResult,
} from "./solve-ingestion";

export * from "./solve-ingestion";

type Db = ReturnType<typeof createServiceClient>;

/**
 * Full sync for one profile. Idempotent; delegates to the deep SolveIngestor module.
 */
export async function syncUser(
  db: Db,
  authUserId: string,
  opts: { requestedBy?: string; force?: boolean } = {}
): Promise<SyncResult> {
  const ingestor = new SolveIngestor(
    new SupabaseStorageAdapter(db),
    new LiveLeetCodeAdapter()
  );
  return ingestor.ingestUserSolves(authUserId, opts);
}

/** Hourly worker selection: last success >60min ago (jitter ±10min), oldest first, batch N. */
export async function dueProfiles(db: Db, batchSize: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data } = await db
    .from("profiles")
    .select("auth_user_id, last_sync_at")
    .not("lc_username", "is", null)
    .or(`last_sync_at.is.null,last_sync_at.lt.${cutoff}`)
    .order("last_sync_at", { ascending: true, nullsFirst: true })
    .limit(batchSize * 3); // oversample, then jitter-filter
  const rows = (data ?? []) as { auth_user_id: string; last_sync_at: string | null }[];
  const eligible = rows.filter((r) => {
    if (!r.last_sync_at) return true;
    const ageMin = (Date.now() - Date.parse(r.last_sync_at)) / 60_000;
    const jitter = hashJitter(r.auth_user_id); // -10..+10
    return ageMin >= 60 + jitter;
  });
  return eligible.slice(0, batchSize).map((r) => r.auth_user_id);
}

function hashJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 200;
  return (h % 21) - 10; // -10..+10
}

/** Run pool with concurrency N (spec §7.2: batch 20, concurrency 5). */
export async function runPool<T>(items: T[], concurrency: number, fn: (t: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      try {
        await fn(item);
      } catch {
        /* per-user errors already logged inside syncUser */
      }
    }
  });
  await Promise.all(workers);
}
