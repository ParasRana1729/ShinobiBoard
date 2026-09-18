import { createServiceClient } from "@/lib/supabase/server";
import { getRankMeta, getRankProgress } from "@/lib/ranks";
import type { Difficulty } from "@/lib/types";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const TIER_COLORS: Record<string, { badge: string; text: string; border: string }> = {
  Academy: { badge: "#1b1f28", text: "#9ba1ad", border: "rgba(243, 238, 228, 0.15)" },
  Genin: { badge: "rgba(20, 184, 166, 0.15)", text: "#14b8a6", border: "rgba(20, 184, 166, 0.4)" },
  Chunin: { badge: "#1b1f28", text: "#f3eee4", border: "rgba(243, 238, 228, 0.25)" },
  Jonin: { badge: "#1b1f28", text: "#f3eee4", border: "rgba(243, 238, 228, 0.35)" },
  ANBU: { badge: "rgba(224, 86, 56, 0.12)", text: "#e05638", border: "rgba(224, 86, 56, 0.4)" },
  Kage: { badge: "rgba(224, 86, 56, 0.2)", text: "#e05638", border: "rgba(224, 86, 56, 0.6)" },
  Sage: { badge: "rgba(249, 115, 22, 0.2)", text: "#fb923c", border: "rgba(249, 115, 22, 0.6)" },
};

const TITLE_ICONS: Record<string, { label: string; icon: string; color: string }> = {
  hokage: { label: "Hokage", icon: "👑", color: "#e05638" },
  itachi: { label: "Itachi", icon: "🐦", color: "#a78bfa" },
  rock_lee: { label: "Rock Lee", icon: "💪", color: "#14b8a6" },
};

function renderNotFoundCard(username: string): string {
  const safeUser = escapeXml(username);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="195" viewBox="0 0 500 195" fill="none">
  <rect width="500" height="195" rx="8" fill="#0c0e12"/>
  <rect x="1" y="1" width="498" height="193" rx="7" fill="#14171e" stroke="rgba(243, 238, 228, 0.12)" stroke-width="1"/>
  <text x="250" y="90" fill="#f3eee4" font-family="Georgia, serif" font-size="18" font-weight="600" text-anchor="middle">Shinobi Not Found</text>
  <text x="250" y="115" fill="#636a77" font-family="ui-monospace, monospace" font-size="12" text-anchor="middle">No profile found for "${safeUser}"</text>
  <text x="250" y="150" fill="#e05638" font-family="ui-monospace, monospace" font-size="11" text-anchor="middle">Join the grind at shinobiboard.vercel.app</text>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const username = decodeURIComponent(params.username).trim();
  const db = createServiceClient();

  // Try matching by LeetCode handle first, then display name
  let { data: profile } = await db
    .from("profiles")
    .select("*")
    .ilike("lc_username", username)
    .single();

  if (!profile) {
    const { data: byDisplayName } = await db
      .from("profiles")
      .select("*")
      .ilike("display_name", username)
      .single();
    profile = byDisplayName;
  }

  if (!profile) {
    return new Response(renderNotFoundCard(username), {
      status: 404,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  const baseRank = profile.base_rank ?? "Academy";
  const rankMeta = getRankMeta(baseRank);
  const progress = getRankProgress(profile.xp ?? 0);
  const tierStyle = TIER_COLORS[baseRank] ?? TIER_COLORS.Academy;

  // Active weekly title if any
  const { data: titleRows } = await db
    .from("titles")
    .select("title, expires_at")
    .eq("user_id", profile.auth_user_id)
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  const activeTitle = titleRows?.[0] ? TITLE_ICONS[titleRows[0].title] : null;

  // Distinct solves split
  const { data: solves } = await db
    .from("solves")
    .select("slug, diff")
    .eq("user_id", profile.auth_user_id);

  const distinct = new Map<string, Difficulty>();
  for (const s of (solves ?? []) as { slug: string; diff: Difficulty }[]) {
    if (!distinct.has(s.slug)) distinct.set(s.slug, s.diff);
  }

  const easyCount = [...distinct.values()].filter((d) => d === "Easy").length;
  const medCount = [...distinct.values()].filter((d) => d === "Medium").length;
  const hardCount = [...distinct.values()].filter((d) => d === "Hard").length;
  const totalDistinct = distinct.size;

  // Calculate solve split bar widths (total width: 330px)
  const totalBarWidth = 330;
  const easyWidth = totalDistinct > 0 ? Math.max(1, Math.round((easyCount / totalDistinct) * totalBarWidth)) : 0;
  const medWidth = totalDistinct > 0 ? Math.max(1, Math.round((medCount / totalDistinct) * totalBarWidth)) : 0;
  const hardWidth = totalDistinct > 0 ? Math.max(0, totalBarWidth - easyWidth - medWidth) : 0;

  const displayName = escapeXml(profile.display_name ?? "Shinobi");
  const lcUsername = escapeXml(profile.lc_username ?? "");
  const character = escapeXml(rankMeta.character);
  const tierTitle = escapeXml(rankMeta.title);
  const streak = profile.streak ?? 0;
  const xp = (profile.xp ?? 0).toLocaleString();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="195" viewBox="0 0 500 195" fill="none">
  <defs>
    <style>
      .heading { font-family: 'Inter', system-ui, -apple-system, sans-serif; letter-spacing: -0.02em; }
      .sans { font-family: 'IBM Plex Sans', -apple-system, system-ui, sans-serif; }
      .mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace; }
    </style>
    <linearGradient id="cardBg" x1="0" y1="0" x2="500" y2="195" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14171e"/>
      <stop offset="100%" stop-color="#0f1217"/>
    </linearGradient>
    <clipPath id="avatarClip">
      <rect x="20" y="22" width="76" height="76" rx="6"/>
    </clipPath>
    <clipPath id="solveBarClip">
      <rect x="146" y="142" width="330" height="6" rx="3"/>
    </clipPath>
  </defs>

  <!-- Outer Canvas & Border -->
  <rect width="500" height="195" rx="8" fill="#0c0e12"/>
  <rect x="1" y="1" width="498" height="193" rx="7" fill="url(#cardBg)" stroke="rgba(243, 238, 228, 0.12)" stroke-width="1"/>

  <!-- Left Dossier Seal Frame -->
  <rect x="18" y="20" width="80" height="80" rx="8" fill="${tierStyle.badge}" stroke="${tierStyle.border}" stroke-width="1.5"/>
  <text x="58" y="66" font-size="34" text-anchor="middle">${rankMeta.character.startsWith("Naruto") ? "🍃" : rankMeta.character.startsWith("Kakashi") ? "⚔️" : rankMeta.character.startsWith("Itachi") ? "🎭" : rankMeta.character.startsWith("Minato") ? "👑" : rankMeta.character.startsWith("Jiraiya") ? "🐸" : rankMeta.character.startsWith("Shikamaru") ? "⭐" : "🎒"}</text>
  
  <!-- Level Badge -->
  <rect x="20" y="106" width="76" height="18" rx="4" fill="#1b1f28" stroke="rgba(243, 238, 228, 0.1)" stroke-width="1"/>
  <text x="58" y="119" class="mono" font-size="9.5" font-weight="600" fill="#9ba1ad" text-anchor="middle">LV. ${progress.level} · ${baseRank.toUpperCase()}</text>

  <!-- Header: Display Name & Handle -->
  <text x="114" y="42" class="heading" font-size="18" font-weight="700" fill="#f3eee4">${displayName}</text>
  <text x="114" y="58" class="mono" font-size="11" fill="#636a77">@${lcUsername || "unlinked"}</text>

  <!-- Character Persona & Tier -->
  <rect x="114" y="70" width="auto" height="18" rx="3" fill="#1b1f28"/>
  <text x="114" y="82" class="sans" font-size="11" font-weight="500" fill="${tierStyle.text}">${character} · <tspan fill="#9ba1ad">${tierTitle}</tspan></text>

  <!-- Active Title Badge (if awarded) -->
  ${
    activeTitle
      ? `<g transform="translate(400, 24)">
    <rect x="-8" y="0" width="94" height="20" rx="4" fill="rgba(224, 86, 56, 0.15)" stroke="${activeTitle.color}" stroke-width="1"/>
    <text x="39" y="14" class="mono" font-size="10" font-weight="600" fill="${activeTitle.color}" text-anchor="middle">${activeTitle.icon} ${activeTitle.label.toUpperCase()}</text>
  </g>`
      : ""
  }

  <!-- Divider Line -->
  <line x1="114" y1="96" x2="480" y2="96" stroke="rgba(243, 238, 228, 0.08)" stroke-width="1"/>

  <!-- Core Metrics Grid -->
  <g transform="translate(114, 114)">
    <!-- Streak -->
    <text x="0" y="0" class="mono" font-size="10" fill="#636a77">ACTIVE STREAK</text>
    <text x="0" y="16" class="mono" font-size="13" font-weight="600" fill="#f87171">🔥 ${streak} Days</text>

    <!-- Total XP -->
    <text x="120" y="0" class="mono" font-size="10" fill="#636a77">LIFETIME XP</text>
    <text x="120" y="16" class="mono" font-size="13" font-weight="600" fill="#e05638">⚡ ${xp} XP</text>

    <!-- Solves Total -->
    <text x="240" y="0" class="mono" font-size="10" fill="#636a77">DISTINCT SOLVES</text>
    <text x="240" y="16" class="mono" font-size="13" font-weight="600" fill="#f3eee4">🏆 ${totalDistinct} Solved</text>
  </g>

  <!-- Solve Breakdown Segmented Bar -->
  <g clip-path="url(#solveBarClip)">
    <rect x="146" y="142" width="330" height="6" fill="#1b1f28"/>
    ${easyWidth > 0 ? `<rect x="146" y="142" width="${easyWidth}" height="6" fill="#14b8a6"/>` : ""}
    ${medWidth > 0 ? `<rect x="${146 + easyWidth}" y="142" width="${medWidth}" height="6" fill="#e5a93c"/>` : ""}
    ${hardWidth > 0 ? `<rect x="${146 + easyWidth + medWidth}" y="142" width="${hardWidth}" height="6" fill="#f87171"/>` : ""}
  </g>

  <!-- Solve Split Legend -->
  <text x="114" y="148" class="mono" font-size="9" fill="#636a77">SOLVES</text>
  <g transform="translate(114, 168)" class="mono" font-size="10">
    <circle cx="4" cy="-3" r="3" fill="#14b8a6"/>
    <text x="12" y="0" fill="#14b8a6" font-weight="500">${easyCount} Easy</text>

    <circle cx="80" cy="-3" r="3" fill="#e5a93c"/>
    <text x="88" y="0" fill="#e5a93c" font-weight="500">${medCount} Med</text>

    <circle cx="152" cy="-3" r="3" fill="#f87171"/>
    <text x="160" y="0" fill="#f87171" font-weight="500">${hardCount} Hard</text>
  </g>

  <!-- Footer Seal Brand Mark -->
  <text x="480" y="174" class="serif" font-size="10" fill="#636a77" text-anchor="end">ShinobiBoard <tspan class="mono" font-size="9" fill="#e05638">· 忍</tspan></text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
