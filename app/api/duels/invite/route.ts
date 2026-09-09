import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { json, unauthorized } from "@/lib/http";
import { signDuelInvite } from "@/lib/duel";

/** POST /api/duels/invite — mint single-use JWT duel link, 7-day expiry (§3.1). */
export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  let token: string;
  let jti: string;
  let expiresAt: Date;
  try {
    ({ token, jti, expiresAt } = signDuelInvite(userId));
  } catch {
    return json({ error: "Duel invites not configured" }, 500);
  }
  const db = createServiceClient();
  await db.from("duel_invites").insert({
    jti,
    from_user: userId,
    expires_at: expiresAt.toISOString(),
  });
  return json({ token, expires_at: expiresAt.toISOString() }, 201);
}
