# AGENTS.md — ShinobiBoard (LeetCode Board v1.1)

> Project context for AI coding agents. Product behavior source of truth: `leetcode-board-spec.md`.
> Stack (locked, spec §11): Next.js 14 App Router + Supabase (Postgres/Auth/Realtime) + Vercel Cron. Auth: Google only.

## Status (2026-09-09)

v1.1 implemented and verified locally: `tsc --noEmit` clean, `vitest` 17/17 green, `next build` green
(25 API routes, 6 page routes). **Not yet deployed; DB migrations have never run against a real Postgres**
— apply `supabase/migrations/*` to a dev project and smoke-test before launch.
Local launch fixes (uncommitted): cron auth bypass closed, duel secret ≥32, titles
cap via trigger, per-instance realtime topics, instant LeetCode link.

## Repo map

- `app/` — pages (`page`, `login`, `dashboard`, `discover`, `groups/[id]`, `duel/accept`) + `api/` routes
  (`verify/*` incl. instant `link`, `sync/refresh`, `sync/poll`, `groups/*`, `duels/*`, `nudge`, `cron/sync`, `cron/weekly`, `account`).
- `components/` — `Board` (cards, views, sort/filter/search, pins, drag-reorder), `Feed` (Realtime `group:<id>`
  channel + polling fallback), `GroupForms`, `GroupSettings`, `VerifyLeetCode`, `JoinClubButton`.
- `lib/` — pure, env-free policy logic with unit tests (`lib/__tests__/scoring.test.ts`):
  `week` (Mon–Sun UTC weeks, streaks), `ranks` (XP/ladder), `scoring` (leaderboard order, title pickers),
  `sync` (stale/frozen/rate-limit policy, backoff, dedupe), `invite` (8-char codes), `duel` (JWT),
  `leetcode` (GraphQL client). `lib/server/` — `sync-engine` (poll worker used by cron + manual refresh),
  `events` (best-effort feed writer), `lib/supabase/` — browser/server/service clients.
- `supabase/migrations/` — `0001_init.sql` (full §10 schema + triggers + RLS), `0002_custom_orders.sql`.
- `vercel.json` — cron: hourly `/api/cron/sync`, Mon 00:05 UTC `/api/cron/weekly`. `.env.example` — required env.

## Spec decisions worth knowing

- `memberships.personal_order` (one float) cannot encode a viewer's card ordering → real per-viewer order
  lives in `custom_orders`; a touch timestamp is mirrored into `personal_order` for compat (`0002`).
- Real pins are per-viewer in `member_pins` (≤2 enforced by trigger); `memberships.pinned` remains as a
  global backstop (≤2 per group trigger). Board merges both.
- `403/429` from LeetCode sets `rate_limited` + `retry_at` (backoff 5m→30m→2h) — never frozen (§7.3).
- Linking is instant (`POST /api/verify/link`: exists + public + unclaimed → linked);
  the About-code `start`/`confirm` flow is dispute-only for claimed names (§7.1).
- Titles 1-holder cap is `trg_title_holder` trigger — a partial unique index with
  `now()` is invalid Postgres (index predicates must be IMMUTABLE).
- Realtime topics are per-instance (`group:<id>:board|feed:<rand>`): supabase-js
  reuses channels by topic and Board + Feed mount together.
- Weekly counters are global per user; goal/title/rank are per group. Titles are computed from the
  just-ended week's `solves` rows in the Monday cron, then counters reset.
- Feed event types include `goal_hit`/`member_joined`/`member_left` in addition to the §8 list.

## Commands

- `npm run dev` · `npm run build` · `npm run typecheck` (`tsc --noEmit`) · `npm test` (`vitest run`)
- Always re-run typecheck + tests + build after touching `lib/`, `app/api/`, or migrations.

## Conventions

- Pure policy → `lib/*.ts` (must stay importable without env so vitest works). Supabase/LeetCode I/O →
  `lib/server/*` and API routes only, via `createServiceClient()` (bypasses RLS — never expose raw).
- API routes: validate with `zod`, respond via `lib/http.ts` helpers, guard cron with `isCronAuthorized`.
- Client components fetch the API routes (cookies carry the session); server components use `lib/auth.ts`.
- Do not commit secrets (`.env*` ignored except `.env.example` placeholders), `node_modules/`, `.next/`,
  `tsconfig.tsbuildinfo`. Do not create `*.md` docs unless asked.

## Launch checklist (still TODO)

1. `supabase db push` to dev; verify triggers (pin cap, group caps, event prune) and RLS in SQL editor.
2. Supabase Dashboard: enable Google provider (redirect `<app>/auth/callback`); add `events` table to the
   Realtime publication (board/feed live updates depend on it).
3. Set production env (`SUPABASE_SERVICE_ROLE_KEY`, `DUEL_JWT_SECRET` ≥32 chars, `CRON_SECRET`); confirm
   Vercel Cron hits both cron routes (they accept `?trigger=<CRON_SECRET>` or Bearer).
4. Reskin Naruto working titles before public launch (IP note, spec §5).

## v2 (explicitly out, spec §13)

Push notifications, co-mods, per-user custom goals, streak grace days, bets, chat, code editor, coaching, public API.
