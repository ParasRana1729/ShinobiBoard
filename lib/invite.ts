import { customAlphabet } from "nanoid";

/**
 * Squad/Club invite code §3.1: 8-char nanoid, alphabet excludes 0/O/1/I
 * (avoids visual confusion). Uppercase Crockford-style base32.
 * Single active code per group; regen invalidates old immediately;
 * close sets invite_enabled=false + code nulled.
 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const nanoid8 = customAlphabet(ALPHABET, 8);

export function generateInviteCode(): string {
  return nanoid8();
}

export function isValidInviteCode(code: string): boolean {
  if (typeof code !== "string" || code.trim().length !== 8) return false;
  return /^[2-9A-HJ-NP-Z]{8}$/i.test(code.trim());
}

