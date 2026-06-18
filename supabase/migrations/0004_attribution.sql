-- supabase/migrations/0004_attribution.sql
alter table public.user_data add column if not exists referred_by_teacher uuid references public.teachers(id) on delete set null;

-- Attribute the caller to a teacher by referral_code. SET-ONCE: only writes when the caller's
-- referred_by_teacher is currently null; never lets a teacher attribute to themselves.
-- Returns the resolved teacher_id, or null if the code is unknown / already attributed / self.
-- SECURITY DEFINER so it can read teachers (which the student can't SELECT) and write the student's
-- own user_data row; it only ever mutates auth.uid()'s row.
create or replace function public.attribute_to_teacher(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  tid uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select id into tid from public.teachers where referral_code = p_code;
  if tid is null or tid = uid then return null; end if;
  -- ensure the row exists, then set-once
  insert into public.user_data(id) values (uid) on conflict (id) do nothing;
  update public.user_data
     set referred_by_teacher = tid, updated_at = now()
   where id = uid and referred_by_teacher is null;
  -- return the now-effective teacher (whether we just set it or it was already set to someone)
  select referred_by_teacher into tid from public.user_data where id = uid;
  return tid;
end;
$$;
revoke all on function public.attribute_to_teacher(text) from public;
grant execute on function public.attribute_to_teacher(text) to authenticated;
