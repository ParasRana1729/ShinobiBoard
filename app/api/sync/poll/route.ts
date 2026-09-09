import { GET as cronSync } from "@/app/api/cron/sync/route";

/** Alias worker path — Vercel Cron may point here instead of /api/cron/sync. */
export const GET = cronSync;
