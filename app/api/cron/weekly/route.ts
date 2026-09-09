import { createServiceClient } from "@/lib/supabase/server";
import { isCronAuthorized, json } from "@/lib/http";
import { pickHokage, pickItachi, pickRockLee, type TitleCandidate } from "@/lib/scoring";
import { addDaysUTC, weekStartUTC } from "@/lib/week";
import { TITLE_META } from "@/lib/constants";
import { postEvent } from "@/lib/server/events";

/**
 * Monday 00:05 UTC cron (§8): reset weekly_count, grant Hokage/Itachi/Rock Lee,
 * post weekly winner event. Week = Mon 00:00 UTC → Sun 23:59 UTC.
 * Titles computed from the JUST-ENDED week (solves.week_start), then counters reset.
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return json({ error: "Cron unauthorized" }, 401);
  const db = createServiceClient();
  const now = new Date();
  const currentWeek = weekStartUTC(now);
  const endedWeek = addDaysUTC(currentWeek, -7);
  const prevWeek = addDaysUTC(currentWeek, -14);

  // All groups, paginated.
  let groups: { id: string; name: string; goal: number; type: string }[] = [];
  let offset = 0;
  for (;;) {
    const { data } = await db.from("groups").select("id, name, goal, type").range(offset, offset + 199);
    const batch = (data ?? []) as typeof groups;
    groups = groups.concat(batch);
    if (batch.length < 200) break;
    offset += 200;
  }

  let granted = 0;
  for (const group of groups) {
    const { data: mrows } = await db.from("memberships").select("user_id").eq("group_id", group.id);
    const ids = ((mrows ?? []) as { user_id: string }[]).map((m) => m.user_id);
    if (!ids.length) continue;

    const { data: prows } = await db
      .from("profiles")
      .select("auth_user_id, xp, streak, sync_status, display_name")
      .in("auth_user_id", ids);
    const prof = new Map(((prows ?? []) as Record<string, unknown>[]).map((p) => [(p as { auth_user_id: string }).auth_user_id, p]));

    // Distinct slugs per week for ended + previous week (Rock Lee qualifier).
    const { data: srows } = await db
      .from("solves")
      .select("user_id, slug, diff, solved_at, week_start")
      .in("user_id", ids)
      .in("week_start", [endedWeek, prevWeek])
      .limit(20000);

    const byUser = new Map<string, { ended: Map<string, string>; prev: Set<string>; lastAt: string | null }>();
    for (const u of ids) byUser.set(u, { ended: new Map(), prev: new Set(), lastAt: null });
    for (const s of (srows ?? []) as { user_id: string; slug: string; diff: string; solved_at: string; week_start: string }[]) {
      const e = byUser.get(s.user_id);
      if (!e) continue;
      if (s.week_start === endedWeek) {
        if (!e.ended.has(s.slug)) e.ended.set(s.slug, s.diff);
        if (!e.lastAt || s.solved_at > e.lastAt) e.lastAt = s.solved_at;
      } else {
        e.prev.add(s.slug);
      }
    }

    const cands: TitleCandidate[] = ids.map((u) => {
      const e = byUser.get(u)!;
      const p = (prof.get(u) ?? {}) as unknown as { xp: number; streak: number; sync_status: string };
      const hards = [...e.ended.values()].filter((d) => d === "Hard").length;
      return {
        user_id: u,
        weekly_count: e.ended.size,
        weekly_hards: hards,
        prev_weekly_count: e.prev.size,
        xp: p.xp ?? 0,
        streak: p.streak ?? 0,
        last_solved_at: e.lastAt,
        sync_status: p.sync_status ?? "live",
        goal: group.goal,
      };
    });
    // Leaderboard order for Hokage tie-break (§4).
    cands.sort(
      (a, b) =>
        b.weekly_count - a.weekly_count ||
        b.weekly_hards - a.weekly_hards ||
        b.xp - a.xp ||
        b.streak - a.streak ||
        (a.last_solved_at && b.last_solved_at ? Date.parse(a.last_solved_at) - Date.parse(b.last_solved_at) : 0)
    );

    const nowIso = now.toISOString();
    const awards: { cand: TitleCandidate; title: "hokage" | "itachi" | "rock_lee" }[] = [];
    const h = pickHokage(cands);
    if (h) awards.push({ cand: h, title: "hokage" });
    const it = pickItachi(cands);
    if (it) awards.push({ cand: it, title: "itachi" });
    const rl = pickRockLee(cands);
    if (rl) awards.push({ cand: rl, title: "rock_lee" });

    for (const { cand, title } of awards) {
      const days = TITLE_META[title].durationDays;
      const { error } = await db.from("titles").insert({
        user_id: cand.user_id,
        group_id: group.id,
        title,
        granted_at: nowIso,
        expires_at: new Date(now.getTime() + days * 86_400_000).toISOString(),
      });
      if (error) continue; // partial-unique holder exists — keep incumbent
      granted++;
      const nm = ((prof.get(cand.user_id) ?? {}) as { display_name?: string }).display_name ?? "Someone";
      const label = TITLE_META[title].label;
      await postEvent(db, group.id, title === "hokage" ? "hokage" : "title_awarded",
        title === "hokage"
          ? `👑 Weekly winner: ${nm} takes HOKAGE with ${cand.weekly_count} solves!`
          : `🏅 ${nm} earns ${label} (${cand.weekly_count} solves, ${cand.weekly_hards} hard)`,
        cand.user_id, { title, weekly_count: cand.weekly_count });
      if (title === "rock_lee") {
        await postEvent(db, group.id, "comeback", `💪 Comeback of the week: ${nm} — 0 → ${cand.weekly_count}!`, cand.user_id, {});
      }
    }

    if (cands[0] && cands[0].weekly_count > 0 && !h) {
      // No Hokage (goal missed / frozen top) — still post winner line for the loop.
      await postEvent(db, group.id, "weekly_winner",
        `📊 Week closed: top score ${cands[0].weekly_count} (no Hokage — goal ${group.goal} unmet or frozen)`, null, {});
    }

    // Overtook feed: group #N improved vs previous week ordering.
    const prevRanked = [...cands].sort(
      (a, b) => b.prev_weekly_count - a.prev_weekly_count || b.xp - a.xp || b.streak - a.streak
    );
    const prevRankOf = new Map(prevRanked.map((c, i) => [c.user_id, i + 1]));
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const newRank = i + 1;
      const oldRank = prevRankOf.get(c.user_id) ?? newRank;
      if (oldRank - newRank >= 1 && c.weekly_count > 0) {
        const nm = ((prof.get(c.user_id) ?? {}) as { display_name?: string }).display_name ?? "Someone";
        await postEvent(db, group.id, "overtook", `📈 ${nm} climbed #${oldRank} → #${newRank}!`, c.user_id, {
          from: oldRank,
          to: newRank,
        });
      }
    }
  }

  // Global reset: weekly counters → 0 for the new week; decay broken streaks.
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  await db.from("profiles").update({ weekly_count: 0, weekly_hards: 0, week_start: currentWeek }).neq("week_start", currentWeek);
  await db.from("profiles").update({ streak: 0 }).lt("streak_last_date", yesterday).gt("streak", 0);

  return json({ ok: true, groups: groups.length, ended_week: endedWeek, titles_granted: granted });
}
