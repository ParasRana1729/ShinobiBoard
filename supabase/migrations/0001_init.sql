-- ShinobiBoard (LeetCode Board v1.1) — initial schema
-- Spec §10 Data Model + §3/§4/§5/§8 constraints.
-- Run via: supabase db push (supabase/migrations/*) or psql against Postgres.
-- Assumes Supabase project (auth.users exists, pgcrypto available).

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ─── helper: updated_at ─────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─── profiles §10 ───────────────────────────────────────────────────
-- auth_user_id PK references auth.users; lc_username UNIQUE (anti-squat claim).
create table if not exists public.profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  lc_username text unique,
  display_name text not null default 'Shinobi',
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  base_rank text not null default 'Academy',
  streak integer not null default 0 check (streak >= 0),
  streak_last_date date,
  weekly_count integer not null default 0 check (weekly_count >= 0),
  weekly_hards integer not null default 0 check (weekly_hards >= 0),
  week_start date not null default (date_trunc('week', (now() at time zone 'utc') + interval '0 day')::date),
  last_sync_at timestamptz,
  sync_status text not null default 'live' check (sync_status in ('live','stale','frozen','rate_limited')),
  frozen_reason text,
  retry_at timestamptz,
  sync_cursor_ts bigint not null default 0,
  sync_cursor_id text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists profiles_lc_username_trgm on public.profiles using gin (lc_username gin_trgm_ops);

-- ─── groups §3/§10 ──────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('squad','club','duel')),
  name text not null check (char_length(name) between 1 and 80),
  code text unique,
  invite_enabled boolean not null default true,
  goal integer not null default 7 check (goal between 1 and 50),
  owner_id uuid references public.profiles(auth_user_id) on delete set null,
  member_count integer not null default 0 check (member_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists groups_type_idx on public.groups(type);
create index if not exists groups_code_idx on public.groups(code) where code is not null;

-- ─── memberships §10 ────────────────────────────────────────────────
create table if not exists public.memberships (
  user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  personal_order double precision not null default 0,
  pinned boolean not null default false,
  pinned_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (user_id, group_id)
);
create index if not exists memberships_group_idx on public.memberships(group_id, user_id);
create index if not exists memberships_user_idx on public.memberships(user_id);

-- Spec §4: "Pin up to 2 cards per membership per group".
-- The literal data-model CHECK (pinned=true count ≤ 2) is enforced here per group
-- as a backstop. Personal per-viewer pins (the real UX: each viewer pins any 2
-- cards) live in member_pins below with its own ≤2-per-(viewer,group) trigger.
create or replace function public.check_membership_pinned_limit()
returns trigger language plpgsql as $$
declare n int;
begin
  if new.pinned then
    select count(*) into n from public.memberships
    where group_id = new.group_id and pinned = true and (user_id, group_id) <> (new.user_id, new.group_id);
    if n >= 2 then
      raise exception 'PIN_LIMIT: at most 2 pinned cards per group (memberships backstop)';
    end if;
    new.pinned_at = coalesce(new.pinned_at, now());
  end if;
  return new;
end $$;
drop trigger if exists trg_membership_pinned_limit on public.memberships;
create trigger trg_membership_pinned_limit
  before insert or update of pinned on public.memberships
  for each row execute function public.check_membership_pinned_limit();

-- ─── member_pins (personal pins — resolves §4 pin semantics) ────────
-- Each viewer (membership) may pin up to 2 cards in a group. Floats to top in
-- both Leaderboard and Custom views with pin icon.
create table if not exists public.member_pins (
  viewer_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  pinned_user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  pinned_at timestamptz not null default now(),
  primary key (viewer_id, pinned_user_id, group_id),
  check (viewer_id <> pinned_user_id)
);
create index if not exists member_pins_viewer_group_idx on public.member_pins(viewer_id, group_id);

create or replace function public.check_member_pins_limit()
returns trigger language plpgsql as $$
declare n int;
begin
  select count(*) into n from public.member_pins
  where viewer_id = new.viewer_id and group_id = new.group_id
    and (viewer_id, pinned_user_id, group_id) <> (new.viewer_id, new.pinned_user_id, new.group_id);
  if n >= 2 then
    raise exception 'PIN_LIMIT: at most 2 pinned cards per membership per group';
  end if;
  return new;
end $$;
drop trigger if exists trg_member_pins_limit on public.member_pins;
create trigger trg_member_pins_limit
  before insert or update on public.member_pins
  for each row execute function public.check_member_pins_limit();

-- ─── group size caps §3 ─────────────────────────────────────────────
-- squad max 15, club max 150, duel exactly ≤2. Waitlist handled app-side.
create or replace function public.check_group_capacity()
returns trigger language plpgsql as $$
declare gtype text; n int;
begin
  select type into gtype from public.groups where id = new.group_id;
  select count(*) into n from public.memberships where group_id = new.group_id;
  if gtype = 'squad' and n > 15 then
    raise exception 'GROUP_FULL: squad cap is 15 members';
  elsif gtype = 'club' and n > 150 then
    raise exception 'GROUP_FULL: club cap is 150 members (waitlist beyond)';
  elsif gtype = 'duel' and n > 2 then
    raise exception 'GROUP_FULL: duel is exactly 2 users';
  end if;
  return new;
end $$;
drop trigger if exists trg_group_capacity on public.memberships;
create trigger trg_group_capacity
  after insert on public.memberships
  for each row execute function public.check_group_capacity();

-- keep groups.member_count in sync
create or replace function public.sync_member_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.groups set member_count = member_count + 1 where id = new.group_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
    return old;
  end if;
  return null;
end $$;
drop trigger if exists trg_sync_member_count_ins on public.memberships;
drop trigger if exists trg_sync_member_count_del on public.memberships;
create trigger trg_sync_member_count_ins after insert on public.memberships
  for each row execute function public.sync_member_count();
create trigger trg_sync_member_count_del after delete on public.memberships
  for each row execute function public.sync_member_count();

-- ─── club waitlist §3 (beyond 150) ──────────────────────────────────
create table if not exists public.group_waitlist (
  user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, group_id)
);

-- ─── solves + problem_meta §5/§7.2/§10 ──────────────────────────────
create table if not exists public.problem_meta (
  slug text primary key,
  title text not null,
  difficulty text not null check (difficulty in ('Easy','Medium','Hard')),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_problem_meta_touch on public.problem_meta;
create trigger trg_problem_meta_touch before update on public.problem_meta
  for each row execute function public.touch_updated_at();

create table if not exists public.solves (
  submission_id text primary key,
  user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  slug text not null,
  diff text not null check (diff in ('Easy','Medium','Hard')),
  lang text not null default 'unknown',
  title text,
  solved_at timestamptz not null,
  week_start date not null,
  created_at timestamptz not null default now()
);
create index if not exists solves_user_solved_idx on public.solves(user_id, solved_at desc);
create index if not exists solves_user_slug_idx on public.solves(user_id, slug);
-- weekly uniqueness for *counted* solves is (user_id, slug, week_start) — enforced
-- app-side via COUNT DISTINCT slug per week (spec §10 scoring constraints) rather
-- than a hard DB unique index, because re-submits must still be ingested (upsert
-- on submission_id) but score 0. This partial index speeds the counted query.
create index if not exists solves_user_week_slug_idx on public.solves(user_id, week_start, slug);

-- ─── verification codes §7.1 (anti-squat: SB-XXXXXX, 30-min TTL) ─────
create table if not exists public.verification_codes (
  user_id uuid primary key references public.profiles(auth_user_id) on delete cascade,
  code text not null,
  lc_username text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ─── duel invites §3.1 (JWT jti single-use ledger) ──────────────────
create table if not exists public.duel_invites (
  jti text primary key,
  from_user uuid not null references public.profiles(auth_user_id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(auth_user_id) on delete set null,
  group_id uuid references public.groups(id) on delete set null
);
create index if not exists duel_invites_from_idx on public.duel_invites(from_user);

-- ─── titles §5 (partial unique: 1 holder max per group+title while live) ──
create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (title in ('hokage','itachi','rock_lee')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create unique index if not exists titles_one_holder_idx
  on public.titles(group_id, title) where (expires_at > now());
create index if not exists titles_user_idx on public.titles(user_id, expires_at desc);

-- ─── events §8 (retention 30d, cap 200/group, prune oldest) ──────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  type text not null check (type in ('overtook','rank_up','hokage','title_awarded','weekly_winner','nudge','frozen','comeback','member_joined','member_left','goal_hit')),
  actor_id uuid references public.profiles(auth_user_id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  text text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists events_group_created_idx on public.events(group_id, created_at desc);

create or replace function public.prune_group_events()
returns trigger language plpgsql as $$
begin
  -- retention: drop rows older than 30 days for this group
  delete from public.events
  where group_id = new.group_id and created_at < now() - interval '30 days';
  -- cap: keep newest 200 per group
  delete from public.events e using (
    select id from public.events
    where group_id = new.group_id
    order by created_at desc offset 200
  ) old where e.id = old.id;
  return new;
end $$;
drop trigger if exists trg_prune_group_events on public.events;
create trigger trg_prune_group_events
  after insert on public.events
  for each row execute function public.prune_group_events();

-- ─── nudges §8/§10 (1/day per from→to per group) ────────────────────
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(auth_user_id) on delete cascade,
  to_user uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  day date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  unique (from_user, to_user, group_id, day),
  check (from_user <> to_user)
);
create index if not exists nudges_to_group_day_idx on public.nudges(to_user, group_id, day desc);

-- ─── sync_logs §7.3/§10 ─────────────────────────────────────────────
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  requested_by uuid references public.profiles(auth_user_id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'ok' check (status in ('ok','stale','rate_limited','auth_error','not_found','private','error')),
  error text,
  fetched integer not null default 0 check (fetched >= 0)
);
create index if not exists sync_logs_user_started_idx on public.sync_logs(user_id, started_at desc);
create index if not exists sync_logs_requested_by_idx on public.sync_logs(requested_by, started_at desc);

-- ═══ RLS ═══
-- Writes go through service-role API routes (bypass RLS). Policies grant
-- authenticated read so board/feed render, plus self-profile write for
-- display_name/avatar (server re-validates). Everything else denied by default.
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.member_pins enable row level security;
alter table public.group_waitlist enable row level security;
alter table public.solves enable row level security;
alter table public.problem_meta enable row level security;
alter table public.verification_codes enable row level security;
alter table public.duel_invites enable row level security;
alter table public.titles enable row level security;
alter table public.events enable row level security;
alter table public.nudges enable row level security;
alter table public.sync_logs enable row level security;

drop policy if exists "read all for authenticated" on public.profiles;
create policy "read all for authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "self update own profile" on public.profiles;
create policy "self update own profile" on public.profiles for update to authenticated
  using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
drop policy if exists "self insert own profile" on public.profiles;
create policy "self insert own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = auth_user_id);

drop policy if exists "read groups for authenticated" on public.groups;
create policy "read groups for authenticated" on public.groups for select to authenticated using (true);

drop policy if exists "read memberships for authenticated" on public.memberships;
create policy "read memberships for authenticated" on public.memberships for select to authenticated using (true);

drop policy if exists "read pins for authenticated" on public.member_pins;
create policy "read pins for authenticated" on public.member_pins for select to authenticated using (true);
drop policy if exists "manage own pins" on public.member_pins;
create policy "manage own pins" on public.member_pins for all to authenticated
  using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);

drop policy if exists "read waitlist for authenticated" on public.group_waitlist;
create policy "read waitlist for authenticated" on public.group_waitlist for select to authenticated using (true);

drop policy if exists "read solves for authenticated" on public.solves;
create policy "read solves for authenticated" on public.solves for select to authenticated using (true);

drop policy if exists "read problem_meta for authenticated" on public.problem_meta;
create policy "read problem_meta for authenticated" on public.problem_meta for select to authenticated using (true);

drop policy if exists "read titles for authenticated" on public.titles;
create policy "read titles for authenticated" on public.titles for select to authenticated using (true);

drop policy if exists "read events for authenticated" on public.events;
create policy "read events for authenticated" on public.events for select to authenticated using (true);

drop policy if exists "read nudges for authenticated" on public.nudges;
create policy "read nudges for authenticated" on public.nudges for select to authenticated using (true);

drop policy if exists "read own sync logs" on public.sync_logs;
create policy "read own sync logs" on public.sync_logs for select to authenticated
  using (auth.uid() = user_id or auth.uid() = requested_by);

drop policy if exists "own verification codes" on public.verification_codes;
create policy "own verification codes" on public.verification_codes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own duel invites" on public.duel_invites;
create policy "own duel invites" on public.duel_invites for select to authenticated
  using (auth.uid() = from_user or auth.uid() = used_by);
