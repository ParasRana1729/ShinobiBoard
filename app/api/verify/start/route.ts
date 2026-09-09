import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUserId } from "@/lib/auth";
import { badRequest, json, unauthorized } from "@/lib/http";
import { fetchMatchedUser } from "@/lib/leetcode";
import { VERIFY_CODE_PREFIX, VERIFY_CODE_TTL_MIN } from "@/lib/constants";

const Body = z.object({ leetcode_username: z.string().min(1).max(30) });

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 6; i++) s += alphabet[buf[i] % alphabet.length];
  return `${VERIFY_CODE_PREFIX}${s}`;
}

/**
 * POST /api/verify/start — dispute path step 1 (§7.1).
 * Issues SB-XXXXXX (30-min TTL) so the requester can prove ownership of a
 * username claimed by someone else. Normal linking uses /api/verify/link.
 */
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) return unauthorized();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("leetcode_username required");
  const username = parsed.data.leetcode_username.trim();

  let about: string | null = null;
  try {
    const mu = await fetchMatchedUser(username);
    about = mu.aboutMe;
  } catch (e) {
    return badRequest((e as Error).message);
  }
  void about;

  const db = createServiceClient();
  // Claimed guard: username linked to another auth user → dispute path.
  const { data: claimed } = await db.from("profiles").select("auth_user_id").eq("lc_username", username).single();
  if (claimed && (claimed as { auth_user_id: string }).auth_user_id !== userId) {
    return badRequest("Claimed — ask owner to unlink or dispute", { code: "claimed" });
  }

  const code = makeCode();
  const expiresAt = new Date(Date.now() + VERIFY_CODE_TTL_MIN * 60_000).toISOString();
  await db.from("verification_codes").upsert({
    user_id: userId,
    code,
    lc_username: username,
    expires_at: expiresAt,
  });

  return json({ code, expires_at: expiresAt, ttl_min: VERIFY_CODE_TTL_MIN });
}
