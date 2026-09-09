/** UTC week / streak helpers. Week = Mon 00:00:00 UTC → Sun 23:59:59 UTC (spec §6). */

export function toUTCDate(d: Date | string | number): Date {
  return new Date(d);
}

/** Monday (00:00 UTC) of the week containing `d`. Returns YYYY-MM-DD. */
export function weekStartUTC(d: Date | string | number = new Date()): string {
  const dt = toUTCDate(d);
  const day = dt.getUTCDay(); // 0 Sun … 6 Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate() - diffToMonday)
  );
  return monday.toISOString().slice(0, 10);
}

export function utcDayString(d: Date | string | number = new Date()): string {
  return toUTCDate(d).toISOString().slice(0, 10);
}

export function addDaysUTC(dayStr: string, n: number): string {
  const [y, m, d] = dayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function diffDaysUTC(a: string, b: string): number {
  const pa = Date.parse(a + "T00:00:00Z");
  const pb = Date.parse(b + "T00:00:00Z");
  return Math.round((pb - pa) / 86_400_000);
}

/**
 * Next streak state given a counted solve landing on `solveDay` (UTC day).
 * - same day as streak_last_date → unchanged (already counted today)
 * - exactly next day → streak + 1
 * - gap → reset to 1 (new streak starts today)
 * - first solve ever → 1
 */
export function nextStreak(
  prevStreak: number,
  streakLastDate: string | null,
  solveDay: string
): { streak: number; streak_last_date: string } {
  if (!streakLastDate) return { streak: 1, streak_last_date: solveDay };
  if (streakLastDate === solveDay) return { streak: prevStreak, streak_last_date: solveDay };
  if (diffDaysUTC(streakLastDate, solveDay) === 1)
    return { streak: prevStreak + 1, streak_last_date: solveDay };
  return { streak: 1, streak_last_date: solveDay };
}

/** "xh ago" / "xd ago" label for card front last-solved line. */
export function timeAgo(iso: string | null, nowMs = Date.now()): string {
  if (!iso) return "never";
  const s = Math.max(1, Math.floor((nowMs - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** 7 UTC day strings ending today (for activity dots). */
export function last7UTCdays(now = new Date()): string[] {
  const today = utcDayString(now);
  return Array.from({ length: 7 }, (_, i) => addDaysUTC(today, i - 6));
}
