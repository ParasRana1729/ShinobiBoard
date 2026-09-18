# 🥷 ShinobiBoard (LeetCode Board)

> **High-density LeetCode group dashboard and rivalry arena** with friend circles, Trello-style people-cards, Naruto-themed progression tiers, and real-time live activity feeds.

ShinobiBoard turns the solitary LeetCode grind into a shared daily habit. Compete in private squads, public clubs, or head-to-head duels with deterministic tiebreakers, dynamic streak multipliers, and weekly title sprint resets.

---

## ⚡ Tech Stack

- **Framework**: [Next.js 14.2](https://nextjs.org/) (App Router, Server Components & Route Handlers, TypeScript)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS, Auth via Google OAuth only, Realtime WebSocket subscriptions)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Dark Sumi Obsidian theme, Inter display headings, IBM Plex typography)
- **Background Jobs**: Vercel Cron (hourly sync polling & Monday 00:05 UTC reset worker)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) (pure in-memory unit tests for scoring & domain rules)

---

## 🥋 Core Features & Architecture

### 1. Three Group Types
- **Private Squad**: Invite-code only (8-char nanoid, collision-resistant), 3–15 members, hidden from discovery.
- **Public Club**: Discoverable directory with instant join, up to 150 members with automated FIFO waitlist.
- **1:1 Duel**: Exactly 2 rivals, daily head-to-head W/L/D records, single-use 7-day signed JWT challenge links.

### 2. Trello-Style People Cards & Board UX
- **Card Front**: Rank avatar with tier border, display name, LeetCode username, weekly goal progress bar (`X / Goal`), streak flame counter, and last solved problem chip (`slug · diff · time`).
- **Expanded Drawer**: Recent 5 counted solves, 7-day UTC activity heatmap dots, all-time Easy/Medium/Hard solve split, base rank & XP progress bar, active limited titles, and sync freshness diagnostics.
- **Views**:
  - `Leaderboard` (Default): Ranked by weekly counted solves $\to$ weekly hards $\to$ lifetime XP $\to$ streak $\to$ earliest last solve. Frozen accounts sink to the bottom.
  - `Custom`: Drag-and-drop reordering persisted per-viewer in `custom_orders`.
  - `Pinning`: Dual-layer personal card pinning (up to 2 cards per viewer float to top).

### 3. Balanced Scoring & Naruto Progression Ladder
- **First-Ever Solves**:
  - Easy: **+5 XP**
  - Medium: **+15 XP**
  - Hard: **+40 XP**
- **Spaced Practice Solves (Cross-Week)**:
  - Easy: **+1 XP**
  - Medium: **+4 XP**
  - Hard: **+10 XP**
  - Contributes `+1` to `weekly_count`.
- **Intra-Week Deduplication**: Duplicate submissions of the same problem within the same UTC week award **0 XP** and **0 weekly count**.
- **Dynamic Streak Multiplier**:
  - 1–2 days: `+0 XP`
  - 3–6 days: `+2 XP`
  - 7–13 days: `+3 XP`
  - 14–29 days: `+4 XP`
  - 30+ days: `+5 XP`
- **7-Tier Permanent Ladder**:
  1. `Academy`: 0 XP (*Konohamaru*)
  2. `Genin`: 150 XP (*Naruto*)
  3. `Chunin`: 500 XP (*Shikamaru*)
  4. `Jonin`: 1,200 XP (*Kakashi*)
  5. `ANBU`: 2,500 XP (*Itachi*)
  6. `Kage`: 4,500 XP (*Minato*)
  7. `Sage`: 7,500 XP (*Jiraiya*)

### 4. Weekly Limited Titles (Mon 00:05 UTC Reset)
- **Hokage** (7 days): Awarded to #1 solver in the group who met or exceeded the group goal and is non-frozen.
- **Itachi** (3 days): Awarded to the solver with the most counted Hard solves that week (minimum 1 Hard, non-frozen).
- **Rock Lee** (3 days): Comeback award for solving 0 problems in the previous week and $\ge 15$ problems in the current week.

### 5. Sync Freshness & Anti-Squat Verification
- **Sync State Machine**:
  - `Live` (< 24h since sync): Full participation.
  - `Stale` (24h–48h): Normal display, flagged in drawer.
  - `Frozen` (> 48h or profile error): Dimmed with snowflake badge, sinks to the bottom of all boards, excluded from titles.
  - `Rate Limited`: Upstream 403/429 triggers exponential backoff (5m $\to$ 30m $\to$ 2h) and **never degrades to frozen**.
- **Account Linking**: Fast-path instant verification with 7-day backward cursor, plus `SB-XXXXXX` About Me dispute verification for contested usernames.

---

## 📁 Repository Structure

```
ShinobiBoard/
├── app/                              # Next.js 14 App Router
│   ├── layout.tsx                    # Root layout with SSR user profile & Navbar
│   ├── page.tsx                      # Landing page (editorial teaser & ladder preview)
│   ├── login/page.tsx                # Google OAuth sign-in
│   ├── dashboard/page.tsx            # User HQ (personal stats, group hubs, missions)
│   ├── discover/page.tsx             # Public club discovery directory
│   ├── duel/accept/page.tsx          # 1:1 duel invite landing & JWT acceptance
│   ├── groups/[id]/page.tsx          # Group board & activity view
│   ├── auth/callback/route.ts        # Supabase PKCE OAuth exchange
│   └── api/                          # 24 discrete REST route handlers
├── components/                       # React client and server components
│   ├── Board.tsx                     # Leaderboard matrix, drawer, reorder, pins
│   ├── Feed.tsx                      # Realtime activity stream with fallback polling
│   ├── GroupForms.tsx                # Create squad/club form & join-by-code form
│   ├── GroupSettings.tsx             # Owner controls (rename, code regen, goal, kick)
│   ├── RankAvatar.tsx                # Character avatar renderer with tier styling
│   ├── RankProgressCard.tsx          # Dashboard XP meter, level calculator & lore modal
│   ├── VerifyLeetCode.tsx            # Fast-path link, dispute challenge & unlink modal
│   └── Navbar.tsx                    # Header with streak counter and user status
├── lib/                              # Pure domain logic & shared contracts
│   ├── week.ts                       # Mon–Sun UTC week windows & streak calculation
│   ├── ranks.ts                      # 7-tier ladder, XP thresholds, character lore
│   ├── scoring.ts                    # Sorting, deterministic tiebreakers, title pickers
│   ├── sync.ts                       # Sync state machine, backoff, cursor checks
│   ├── invite.ts                     # 8-char nanoid invite code generator
│   ├── duel.ts                       # 7-day duel challenge JWT signing & verification
│   ├── leetcode.ts                   # LeetCode GraphQL client & error definitions
│   ├── types.ts                      # TypeScript interfaces & database record types
│   ├── server/                       # Server-only pipelines (Supabase + LeetCode I/O)
│   │   ├── sync-engine.ts            # Batch worker, hash-jitter scheduler, liveness
│   │   └── events.ts                 # Group-wide activity feed broadcaster
│   └── supabase/                     # Client factories (browser, server, admin)
├── supabase/migrations/              # PostgreSQL schema migrations
│   ├── 0001_init.sql                 # Baseline schema (13 tables, triggers, RLS)
│   └── 0002_custom_orders.sql        # Custom viewer card ordering table
├── tailwind.config.ts                # Sumi obsidian theme & typography
├── vercel.json                       # Vercel Cron schedule configuration
└── vitest.config.ts                  # Vitest runner configuration
```

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js $\ge 18.17.0$
- npm $\ge 9.0.0$

### 2. Installation
```bash
git clone https://github.com/ParasRana1729/ShinobiBoard.git
cd ShinobiBoard
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DUEL_JWT_SECRET=super-secret-jwt-key-at-least-32-chars-long!
CRON_SECRET=your-random-cron-secret-string
```

### 4. Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server at `http://localhost:3000` |
| `npm run typecheck` | Validates strict TypeScript compilation (`tsc --noEmit`) |
| `npm test` | Runs pure domain logic unit tests via Vitest (19 tests) |
| `npm run build` | Compiles production Next.js application bundle |
| `npm run start` | Runs production server after build |

---

## 🔒 Security & Database Rules
- **Row Level Security (RLS)**: Enabled across all 14 PostgreSQL tables. Direct mutations from anonymous or unauthenticated roles are strictly disallowed.
- **Service Role Isolation**: Server mutations and cron pipelines run exclusively via `createServiceClient()` in server-only route handlers.
- **Strict Payload Validation**: All mutation endpoints parse and validate input payloads with Zod schemas.
