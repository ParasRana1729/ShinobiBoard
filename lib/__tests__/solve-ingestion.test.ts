import { describe, expect, it } from "vitest";
import {
  SolveIngestor,
  InMemoryStorageAdapter,
  FixtureLeetCodeAdapter,
} from "../server/solve-ingestion";
import { LeetCodeError } from "../leetcode";
import type { Profile } from "../types";

function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    auth_user_id: "user-1",
    lc_username: "ninja_solver",
    display_name: "Kakashi",
    avatar_url: null,
    xp: 0,
    base_rank: "Academy",
    streak: 0,
    streak_last_date: null,
    weekly_count: 0,
    weekly_hards: 0,
    week_start: "2026-09-07",
    last_sync_at: null,
    sync_status: "stale",
    frozen_reason: null,
    retry_at: null,
    sync_cursor_ts: 0,
    sync_cursor_id: "",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("SolveIngestor (Deep Ingestion Module)", () => {
  it("ingests first-ever solve: updates streak, accrues base XP, advances cursor, sets status live", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    storage.profiles.set("user-1", createMockProfile());
    upstream.difficulties.set("two-sum", { title: "Two Sum", difficulty: "Easy" });

    // Solve at 2026-09-09T10:00:00Z (Wednesday)
    const solveTs = Math.floor(Date.parse("2026-09-09T10:00:00Z") / 1000);
    upstream.recentSolves = [
      {
        submissionId: "sub-100",
        title: "Two Sum",
        slug: "two-sum",
        timestampSec: solveTs,
        lang: "typescript",
      },
    ];

    const result = await ingestor.ingestUserSolves("user-1", {
      now: new Date("2026-09-09T12:00:00Z"),
    });

    expect(result.status).toBe("ok");
    expect(result.counted).toBe(1);
    expect(result.xp_gained).toBe(5); // Easy first-ever = 5 XP

    const updated = await storage.getProfile("user-1");
    expect(updated?.xp).toBe(5);
    expect(updated?.streak).toBe(1);
    expect(updated?.streak_last_date).toBe("2026-09-09");
    expect(updated?.weekly_count).toBe(1);
    expect(updated?.sync_status).toBe("live");
    expect(updated?.sync_cursor_ts).toBe(solveTs);
    expect(updated?.sync_cursor_id).toBe("sub-100");

    // Verify solve was persisted
    expect(storage.solves).toHaveLength(1);
    expect(storage.solves[0].slug).toBe("two-sum");
    expect(storage.solves[0].diff).toBe("Easy");
  });

  it("intra-week deduplication: resubmitting same slug in same week yields 0 XP and no count increment", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    const solve1Ts = Math.floor(Date.parse("2026-09-09T10:00:00Z") / 1000);
    const solve2Ts = Math.floor(Date.parse("2026-09-10T11:00:00Z") / 1000);

    storage.profiles.set("user-1", createMockProfile());
    upstream.difficulties.set("two-sum", { title: "Two Sum", difficulty: "Easy" });

    upstream.recentSolves = [
      {
        submissionId: "sub-1",
        title: "Two Sum",
        slug: "two-sum",
        timestampSec: solve1Ts,
        lang: "typescript",
      },
    ];

    // Ingest first solve
    await ingestor.ingestUserSolves("user-1", { now: new Date("2026-09-09T12:00:00Z") });

    // Second submission of the same slug on the next day
    upstream.recentSolves = [
      {
        submissionId: "sub-2",
        title: "Two Sum",
        slug: "two-sum",
        timestampSec: solve2Ts,
        lang: "python",
      },
    ];

    const result2 = await ingestor.ingestUserSolves("user-1", {
      now: new Date("2026-09-10T12:00:00Z"),
    });

    expect(result2.counted).toBe(0);
    expect(result2.xp_gained).toBe(0);

    const profile = await storage.getProfile("user-1");
    expect(profile?.weekly_count).toBe(1);
    expect(profile?.xp).toBe(5);
    // Streak still advances because user was active on consecutive day
    expect(profile?.streak).toBe(2);
    expect(profile?.sync_cursor_ts).toBe(solve2Ts);
  });

  it("cross-week repeat: earns spaced-repetition practice XP plus streak bonus", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    // Profile already completed Medium problem in earlier week ("2026-08-31")
    storage.solves.push({
      submission_id: "old-sub",
      user_id: "user-1",
      slug: "coin-change",
      diff: "Medium",
      lang: "typescript",
      title: "Coin Change",
      solved_at: "2026-09-02T10:00:00Z",
      week_start: "2026-08-31",
    });

    // Current week is 2026-09-07. Active streak = 5 (streak 3-6 gives +2 bonus)
    storage.profiles.set(
      "user-1",
      createMockProfile({
        xp: 100,
        streak: 5,
        streak_last_date: "2026-09-08",
        week_start: "2026-09-07",
        sync_cursor_ts: Math.floor(Date.parse("2026-09-08T10:00:00Z") / 1000),
      })
    );

    upstream.difficulties.set("coin-change", { title: "Coin Change", difficulty: "Medium" });

    const newSolveTs = Math.floor(Date.parse("2026-09-09T10:00:00Z") / 1000);
    upstream.recentSolves = [
      {
        submissionId: "new-sub",
        title: "Coin Change",
        slug: "coin-change",
        timestampSec: newSolveTs,
        lang: "typescript",
      },
    ];

    const result = await ingestor.ingestUserSolves("user-1", {
      now: new Date("2026-09-09T12:00:00Z"),
    });

    // Repeat Medium: 4 practice XP + 2 streak bonus (streak 6 at solve) = 6 XP
    expect(result.counted).toBe(1);
    expect(result.xp_gained).toBe(6);

    const profile = await storage.getProfile("user-1");
    expect(profile?.xp).toBe(106);
    expect(profile?.weekly_count).toBe(1);
    expect(profile?.streak).toBe(6);
  });

  it("rate-limited response from upstream sets rate_limited status with backoff and NEVER freezes", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    storage.profiles.set("user-1", createMockProfile({ sync_status: "live" }));
    upstream.errorToThrow = new LeetCodeError("rate_limited", "LeetCode HTTP 429", 300);

    const result = await ingestor.ingestUserSolves("user-1");

    expect(result.status).toBe("rate_limited");
    const profile = await storage.getProfile("user-1");
    expect(profile?.sync_status).toBe("rate_limited");
    expect(profile?.frozen_reason).toBeNull();
    expect(profile?.retry_at).not.toBeNull();
  });

  it("not found / private response from upstream freezes profile with reason", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    storage.profiles.set("user-1", createMockProfile({ sync_status: "live" }));
    upstream.errorToThrow = new LeetCodeError("private", "Profile is private");

    const result = await ingestor.ingestUserSolves("user-1");

    expect(result.status).toBe("frozen");
    const profile = await storage.getProfile("user-1");
    expect(profile?.sync_status).toBe("frozen");
    expect(profile?.frozen_reason).toBe("private");
    expect(profile?.retry_at).toBeNull();
  });

  it("empty batch with broken streak decays streak to 0 and marks status live", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    // Last solve was 3 days ago
    storage.profiles.set(
      "user-1",
      createMockProfile({
        streak: 10,
        streak_last_date: "2026-09-05",
        sync_status: "stale",
      })
    );
    upstream.recentSolves = []; // no new solves

    const result = await ingestor.ingestUserSolves("user-1", {
      now: new Date("2026-09-09T12:00:00Z"),
    });

    expect(result.status).toBe("ok");
    const profile = await storage.getProfile("user-1");
    expect(profile?.streak).toBe(0);
    expect(profile?.sync_status).toBe("live");
  });

  it("detects and emits event for Shinobi Daily Bounty claim", async () => {
    const storage = new InMemoryStorageAdapter();
    const upstream = new FixtureLeetCodeAdapter();
    const ingestor = new SolveIngestor(storage, upstream);

    storage.profiles.set("user-1", createMockProfile());
    storage.groups.push({ groupId: "group-leaf", name: "Leaf Shinobi", goal: 5 });

    const todayStr = "2026-09-09";
    const solveTs = Math.floor(Date.parse(`${todayStr}T08:00:00Z`) / 1000);

    upstream.dailyBounty = {
      date: todayStr,
      question: {
        titleSlug: "trapping-rain-water",
        title: "Trapping Rain Water",
        difficulty: "Hard",
      },
    };
    upstream.difficulties.set("trapping-rain-water", {
      title: "Trapping Rain Water",
      difficulty: "Hard",
    });

    upstream.recentSolves = [
      {
        submissionId: "bounty-sub",
        title: "Trapping Rain Water",
        slug: "trapping-rain-water",
        timestampSec: solveTs,
        lang: "rust",
      },
    ];

    await ingestor.ingestUserSolves("user-1", {
      now: new Date(`${todayStr}T10:00:00Z`),
    });

    const bountyEvent = storage.events.find(
      (e) => (e.payload as any)?.bounty === true
    );
    expect(bountyEvent).toBeDefined();
    expect(bountyEvent?.text).toContain("Trapping Rain Water");
  });
});
