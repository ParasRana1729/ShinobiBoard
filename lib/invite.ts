import { customAlphabet } from "nanoid";

/**
 * Squad/Club invite code §3.1: 8-char nanoid, alphabet excludes 0/O/1/I
 * (avoids visual confusion). Single active code per group; regen invalidates
 * old immediately; close sets invite_enabled=false + code nulled.
 */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const nanoid8 = customAlphabet(ALPHABET, 8);

export function generateInviteCode(): string {
  return nanoid8();
}

export function isValidInviteCode(code: string): boolean {
  return /^[2-9A-HJ-NP-Za-km-z]{8}$/.test(code);
}
