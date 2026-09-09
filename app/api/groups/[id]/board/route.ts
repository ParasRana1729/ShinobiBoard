import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { json, notFound, unauthorized, forbidden } from "@/lib/http";
import { orderBySort, orderLeaderboard, withGroupRank } from "@/lib/scoring";
import { weekStartUTC } from "@/lib/week";
import { BOARD_TOP_N, ROSTER_PAGE_SIZE } from "@/lib/constants";
import type { BoardRow, BoardSort, Difficulty, SyncStatus, TitleKind } from "@/lib/types";

/**
 * GET /api/groups/[id]/board?view=leaderboard|custom&sort=weekly|streak|xp|base_rank&filter=all|stale|frozen|titles&q=&page=
 * Scale rule (§4): page 1 renders pinned + Top 50 + search results; full roster paginated 50/page.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const viewerId = await getAuthUserId();
  if (!viewerId) return unauthorized();
  const url = new URL(req.url);
  const view = url.searchParams.get("view") === "custom" ? "custom" : "leaderboard";
  const sort = (["weekly", "streak", "xp", "base_rank"].includes(url.searchParams.get("sort") ?? "")
    ? url.searchParams.get("sort")
    : "weekly") as BoardSort;
  const filter = url.searchParams.get("filter") ?? "all";
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  const db = createServiceClient();
  const { data: grow } = await db.from("groups").select("*").eq("id", params.id).single();
  const group = grow as unknown as null | {
    id: string; type: string; name: string; goal: number; member_count: number; invite_enabled: boolean;
  };
  if (!group) return notFound("Group not found");

  const { data: mem } = await db
    .from("memberships")
    .select("*")
    .eq("group_id", params.id)
    .eq("user_id", viewerId)
    .single();
  const isOpenClub = group.type === "club" && group.invite_enabled;
  if (!mem && !isOpenClub) return forbidden("Invite required to view this board");

  const { data: mrows } = await db.from("memberships").select("user_id, pinned").eq("group_id", params.id);
  const members = (mrows ?? []) as { user_id: string; pinned: boolean }[];
  const ids = members.map((m) => m.user_id);
  if (ids.length === 0) return json({ rows: [], total: 0, page: 1, pages: 1, goal: group.goal });

  const [{ data: prows }, { data: pins }, { data: trows }, { data: corders }] = await Promise.all([
    db.from("profiles").select("*").in("auth_user_id", ids),
    db.from("member_pins").select("pinned_user_id").eq("viewer_id", viewerId).eq("group_id", params.id),
    db.from("titles").select("user_id, title, expires_at").eq("group_id", params.id).gt("expires_at", new Date().toISOString()),
    db.from("custom_orders").select("target_user_id, position").eq("viewer_id", viewerId).eq("group_id", params.id),
  ]);

  const profiles = new Map(
    ((prows ?? []) as Record<string, unknown>[]).map((p) => [(p as { auth_user_id: string }).auth_user_id, p as Record<string, never>] as const)
  );
  const pinSet = new Set((pins ?? []).map((p) => (p as { pinned_user_id: string }).pinned_user_id));
  const titlesByUser = new Map<string, { title: TitleKind; expires_at: string }[]>();
  for (const t of (trows ?? []) as { user_id: string; title: TitleKind; expires_at: string }[]) {
    const arr = titlesByUser.get(t.user_id) ?? [];
    arr.push({ title: t.title, expires_at: t.expires_at });
    titlesByUser.set(t.user_id, arr);
  }

  // Latest solve per member (one query, newest-first, first-seen wins).
  const { data: srows } = await db
    .from("solves")
    .select("user_id, slug, diff, solved_at")
    .in("user_id", ids)
    .order("solved_at", { ascending: false })
    .limit(1000);
  const lastByUser = new Map<string, { slug: string; diff: Difficulty; solved_at: string }>();
  for (const s of (srows ?? []) as { user_id: string; slug: string; diff: Difficulty; solved_at: string }[]) {
    if (!lastByUser.has(s.user_id)) lastByUser.set(s.user_id, { slug: s.slug, diff: s.diff, solved_at: s.solved_at });
  }

  const currentWeek = weekStartUTC(new Date());
  const globalPinByMembership = new Set(members.filter((m) => m.pinned).map((m) => m.user_id));

  let rows: BoardRow[] = ids.map((uid) => {
    const p = (profiles.get(uid) ?? {}) as unknown as {
      display_name: string; avatar_url: string | null; lc_username: string | null;
      xp: number; base_rank: string; streak: number; weekly_count: number; weekly_hards: number;
      week_start: string; sync_status: SyncStatus; frozen_reason: string | null;
      last_sync_at: string | null; retry_at: string | null;
    };
    // Lazy week rollover for display (cron persists the reset).
    const rolled = p.week_start !== currentWeek;
    const last = lastByUser.get(uid) ?? null;
    return {
      user_id: uid,
      display_name: p.display_name ?? "Shinobi",
      avatar_url: p.avatar_url ?? null,
      lc_username: p.lc_username ?? null,
      xp: p.xp ?? 0,
      base_rank: p.base_rank ?? "Academy",
      streak: rolled ? 0 : (p.streak ?? 0),
      weekly_count: rolled ? 0 : (p.weekly_count ?? 0),
      weekly_hards: rolled ? 0 : (p.weekly_hards ?? 0),
      last_solved_at: last?.solved_at ?? null,
      last_solved_slug: last?.slug ?? null,
      last_solved_diff: last?.diff ?? null,
      sync_status: p.sync_status ?? "live",
      frozen_reason: p.frozen_reason ?? null,
      last_sync_at: p.last_sync_at ?? null,
      retry_at: p.retry_at ?? null,
      pinned: pinSet.has(uid) || globalPinByMembership.has(uid),
      group_rank: 0,
      titles: titlesByUser.get(uid) ?? [],
    };
  });

  // Filters (§4): stale-only, frozen, title holders.
  if (filter === "stale") rows = rows.filter((r) => r.sync_status === "stale" || r.sync_status === "rate_limited");
  else if (filter === "frozen") rows = rows.filter((r) => r.sync_status === "frozen");
  else if (filter === "titles") rows = rows.filter((r) => r.titles.length > 0);

  // Search by display name / lc_username.
  if (q) {
    rows = rows.filter(
      (r) => r.display_name.toLowerCase().includes(q) || (r.lc_username ?? "").toLowerCase().includes(q)
    );
  }

  // Ordering.
  if (view === "custom") {
    const pos = new Map(
      ((corders ?? []) as { target_user_id: string; position: number }[]).map((c) => [c.target_user_id, c.position])
    );
    if (pos.size > 0) {
      const pinned = rows.filter((r) => r.pinned);
      const rest = rows.filter((r) => !r.pinned);
      const byPos = (a: BoardRow, b: BoardRow) => {
        const pa = pos.has(a.user_id) ? pos.get(a.user_id)! : Number.MAX_SAFE_INTEGER;
        const pb = pos.has(b.user_id) ? pos.get(b.user_id)! : Number.MAX_SAFE_INTEGER;
        return pa - pb;
      };
      pinned.sort(byPos);
      rest.sort(byPos);
      rows = withGroupRank([...pinned, ...rest]);
    } else {
      rows = withGroupRank(orderBySort(rows, sort));
    }
  } else {
    rows = withGroupRank(orderBySort(rows, sort));
    void orderLeaderboard; // default weekly order == orderBySort(weekly); kept import for clarity
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / ROSTER_PAGE_SIZE));

  // Scale rule: page 1 → pinned + Top 50 (+ all search matches when searching).
  let pageRows: BoardRow[];
  if (page === 1 && !q) {
    const pinned = rows.filter((r) => r.pinned);
    const rest = rows.filter((r) => !r.pinned).slice(0, BOARD_TOP_N);
    pageRows = [...pinned, ...rest];
  } else if (page === 1 && q) {
    const pinned = rows.filter((r) => r.pinned);
    const rest = rows.filter((r) => !r.pinned).slice(0, 100);
    pageRows = [...pinned, ...rest];
  } else {
    pageRows = rows.slice((page - 1) * ROSTER_PAGE_SIZE, page * ROSTER_PAGE_SIZE);
  }

  return json({ rows: pageRows, total, page, pages, goal: group.goal, view, sort });
}
