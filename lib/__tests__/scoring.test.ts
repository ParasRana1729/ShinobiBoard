import { describe, expect, it } from "vitest";
import { weekStartUTC, nextStreak, diffDaysUTC } from "../week";
import { baseRankForXp, xpToNext, scoreCountedSolve, getRankProgress, getRankMeta } from "../ranks";
import { orderLeaderboard, pickHokage, pickItachi, pickRockLee } from "../scoring";
import { backoffMs, syncHealth, partitionCounted, isNewerThanCursor } from "../sync";
import { generateInviteCode, isValidInviteCode } from "../invite";
import type { BoardRow } from "../types";

describe("week", () => {
  it("week starts Monday UTC", () => {
    // 2026-09-09 is a Wednesday → Monday 2026-09-07
    expect(weekStartUTC("2026-09-09T12:00:00Z")).toBe("2026-09-07");
    expect(weekStartUTC("2026-09-07T00:00:00Z")).toBe("2026-09-07");
    expect(weekStartUTC("2026-09-13T23:59:59Z")).toBe("2026-09-07"); // Sunday
    expect(weekStartUTC("2026-09-14T00:00:00Z")).toBe("2026-09-14"); // next Monday
  });
  it("streak advances only on consecutive UTC days", () => {
    expect(nextStreak(3, "2026-09-08", "2026-09-08").streak).toBe(3);
    expect(nextStreak(3, "2026-09-08", "2026-09-09").streak).toBe(4);
    expect(nextStreak(5, "2026-09-07", "2026-09-09").streak).toBe(1);
    expect(nextStreak(0, null, "2026-09-09").streak).toBe(1);
  });
  it("diffDaysUTC", () => {
    expect(diffDaysUTC("2026-09-08", "2026-09-09")).toBe(1);
  });
});

describe("ranks + xp", () => {
  it("ladder never drops, thresholds per spec", () => {
    expect(baseRankForXp(0)).toBe("Academy");
    expect(baseRankForXp(149)).toBe("Academy");
    expect(baseRankForXp(150)).toBe("Genin");
    expect(baseRankForXp(600)).toBe("Chunin");
    expect(baseRankForXp(1500)).toBe("Jonin");
    expect(baseRankForXp(3000)).toBe("ANBU");
    expect(baseRankForXp(5250)).toBe("Kage");
    expect(baseRankForXp(99999)).toBe("Kage");
  });
  it("xpToNext", () => {
    expect(xpToNext(0)).toEqual({ next: "Genin", needed: 150 });
    expect(xpToNext(5250)).toEqual({ next: null, needed: 0 });
  });
  it("first-ever + streak bonus; re-submits score 0 (caller skips)", () => {
    // Medium first-ever on streak 5 → 17 XP
    expect(scoreCountedSolve({ difficulty: "Medium", isFirstEver: true, streakAtSolve: 5 })).toBe(17);
    // Same medium next week (repeat) on streak 5 → +1 weekly, +2 XP
    expect(scoreCountedSolve({ difficulty: "Medium", isFirstEver: false, streakAtSolve: 5 })).toBe(2);
    // No streak bonus below 3
    expect(scoreCountedSolve({ difficulty: "Hard", isFirstEver: true, streakAtSolve: 2 })).toBe(40);
    expect(scoreCountedSolve({ difficulty: "Easy", isFirstEver: false, streakAtSolve: 0 })).toBe(0);
  });
  it("getRankProgress calculates exact tier progress and gamer level", () => {
    const p0 = getRankProgress(0);
    expect(p0.currentRank).toBe("Academy");
    expect(p0.percentage).toBe(0);
    expect(p0.needed).toBe(150);
    expect(p0.level).toBe(1);

    const pMidAcademy = getRankProgress(75);
    expect(pMidAcademy.currentRank).toBe("Academy");
    expect(pMidAcademy.percentage).toBe(50);
    expect(pMidAcademy.needed).toBe(75);

    const pGenin = getRankProgress(375); // 150 + 225 out of 450
    expect(pGenin.currentRank).toBe("Genin");
    expect(pGenin.percentage).toBe(50);
    expect(pGenin.needed).toBe(225);
    expect(pGenin.level).toBe(4);

    const pKage = getRankProgress(6000);
    expect(pKage.currentRank).toBe("Kage");
    expect(pKage.isMaxRank).toBe(true);
    expect(pKage.percentage).toBe(100);
    expect(pKage.needed).toBe(0);
    expect(pKage.nextRank).toBeNull();
  });
  it("getRankMeta associates authentic anime character lore", () => {
    expect(getRankMeta("Academy").character).toBe("Naruto Uzumaki");
    expect(getRankMeta("Genin").character).toBe("Sasuke Uchiha");
    expect(getRankMeta("Chunin").character).toBe("Shikamaru Nara");
    expect(getRankMeta("Jonin").character).toBe("Kakashi Hatake");
    expect(getRankMeta("ANBU").character).toBe("Itachi Uchiha");
    expect(getRankMeta("Kage").character).toBe("Minato Namikaze");
  });
});

function row(over: Partial<BoardRow> & { user_id: string }): BoardRow {
  return {
    display_name: over.user_id, avatar_url: null, lc_username: over.user_id,
    xp: 0, base_rank: "Academy", streak: 0, weekly_count: 0, weekly_hards: 0,
    last_solved_at: null, last_solved_slug: null, last_solved_diff: null,
    sync_status: "live", frozen_reason: null, last_sync_at: null, retry_at: null,
    pinned: false, group_rank: 0, titles: [], ...over,
  };
}

describe("leaderboard order", () => {
  it("weekly → hards → xp → streak → earlier solve; frozen sinks", () => {
    const rows = [
      row({ user_id: "b", weekly_count: 5, weekly_hards: 1, xp: 100 }),
      row({ user_id: "a", weekly_count: 7, xp: 10 }),
      row({ user_id: "c", weekly_count: 7, weekly_hards: 2, xp: 5 }),
      row({ user_id: "f", weekly_count: 99, sync_status: "frozen", xp: 9999 }),
    ];
    const ordered = orderLeaderboard(rows).map((r) => r.user_id);
    expect(ordered).toEqual(["c", "a", "b", "f"]);
  });
  it("pinned floats to top", () => {
    const rows = [row({ user_id: "a", weekly_count: 9 }), row({ user_id: "b", weekly_count: 1, pinned: true })];
    expect(orderLeaderboard(rows)[0].user_id).toBe("b");
  });
});

describe("titles", () => {
  const base = { prev_weekly_count: 3, last_solved_at: null, goal: 7 };
  it("hokage requires goal + non-frozen", () => {
    expect(pickHokage([{ user_id: "a", weekly_count: 9, weekly_hards: 0, xp: 0, streak: 1, sync_status: "live", ...base }])?.user_id).toBe("a");
    expect(pickHokage([{ user_id: "a", weekly_count: 6, weekly_hards: 0, xp: 0, streak: 1, sync_status: "live", ...base }])).toBeNull();
    expect(pickHokage([{ user_id: "a", weekly_count: 9, weekly_hards: 0, xp: 0, streak: 1, sync_status: "frozen", ...base }])).toBeNull();
  });
  it("itachi tie-break: hards → weekly → xp → streak", () => {
    const cands = [
      { user_id: "a", weekly_count: 5, weekly_hards: 3, xp: 10, streak: 1, sync_status: "live", ...base },
      { user_id: "b", weekly_count: 8, weekly_hards: 3, xp: 5, streak: 1, sync_status: "live", ...base },
    ];
    expect(pickItachi(cands)?.user_id).toBe("b");
  });
  it("rock lee qualifier: prev 0 + current ≥15; vacant otherwise", () => {
    expect(pickRockLee([{ user_id: "a", weekly_count: 14, weekly_hards: 0, xp: 0, streak: 1, sync_status: "live", prev_weekly_count: 0, last_solved_at: null, goal: 7 }])).toBeNull();
    expect(pickRockLee([{ user_id: "a", weekly_count: 16, weekly_hards: 0, xp: 0, streak: 1, sync_status: "live", prev_weekly_count: 1, last_solved_at: null, goal: 7 }])).toBeNull();
    expect(pickRockLee([{ user_id: "a", weekly_count: 16, weekly_hards: 1, xp: 0, streak: 2, sync_status: "live", prev_weekly_count: 0, last_solved_at: null, goal: 7 }])?.user_id).toBe("a");
  });
});

describe("sync policy", () => {
  const now = Date.parse("2026-09-09T12:00:00Z");
  it("live <24h, stale 24–48h, frozen >48h", () => {
    expect(syncHealth({ lastSyncAtMs: now - 12 * 3.6e6, nowMs: now }).status).toBe("live");
    expect(syncHealth({ lastSyncAtMs: now - 26 * 3.6e6, nowMs: now }).status).toBe("stale");
    expect(syncHealth({ lastSyncAtMs: now - 52 * 3.6e6, nowMs: now }).status).toBe("frozen");
  });
  it("auth error freezes; rate_limit never freezes", () => {
    expect(syncHealth({ lastSyncAtMs: now, nowMs: now, authError: true }).status).toBe("frozen");
    expect(syncHealth({ lastSyncAtMs: now - 100 * 3.6e6, nowMs: now, prevStatus: "rate_limited" }).status).toBe("rate_limited");
  });
  it("backoff 5m → 30m → 2h", () => {
    expect(backoffMs(0)).toBe(5 * 60_000);
    expect(backoffMs(1)).toBe(30 * 60_000);
    expect(backoffMs(5)).toBe(2 * 3_600_000);
  });
  it("distinct slug per week dedupes re-submits", () => {
    const subs = [{ slug: "two-sum" }, { slug: "two-sum" }, { slug: "trap" }];
    const { counted, duplicates } = partitionCounted(subs, new Set(["trap"]));
    expect(counted.map((c) => c.slug)).toEqual(["two-sum"]);
    expect(duplicates.map((c) => c.slug)).toEqual(["two-sum", "trap"]);
  });
  it("cursor compares (ts, id)", () => {
    expect(isNewerThanCursor(100, "b", 99, "z")).toBe(true);
    expect(isNewerThanCursor(99, "z", 100, "a")).toBe(false);
    expect(isNewerThanCursor(100, "b", 100, "a")).toBe(true);
  });
});

describe("invite codes", () => {
  it("8 chars, no 0/O/1/I", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateInviteCode();
      expect(c).toHaveLength(8);
      expect(isValidInviteCode(c)).toBe(true);
      expect(/[0O1I]/.test(c)).toBe(false);
    }
    expect(isValidInviteCode("bad!")).toBe(false);
  });
});
