-- supabase/migrations/0006_dashboard.sql
-- Privacy-safe teacher dashboard. Returns ONE row per attributed student with numbers + paid bool
-- + display name. NEVER returns diary, game state, or raw entitlement fields. Hard-filtered to the
-- caller's own students. SECURITY DEFINER so it can join entitlements (which the teacher can't read
-- directly) and group_adherence, but it only ever exposes the safe projection below.
create or replace function public.get_teacher_dashboard()
returns table (
  student_id   uuid,
  student_label text,
  paid         boolean,
  today_done   int,
  today_total  int,
  streak       int,
  week_pct     numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with my_students as (
    select u.id, u.name
    from public.user_data u
    where u.referred_by_teacher = auth.uid()
  ),
  latest as (  -- most recent adherence row per student = "today" snapshot
    select distinct on (ga.student_id) ga.student_id, ga.done, ga.total, ga.streak
    from public.group_adherence ga
    where ga.teacher_id = auth.uid()
    order by ga.student_id, ga.date desc
  ),
  week as (    -- avg completion ratio over the last 7 days
    select ga.student_id, avg(case when ga.total > 0 then ga.done::numeric / ga.total else 0 end) as pct
    from public.group_adherence ga
    where ga.teacher_id = auth.uid() and ga.date >= (current_date - 6)
    group by ga.student_id
  )
  select
    s.id,
    coalesce(s.name, 'Ученик'),
    coalesce(e.premium and (e.premium_until is null or e.premium_until > now()), false),
    coalesce(l.done, 0),
    coalesce(l.total, 0),
    coalesce(l.streak, 0),
    round(coalesce(w.pct, 0), 2)
  from my_students s
  left join latest l on l.student_id = s.id
  left join week   w on w.student_id = s.id
  left join public.entitlements e on e.id = s.id
  order by coalesce(l.done, 0) desc, s.id;
$$;
revoke all on function public.get_teacher_dashboard() from public;
grant execute on function public.get_teacher_dashboard() to authenticated;

-- Estimated rev-share input: how many of the caller's students are currently paying.
-- The ruble conversion lives in the client (pricing params), keeping money math out of the DB.
create or replace function public.get_revshare_estimate()
returns int
language sql
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int
  from public.user_data u
  join public.entitlements e on e.id = u.id
  where u.referred_by_teacher = auth.uid()
    and e.premium and (e.premium_until is null or e.premium_until > now());
$$;
revoke all on function public.get_revshare_estimate() from public;
grant execute on function public.get_revshare_estimate() to authenticated;
