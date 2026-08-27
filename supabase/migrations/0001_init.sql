-- Free Me — initial schema.
-- Apply with `pnpm db:push` (after `supabase link`) or paste into the Supabase SQL editor.
--
-- The API talks to Postgres with the service-role key (server only), so it can read and
-- write every row. Row-level security below is what protects data if a browser ever
-- talks to Supabase directly: a signed-in person can read only their own rows.

create extension if not exists pgcrypto;

-- One row per session: a guest (cookie id) or a signed-in person ("user:<uuid>").
-- `data` is the StoredSession document the app already uses (profile, plan, metrics,
-- progress events, allocations, background-upgrade state).
create table if not exists public.sessions (
  id          text primary key,
  user_id     uuid references auth.users (id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

-- Append-only history of every plan produced (template, AI upgrade, demo) with token
-- usage — this is the cost dashboard's source of truth.
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null references public.sessions (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete cascade,
  version     integer not null,
  source      text not null check (source in ('ai', 'template')),
  mode        text not null,
  plan        jsonb not null,
  metrics     jsonb not null,
  usage       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists plans_session_idx on public.plans (session_id, created_at desc);
create index if not exists plans_user_idx on public.plans (user_id, created_at desc);

alter table public.sessions enable row level security;
alter table public.plans    enable row level security;

drop policy if exists "read own sessions" on public.sessions;
create policy "read own sessions" on public.sessions
  for select using (auth.uid() = user_id);

drop policy if exists "read own plans" on public.plans;
create policy "read own plans" on public.plans
  for select using (auth.uid() = user_id);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists sessions_touch on public.sessions;
create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();
