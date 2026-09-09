/**
 * Minimal LeetCode GraphQL client (spec §7.2).
 * Queries: matchedUser { submitStats } + recentAcSubmissionList(limit:50) +
 * lazy question(titleSlug:) { difficulty } for unknown slugs.
 */
import type { Difficulty } from "./types";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

export type LeetCodeErrorKind =
  | "not_found"
  | "private"
  | "rate_limited"
  | "network"
  | "unknown";

export class LeetCodeError extends Error {
  kind: LeetCodeErrorKind;
  retryAfterSec?: number;
  constructor(kind: LeetCodeErrorKind, message: string, retryAfterSec?: number) {
    super(message);
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
  }
}

async function gql<T>(body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "ShinobiBoard/1.1 (weekly accountability board)",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new LeetCodeError("network", `LeetCode unreachable: ${(e as Error).message}`);
  }
  if (res.status === 403 || res.status === 429) {
    const ra = Number(res.headers.get("retry-after") ?? 0) || undefined;
    throw new LeetCodeError("rate_limited", `LeetCode busy (${res.status}) — retry shortly`, ra);
  }
  if (!res.ok) throw new LeetCodeError("unknown", `LeetCode HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new LeetCodeError("unknown", json.errors[0].message);
  if (!json.data) throw new LeetCodeError("unknown", "Empty LeetCode response");
  return json.data;
}

export interface MatchedUser {
  username: string;
  aboutMe: string | null;
  acByDifficulty: { difficulty: string; count: number }[];
}

/** Step 1–3 of onboarding verify (§7.1): existence + public stats + aboutMe. */
export async function fetchMatchedUser(username: string): Promise<MatchedUser> {
  const data = await gql<{
    matchedUser: null | {
      username: string;
      submitStats: null | { acSubmissionNum: { difficulty: string; count: number }[] };
      profile: null | { aboutMe: string | null };
    };
  }>({
    operationName: "getUserProfile",
    query: `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats { acSubmissionNum { difficulty count } }
          profile { aboutMe }
        }
      }`,
    variables: { username },
  });
  if (!data.matchedUser) throw new LeetCodeError("not_found", "Not found — check spelling");
  if (!data.matchedUser.submitStats)
    throw new LeetCodeError("private", "Set profile Public");
  return {
    username: data.matchedUser.username,
    aboutMe: data.matchedUser.profile?.aboutMe ?? null,
    acByDifficulty: data.matchedUser.submitStats.acSubmissionNum,
  };
}

export interface RecentAc {
  submissionId: string;
  title: string;
  slug: string;
  timestampSec: number;
  lang: string;
}

/** recentAcSubmissionList(username, limit:50). Paginate while newest page still newer than cursor (≤3 pages). */
export async function fetchRecentAc(
  username: string,
  limit = 50
): Promise<RecentAc[]> {
  const data = await gql<{
    recentAcSubmissionList: { id: string; title: string; titleSlug: string; timestamp: string; lang: string }[];
  }>({
    operationName: "recentAcSubmissions",
    query: `
      query recentAcSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id title titleSlug timestamp lang
        }
      }`,
    variables: { username, limit },
  });
  return (data.recentAcSubmissionList ?? []).map((s) => ({
    submissionId: String(s.id),
    title: s.title,
    slug: s.titleSlug,
    timestampSec: Number(s.timestamp),
    lang: s.lang || "unknown",
  }));
}

export async function fetchQuestionDifficulty(slug: string): Promise<{
  title: string;
  difficulty: Difficulty;
}> {
  const data = await gql<{
    question: null | { title: string; difficulty: string };
  }>({
    operationName: "questionData",
    query: `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) { title difficulty }
      }`,
    variables: { titleSlug: slug },
  });
  if (!data.question) throw new LeetCodeError("not_found", `Unknown problem ${slug}`);
  const d = data.question.difficulty;
  if (d !== "Easy" && d !== "Medium" && d !== "Hard")
    throw new LeetCodeError("unknown", `Unexpected difficulty ${d}`);
  return { title: data.question.title, difficulty: d };
}

export function isRateLimited(e: unknown): boolean {
  return e instanceof LeetCodeError && e.kind === "rate_limited";
}
