---
name: Anti-slop UI reskin
overview: "Replace the dark gold-glass “SaaS template” look with a light washi-paper, sumi-ink, vermillion-stamp system: serif headlines, hairline borders, no glow/gradients/telemetry chrome. Product behavior and ninja ranks stay the same."
todos:
  - id: tokens
    content: Retheme tailwind + globals + layout fonts (paper, vermillion, Newsreader/IBM Plex)
    status: completed
  - id: chrome
    content: Reskin Navbar and shared button/surface classes
    status: completed
  - id: marketing
    content: Rewrite homepage and login to editorial paper layout
    status: completed
  - id: app-surfaces
    content: Apply paper/ink language to dashboard, discover, groups, board, feed, forms, rank card, duel accept, loaders
    status: completed
  - id: verify
    content: Typecheck and browser-check public pages desktop + mobile
    status: completed
isProject: false
---

# Anti-slop UI reskin (washi + ink)

## Direction

Pick **light paper**, not another dark dashboard. Almost every AI-generated UI is midnight + gold glow + glass + Space Grotesk. ShinobiBoard should feel like a print dojo roster: cream paper, black ink, one vermillion seal for actions.

Keep: ninja ranks, character avatars, 忍 mark, Trello-style board, existing routes and copy’s meaning.

Kill: gradient headlines, blur orbs, `backdrop-blur`, `shadow-glow*`, `telemetry-tag`, `animate-ping`, macOS traffic-light mock chrome, Sparkles icons, `rounded-3xl` + stacked glass cards, Plus Jakarta / Space Grotesk pairing.

## Design tokens

Rewrite [`tailwind.config.ts`](tailwind.config.ts) and [`app/globals.css`](app/globals.css):

- Background `ink`: warm paper (`#f3eee4`)
- Surfaces: off-white cards (`#faf7f1`), slightly darker well (`#ebe4d6`)
- Text: near-black (`#1c1712`), muted brown-gray
- Accent `shinobi-gold`: remapped to vermillion seal (`#c4452d`) so existing `btn-tactile-primary` / gold class names keep working without a 200-file rename
- Borders: `rgba(28,23,18,0.14)` hairlines, not `white/8`
- Radius: 4–8px (not 16–24px)
- Shadows: none or a 1px offset ink edge; delete glow utilities
- Body: no grid dots, no radial gold/teal blobs
- Buttons: solid vermillion + cream label; secondary = ink outline on paper
- `color-scheme: light`

Fonts in [`app/layout.tsx`](app/layout.tsx): **Newsreader** (headings) + **IBM Plex Sans** (UI) + **IBM Plex Mono** (counts). Drop Plus Jakarta / Space Grotesk / JetBrains.

## Shared chrome

[`components/Navbar.tsx`](components/Navbar.tsx): sticky paper bar, hairline bottom, 忍 in a square ink stamp (no ping dot, no gold gradient tile). Wordmark in serif, no `v1.1` chip, no “LeetCode Accountability” subtitle. Nav = text links with an underline, not amber pills. Streak is `12d` in mono, not a glowing flame badge.

[`app/globals.css`](app/globals.css) component classes (`surface-panel`, `btn-tactile-*`) updated so forms/board inherit the new surfaces without rewriting every file twice.

## Marketing + auth (highest slop density)

Rewrite [`app/page.tsx`](app/page.tsx) as an editorial page, not a feature-card catalog:

- Left-aligned (or modest centered) serif headline in ink — **no gradient span**
- One short subhead, two links (Sign in / Clubs)
- Board mock: simple paper cards with black rules, not a fake browser window
- Three modes as a definition list / numbered column, not icon-glow tiles
- Rank ladder as a horizontal rule of names + XP, not six glowing portals
- Drop “Competitive LeetCode Engine”, “Claim Your Ninja Headband”, telemetry pills, Sparkles

[`app/login/page.tsx`](app/login/page.tsx): small paper panel, serif title (“Sign in”), Google button as outline + mark, no gold crest glow, no 3-up icon checklist.

## App surfaces

Apply the same language (paper cards, vermillion primary, hairline, no blur) to:

- [`app/dashboard/page.tsx`](app/dashboard/page.tsx) — greeting in ink, no gradient name
- [`app/discover/page.tsx`](app/discover/page.tsx)
- [`app/groups/[id]/page.tsx`](app/groups/[id]/page.tsx)
- [`app/duel/accept/page.tsx`](app/duel/accept/page.tsx)
- [`components/Board.tsx`](components/Board.tsx), [`Feed.tsx`](components/Feed.tsx), [`RankProgressCard.tsx`](components/RankProgressCard.tsx), [`GroupForms.tsx`](components/GroupForms.tsx), [`GroupSettings.tsx`](components/GroupSettings.tsx), [`VerifyLeetCode.tsx`](components/VerifyLeetCode.tsx), [`JoinClubButton.tsx`](components/JoinClubButton.tsx)
- Loading skeletons and [`RankAvatar.tsx`](components/RankAvatar.tsx) (`showGlow` off by default; ring = ink, not gold bloom)

Hardcoded `text-white`, `border-white/`, `bg-slate-950`, `amber-300` on these screens get swapped for token colors so they remain readable on paper.

## Out of scope

No route/API/schema changes. No Naruto title rename (spec §5). No new docs.

## Verify

Typecheck. Load `/`, `/login`, `/discover` in the browser (desktop + a narrow viewport). Dashboard/board if a session exists; otherwise confirm those files compile and match the new classes visually via the public pages + loading states.
