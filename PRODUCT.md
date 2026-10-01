# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary**: College interview-prep grinders and software engineering peers (groups of 3–15 friends) preparing for technical interviews, studying LeetCode patterns, and struggling to sustain motivation after week 1 of solo grinding.
- **Secondary**: Public university and community prep clubs (topic-based cohorts, capped at 150 members with FIFO waitlist) and competitive 1:1 rivalry pairs tracking daily head-to-head solve differentials.

## Product Purpose

ShinobiBoard transforms the solitary, high-friction LeetCode grind into a shared, high-density daily habit. By combining Trello-style people-cards, weekly solve sprints (Mon–Sun UTC), gamified ninja progression tiers, and real-time activity feeds, the product makes developers open the dashboard daily to protect their streak, rank, and squad standing. Success means squads sustaining $\ge 40\%$ active members at week 4 with high weekly goal hit-rates.

## Positioning

Unlike LeetCode profiles (isolated telemetry), Discord channels (noisy, transient chat), or shared spreadsheets (manual, brittle logging), ShinobiBoard provides **strict, automated, zero-manual-entry LeetCode accountability** built around verified GraphQL sync, deterministic tiebreakers, and weekly title sprints where names and rankings carry social stakes.

## Operating Context

- **Daily Ritual**: Developers solve problems on LeetCode; automated background workers sync submissions hourly, advancing streaks, accruing XP, and posting feed events.
- **Weekly Sprint**: UTC weeks run strictly from Monday 00:00:00 UTC through Sunday 23:59:59 UTC.
- **Sprint Rollover**: Every Monday at 00:05 UTC, scores reset and scarce weekly titles are awarded (`Hokage`, `Itachi`, `Rock Lee`).
- **Device Usage**: Primarily desktop browsers during coding sessions, with responsive mobile view for checking standings and nudging teammates on the go.

## Capabilities and Constraints

- **Capabilities**:
  - Three distinct group types: Private Squads (invite-only, 3–15 members), Public Clubs (directory discoverable, up to 150 members with waitlist), and 1:1 Duels (signed 7-day JWT invites).
  - Trello-style people cards with weekly goal progress, streak flames, recent solve chips, and expanded drawers.
  - Dual-layer personal card pinning (max 2 cards per viewer float to top) and custom drag-and-drop ordering.
  - 7-tier permanent base ladder: Academy (0 XP), Genin (150 XP), Chunin (500 XP), Jonin (1,200 XP), ANBU (2,500 XP), Kage (4,500 XP), and Sage (7,500 XP).
  - Scoring rules: first-ever solve XP (Easy 5, Med 15, Hard 40), cross-week practice XP (Easy 1, Med 4, Hard 10), dynamic streak bonus tiers (up to +5 XP), and intra-week duplicate deduplication (0 XP).
  - Sync freshness state machine: Live (<24h), Stale (24–48h), Frozen (>48h or profile error, sinks to board bottom), Rate-Limited (exponential backoff 5m $\to$ 30m $\to$ 2h, never freezes).
  - Anti-squat LeetCode verification via 7-day backfill cursor and `SB-XXXXXX` About Me dispute verification.
- **Constraints (Locked v1 Scope)**:
  - Auth provider: Google OAuth only.
  - No web push / FCM push notifications (in-app feed and daily nudges only).
  - No co-moderators (single owner per group).
  - Zero grace days or streak freezes in v1.
  - No code editor, no bets, no in-app chat, and no public developer API.

## Brand Commitments

- **Tone & Persona**: Tactile, disciplined, restrained Japanese ninja dojo aesthetic; editorial serif headlines paired with precise monospace metrics.
- **Visual Identity**: Dark Sumi Obsidian theme with hairline sumi borders, warm paper/ink highlights, vermillion seal accent buttons, and character rank emblems.
- **Naming**: Ninja lore working names (Hokage, Itachi, Rock Lee) with clean reskinnability planned for commercial launch.

## Evidence on Hand

- Complete specification in `leetcode-board-spec.md`.
- Exhaustive engineering manual and verified benchmarks in `AGENTS.md`.
- Baseline database schema and custom orders in `supabase/migrations/0001_init.sql` and `0002_custom_orders.sql`.
- 20 verified passing unit tests in `lib/__tests__/scoring.test.ts` across 6 test suites.
- 34 compiled dynamic Next.js routes (7 page routes + 27 route handlers).

## Product Principles

1. **Strict Automated Truth**: Zero manual solve submissions or self-reporting. Every counted solve, streak, and XP point must be backed by verified LeetCode sync.
2. **Deterministic Fairness**: Transparent, deterministic tiebreakers (Weekly Count $\to$ Hards $\to$ Lifetime XP $\to$ Streak $\to$ Earliest Last Solve). No hidden randomness or arbitrary rank swaps.
3. **Daily Accountability Over Solo Vanity**: Highlight squad goal completion and mutual momentum over isolated vanity metrics.
4. **Resilience Without False Penalty**: Upstream rate limits from LeetCode never freeze or penalize an account. Frozen status is reserved for genuine inactivity or private profiles.
5. **Tactile Density**: High information density inspired by Trello boards and editorial print sheets, avoiding generic AI-generated purple glassmorphism.

## Accessibility & Inclusion

- Semantic HTML layout with keyboard-navigable card drawers, accessible modal dialogs, and clear ARIA labels.
- Color contrast compliance across text and status indicators against dark obsidian card backgrounds.
- Zero reliance on color alone to communicate state (e.g. snowflake badges for frozen status, flame counters for streaks, distinct badge text for Easy/Med/Hard).
