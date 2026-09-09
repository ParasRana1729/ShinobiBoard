import type { createServiceClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/types";

type Db = ReturnType<typeof createServiceClient>;

/** Best-effort feed event writer — never throws (sync/cron must not fail on feed). */
export async function postEvent(
  db: Db,
  groupId: string,
  type: EventType,
  text: string,
  actorId: string | null = null,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    await db.from("events").insert({
      group_id: groupId,
      type,
      actor_id: actorId,
      text,
      payload,
    });
  } catch {
    // feed is advisory; ignore (cap/prune trigger handles overflow)
  }
}

export async function postEventToUserGroups(
  db: Db,
  userId: string,
  type: EventType,
  text: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data } = await db.from("memberships").select("group_id").eq("user_id", userId);
    for (const m of data ?? []) {
      await postEvent(db, (m as { group_id: string }).group_id, type, text, userId, payload);
    }
  } catch {
    /* ignore */
  }
}
