-- ShinobiBoard 0002 — personal custom order (spec §4 Custom view).
-- Spec data model stores `memberships.personal_order`, but a single float per
-- (user, group) cannot encode one viewer's ordering of N cards. Resolution:
-- per-viewer positions live here; we mirror a touch timestamp into
-- memberships.personal_order for spec compat.

create table if not exists public.custom_orders (
  viewer_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  target_user_id uuid not null references public.profiles(auth_user_id) on delete cascade,
  position double precision not null,
  updated_at timestamptz not null default now(),
  primary key (viewer_id, group_id, target_user_id)
);
create index if not exists custom_orders_viewer_group_idx
  on public.custom_orders(viewer_id, group_id, position);

alter table public.custom_orders enable row level security;
drop policy if exists "own custom orders" on public.custom_orders;
create policy "own custom orders" on public.custom_orders for all to authenticated
  using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);
