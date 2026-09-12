# AGENTS.md — ShinobiBoard Technical Manual

> **Product Specification**: `leetcode-board-spec.md` (Product behavior source of truth)  
> **Target Audience**: AI coding agents, autonomous subagents, and core engineers modifying this codebase.  
> **Stack (Locked, Spec §11)**: Next.js 14.2.35 App Router (TypeScript) + Supabase (Postgres, Auth, Realtime) + Vercel Cron. Auth provider: Google OAuth only.

---

## 1. Executive System Summary & Verified Health Benchmarks

ShinobiBoard is a high-density, competitive LeetCode group dashboard and rivalry arena built around weekly Mon–Sun UTC solve sprints, Naruto-themed progression tiers, deterministic tiebreakers, and real-time live activity feeds.

### 1.1 Verified Health Status (2026-09-12)

All metrics below represent genuine, reproducible verification benchmarks executed against the repository:

| Verification Stage | Command | Status | Details & Execution Metrics |
| :--- | :--- | :--- | :--- |
| **Type Safety** | `npm run typecheck` (`tsc --noEmit`) | **PASS (0 errors)** | Clean exit code 0. Full strict TypeScript compliance across all routes, components, and domain modules. |
| **Business Logic Unit Tests** | `npm test` (`vitest run`) | **PASS (19/19 passing)** | Clean exit code 0 across 6 test suites in `lib/__tests__/scoring.test.ts` (duration ~700ms). Corrects stale legacy docs claiming 17 tests. |
| **Production Build** | `npm run build` (`next build`) | **PASS (32 routes)** | Next.js 14.2.35 production bundle clean. 32 dynamic routes (`ƒ`): 6 page routes, 1 `_not-found`, 24 `/api/*` endpoints, 1 `/auth/callback`. Shared JS: 87.3 kB; Middleware: 86.2 kB. |

### 1.2 Known Build & Runtime Caveats

1. **Font Optimization Metric Warning**:
   - `⨯ Failed to find font override values for font 'Newsreader'`: Emitted by Next.js `next/font` during page optimization. Non-fatal fallback that does not impede build compilation or runtime rendering.
2. **ESLint Setup Prompt**:
   - `npm run lint` (`next lint`): Currently prompts interactively because no `.eslintrc*` file is committed. Running in non-interactive CI/CD fails with exit code 1 unless configured.
3. **Database Migration State**:
   - Migration files in `supabase/migrations/` (`0001_init.sql` and `0002_custom_orders.sql`) are syntactically and logically complete, but have not yet been applied to a live hosted Supabase Postgres instance. Run `supabase db push` to dev before launch.
4. **Vite Node API Deprecation**:
   - Vitest emits a deprecation notice for Vite's CJS Node API. Upstream tooling notice; unit tests execute cleanly in-memory.

---

## 2. Exhaustive Architectural Repo Map

```
ShinobiBoard/
├── app/                              # Next.js 14 App Router entrypoints
│   ├── layout.tsx                    # Root layout with SSR user profile fetch & Navbar
│   ├── loading.tsx                   # Global centered loading spinner with '忍' emblem
│   ├── page.tsx                      # Landing page (public teaser, rank ladder preview)
│   ├── login/page.tsx                # Google OAuth sign-in with callback redirection
│   ├── dashboard/                    # User dashboard (personal stats, group hubs)
│   │   ├── loading.tsx               # Dashboard skeleton loader
│   │   └── page.tsx                  # Dynamic SSR dashboard view
│   ├── discover/                     # Public club discovery directory
│   │   ├── loading.tsx               # Discover skeleton loader
│   │   └── page.tsx                  # Discover page (search filter, club capacity bars)
│   ├── duel/accept/page.tsx          # Duel invite landing page (JWT token validation)
│   ├── groups/[id]/                  # Group board & activity view
│   │   ├── loading.tsx               # Board skeleton loader
│   │   └── page.tsx                  # Dynamic SSR board view (RLS gate, Board, Feed)
│   ├── auth/callback/route.ts        # Supabase PKCE OAuth code exchange & profile bootstrap
│   └── api/                          # 24 discrete route handlers (see Route Manifest)
├── components/                       # React client and server UI components
│   ├── Board.tsx                     # Main leaderboard matrix, card renderers, drawer, drag reorder
│   ├── Feed.tsx                      # Realtime activity stream with isolated channels & polling fallback
│   ├── GroupForms.tsx                # Create squad/club form and join-by-code form
│   ├── GroupSettings.tsx             # Owner controls (rename, code regen, goal change, transfer, kick)
│   ├── JoinClubButton.tsx            # Club enrollment CTA with automated waitlist toggle at 150 cap
│   ├── VerifyLeetCode.tsx            # Fast-path link, dispute challenge, and unlinking dialogs
│   ├── RankAvatar.tsx                # Dynamic character avatar renderer with tier borders & levels
│   ├── RankProgressCard.tsx          # Dashboard XP meter, level calculator, and scoring rules modal
│   ├── Navbar.tsx                    # Top navigation bar, streak counter, XP badge, sign-out handler
│   └── BoardSkeleton.tsx             # Geometry-accurate card loading skeleton
├── lib/                              # Pure, environment-free domain logic & shared contracts
│   ├── week.ts                       # Mon–Sun UTC week windows, streak calculations, date diffs
│   ├── ranks.ts                      # 6-tier ladder, XP thresholds, character lore, tier progress
│   ├── scoring.ts                    # Leaderboard sorting, deterministic tiebreakers, title pickers
│   ├── sync.ts                       # Sync health state machine, backoff calculation, cursor checks
│   ├── invite.ts                     # 8-character collision-resistant group invite codes
│   ├── duel.ts                       # 7-day duel invite JWT token minting and signature verification
│   ├── leetcode.ts                   # LeetCode GraphQL client and typed error definitions
│   ├── auth.ts                       # Server component / route handler session identity extractors
│   ├── http.ts                       # Standard JSON response helpers and cron authorization guard
│   ├── types.ts                      # Domain TypeScript interfaces and database record typings
│   ├── constants.ts                  # System-wide operational constants, caps, and ladders
│   ├── __tests__/scoring.test.ts     # 19 Vitest unit tests covering domain rules
│   ├── server/                       # Impure server-only pipelines (Supabase + LeetCode I/O)
│   │   ├── sync-engine.ts            # Batch worker, hash-jitter scheduler, liveness pipeline
│   │   └── events.ts                 # Best-effort feed event writer with group-wide broadcasting
│   └── supabase/                     # Supabase client instantiation factories
│       ├── client.ts                 # Browser client (createBrowserClient from @supabase/ssr)
│       └── server.ts                 # Server SSR client (cookies) & Admin service role client
├── supabase/migrations/              # PostgreSQL schema migrations
│   ├── 0001_init.sql                 # Baseline schema (13 tables, triggers, RLS policies, indexes)
│   └── 0002_custom_orders.sql        # Custom viewer card ordering table and RLS policies
├── middleware.ts                     # Edge middleware: cookie session refreshes & login redirects
├── vercel.json                       # Vercel Cron schedule definitions
├── tailwind.config.ts                # Tailwind design system configuration (sumi, shinobi-gold)
├── vitest.config.ts                  # Vitest runner configuration
└── package.json                      # Project dependencies and script commands
```

### 2.1 Complete Route Handlers Manifest (25 Endpoints)

All API route handlers enforce strict input validation, uniform error responses via `lib/http.ts`, and authorization boundaries:

| Path | Method | Auth Guard | Validation / Parameters | Purpose | HTTP Status Codes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `/auth/callback` | `GET` | PKCE `code` | `code`, optional `next` | Exchanges OAuth code for session, boots profile | 302 (Redirect) |
| `/api/account` | `DELETE` | `getAuthUserId()` | None | GDPR account deletion, group cleanup, user wipe | 200, 401, 500 |
| `/api/cron/sync` | `GET` | `isCronAuthorized()` | Query `?trigger=` or `Bearer` | Hourly background sync worker (batch 20, conc 5) | 200, 401 |
| `/api/cron/weekly` | `GET` | `isCronAuthorized()` | Query `?trigger=` or `Bearer` | Mon 00:05 UTC reset: awards titles, wipes week counts | 200, 401 |
| `/api/duels/invite` | `POST` | `getAuthUserId()` | None | Mints signed 7-day single-use duel challenge JWT | 201, 401, 500 |
| `/api/duels/accept` | `GET` | `getAuthUserId()` | Query `token` | Consumes duel JWT, enforces pair dedupe, makes group | 302, 400, 401 |
| `/api/groups` | `GET` | `getAuthUserId()` | None | Lists all group memberships for authenticated user | 200, 401 |
| `/api/groups` | `POST` | `getAuthUserId()` | Zod `{ name, type, goal? }` | Creates squad or club, mints 8-char code, sets owner | 201, 400, 401 |
| `/api/groups/join` | `POST` | `getAuthUserId()` | Zod `{ code: 8 chars }` | Joins squad/club by code; waitlists if club is full | 200, 201, 202, 400, 401 |
| `/api/groups/[id]` | `PATCH` | Owner Only | Zod `{ name?, goal?, invite_enabled? }` | Updates metadata; regenerates code if reopening | 200, 400, 401, 403, 404 |
| `/api/groups/[id]` | `POST` | Owner Only | Same as PATCH | Alias pointing directly to PATCH handler | 200, 400, 401, 403, 404 |
| `/api/groups/[id]` | `DELETE` | Owner Only | None | Deletes club; archives duel; rejects squad deletion | 200, 400, 401, 403, 404 |
| `/api/groups/[id]/board` | `GET` | Member or Open Club | Query `view, sort, filter, q, page` | Paged card roster, pins, stats, streak decay checks | 200, 401, 403, 404 |
| `/api/groups/[id]/feed` | `GET` | Member or Open Club | None | Returns latest 100 activity events for group feed | 200, 401, 403 |
| `/api/groups/[id]/join` | `POST` | `getAuthUserId()` | None | Instant join for open clubs; waitlists if $\ge 150$ | 201, 202, 400, 401, 404 |
| `/api/groups/[id]/kick` | `POST` | Owner Only | Zod `{ user_id: uuid }` | Evicts member, removes their pins, posts event | 200, 400, 401, 403, 404 |
| `/api/groups/[id]/leave` | `POST` | Member Only | None | Leaves group; auto-transfers ownership to oldest | 200, 400, 401 |
| `/api/groups/[id]/member/[userId]` | `GET` | Member or Open Club | None | Expanded card drawer: 7d activity, split, duel stats | 200, 401, 403, 404 |
| `/api/groups/[id]/order` | `POST` | Member Only | Zod `{ ordered_user_ids: uuid[] }` | Upserts `custom_orders` & mirrors touch timestamp | 200, 400, 401, 403 |
| `/api/groups/[id]/pin` | `POST` | Member Only | Zod `{ user_id: uuid, pinned: bool }` | Pins/unpins card (viewer scope, max 2 enforced) | 200, 400, 401, 403 |
| `/api/groups/[id]/regen-code` | `POST` | Owner Only | None | Rotates 8-char invite code, invalidating old code | 200, 400, 401, 403, 404 |
| `/api/nudge` | `POST` | Co-member in group | Zod `{ to_user: uuid, group_id: uuid }` | Sends daily nudge (1/day per target per group) | 201, 400, 401 |
| `/api/sync/poll` | `GET` | `isCronAuthorized()` | Query `?trigger=` or `Bearer` | Direct handler alias exporting `/api/cron/sync` | 200, 401 |
| `/api/sync/refresh` | `POST` | Co-member in group | Zod `{ user_id: uuid }` | Manual card sync (10m card cooldown, 10/hr user cap) | 200, 400, 401, 429 |
| `/api/verify/link` | `POST` | `getAuthUserId()` | Zod `{ leetcode_username }` | Instant unclaimed link; sets 7-day backfill cursor | 200, 400, 401 |
| `/api/verify/start` | `POST` | `getAuthUserId()` | Zod `{ leetcode_username }` | Starts dispute flow; generates `SB-XXXXXX` (30m TTL) | 200, 400, 401 |
| `/api/verify/confirm` | `POST` | `getAuthUserId()` | Zod `{ leetcode_username }` | Verifies `SB-XXXXXX` in About Me, reclaims handle | 200, 400, 401 |
| `/api/verify/unlink` | `POST` | `getAuthUserId()` | None | Unlinks handle, retains historical solves | 200, 401 |

---

## 3. Pure vs. Impure Isolation Rules & Critical Invariants

### 3.1 Architectural Boundary Rules

1. **Pure Domain Logic (`lib/*.ts`)**:
   - Must be **completely environment-free and I/O-free**.
   - No database queries, no network calls, no file system operations, and no top-level `process.env` evaluations.
   - Vitest runs entirely in-memory against these pure functions without spinning up containers or reading `.env`.
2. **Server-Side Pipelines (`lib/server/*.ts`) & API Routes (`app/api/*`)**:
   - Contain all side-effecting operations (LeetCode GraphQL requests, Supabase database writes).
   - Use `createServiceClient()` (`SUPABASE_SERVICE_ROLE_KEY`) to bypass Postgres RLS, execute cross-table mutations, maintain audit logs, and enforce transactional invariants.
   - **Never import `lib/server/*` or `@supabase/supabase-js` service clients into Client Components.**

### 3.2 Sync Health State Machine & Transitions

The sync health engine (`lib/sync.ts` & `lib/server/sync-engine.ts`) evaluates account freshness:

```
                  last_sync_at < 24h
                ┌─────────────────────┐
                │        LIVE         │
                └──────────┬──────────┘
                           │
                 24h <= last_sync_at < 48h
                           ▼
                ┌─────────────────────┐
                │        STALE        │◄────────────────────────┐
                └──────────┬──────────┘                         │
                           │                                    │
           last_sync_at >= 48h OR Auth Error                    │
                           ▼                                    │
                ┌─────────────────────┐                         │
                │       FROZEN        │ (sinks to board bottom) │
                └─────────────────────┘                         │
                                                                │
           403/429 Upstream Rate Limit                          │
                ┌─────────────────────┐                         │
                │    RATE_LIMITED     │─────────────────────────┘
                └─────────────────────┘   Backoff recovery
                * NEVER degrades to Frozen
```

- **Live (<24h)**: Normal status; full participation in leaderboard and titles.
- **Stale (24–48h)**: Normal display; keeps earned rank; flagged in drawer diagnostics.
- **Frozen (>48h or Auth/Private Error)**: **Sinks to the bottom of all leaderboard views** below all active solvers. Disqualified from Hokage title. Displays frozen styling (`opacity-70`, snowflake badge).
- **Rate Limited Invariant**: HTTP 403 or 429 from LeetCode sets `sync_status = 'rate_limited'` and updates `retry_at`. **Rate limiting NEVER degrades an account to frozen status.**
- **Exponential Backoff**: Successive failures scale delay:
  - Step 0 (1st failure): 5 minutes (`5 * 60_000` ms)
  - Step 1 (2nd failure): 30 minutes (`30 * 60_000` ms)
  - Step 2+ (3rd+ failure): 2 hours (`2 * 3_600_000` ms)
- **Composite Cursor Comparison**:
  LeetCode timestamps are granular to seconds. To prevent dropping or double-counting concurrent submissions:
  `isNewerThanCursor(tsSec, subId, cursorTs, cursorId) = (tsSec !== cursorTs) ? (tsSec > cursorTs) : (subId > cursorId)`

### 3.3 Scoring Formulas, Deduplication & Streak Invariants

- **Mon–Sun UTC Week Key**:
  Weeks begin strictly at Monday 00:00:00 UTC (`weekStartUTC()`). Postgres stores `profiles.week_start` and `solves.week_start` as `YYYY-MM-DD`.
- **Intra-Week Deduplication**:
  Counted solves require **distinct problem slugs per UTC week**. If a user re-submits a problem they already solved within the same UTC week, the second submission yields **0 XP and 0 weekly count increment**.
- **Cross-Week Repeat Practice Scoring**:
  Solving a problem previously completed in an earlier week contributes:
  - `+1` to the current `weekly_count`.
  - Spaced repetition practice base XP (`PRACTICE_XP_BY_DIFFICULTY`): `Easy` +1 XP, `Medium` +4 XP, `Hard` +10 XP.
  - Dynamic streak bonus (`getStreakBonus(streakAtSolve)`).
- **Base Difficulty XP (`XP_BY_DIFFICULTY`)**:
  - Awarded on **first-ever AC** of a slug:
    - `Easy`: +5 XP
    - `Medium`: +15 XP
    - `Hard`: +40 XP
- **Dynamic Streak Bonus Tiers (`STREAK_BONUS_TIERS`)**:
  - `1–2 days`: +0 XP
  - `3–6 days`: +2 XP
  - `7–13 days`: +3 XP
  - `14–29 days`: +4 XP
  - `30+ days`: +5 XP
- **Permanent Base Ladder (`BASE_LADDER`)**:
  - `Academy`: 0 XP (Konohamaru)
  - `Genin`: 150 XP (Naruto)
  - `Chunin`: 500 XP (Shikamaru)
  - `Jonin`: 1,200 XP (Kakashi, aligned with Blind 75 completion)
  - `ANBU`: 2,500 XP (Itachi, aligned with NeetCode 150 completion)
  - `Kage`: 4,500 XP (Minato, aligned with Senior / Striver completion)
  - `Sage`: 7,500 XP (Jiraiya, pinnacle competitive tier)
- **Streak Progression & Decay**:
  - A solve on the consecutive UTC calendar day (`diffDaysUTC === 1`) increments streak by 1.
  - Same-day solves keep streak unchanged.
  - Gap > 1 day resets streak to 1 upon solve.
  - **Zero Grace Days**: Spec §13 explicitly defers streak grace days, freezes, and weekend pauses to v2. If a user does not solve a problem, streak actively decays to 0 during the Monday cron sweep, in `syncUser` empty batches, and dynamically in the board view (`p.streak_last_date < yesterday ? 0 : p.streak`).

### 3.4 Leaderboard Sorting Hierarchy & Deterministic Tiebreakers

Leaderboard view ranks rows using strict multi-tier tiebreakers (`lib/scoring.ts`):

1. **Pin Status**: Viewer's pinned cards float to the top (`pinned` partition first).
2. **Frozen Sinking**: Frozen accounts sink to the bottom of their respective partition (`af - bf`).
3. **Weekly Count**: Descending (`b.weekly_count - a.weekly_count`).
4. **Weekly Hards**: Descending (`b.weekly_hards - a.weekly_hards`).
5. **Lifetime XP**: Descending (`b.xp - a.xp`).
6. **Active Streak**: Descending (`b.streak - a.streak`).
7. **Earliest Solve Timestamp (Golden Rule)**: Ascending (`at - bt`). **The solver who reached the score earlier in the week wins the tie.** Missing solve timestamp is treated as `Number.MAX_SAFE_INTEGER`.

### 3.5 Weekly Title Assignment Rules

Evaluated every Monday at 00:05 UTC by `/api/cron/weekly` across the just-ended week:

- **Hokage (Crown, 7-day duration)**:
  - Assigned to the #1 candidate in leaderboard order.
  - **Hard Qualification**: Must be **non-frozen** AND have `weekly_count >= group.goal`.
  - If the top candidate missed the goal or is frozen, **the title remains vacant for the week**.
- **Itachi (Crow, 3-day duration)**:
  - Awarded to the solver with the highest `weekly_hards` in the ended week.
  - Tiebreakers: `weekly_hards desc → weekly_count desc → xp desc → streak desc`.
  - Must be non-frozen with at least 1 Hard solve (`weekly_hards > 0`). Otherwise vacant.
- **Rock Lee (Lotus/Flex, 3-day duration)**:
  - Comeback award: Must be non-frozen, had **0 solves in the previous week**, and achieved **$\ge 15$ solves in the current week**.
  - Winner is candidate with highest delta (`weekly_count` among qualifiers). Otherwise vacant.
- **Single Live Holder Database Invariant**:
  Protected by trigger `trg_title_holder`. At most 1 active title holder per title per group can exist simultaneously.

### 3.6 Dual-Layer Pinning Architecture

1. **Viewer's Personal Pins (`member_pins` table)**:
   - Primary user experience. Each member can pin up to 2 cards for their personal view.
   - Enforced by database trigger `trg_member_pins_limit` (raises `PIN_LIMIT` if count $\ge 2$).
2. **Group Legacy Backstop (`memberships.pinned` column)**:
   - Group-level default pins. Enforced by database trigger `trg_membership_pinned_limit` (max 2 per group).
3. **Board Merging**:
   - `Board.tsx` and `/api/groups/[id]/board` evaluate: `isPinned = pinSet.has(uid) || globalPinByMembership.has(uid)`.

### 3.7 Custom View Ordering Normalization

- `memberships.personal_order` (single float column) cannot store an arbitrary card permutation from the perspective of multiple viewers.
- Normalized table `custom_orders` (`viewer_id`, `group_id`, `target_user_id`, `position`) stores viewer-specific drag-and-drop order.
- To maintain backward compatibility and auditability, `/api/groups/[id]/order` updates `custom_orders` and mirrors a touch timestamp modulo into `memberships.personal_order = Date.now() % 1_000_000`.

### 3.8 Realtime Topic Isolation & Polling Fallback

- `supabase-js` reuses channel instances keyed by topic string.
- Because `Board` and `Feed` mount concurrently on `/groups/[id]`, identical topics cause race conditions and subscription teardown.
- **Topic Isolation Invariant**:
  - `Board.tsx`: `group:${groupId}:board:${Math.random().toString(36).slice(2, 10)}`
  - `Feed.tsx`: `group:${groupId}:feed:${Math.random().toString(36).slice(2, 10)}`
- **Fallback Polling**: `Board.tsx` executes a 30-second interval refresh (`setInterval(load, 30_000)`) alongside WebSocket channels.

### 3.9 LeetCode Verification Mechanics

1. **Instant Link Fast-Path (`POST /api/verify/link`)**:
   - Verifies username exists on LeetCode via GraphQL query `fetchMatchedUser(username)`.
   - Confirms handle is unclaimed in `profiles`.
   - Links handle immediately and establishes a **7-day backward cursor** (`sync_cursor_ts = now - 7 days`), preventing historic solve farming.
2. **Dispute Verification Flow (`POST /api/verify/start` & `POST /api/verify/confirm`)**:
   - Used when a handle is already claimed by another user.
   - `start`: Generates `SB-XXXXXX` (cryptographic random 6-character code, 30-minute TTL) stored in `verification_codes`.
   - User pastes `SB-XXXXXX` into their LeetCode profile "About Me" section.
   - `confirm`: Queries LeetCode GraphQL `aboutMe`, validates token presence, transfers ownership to new user, and freezes the prior claimant's profile (`frozen_reason = 'claimed_by_dispute'`).

---

## 4. Complete Database Schema, Trigger & Constraint Inventory

The database consists of 14 tables defined across `supabase/migrations/0001_init.sql` and `0002_custom_orders.sql`.

### 4.1 Schema Tables & Indexes

```
┌─────────────────────────┬───────────────────────────┬────────────────────────────────────────────────────────┐
│ Table Name              │ Primary Key               │ Key Columns, CHECK Constraints & Indexes               │
├─────────────────────────┼───────────────────────────┼────────────────────────────────────────────────────────┤
│ profiles                │ auth_user_id (uuid)       │ lc_username (unique text), sync_status (live, stale,   │
│                         │                           │ frozen, rate_limited), xp (>=0), base_rank, streak,    │
│                         │                           │ weekly_count, weekly_hards, week_start, sync_cursor_ts │
│                         │                           │ GIN Trigram index: profiles_lc_username_trgm           │
│ groups                  │ id (uuid)                 │ type (squad, club, duel), name (1-80 chars), goal,     │
│                         │                           │ code (unique 8-char), invite_enabled, member_count     │
│                         │                           │ Indexes: groups_type_idx, groups_code_idx              │
│ memberships             │ (user_id, group_id)       │ role (owner, member), personal_order (float8), pinned, │
│                         │                           │ pinned_at, joined_at. Foreign keys cascade on delete   │
│                         │                           │ Indexes: memberships_group_idx, memberships_user_idx   │
│ member_pins             │ (viewer_id, pinned_user_id│ check (viewer_id <> pinned_user_id)                    │
│                         │  group_id)                │ Index: member_pins_viewer_group_idx                    │
│ group_waitlist          │ (user_id, group_id)       │ FIFO club capacity waitlist entries                    │
│ problem_meta            │ slug (text)               │ title, difficulty (Easy, Medium, Hard), updated_at     │
│ solves                  │ submission_id (text)      │ user_id, slug, diff, lang, solved_at, week_start      │
│                         │                           │ Indexes: user_solved_idx, user_week_slug_idx           │
│ verification_codes      │ user_id (uuid)            │ code (SB-XXXXXX), lc_username, expires_at (30-min TTL) │
│ duel_invites            │ jti (text)                │ from_user, expires_at (7d TTL), used_at, used_by,      │
│                         │                           │ group_id. Index: duel_invites_from_idx                 │
│ titles                  │ id (uuid)                 │ user_id, group_id, title (hokage, itachi, rock_lee),   │
│                         │                           │ granted_at, expires_at. Index: titles_user_idx         │
│ events                  │ id (uuid)                 │ group_id, type (11 domain types), actor_id, payload    │
│                         │                           │ (jsonb), text. Index: events_group_created_idx         │
│ nudges                  │ id (uuid)                 │ from_user, to_user, group_id, day (date)               │
│                         │                           │ Unique: (from_user, to_user, group_id, day)            │
│ sync_logs               │ id (uuid)                 │ user_id, requested_by, status, error, fetched          │
│                         │                           │ Indexes: sync_logs_user_started_idx, requested_by_idx  │
│ custom_orders           │ (viewer_id, group_id,     │ position (double precision), updated_at                │
│                         │  target_user_id)          │ Index: custom_orders_viewer_group_idx                  │
└─────────────────────────┴───────────────────────────┴────────────────────────────────────────────────────────┘
```

### 4.2 Database Triggers & Stored Procedures

1. **`trg_title_holder` on `public.titles`** (`BEFORE INSERT OR UPDATE`):
   - **Enforces**: At most 1 active holder per title per group (`expires_at > now()`).
   - **PostgreSQL IMMUTABLE Constraint Rationale**:
     PostgreSQL requires partial index expressions (`WHERE ...`) to be strictly `IMMUTABLE`. Built-in timestamp functions (`now()`, `CURRENT_TIMESTAMP`) are evaluated per transaction and are classified as `STABLE`. Executing `CREATE UNIQUE INDEX ... WHERE expires_at > now()` fails with `ERROR: functions in index predicate must be marked IMMUTABLE`. Active title uniqueness must therefore be enforced dynamically via this PL/pgSQL trigger.
2. **`trg_member_pins_limit` on `public.member_pins`** (`BEFORE INSERT OR UPDATE`):
   - Enforces viewer personal pin cap: count of existing pins for `(viewer_id, group_id)` must be `< 2`. Raises `PIN_LIMIT` exception on violation.
3. **`trg_membership_pinned_limit` on `public.memberships`** (`BEFORE INSERT OR UPDATE OF pinned`):
   - Enforces group backstop pin cap: count of pinned memberships for `group_id` must be `< 2`.
4. **`trg_group_capacity` on `public.memberships`** (`AFTER INSERT`):
   - Enforces membership ceiling by group type:
     - `squad`: Max 15 members (`GROUP_FULL: squad cap is 15 members`)
     - `club`: Max 150 members (`GROUP_FULL: club cap is 150 members (waitlist beyond)`)
     - `duel`: Exactly 2 members (`GROUP_FULL: duel is exactly 2 users`)
5. **`trg_sync_member_count_ins` & `trg_sync_member_count_del` on `public.memberships`**:
   - Maintains cached `groups.member_count` atomically on membership insertion (`+1`) and deletion (`greatest(member_count - 1, 0)`).
6. **`trg_prune_group_events` on `public.events`** (`AFTER INSERT`):
   - Enforces 30-day event retention (`created_at < now() - interval '30 days'`).
   - Caps total stored events at 200 per group by deleting records beyond offset 200 ordered by `created_at desc`.
7. **`trg_problem_meta_touch` on `public.problem_meta`** (`BEFORE UPDATE`):
   - Updates `updated_at = now()`.

### 4.3 Row Level Security (RLS) Policy Summary

All 14 tables have RLS enabled. **Zero tables grant direct read or write access to the `anon` role.**

- `profiles`: `SELECT` authenticated (all); `UPDATE/INSERT` authenticated (`auth.uid() = auth_user_id`).
- `member_pins`: `SELECT` authenticated (all); `ALL` authenticated (`auth.uid() = viewer_id`).
- `custom_orders`: `ALL` authenticated (`auth.uid() = viewer_id`).
- `verification_codes`: `ALL` authenticated (`auth.uid() = user_id`).
- `groups`, `memberships`, `group_waitlist`, `solves`, `problem_meta`, `titles`, `events`, `nudges`: `SELECT` authenticated (all); direct client mutations denied.
- `sync_logs`: `SELECT` authenticated (`auth.uid() = user_id OR auth.uid() = requested_by`).
- `duel_invites`: `SELECT` authenticated (`auth.uid() = from_user OR auth.uid() = used_by`).

---

## 5. Operational Instructions & Launch Guide

### 5.1 Local Development Commands

```bash
# 1. Start local Next.js dev server (port 3000)
npm run dev

# 2. Typecheck entire repository (must pass with 0 errors)
npm run typecheck

# 3. Run pure domain unit test suite (19 tests)
npm test

# 4. Compile optimized Next.js production build
npm run build
```

### 5.2 Vercel Cron Configuration & Authentication

- **Config File**: `vercel.json`
- **Endpoints**:
  - `/api/cron/sync`: Hourly batch sync worker (`SYNC_BATCH_SIZE = 20`, `SYNC_CONCURRENCY = 5`).
  - `/api/cron/weekly`: Weekly title calculation and score rollover (Mon 00:05 UTC).
  - `/api/sync/poll`: Functional alias for `/api/cron/sync`.
- **Authorization Guard (`isCronAuthorized`)**:
  Both cron routes verify `CRON_SECRET` through either:
  1. URL Query: `GET /api/cron/sync?trigger=<CRON_SECRET>`
  2. Authorization Header: `Authorization: Bearer <CRON_SECRET>`
- **Schedule Alignment Note**:
  `vercel.json` currently specifies `"0 0 * * *"` (daily midnight UTC). For production hourly sync as specified in §7.3, update `vercel.json` cron expression to `"0 * * * *"`.

### 5.3 Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role Key (Server-only, bypasses RLS for cron & mutations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Duel Challenge Token Signing Key (Must be at least 32 characters)
DUEL_JWT_SECRET=super-secret-jwt-key-at-least-32-chars-long!

# Vercel Cron Protection Secret
CRON_SECRET=your-random-cron-secret-string
```

### 5.4 Pre-Launch Verification Checklist

1. **Apply Database Migrations**:
   Run `supabase db push` against the target hosted Supabase project. Verify in the Supabase SQL editor that all 14 tables, custom CHECK constraints, and 8 triggers compile cleanly.
2. **Enable Realtime Publication on Events**:
   Execute the following SQL command in Supabase to enable live Board and Feed event streaming:
   ```sql
   alter publication supabase_realtime add table public.events;
   ```
3. **Configure Google OAuth Provider**:
   In Supabase Dashboard (Authentication -> Providers -> Google), configure Client ID & Secret. Set redirect URL to `https://<your-domain>/auth/callback`.
4. **Environment Variables**:
   Verify `DUEL_JWT_SECRET` is $\ge 32$ characters. Configure `CRON_SECRET` in Vercel project settings.
5. **Intellectual Property Reskin**:
   Per spec §5, Naruto working names (Hokage, Itachi, Rock Lee, character lore avatars) are placeholders for development and must be reskinned to non-infringing ninja lore prior to commercial launch.

### 5.5 Out of Scope for v1 (Spec §13)

The following features are explicitly deferred to v2. Do not implement or introduce facades for:
- Push notifications / web push
- Co-moderators (groups are single-owner only in v1)
- Per-user custom solve goals
- Streak grace days, weekend freeze items, or recovery passes
- Betting / wagering mechanics
- Real-time in-app chat
- Embedded code editor / IDE
- AI automated coaching
- Public REST / GraphQL developer API

---

## 6. Non-Negotiable Coding Conventions

1. **Zod Validation on All Mutation Routes**:
   Every POST, PATCH, and DELETE handler must parse incoming JSON payloads using strict Zod schemas before processing.
2. **Supabase Client Discipline**:
   - `lib/supabase/client.ts` (`createBrowserClient`): Browser / Client Components only.
   - `lib/supabase/server.ts` (`createServerClient`): Server Components & auth session identification (`lib/auth.ts`).
   - `lib/supabase/server.ts` (`createServiceClient`): Route handlers and server pipelines requiring administrative bypass. **Never expose `createServiceClient` to client bundles.**
3. **HTTP Response Uniformity**:
   All API routes must use the standard response helpers in `lib/http.ts`: `json()`, `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `rateLimited()`.
4. **Clean Code & Git Discipline**:
   - Zero hardcoded test values, mock bypasses, or dummy implementations.
   - Do not commit secrets, `.env*` files (except `.env.example`), `.next/`, or `tsconfig.tsbuildinfo`.
   - Do not create unrequested markdown documentation files in the repository.
