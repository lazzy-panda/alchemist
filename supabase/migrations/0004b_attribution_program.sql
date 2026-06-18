-- supabase/migrations/0004b_attribution_program.sql
-- Drop the existing function first because we're changing its return type (uuid -> jsonb).
-- "create or replace function" cannot change the return type in Postgres.
drop function if exists public.attribute_to_teacher(text);

create or replace function public.attribute_to_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  tid uuid;
  prog jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select id, program into tid, prog from public.teachers where referral_code = p_code;
  if tid is null or tid = uid then return null; end if;
  insert into public.user_data(id) values (uid) on conflict (id) do nothing;
  update public.user_data set referred_by_teacher = tid, updated_at = now()
   where id = uid and referred_by_teacher is null;
  select referred_by_teacher into tid from public.user_data where id = uid;
  return jsonb_build_object('teacher_id', tid, 'program', coalesce(prog, '[]'::jsonb));
end;
$$;
-- a separate fn to (re)fetch the program for an already-attributed student
create or replace function public.get_my_teacher_program()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(t.program, '[]'::jsonb)
  from public.user_data u join public.teachers t on t.id = u.referred_by_teacher
  where u.id = auth.uid();
$$;
revoke all on function public.attribute_to_teacher(text) from public;
grant execute on function public.attribute_to_teacher(text) to authenticated;
revoke all on function public.get_my_teacher_program() from public;
grant execute on function public.get_my_teacher_program() to authenticated;
