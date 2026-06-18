-- supabase/migrations/0003_teachers.sql
create table if not exists public.teachers (
  id            uuid primary key references auth.users(id) on delete cascade,
  referral_code text unique not null,
  program       jsonb not null default '[]'::jsonb,  -- array of practice objects (recommended program)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.teachers enable row level security;

-- owner may read/update their own teacher row (insert happens via the SECURITY DEFINER fn below)
create policy teachers_select_own on public.teachers for select using (auth.uid() = id);
create policy teachers_update_own on public.teachers for update using (auth.uid() = id) with check (auth.uid() = id);

-- idempotently turn the caller into a teacher; returns their referral_code.
-- SECURITY DEFINER so it can generate a unique code and insert; it only ever acts on auth.uid().
create or replace function public.enable_teacher_mode()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  code text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select referral_code into code from public.teachers where id = uid;
  if code is not null then return code; end if;
  -- 8 hex chars; retry on the (astronomically unlikely) unique collision
  loop
    code := substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 8);
    begin
      insert into public.teachers(id, referral_code) values (uid, code);
      return code;
    exception when unique_violation then
      -- try again with a fresh code
    end;
  end loop;
end;
$$;
revoke all on function public.enable_teacher_mode() from public;
grant execute on function public.enable_teacher_mode() to authenticated;
