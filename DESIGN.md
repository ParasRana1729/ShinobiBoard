---
name: ShinobiBoard
description: High-density competitive LeetCode group dashboard in a Dark Sumi Obsidian aesthetic
colors:
  ink: "#0c0e12"
  sumi: "#f3eee4"
  surface-card: "#14171e"
  surface-elevated: "#1b1f28"
  surface-hover: "#222733"
  primary: "#e05638"
  primary-hover: "#c94427"
  text-primary: "#f3eee4"
  text-secondary: "#9ba1ad"
  text-muted: "#636a77"
  teal: "#14b8a6"
  flame: "#f87171"
  amber: "#e5a93c"
  violet: "#a78bfa"
  orange: "#fb923c"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  metric:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System — ShinobiBoard

## Overview

ShinobiBoard rejects generic "AI SaaS" templates (floating purple neon, blurry glassmorphism, heavy drop-shadows, and bloated card radiuses) in favor of an **anti-slop, tactile Dark Sumi Obsidian dojo aesthetic**.

Inspired by Japanese ink calligraphy (*shodō*), ink stones (*suzuri*), washi paper fibers, and red wax artist seals (*hanko*), the interface is engineered for serious competitive interview prep:
- **Atmosphere**: Quiet, disciplined, sharp, and focused.
- **Hierarchy**: Restrained dark obsidian surfaces with crisp 1px hairline ink borders.
- **Accent Philosophy**: Deep vermillion seal red (`#e05638`) used purposefully for critical calls to action, rank progression, and active milestones.

---

## Colors

### Canvas & Surface Architecture (Tonal Layering)
- **Ink Canvas (`#0c0e12` / `bg-ink`)**: Ground zero background layer. Absorbs light without muddy blue tones.
- **Surface Card (`#14171e` / `bg-surface-card`)**: Primary container for board cards, stats widgets, and dialog modals.
- **Surface Elevated (`#1b1f28` / `bg-surface-elevated`)**: Secondary depth layer for well insets, quest containers, and table headers.
- **Surface Hover (`#222733` / `bg-surface-hover`)**: Subtle interactive state for clickable rows and dropdown items.

### Text & Ink Spectrum
- **Primary Sumi (`#f3eee4` / `text-text-primary`)**: High-legibility warm off-white, mimicking unbleached paper fibers.
- **Secondary Ink (`#9ba1ad` / `text-text-secondary`)**: Clean silver-gray for secondary descriptions and labels.
- **Muted Charcoal (`#636a77` / `text-text-muted`)**: Low-emphasis tone for telemetry metadata, UTC indicators, and subtitles.

### Semantic Accents & Rank Emblems
- **Vermillion Seal / Shinobi Gold (`#e05638` / `text-shinobi-gold` & `bg-shinobi-gold`)**: The signature brand seal. Reserved for primary buttons, Hokage titles, and goal meters.
- **Shinobi Teal (`#14b8a6`)**: Success, completed weekly goals, Easy problem difficulty tags, and Genin badges.
- **Shinobi Flame (`#f87171` / `#ef4444`)**: Hard difficulty problems, dangerous actions (kick/delete), and streak flames.
- **Shinobi Amber (`#e5a93c`)**: Warnings, Medium solve counts, and approaching streak decays.

---

## Typography

The typography system pairs classic editorial weight with surgical monospace precision:

```
Headings       ── Newsreader (Serif)          ── Dojo dignity & scroll heritage
Interface / UI ── IBM Plex Sans (Sans-Serif)  ── High-density UI scanability
Metrics & Time ── IBM Plex Mono (Monospace)   ── Exact solve counts & UTC timestamps
```

### Type Hierarchy
- **Display / H1 (`font-heading text-3xl sm:text-4xl`)**: Newsreader 600 weight. Used for hero taglines and group names.
- **Section Titles (`font-heading text-xl sm:text-2xl`)**: Newsreader 600 weight. Used for dashboard hubs and modal headers.
- **Card Headings (`font-heading text-base font-bold`)**: Newsreader 600 weight. Display names on people cards.
- **UI Body (`font-sans text-sm` / `text-xs`)**: IBM Plex Sans 400/500 weight. Explanatory text, settings descriptions, and button labels.
- **Data & Telemetry (`font-mono text-xs` / `text-[11px]`)**: IBM Plex Mono 500 weight. Progress counters (`7/10`), solve timestamps (`2h ago`), streak indicators, and rank badges.

---

## Layout

- **Horizontal Board Matrix (Desktop $\ge 768px$)**: Trello-style horizontal board columns with smooth horizontal scrolling (`.board-scroll`), rendering pinned cards first, followed by top performers.
- **Vertical Stack (Mobile $< 768px$)**: Fluid single-column card stack optimized for single-thumb mobile scrolling.
- **Group Command Layout**: Two-column responsive split on group pages: dynamic card matrix on the left (responsive `min-w-0`), sticky live activity feed on the right (`xl:sticky xl:top-20 xl:w-[340px]`).
- **Dashboard Grid**: 3-column asymmetric layout with a 2-column Ninja Dossier / XP Engine flanked by a 1-column Active Objectives & Quests panel.

---

## Elevation & Depth

- **Tonal Stepping**: No dramatic blurred dropshadows. Depth is conveyed strictly through progressive tonal steps (`ink #0c0e12` $\to$ `card #14171e` $\to$ `elevated #1b1f28`).
- **Hairline Dividers**: Surfaces are framed with delicate 1px sumi borders (`border border-sumi/15` or `border border-sumi/10`).
- **Tactile Card Shadow (`shadow-tactile-card`)**:
  `0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(243, 238, 228, 0.08)`
- **No Neon Halos**: All AI-template glow utilities (`shadow-glow`, `glow-gold`, `backdrop-blur`) are intentionally neutralized to `none`.

---

## Shapes & Radii

- **Disciplined Radii**:
  - `rounded-md` (6px): Default for buttons, inputs, and code chips.
  - `rounded-xl` (8px): Outer borders of smaller cards, quest pods, and alert boxes.
  - `rounded-2xl` (6px–8px redefined in Tailwind): Section cards and dialog modals.
  - `rounded-full`: Reserved strictly for status pills, difficulty badges, and circular avatar badges.
- **Avatar Frames**: Square or subtly rounded crops bordered by solid rank tier rings, avoiding soft outer shadows.

---

## Components

### 1. People Cards (`components/Board.tsx`)
- **Header**: Avatar with character rank emblem, display name in serif, LeetCode username in monospace, and rank badge `#N`.
- **Goal Bar**: Progress bar transitioning from Shinobi Gold (`bg-shinobi-gold`) to Shinobi Teal (`bg-shinobi-teal`) upon reaching goal.
- **Telemetry Chips**: Streak flame counter (`🔥 12d`) and latest solved problem badge (`slug · diff · 3h ago`).
- **Frozen Treatment**: Dimmed at 70% opacity with snowflake icon; sinking to the bottom of all views.

### 2. Button Hierarchy (`app/globals.css`)
- **Primary (`btn-tactile-primary`)**: Solid vermillion (`#e05638`), crisp white text, 1px active press displacement (`active:translate-y-px`).
- **Secondary (`btn-tactile-secondary`)**: Elevated dark surface with 1px sumi border, text-primary label.
- **Danger (`btn-tactile-danger`)**: Flame red tint (`bg-shinobi-flame/10 text-shinobi-flame border border-shinobi-flame/40`).

### 3. Difficulty Pills
- **Easy**: `border-shinobi-teal/30 bg-shinobi-teal/10 text-shinobi-teal`
- **Medium**: `border-sumi/20 bg-surface-elevated text-text-secondary`
- **Hard**: `border-shinobi-flame/30 bg-shinobi-flame/10 text-shinobi-flame`

---

## Do's and Don'ts

### ✅ DO
- **DO** use `font-heading` (Newsreader) for titles and `font-mono` (IBM Plex Mono) for all numbers, counts, and dates.
- **DO** frame cards with 1px hairline borders (`border-sumi/15`) rather than heavy drop shadows.
- **DO** use vermillion (`bg-shinobi-gold`) sparingly as a purposeful focal point.
- **DO** maintain compact, high-density card geometry that respects horizontal screen space.
- **DO** provide clear empty states that guide users toward invite codes or problem solving.

### ❌ DON'T
- **DON'T** introduce purple, indigo, or cyan cyberpunk neon gradients.
- **DON'T** use `backdrop-blur` or frosted glass effects.
- **DON'T** use overly round `rounded-3xl` bubble cards.
- **DON'T** use animated glowing rings, pulse pings, or floating sparkle emojis.
- **DON'T** display numbers in proportional sans-serif fonts; always use monospace for alignment.
