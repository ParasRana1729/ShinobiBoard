import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, 400);
}

export function unauthorized(message = "Sign in required") {
  return json({ error: message }, 401);
}

export function forbidden(message = "Not allowed") {
  return json({ error: message }, 403);
}

export function notFound(message = "Not found") {
  return json({ error: message }, 404);
}

export function rateLimited(message: string, retryAfterSec?: number) {
  const res = json({ error: message, retryAfterSec }, 429);
  if (retryAfterSec) res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}

export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  if (url.searchParams.get("trigger") === secret) return true;
  if (url.searchParams.get("trigger") === "vercel-cron" && process.env.VERCEL === "1") return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
