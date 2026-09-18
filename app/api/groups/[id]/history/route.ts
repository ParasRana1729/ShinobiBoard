import { getAuthUserId } from "@/lib/auth";
import { json, unauthorized, forbidden, notFound } from "@/lib/http";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export interface TitleHistoryEntry {
  id: string;
  title: "hokage" | "itachi" | "rock_lee";
  granted_at: string;
  expires_at: string;
  user_id: string;
  profile: {
    display_name: string;
    lc_username: string | null;
    avatar_url: string | null;
    base_rank: string;
  } | null;
  stats?: {
    weekly_count?: number;
    weekly_hards?: number;
  };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();

  const supabase = createClient();
  const db = createServiceClient();

  // Validate group exists and user has access
  const { data: group } = await supabase
    .from("groups")
    .select("id, type, invite_enabled")
    .eq("id", params.id)
    .single();

  if (!group) return notFound("Group not found");

  const { data: membership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("group_id", params.id)
    .eq("user_id", userId)
    .single();

  if (!membership && !(group.type === "club" && group.invite_enabled)) {
    return forbidden("Must be a group member");
  }

  // Query titles history for this group
  const { data: titlesData } = await db
    .from("titles")
    .select(`
      id,
      title,
      granted_at,
      expires_at,
      user_id
    `)
    .eq("group_id", params.id)
    .order("granted_at", { ascending: false })
    .limit(100);

  if (!titlesData || titlesData.length === 0) {
    return json({ history: [] });
  }

  // Fetch unique profiles
  const userIds = [...new Set(titlesData.map((t) => t.user_id))];
  const { data: profilesData } = await db
    .from("profiles")
    .select("auth_user_id, display_name, lc_username, avatar_url, base_rank")
    .in("auth_user_id", userIds);

  const profileMap = new Map(
    (profilesData ?? []).map((p) => [p.auth_user_id, p])
  );

  // Fetch title_awarded events to correlate stats
  const { data: eventsData } = await db
    .from("events")
    .select("actor_id, payload, created_at")
    .eq("group_id", params.id)
    .eq("type", "title_awarded")
    .limit(200);

  const history: TitleHistoryEntry[] = titlesData.map((t) => {
    const prof = profileMap.get(t.user_id) ?? null;
    
    // Find closest event
    const grantTime = new Date(t.granted_at).getTime();
    const matchingEvent = (eventsData ?? []).find((e) => {
      if (e.actor_id !== t.user_id) return false;
      const evTime = new Date(e.created_at).getTime();
      return Math.abs(evTime - grantTime) < 10_000; // within 10 seconds
    });

    const payload = (matchingEvent?.payload as Record<string, unknown>) ?? {};

    return {
      id: t.id,
      title: t.title as "hokage" | "itachi" | "rock_lee",
      granted_at: t.granted_at,
      expires_at: t.expires_at,
      user_id: t.user_id,
      profile: prof
        ? {
            display_name: prof.display_name,
            lc_username: prof.lc_username,
            avatar_url: prof.avatar_url,
            base_rank: prof.base_rank,
          }
        : null,
      stats: {
        weekly_count: typeof payload.weekly_count === "number" ? payload.weekly_count : undefined,
        weekly_hards: typeof payload.weekly_hards === "number" ? payload.weekly_hards : undefined,
      },
    };
  });

  return json({ history });
}
