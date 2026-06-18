-- supabase/migrations/0005_group_adherence.sql
create table if not exists public.group_adherence (
  student_id uuid not null references auth.users(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  date       date not null,                 -- the student's local practice-day (YYYY-MM-DD)
  done       int  not null default 0,
  total      int  not null default 0,
  streak     int  not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, date)
);
alter table public.group_adherence enable row level security;

-- student writes/updates ONLY their own rows; teacher reads rows for their own students
create policy ga_student_insert on public.group_adherence for insert with check (auth.uid() = student_id);
create policy ga_student_update on public.group_adherence for update using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy ga_student_select on public.group_adherence for select using (auth.uid() = student_id);
create policy ga_teacher_select on public.group_adherence for select using (auth.uid() = teacher_id);

create index if not exists ga_teacher_date_idx on public.group_adherence (teacher_id, date);
