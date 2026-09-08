# PROD SPEC SHEET — LeetCode Board v1.1 — FINAL

> Changelog from v1: fixes username squatting, farming, difficulty lookup, poll loss, 429-freeze, title ties, 500-card scale, order/sort conflict, frozen ranking, orphaned groups. Weekly default 20 → 7 (configurable). Nudge push deferred to v2.

## 1. Overview
**Name:** LeetCode Board (aka ShinobiBoard)
**One-liner:** LeetCode progress dashboard with friend groups, Trello-style people-cards.
**Problem:** Solo grind dies after week 1. LeetCode profile + Discord + sheets give zero shared accountability.
**Goal:** Make users open daily to protect streak, rank, and squad standing.
**Non-goals v1:** No code editor, no chat, no coaching, no manual solves, no bets, no push notifications (in-app + feed only).

## 2. Target Users
- College / interview-prep grinders (2-100 friend circles)
- Public prep clubs (topic-based, capped v1)
- Competitive pairs (1:1 rivals)

## 3. Groups — all three in v1, same card system
1. **Private Squad:** invite-code only, **3-15 members**, hidden from discover.
2. **Public Club:** discover + instant join, e.g. `blind-75-fall-26`. **Cap 150 members**, waitlist beyond. Owner can close/regenerate code.
3. **1:1 Duel:** exactly 2 users, daily W/L/D, either side can end. Shows head-to-head + solve diff.

Membership: user can join multiple groups. `weekly_count` is global per user; leaderboard order / titles / goal progress are computed per group.

### 3.1 Invite codes & links
- Squad/Club code: 8-char nanoid (no `0/O/1/I`), single active code per group. Regen invalidates old immediately. Close sets `invite_enabled=false`, code nulled, join blocked.
- Duel invite: signed JWT token, single-use, 7-day expiry. Guards: no self-duel, max 1 active duel per pair (re-use existing instead of creating duplicate).

## 4. Board UX — people as cards
Layout: Trello-like horizontal board, cards = people. Mobile <768px: vertical stack.

**Card front (always visible):** avatar, display name, base rank emblem, group rank #N, weekly `X/Goal` progress bar (Goal = this group's goal), streak flame + N, last solved `Slug · difficulty · xh ago`. Frozen cards dimmed + badge.

**Expanded (click):** recent 5 counted solves (title, difficulty pill, lang, solved_at), 7-day activity dots (UTC days), all-time Easy/Med/Hard split + total (first-ever distinct slugs), base rank + XP to next, active limited title + expiry countdown, duel record in this group W/L/D (duels only), sync health `Live · 12m ago` / `Stale 26h` / `Frozen 52h · reason`.

**Views (resolves order/sort conflict):**
- `Leaderboard` (default): server order = weekly counted solves desc → weekly hards desc → XP desc → streak desc → earlier last solve. Sort dropdown re-orders by: weekly / streak / XP / base rank.
- `Custom` (toggle): drag to reorder — personal view only, stored per-membership as `personal_order`. Drag disabled in Leaderboard view.
- Pin up to 2 cards per membership per group. Pinned float to top in both views with pin icon.
- Filter: stale-only, frozen, title holders. Search by display name / lc_username (required for clubs >50).
- Scale rule: board renders pinned + Top 50 by current sort + search results. Full roster via paginated list (`?page=`), 50/page. Horizontal scroll virtualized.

**Interactions:** Nudge button (`Nudge`, 1/day per friend per group, in-app only v1 — creates feed event + inbox item, no push).

## 5. Ranking — Naruto system (reskinnable)
IP note: working titles, reskin to original names pre-launch.

**Counted solve (anti-farm):** ingestion dedupes on `submissionId`, but scoring counts **distinct `slug` per UTC week**. Re-submitting same problem same week = 0 extra. Re-solving across different weeks = +1 weekly (practice credit) but no base XP (below).

**XP (first-ever only + streak bonus):**
- Easy 5 / Medium 15 / Hard 40 — awarded only on **first-ever AC of slug per user**.
- +2 per counted weekly solve while streak >= 3 at solve time (applies even to cross-week repeats).
- Re-submits same week: 0 XP, 0 weekly.
- Example: Medium first-ever on streak 5 → 17 XP. Same Medium re-solved next week on streak 5 → +1 weekly, +2 XP.

**Base ladder (permanent, global, never drops):**
Academy 0 / Genin 150 / Chunin 600 / Jonin 1500 / ANBU 3000 / Kage 5250.
Kage ≈ 350 first-ever mediums, ≈131 hards, ≈1050 easies (streak bonus lowers this ~10%).

**Streak:** consecutive UTC calendar days with ≥1 counted solve. Break → 0. No grace days v1. Frozen days do not extend streak.

**Limited titles (timed, scarce, per-group, 1 holder max):**
- Weekly #1 → `Hokage · 7 days` (requires meeting group goal, non-frozen, tie-break §4 Leaderboard order).
- Most hards in week (counted hard solves) → `Itachi · 3 days`. Tie → higher weekly total → XP → streak.
- Best comeback → `Rock Lee · 3 days`. Qualifier: previous UTC week 0 counted AND current week ≥15 counted. Winner = largest delta; tie → same tie-break. If no qualifier, title vacant that week (no award).
- Grant: Monday 00:05 UTC cron after reset. Expire automatically (7d/3d). Enforced by partial unique index `(group_id, title) WHERE expires_at > now()`. Shown as gold badge on card.

## 6. Weekly Goal (configurable)
- Global default **7 solves/week** (was 20). Per-group override 1–50, owner-set, default inherits global.
- Week = Mon 00:00:00 UTC → Sun 23:59:59 UTC.
- Card bar = `weekly_count / group_goal` (per-group goal, since user may be in groups with different goals).
- Hokage eligibility requires `weekly_count >= group_goal` + non-frozen.
- "Miss = rank drop" means group `#N` drops naturally; base rank never drops.

## 7. LeetCode Sync — strict only + verified
No manual add/edit. Only synced counted solves count.

### 7.1 Onboarding + anti-squat verification
1. Enter `leetcode_username` → server queries `matchedUser { username, submitStats { acSubmissionNum { difficulty count } }, profile { aboutMe } }`.
2. Fail if not found → `Not found — check spelling`.
3. Fail if `submitStats` null / private → `Set profile Public`.
4. Fail if username linked to another auth user → `Claimed — ask owner to unlink or dispute`.
5. Else issue code `SB-XXXXXX` (30-min TTL). User pastes code into LeetCode Profile About, clicks Verify. Server re-fetches `aboutMe` contains code → link `auth_user ↔ lc_username`. User may remove code after.
6. Unlink/relink allowed (releases username immediately, keeps solve history tied to auth user; new username starts fresh cursor, 7-day backfill only).

### 7.2 Poll
- Server queue every 60 min: profiles with `last_sync_at > 60min ago` (jitter ±10 min), batch 20, concurrency 5. Vercel Cron triggers API route / Edge Function worker (not one-shot for all users).
- Manual Refresh button: cooldown 10 min **per target profile** (shared), plus 10/hour per viewer anti-abuse. Any member may refresh any card.
- Queries: `matchedUser { submitStats }` + `recentAcSubmissionList(username, limit:50)` + lazy `question(titleSlug:) { difficulty }` for unknown slugs. Paginate while newest page still newer than stored cursor (up to 3 pages; frozen backfill limit 100).
- Ingest: upsert `solves` on `submission_id`. `solved_at` = LeetCode `timestamp` (sec, UTC-normalized). Cursor = max(`solved_at`, `submission_id`).
- `problem_meta(slug, title, difficulty)` cache, 30-day refresh.

### 7.3 Stale policy + errors
- `<24h` since successful sync = Live. `24–48h` = Stale (badge, still ranked). `>48h` OR auth error (not-found/private/claimed) = Frozen (dimmed to bottom, excluded from weekly win + titles until resync, still visible).
- `403/429` rate-limit = **not frozen**. Status stays Live with `retry_at`, exponential backoff (5m → 30m → 2h), logged in `sync_logs`. Inline message `LeetCode busy — retry in X`.
- Inline guides: `Fix username / Set profile Public / Retry in X / Re-verify`.

## 8. Accountability Loop
- Monday 00:05 UTC: reset `weekly_count`, grant titles, post weekly winner event.
- Feed per group (`events`): `overtook`, `rank_up`, `hokage`, `title_awarded`, `weekly_winner`, `nudge`, `frozen`, `comeback`. Retention 30 days, cap 200/group (prune oldest). Realtime via Supabase channel per `group_id`.
- Nudge: 1/day per (from, to, group). No punishment beyond freeze/group-rank drop.

## 9. Moderation / Roles / Leave
Owner-only v1 (no co-mods): kick, regen code, rename, close group, delete club, set goal. Public: anyone join (until cap), owner kicks. Private: code required. Duel: create by link, either side ends (history retained, rematch creates new duel row).
- Leave allowed for all. Owner leaving transfers to oldest member; last member leaving deletes squad/club; duel ending archives it.
- Delete account: releases `lc_username`, transfers owned groups or deletes if empty, anonymizes display name in past events.

## 10. Data Model (reference + constraints)
```
profiles(auth_user_id PK, lc_username UNIQUE, display_name, avatar_url,
  xp INT DEFAULT 0, base_rank TEXT, streak INT DEFAULT 0, streak_last_date DATE,
  weekly_count INT DEFAULT 0, week_start DATE, last_sync_at TIMESTAMPTZ,
  sync_status TEXT (live|stale|frozen|rate_limited), frozen_reason TEXT,
  sync_cursor_ts BIGINT, sync_cursor_id TEXT, created_at TIMESTAMPTZ)
groups(id PK, type TEXT (squad|club|duel), name TEXT, code TEXT UNIQUE NULL,
  invite_enabled BOOL DEFAULT true, goal INT DEFAULT 7, owner_id FK, member_count INT, created_at TIMESTAMPTZ)
memberships(user_id FK, group_id FK, role TEXT (owner|member), personal_order FLOAT,
  pinned BOOL DEFAULT false, pinned_at TIMESTAMPTZ, joined_at TIMESTAMPTZ, PK(user_id, group_id),
  CHECK (pinned count ≤2 enforced via trigger))
solves(submission_id TEXT PK, user_id FK, slug TEXT, diff TEXT, lang TEXT, solved_at TIMESTAMPTZ,
  week_start DATE, INDEX(user_id, solved_at), INDEX(user_id, slug))
problem_meta(slug PK, title TEXT, difficulty TEXT, updated_at TIMESTAMPTZ)
titles(id PK, user_id FK, group_id FK, title TEXT (hokage|itachi|rock_lee),
  granted_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
  UNIQUE(group_id, title) WHERE expires_at > now())
events(id PK, group_id FK, type TEXT, actor_id FK NULL, payload JSONB, text TEXT, created_at TIMESTAMPTZ,
  INDEX(group_id, created_at))
nudges(id PK, from_user FK, to_user FK, group_id FK, day DATE, created_at TIMESTAMPTZ,
  UNIQUE(from_user, to_user, group_id, day))
sync_logs(id PK, user_id FK, started_at TIMESTAMPTZ, status TEXT, error TEXT, fetched INT)
```
Scoring constraints: weekly uniqueness `(user_id, slug, week_start)` for counted solves (materialized via query `COUNT DISTINCT slug per week`); XP first-ever via `NOT EXISTS prior slug for user`.

## 11. Tech Constraint (locked)
Next.js + Supabase (Postgres/Auth/Realtime) + Vercel Cron → queue worker (API route / Edge Function, batch 20, concurrency 5). Auth: Google only v1. Realtime: one channel per group (`group:<id>`), board + feed only (no presence v1).

## 12. Metrics / Launch Gate
- Activation: 60% signups complete verified first sync within 24h.
- Retention: 40% squads with 3+ active (active = ≥1 counted solve in week) in week 4.
- Goal hit-rate: % users meeting their group goal. If <10% hit 7 for 2 consecutive weeks, drop default to 5 via config. If >60%, consider raising default to 10.
- Sync health SLO: p95 poll lag <90 min, rate-limit freeze = 0.

## 13. v2 (explicitly out)
Push (FCM/OneSignal), co-mods, per-user custom goals, grace-day / streak freeze item, bets, chat, code editor, coaching, public API.
