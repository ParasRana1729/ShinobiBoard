import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { DUEL_INVITE_TTL_DAYS } from "./constants";

export interface DuelInvitePayload {
  jti: string;
  from: string; // auth_user_id of challenger
  iat: number;
  exp: number;
}

function secret(): string {
  const s = process.env.DUEL_JWT_SECRET;
  if (!s || s.length < 32) throw new Error("DUEL_JWT_SECRET must be >= 32 chars");
  return s;
}

/** Create single-use 1:1 duel invite token, 7-day expiry (§3.1). */
export function signDuelInvite(fromUserId: string): { token: string; jti: string; expiresAt: Date } {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + DUEL_INVITE_TTL_DAYS * 86_400_000);
  const token = jwt.sign({ jti, from: fromUserId }, secret(), {
    expiresIn: `${DUEL_INVITE_TTL_DAYS}d`,
  });
  return { token, jti, expiresAt };
}

/** Verify signature + expiry. Callers must also check jti single-use ledger + guards. */
export function verifyDuelInvite(token: string): DuelInvitePayload {
  const decoded = jwt.verify(token, secret()) as DuelInvitePayload;
  if (!decoded?.jti || !decoded?.from) throw new Error("Invalid duel invite");
  return decoded;
}

/** Duel guards §3.1: no self-duel, max 1 active duel per pair. */
export function duelPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}
