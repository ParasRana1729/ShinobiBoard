import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { forbidden, json, notFound, unauthorized } from "@/lib/http";
import { last7UTCdays } from "@/lib/week";
import { xpToNext } from "@/lib/ranks";
import { fixHint, syncHealthLabel } from "@/lib/sync";
import { RECENT_SOLVES_LIMIT } from "@/lib/constants";
import type { Difficulty, SyncStatus } from "@/lib/types";

/**
 * GET /api/groups/[id]/member/[userId] — expanded card (§4):
 * recent 5 counted solves, 7-day dots (UTC), all-time E/M/H + total
 * (first-ever distinct slugs), base rank + XP to next, active title +
 * expiry, duel record W/L/D (duels only), sync health.
 */
export async function GET(_req: Request, { params }: { params: { id: string; userId: string } }) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const db = createServiceClient();

  const { data: grow } = await db.from("groups").select("*").eq("id", params.id).single();
  const group = grow as unknown as null | { id: string; type: string; created_at: string };
  if (!group) return notFound("Group not found");
  const { data: mem } = await db
    .from("memberships")
    .select("*")
    .eq("group_id", params.id)
    .eq("user_id", viewerId)
    .single();
  if (!mem && group.type !== "club") return forbidden("Invite required");

  const { data: prow } = await db.from("profiles").select("*").eq("auth_user_id", params.userId).single();
  const profile = prow as unknown as null | {
    xp: number; base_rank: string; sync_status: SyncStatus; frozen_reason: string | null;
    last_sync_at: string | null; retry_at: string | null;
  };
  if (!profile) return notFound("Profile not found");

  const [{ data: recent }, { data: all }, { data: titles }] = await Promise.all([
    db.from("solves").select("slug, title, diff, lang, solved_at").eq("user_id", params.userId)
      .order("solved_at", { ascending: false }).limit(RECENT_SOLVES_LIMIT),
    db.from("solves").select("slug, diff, solved_at").eq("user_id", params.userId).order("solved_at", { ascending: true }),
    db.from("titles").select("title, expires_at").eq("group_id", params.id).eq("user_id", params.userId)
      .gt("expires_at", new Date().toISOString()),
  ]);

  const allRows = (all ?? []) as { slug: string; diff: Difficulty; solved_at: string }[];
  const firstSeen = new Set<string>();
  const split = { Easy: 0, Medium: 0, Hard: 0 };
  for (const s of allRows) {
    if (!firstSeen.has(s.slug)) {
      firstSeen.add(s.slug);
      split[s.diff]++;
    }
  }

  const days = last7UTCdays();
  const perDay = new Map(days.map((d) => [d, 0]));
  for (const s of allRows) {
    const d = s.solved_at.slice(0, 10);
    if (perDay.has(d)) perDay.set(d, perDay.get(d)! + 1);
  }

  let duelRecord: { w: number; l: number; d: number } | null = null;
  if (group.type === "duel") {
    const { data: dm } = await db.from("memberships").select("user_id").eq("group_id", params.id);
    const opp = ((dm ?? []) as { user_id: string }[]).map((m) => m.user_id).find((u) => u !== params.userId);
    if (opp) {
      const since = group.created_at.slice(0, 10);
      const { data: both } = await db
        .from("solves")
        .select("user_id, solved_at")
        .in("user_id", [params.userId, opp])
        .gte("solved_at", group.created_at)
        .limit(2000);
      const mine = new Map<string, number>();
      const theirs = new Map<string, number>();
      for (const s of (both ?? []) as { user_id: string; solved_at: string }[]) {
        const d = s.solved_at.slice(0, 10);
        const m = s.user_id === params.userId ? mine : theirs;
        m.set(d, (m.get(d) ?? 0) + 1);
      }
      // Daily W/L/D across duel lifetime (cap 60d window ending today).
      const rec = { w: 0, l: 0, d: 0 };
      const today = days[6];
      let cursor = since > days[0] ? since : days[0];
      void today;
      const seen = new Set([...mine.keys(), ...theirs.keys()].filter((d) => d >= cursor));
      for (const d of seen) {
        const a = mine.get(d) ?? 0;
        const b = theirs.get(d) ?? 0;
        if (a > b) rec.w++;
        else if (a < b) rec.l++;
        else rec.d++;
      }
      duelRecord = rec;
    }
  }

  return json({
    recent: (recent ?? []).map((s) => s),
    dots: days.map((day) => ({ day, count: perDay.get(day) ?? 0 })),
    split: { ...split, total: firstSeen.size },
    xp_to_next: xpToNext(profile.xp),
    titles: titles ?? [],
    duel_record: duelRecord,
    sync_label: syncHealthLabel(profile.sync_status, profile.last_sync_at, profile.frozen_reason, profile.retry_at),
    fix_hint: fixHint(profile.sync_status, profile.frozen_reason),
  });
}
