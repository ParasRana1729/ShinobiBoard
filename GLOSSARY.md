# ShinobiBoard Domain Glossary

This glossary defines the shared domain vocabulary for ShinobiBoard. Modules and interfaces must use these terms consistently.

---

### Core Domain Entities

- **Solve**: A successful problem acceptance ("AC") on LeetCode ingested for an authenticated user.
- **Problem Slug**: The unique URL identifier for a LeetCode problem (e.g. `two-sum`).
- **Weekly Sprint**: The competitive sprint window running strictly from Monday 00:00:00 UTC to Sunday 23:59:59 UTC.
- **Weekly Count**: The count of distinct problem slugs completed within the active weekly sprint. Intra-week re-submissions of an already solved slug yield 0 extra count and 0 XP.
- **Practice XP**: Spaced repetition base XP (Easy: +1, Medium: +4, Hard: +10) awarded when solving a problem previously completed in an earlier week.
- **Base XP**: First-ever AC reward (Easy: +5, Medium: +15, Hard: +40).
- **Streak**: The number of consecutive UTC calendar days with at least one solve. Solves on the next UTC calendar day increment the streak; same-day solves maintain it; gaps of more than 1 day reset the streak to 1.
- **Streak Bonus**: Dynamic XP addition awarded per solve based on the solver's active streak tier (0 XP for 1–2 days, up to +5 XP for 30+ days).
- **Composite Cursor**: The monotonic tuple `(timestampSec, submissionId)` used to prevent duplicate ingestion or dropped submissions during concurrent polls.
- **Sync Status**: The freshness state of a user's linked LeetCode profile:
  - `live`: Last successful sync < 24 hours ago.
  - `stale`: Last successful sync 24–48 hours ago. Still ranked and eligible.
  - `frozen`: Last successful sync > 48 hours ago, or profile is private / not found. Sinks to bottom of leaderboards and disqualified from Hokage title.
  - `rate_limited`: Upstream LeetCode returned HTTP 403 or 429. Backoff applied (5m &rarr; 30m &rarr; 2h). **Never** degrades to `frozen`.

### Titles & Accolades

- **Hokage**: Crown title awarded at Monday 00:05 UTC to the #1 qualified solver in the group who achieved `weekly_count >= group.goal` and is non-frozen.
- **Itachi**: Crow title awarded to the solver with the highest count of Hard solves in the just-ended week.
- **Rock Lee**: Lotus comeback title awarded to a non-frozen solver who achieved 0 solves the previous week and $\ge 15$ solves in the current week.

### Deepened Architectural Modules

- **Solve Ingestor**: The deep module responsible for synchronizing an account against LeetCode. It coordinates upstream retrieval, difficulty resolution, duplicate filtering, chronological streak progression, practice XP calculation, cursor advancement, and freshness state transitions behind a single narrow interface (`ingestUserSolves`).
- **Storage Adapter**: The seam through which the Solve Ingestor reads and persists profile state, solve rows, difficulty metadata, and sync audit logs. Implemented by `SupabaseStorageAdapter` in production and `InMemoryStorageAdapter` in tests.
- **Upstream Adapter**: The seam through which the Solve Ingestor communicates with external LeetCode endpoints. Implemented by `LiveLeetCodeAdapter` in production and `FixtureLeetCodeAdapter` in tests.
