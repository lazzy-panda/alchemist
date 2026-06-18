-- supabase/migrations/0001_entitlements.sql
create table if not exists public.entitlements (
  id            uuid primary key references auth.users(id) on delete cascade,
  premium       boolean not null default false,
  premium_until timestamptz,
  plan          text,
  provider      text,
  updated_at    timestamptz not null default now()
);
alter table public.entitlements enable row level security;

-- owner may read their own entitlement
create policy entitlements_select_own on public.entitlements
  for select using (auth.uid() = id);
-- NO insert/update/delete policies → anon/authenticated clients cannot write.
-- Only the service role (Edge Functions) bypasses RLS to write.
