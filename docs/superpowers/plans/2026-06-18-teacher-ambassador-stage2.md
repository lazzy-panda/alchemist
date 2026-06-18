# Teacher-Ambassador Layer (Stage 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A teacher enables "teacher mode" → gets a referral deep-link and an optional recommended practice program; students who open the app through that link are attributed to the teacher once, receive the program in «Сегодня», and write a daily numbers-only adherence summary; the teacher sees a privacy-safe dashboard (per student: today done, streak, week %, paid/not) plus an estimated rev-share — and the student's diary is NEVER exposed.

**Architecture:** Extends Stage 1 (Supabase + Telegram Mini App, already merged to `main`). New tables `teachers` and `group_adherence`; `user_data` gains `referred_by_teacher`. All cross-user reads a teacher performs go through **SECURITY DEFINER** SQL functions (`enable_teacher_mode`, `attribute_to_teacher`, `get_teacher_dashboard`, `get_revshare_estimate`) that hard-filter on `auth.uid()` and return only numbers + paid bool + display name — never diary, never raw entitlements. Direct table RLS stays strict (own-row only). The client adds a Teacher screen, attribution-on-entry (Telegram `start_param`), idempotent program injection, and a debounced daily adherence write.

**Tech Stack:** Expo / react-native-web, Supabase (Auth, Postgres + RLS + SECURITY DEFINER functions, Edge Functions/Deno, optional pg_cron), Telegram Bot API + Stars (from Stage 1). Tests: Vitest (pure client helpers), Python (REST/RPC privacy + Playwright E2E).

**Environment (hosted-only — same as Stage 1):** no local Docker. Apply migrations on the hosted DB via the Management API (`SBP="$SUPABASE_PAT"` exported in the shell — never commit it; `REF=nsaeudcqgsupzmlawkhj`). Deploy Edge Functions with `SUPABASE_ACCESS_TOKEN="$SUPABASE_PAT" npx supabase functions deploy <name> --no-verify-jwt --project-ref $REF`. App + tests run locally (`npx expo start --web --port 8081`).

**Scope note (decomposition):** Groups A–E are the decision-gate-critical core (attribution → adherence → dashboard → privacy proof). **Group F (bot reminders)** is a separable fast-follow and can be lifted into its own plan if you'd rather ship the core first — it depends on pg_cron / a scheduled function and on storing the Telegram chat id.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0003_teachers.sql` (create) | `teachers` table + RLS (owner-only) + `enable_teacher_mode()` SECURITY DEFINER (idempotent, returns referral_code) |
| `supabase/migrations/0004_attribution.sql` (create) | `user_data.referred_by_teacher` column + `attribute_to_teacher(code)` SECURITY DEFINER (set-once, validates code, no self-attribution) |
| `supabase/migrations/0005_group_adherence.sql` (create) | `group_adherence` table (numbers only) + RLS (student upserts own; teacher selects own students) |
| `supabase/migrations/0006_dashboard.sql` (create) | `get_teacher_dashboard()` + `get_revshare_estimate()` SECURITY DEFINER (privacy-safe projections; never touches diary) |
| `src/teacher.js` (create) | Pure helpers (`todayAdherence`, `revshareEstimateRub`, `weekPct`) + `useTeacher()` hook |
| `src/teacher.test.js` (create) | Vitest for the pure helpers |
| `src/supabase.js` (modify) | Add `enableTeacherMode`, `loadTeacher`, `saveTeacherProgram`, `attributeToTeacher`, `saveAdherence`, `loadTeacherDashboard`, `loadRevshareEstimate` |
| `src/engine.js` (modify) | Export `todayCounts(practices)`; inject teacher program (idempotent); expose `referredBy` + `injectPractices` |
| `src/MainApp.js` (modify) | Attribution-on-entry effect; daily adherence write; Teacher screen route + ctx |
| `src/nav.js` (modify) | Conditional «Учитель» nav entry |
| `src/screens/Teacher.js` (create) | Teacher screen: enable mode, referral link, program editor, dashboard, rev-share estimate |
| `tests/teacher_privacy.py` (create) | REST/RPC test: teacher isolation + diary never exposed + set-once attribution |
| `tests/teacher_flow.py` (create) | Playwright E2E: enable → attribute → program appears → adherence on dashboard |
| `supabase/functions/send-practice-reminders/index.ts` (create, Group F) | Scheduled Telegram reminders to Premium students missing today |
| `supabase/migrations/0007_reminders.sql` (create, Group F) | `user_data.tg_chat_id` + pg_cron schedule (optional) |

---

## Group A — Data + privacy (migrations)

### Task 1: `teachers` table + `enable_teacher_mode()`

**Files:**
- Create: `supabase/migrations/0003_teachers.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply on the hosted DB and verify**

Run (PAT in `$SUPABASE_PAT`):
```bash
REF=nsaeudcqgsupzmlawkhj
python3 -c "import json;print(json.dumps({'query':open('supabase/migrations/0003_teachers.sql').read()}))" \
 | curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @- \
   "https://api.supabase.com/v1/projects/$REF/database/query"
```
Expected: `[]` (no error). Verify the table + function exist:
```bash
python3 -c "import json;print(json.dumps({'query':\"select to_regclass('public.teachers') as t, proname from pg_proc where proname='enable_teacher_mode'\"}))" \
 | curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @- "https://api.supabase.com/v1/projects/$REF/database/query"
```
Expected: a row with `t = public.teachers` and `proname = enable_teacher_mode`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_teachers.sql
git commit -m "feat(db): teachers table + enable_teacher_mode() (RLS owner-only)"
```

---

### Task 2: Attribution column + `attribute_to_teacher(code)`

**Files:**
- Create: `supabase/migrations/0004_attribution.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

> Note: `insert into user_data(id)` assumes `user_data.id` is the PK and other columns are nullable/defaulted (they are: name/avatar/game/diary are nullable). If a NOT NULL column without default exists, add a default in this migration.

- [ ] **Step 2: Apply + verify** (same Management-API pattern as Task 1, Step 2, with `0004_attribution.sql`). Verify the column:
```bash
python3 -c "import json;print(json.dumps({'query':\"select column_name from information_schema.columns where table_name='user_data' and column_name='referred_by_teacher'\"}))" \
 | curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @- "https://api.supabase.com/v1/projects/$REF/database/query"
```
Expected: one row `referred_by_teacher`.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/0004_attribution.sql
git commit -m "feat(db): referred_by_teacher + set-once attribute_to_teacher()"
```

---

### Task 3: `group_adherence` table (numbers only)

**Files:**
- Create: `supabase/migrations/0005_group_adherence.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

> The table holds ONLY counts + streak — never any diary/journal content (spec §7). The client supplies `teacher_id` from its own attributed `referred_by_teacher`; the insert/update `with check` ties every row to the writing student.

- [ ] **Step 2: Apply + verify** (Management API, `0005_group_adherence.sql`). Verify:
```bash
python3 -c "import json;print(json.dumps({'query':\"select to_regclass('public.group_adherence') as t\"}))" \
 | curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @- "https://api.supabase.com/v1/projects/$REF/database/query"
```
Expected: `t = public.group_adherence`.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/0005_group_adherence.sql
git commit -m "feat(db): group_adherence (numbers only) + student/teacher RLS"
```

---

### Task 4: Dashboard + rev-share functions

**Files:**
- Create: `supabase/migrations/0006_dashboard.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply + verify** (Management API, `0006_dashboard.sql`). Verify both functions exist:
```bash
python3 -c "import json;print(json.dumps({'query':\"select proname from pg_proc where proname in ('get_teacher_dashboard','get_revshare_estimate') order by 1\"}))" \
 | curl -s -X POST -H "Authorization: Bearer $SUPABASE_PAT" -H "Content-Type: application/json" -d @- "https://api.supabase.com/v1/projects/$REF/database/query"
```
Expected: two rows.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/0006_dashboard.sql
git commit -m "feat(db): privacy-safe get_teacher_dashboard() + get_revshare_estimate()"
```

---

## Group B — Client data layer

### Task 5: Pure helpers + supabase wiring (TDD)

**Files:**
- Create: `src/teacher.js`
- Create: `src/teacher.test.js`
- Modify: `src/supabase.js`

- [ ] **Step 1: Write the failing test**

```js
// src/teacher.test.js
import { describe, it, expect } from 'vitest';
import { todayCounts } from './engine';
import { revshareEstimateRub, weekPctLabel } from './teacher';

describe('todayCounts', () => {
  const P = (o) => ({ today: true, archived: false, done: false, ...o });
  it('counts today, non-archived done/total', () => {
    const c = todayCounts([P({ done: true }), P({ done: false }), P({ today: false, done: true }), P({ archived: true, done: true })]);
    expect(c).toEqual({ done: 1, total: 2 });
  });
  it('empty list is 0/0', () => expect(todayCounts([])).toEqual({ done: 0, total: 0 }));
});

describe('revshareEstimateRub', () => {
  it('0 paying = 0', () => expect(revshareEstimateRub(0)).toBe(0));
  // 250 Stars/mo ≈ 250₽; net after ~30% Telegram fee × 40% share, rounded
  it('scales with paying count', () => {
    const one = revshareEstimateRub(1);
    expect(one).toBeGreaterThan(0);
    expect(revshareEstimateRub(4)).toBe(one * 4);
  });
});

describe('weekPctLabel', () => {
  it('formats a 0..1 ratio as a percent string', () => {
    expect(weekPctLabel(0.5)).toBe('50%');
    expect(weekPctLabel(0)).toBe('0%');
    expect(weekPctLabel(1)).toBe('100%');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `todayCounts` / `revshareEstimateRub` / `weekPctLabel` not exported yet.

- [ ] **Step 3: Add `todayCounts` to `src/engine.js`** (near `atPracticeCap`, after the imports)

```js
// done/total over the day's visible practices (today, not archived) — used for adherence + dashboard
export function todayCounts(practices) {
  const today = (practices || []).filter((p) => p.today && !p.archived);
  return { done: today.filter((p) => p.done).length, total: today.length };
}
```

- [ ] **Step 4: Write `src/teacher.js`**

```js
// src/teacher.js — teacher-ambassador client helpers + hook
import { useEffect, useState, useCallback } from 'react';
import {
  enableTeacherMode, loadTeacher, saveTeacherProgram,
  loadTeacherDashboard, loadRevshareEstimate,
} from './supabase';

// pricing params for the rev-share ESTIMATE shown to teachers (not authoritative payout)
const PRICE_RUB = 250;       // ≈ monthly Stars price in ₽
const TELEGRAM_NET = 0.7;    // after ~30% Telegram fee
const SHARE_PCT = 0.4;       // teacher's share of net (spec default 40%)

export function revshareEstimateRub(payingCount) {
  return Math.round((payingCount || 0) * PRICE_RUB * TELEGRAM_NET * SHARE_PCT);
}
export function weekPctLabel(ratio) {
  return Math.round((ratio || 0) * 100) + '%';
}

// teacher-side state: their referral code, program, dashboard rows, rev-share estimate
export function useTeacher(userId) {
  const [teacher, setTeacher] = useState(null);   // { referral_code, program } | null
  const [rows, setRows] = useState([]);
  const [paying, setPaying] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const t = await loadTeacher(userId);
    setTeacher(t);
    if (t) {
      setRows(await loadTeacherDashboard());
      setPaying(await loadRevshareEstimate());
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const enable = useCallback(async () => {
    const code = await enableTeacherMode();
    if (code) await refresh();
    return code;
  }, [refresh]);

  const setProgram = useCallback(async (program) => {
    await saveTeacherProgram(program);
    await refresh();
  }, [refresh]);

  return { teacher, rows, paying, loading, refresh, enable, setProgram };
}
```

- [ ] **Step 5: Add the supabase helpers to `src/supabase.js`** (append after `signInWithTelegram`)

```js
/* ---- teacher-ambassador layer (Stage 2) ---- */
export async function enableTeacherMode() {
  try {
    const { data } = await supabase.rpc('enable_teacher_mode');
    return data || null; // returns the referral_code
  } catch (e) { return null; }
}
export async function loadTeacher(id) {
  try {
    const { data } = await supabase.from('teachers').select('referral_code, program').eq('id', id).maybeSingle();
    return data || null;
  } catch (e) { return null; }
}
export async function saveTeacherProgram(program) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user?.id) return;
    await supabase.from('teachers').update({ program, updated_at: new Date().toISOString() }).eq('id', u.user.id);
  } catch (e) {}
}
export async function attributeToTeacher(code) {
  try {
    const { data } = await supabase.rpc('attribute_to_teacher', { p_code: code });
    return data || null; // resolved teacher_id, or null
  } catch (e) { return null; }
}
export async function saveAdherence({ teacherId, date, done, total, streak }) {
  try {
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user?.id || !teacherId) return;
    await supabase.from('group_adherence').upsert(
      { student_id: u.user.id, teacher_id: teacherId, date, done, total, streak, updated_at: new Date().toISOString() },
      { onConflict: 'student_id,date' },
    );
  } catch (e) {}
}
export async function loadTeacherDashboard() {
  try {
    const { data } = await supabase.rpc('get_teacher_dashboard');
    return data || [];
  } catch (e) { return []; }
}
export async function loadRevshareEstimate() {
  try {
    const { data } = await supabase.rpc('get_revshare_estimate');
    return data || 0;
  } catch (e) { return 0; }
}
export async function loadReferredBy(id) {
  try {
    const { data } = await supabase.from('user_data').select('referred_by_teacher').eq('id', id).maybeSingle();
    return data?.referred_by_teacher || null;
  } catch (e) { return null; }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS (existing 9 + new `todayCounts`/`revshareEstimateRub`/`weekPctLabel` cases).

- [ ] **Step 7: Commit**
```bash
git add src/teacher.js src/teacher.test.js src/supabase.js src/engine.js
git commit -m "feat(client): teacher helpers, useTeacher hook, todayCounts (tested)"
```

---

## Group C — Attribution, program injection, adherence write

### Task 6: Attribution on Mini-App entry + program injection

**Files:**
- Modify: `src/engine.js` (add `injectPractices`)
- Modify: `src/MainApp.js` (attribution effect)
- Modify: `src/telegram.web.js` (expose `getStartParam`)

- [ ] **Step 1: Add `getStartParam` to `src/telegram.web.js`**

```js
export function getStartParam() {
  const wa = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  return (wa && wa.initDataUnsafe && wa.initDataUnsafe.start_param) || '';
}
```

- [ ] **Step 2: Add an idempotent `injectPractices` to `useGame` (`src/engine.js`)**

Add inside `useGame`, next to `savePractice`, and include it in the returned object:
```js
  // add teacher-program practices once (idempotent by stable id `tp:<teacherId>:<srcId>`)
  const injectPractices = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) return;
    setPractices((ps) => {
      const have = new Set(ps.map((x) => x.id));
      const fresh = items.filter((it) => !have.has(it.id));
      return fresh.length ? [...ps, ...fresh] : ps;
    });
  }, []);
```
Add `injectPractices,` to the `return { ... }` object.

- [ ] **Step 3: Wire attribution + injection in `src/MainApp.js`**

Add imports:
```js
import { getStartParam } from './telegram.web';
import { attributeToTeacher, loadTeacher, loadReferredBy } from './supabase';
```
Add an effect (after the existing Telegram bootstrap effect). It runs once the user id is known:
```js
  useEffect(() => {
    const uid = auth?.user?.id;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const code = getStartParam();
      let teacherId = await loadReferredBy(uid);          // already attributed?
      if (!teacherId && code) teacherId = await attributeToTeacher(code); // set-once on first entry
      if (cancelled || !teacherId) return;
      const t = await loadTeacher(teacherId);             // teacher row is readable? (only own) — program comes via dashboard fn in prod;
      // NOTE: students cannot SELECT another teacher's row (RLS). The recommended program is delivered
      // to the student through attribute_to_teacher's effect below — see Step 4.
    })();
    return () => { cancelled = true; };
  }, [auth?.user?.id]);
```

> RLS reality check: a student **cannot** `SELECT` the teacher's `teachers` row (policy is owner-only). So the program must be returned by a SECURITY DEFINER path, not a direct read. Implement Step 4 before finishing this task.

- [ ] **Step 4: Return the program from attribution (extend `attribute_to_teacher`)**

Replace the function body in a new migration `supabase/migrations/0004b_attribution_program.sql` so attribution also returns the teacher's program (so the student gets it without reading the teachers table):
```sql
-- supabase/migrations/0004b_attribution_program.sql
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
```
Apply it via the Management API (same pattern). Update `attributeToTeacher` in `src/supabase.js` to return the object, and add `getMyTeacherProgram`:
```js
export async function attributeToTeacher(code) {
  try { const { data } = await supabase.rpc('attribute_to_teacher', { p_code: code }); return data || null; }
  catch (e) { return null; }
}
export async function getMyTeacherProgram() {
  try { const { data } = await supabase.rpc('get_my_teacher_program'); return data || []; }
  catch (e) { return []; }
}
```

- [ ] **Step 5: Finalize the MainApp effect** to inject the program with stable ids

```js
  useEffect(() => {
    const uid = auth?.user?.id;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const code = getStartParam();
      let teacherId = await loadReferredBy(uid);
      let program = [];
      if (!teacherId && code) {
        const res = await attributeToTeacher(code);   // returns { teacher_id, program } | null
        if (res) { teacherId = res.teacher_id; program = res.program || []; }
      } else if (teacherId) {
        program = await getMyTeacherProgram();
      }
      if (cancelled || !teacherId || !program.length) return;
      // stable ids so re-entry never duplicates; mark source for UI grouping
      const items = program.map((p, i) => ({
        ...p, id: `tp:${teacherId}:${p.id || i}`, today: true, custom: false, fromTeacher: teacherId,
      }));
      game.injectPractices(items);
    })();
    return () => { cancelled = true; };
  }, [auth?.user?.id, game.injectPractices]);
```
(Import `getMyTeacherProgram` alongside the others.)

- [ ] **Step 6: Manual smoke** — `npm run test:unit` still green (no pure logic changed beyond Task 5); deeper validation is in the E2E (Task 10). Commit:
```bash
git add src/engine.js src/MainApp.js src/telegram.web.js src/supabase.js supabase/migrations/0004b_attribution_program.sql
git commit -m "feat: attribute student on Mini-App entry + inject teacher program (idempotent)"
```

---

### Task 7: Daily adherence write

**Files:**
- Modify: `src/MainApp.js`

- [ ] **Step 1: Add a debounced adherence-write effect** (after attribution). It writes only when the user is attributed.

```js
  // write a numbers-only daily adherence summary for attributed students (debounced)
  const adhTimer = React.useRef(null);
  useEffect(() => {
    const uid = auth?.user?.id;
    if (!uid) return;
    let cancelled = false;
    clearTimeout(adhTimer.current);
    adhTimer.current = setTimeout(async () => {
      const teacherId = await loadReferredBy(uid);
      if (cancelled || !teacherId) return;
      const { done, total } = todayCounts(game.practices);
      const date = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // local practice-day (03:00 cutoff)
      await saveAdherence({ teacherId, date, done, total, streak: game.streak });
    }, 1500);
    return () => { cancelled = true; clearTimeout(adhTimer.current); };
  }, [auth?.user?.id, game.practices, game.streak]);
```
Add imports: `todayCounts` from `./engine`, `saveAdherence`, `loadReferredBy` from `./supabase` (loadReferredBy already imported in Task 6). Ensure `React` is imported (it is) for `useRef`, or use the existing `useRef` import.

> The `date` uses the same 03:00 cutoff as `practiceDay()` so adherence rows align with the in-app day. Caching `referred_by_teacher` (e.g., in a ref) instead of re-querying each time is a fine optimization but not required for MVP.

- [ ] **Step 2: Commit**
```bash
git add src/MainApp.js
git commit -m "feat: students write a daily numbers-only adherence summary"
```

---

## Group D — Teacher UI

### Task 8: Teacher screen + conditional nav

**Files:**
- Create: `src/screens/Teacher.js`
- Modify: `src/nav.js`
- Modify: `src/MainApp.js`

- [ ] **Step 1: Write `src/screens/Teacher.js`**

```jsx
// src/screens/Teacher.js — teacher-ambassador surface: enable mode, share link, program, dashboard
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { C, FONT } from '../theme';
import { KitPanel } from '../kit';
import { Btn } from '../badges';
import { useTeacher, revshareEstimateRub, weekPctLabel } from '../teacher';

const BOT = 'helper_28052025_bot'; // @BotFather bot username (deep-link host)

function Row({ r }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.paperDeep }}>
      <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, flex: 1 }} numberOfLines={1}>{r.student_label}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 64, textAlign: 'right' }}>{r.today_done}/{r.today_total}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.gold, width: 52, textAlign: 'right' }}>🔥{r.streak}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 56, textAlign: 'right' }}>{weekPctLabel(r.week_pct)}</Text>
      <Text style={{ fontSize: 16, width: 36, textAlign: 'right' }}>{r.paid ? '💎' : '·'}</Text>
    </View>
  );
}

export function TeacherScreen({ ctx }) {
  const { teacher, rows, paying, loading, enable, refresh } = useTeacher(ctx.userId);
  const [copied, setCopied] = useState(false);
  const link = teacher ? `https://t.me/${BOT}?startapp=${teacher.referral_code}` : '';

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (!teacher) {
    return (
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <KitPanel>
          <Text style={{ fontFamily: FONT.display, fontSize: 24, color: C.gold, marginBottom: 10 }}>Режим учителя</Text>
          <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, lineHeight: 26, marginBottom: 16 }}>
            Включи режим учителя — получишь личную ссылку для учеников и приватный дашборд их практики.
            Ученики, пришедшие по ссылке, закрепляются за тобой.
          </Text>
          <Btn variant="gold" block onPress={enable}>Включить режим учителя</Btn>
        </KitPanel>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      <KitPanel>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold, marginBottom: 8 }}>Твоя ссылка</Text>
        <Text selectable style={{ fontFamily: FONT.ui, fontSize: 14, color: C.inkMuted, marginBottom: 10 }}>{link}</Text>
        <Btn variant="gold" block onPress={copy}>{copied ? 'Скопировано ✓' : 'Скопировать ссылку'}</Btn>
      </KitPanel>

      <KitPanel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>Ученики</Text>
          <Pressable onPress={refresh}><Text style={{ fontFamily: FONT.ui, fontSize: 14, color: C.inkMuted }}>{loading ? '…' : '⟳'}</Text></Pressable>
        </View>
        {rows.length === 0
          ? <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.inkFaint, paddingVertical: 8 }}>Пока никто не присоединился. Поделись ссылкой выше.</Text>
          : rows.map((r) => <Row key={r.student_id} r={r} />)}
      </KitPanel>

      <KitPanel>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold, marginBottom: 6 }}>Доход (оценка)</Text>
        <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.ink }}>
          Платящих учеников: {paying}. Примерно ≈ {revshareEstimateRub(paying)}₽/мес (rev-share).
        </Text>
      </KitPanel>
    </ScrollView>
  );
}
```

> `KitPanel` and `Btn` are existing components (`src/kit.js`, `src/badges.js`). Confirm `Btn`'s prop names during implementation (the Paywall uses `<Btn variant="gold" block …>`); match them. If `KitPanel` needs a title prop instead of children, adapt. The recommended-program editor (reusing `EditorSheet`) is deferred to a follow-up step to keep this task focused — see Task 8b note below.

- [ ] **Step 2: Add a conditional «Учитель» nav entry (`src/nav.js`)**

Change the static `NAV` to a base list plus a helper, and let callers pass whether teacher mode is on:
```js
export const NAV = [
  { key: 'today', label: 'Сегодня' },
  { key: 'character', label: 'Герой' },
  { key: 'diary', label: 'Дневник' },
];
export const TEACHER_NAV = { key: 'teacher', label: 'Учитель' };
export function navFor(isTeacher) { return isTeacher ? [...NAV, TEACHER_NAV] : NAV; }
```
Add `teacher: 'user'` (or another Pixelarticons name, e.g. `'users'`) to the `NAV_ICON` map. In `BottomNav`/`SideRail`, replace `NAV.map` with `navFor(isTeacher).map` and accept an `isTeacher` prop.

- [ ] **Step 3: Wire the screen + nav flag in `src/MainApp.js`**

- Import: `import { TeacherScreen } from './screens/Teacher';` and `import { loadTeacher } from './supabase';`
- Add `teacher` to the `SCREENS` map: `teacher: TeacherScreen`.
- Track teacher mode for the nav: `const [isTeacher, setIsTeacher] = useState(false);` and an effect `useEffect(() => { const uid = auth?.user?.id; if (uid) loadTeacher(uid).then((t) => setIsTeacher(!!t)); }, [auth?.user?.id]);`
- Pass `isTeacher` to `<BottomNav … isTeacher={isTeacher} />` and `<SideRail … isTeacher={isTeacher} />`.
- The teacher screen reads from `ctx` (already passed to screens), and `ctx.userId` exists. Ensure the active-screen render passes `ctx` to `TeacherScreen` the same way other screens receive it.

> Discoverability: until a user is a teacher, the «Учитель» tab is hidden. Provide entry to *become* a teacher via a small link on the Character screen header (e.g., a «Стать учителем» text button that does `goRoute('teacher')`), OR show the teacher tab always. Pick one during implementation; hidden-until-enabled + a Character-screen entry point is the recommended default.

- [ ] **Step 4: Commit**
```bash
git add src/screens/Teacher.js src/nav.js src/MainApp.js
git commit -m "feat(ui): teacher screen (enable, referral link, dashboard, rev-share) + conditional nav"
```

**Task 8b (follow-up, optional):** recommended-program editor — reuse `EditorSheet` to let the teacher build `teacher.program` and persist via `setProgram`. Deferred so Task 8 stays shippable; specify as its own task when scheduling.

---

## Group E — Privacy + E2E tests

### Task 9: Privacy / RLS test (the decision-gate guarantee)

**Files:**
- Create: `tests/teacher_privacy.py`

- [ ] **Step 1: Write the test** (uses the Supabase REST/RPC API directly with three sessions: teacher A, teacher B, student of A)

```python
# tests/teacher_privacy.py — proves teacher isolation + diary is never exposed.
# Uses anonymous Supabase sessions (sign_up anon) to avoid Telegram. Requires the app's
# SUPABASE_URL + anon key (public). Run: python3 tests/teacher_privacy.py
import sys, json, urllib.request

URL = "https://nsaeudcqgsupzmlawkhj.supabase.co"
ANON = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYWV1ZGNxZ3N1cHptbGF3a2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODY0ODMsImV4cCI6MjA5NzI2MjQ4M30."
        "-1QzSL6cbmV1ea05euEYl8EN_LX0grA6lrkhWHhkwbc")

def req(method, path, token, body=None):
    r = urllib.request.Request(URL + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": ANON, "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode(); return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode(); return e.code, (json.loads(raw) if raw else None)

def anon_session():
    s, d = req("POST", "/auth/v1/signup", ANON, {"data": {}})
    # anonymous sign-in endpoint returns access_token + user
    if not d or "access_token" not in d:
        s, d = req("POST", "/auth/v1/signup", ANON, {})  # fallback
    return d["access_token"], d["user"]["id"]

def rpc(name, token, args=None):
    return req("POST", f"/rest/v1/rpc/{name}", token, args or {})

def main():
    # NOTE: anonymous signups must be enabled for this project (they are — guest login uses them).
    tA, idA = anon_session()
    tB, idB = anon_session()
    student, idS = anon_session()

    # A becomes a teacher, gets a code
    s, code = rpc("enable_teacher_mode", tA); assert s == 200 and code, (s, code)

    # student attributes to A
    s, res = rpc("attribute_to_teacher", student, {"p_code": code}); assert s == 200 and res, (s, res)
    assert res["teacher_id"] == idA, res

    # student sets a DIARY value on their own row (the thing that must never leak)
    s, _ = req("PATCH", f"/rest/v1/user_data?id=eq.{idS}", student, {"diary": {"secret": "PRIVATE-XYZ"}})
    assert s in (200, 204), s

    # student writes adherence
    s, _ = req("POST", "/rest/v1/group_adherence", student,
               {"student_id": idS, "teacher_id": idA, "date": "2026-06-18", "done": 2, "total": 3, "streak": 4})
    assert s in (200, 201), s

    # 1) Teacher A sees the student in the dashboard — numbers only, no diary key
    s, dash = rpc("get_teacher_dashboard", tA); assert s == 200, (s, dash)
    me = [r for r in dash if r["student_id"] == idS]
    assert me and me[0]["today_done"] == 2 and me[0]["today_total"] == 3, dash
    assert "diary" not in json.dumps(dash) and "PRIVATE-XYZ" not in json.dumps(dash), "DIARY LEAKED!"

    # 2) Teacher B sees NOTHING about A's student
    s, dashB = rpc("get_teacher_dashboard", tB); assert s == 200, (s, dashB)
    assert all(r["student_id"] != idS for r in dashB), "CROSS-TEACHER LEAK!"

    # 3) Nobody can read the student's diary via the table (RLS own-row only)
    s, leak = req("GET", f"/rest/v1/user_data?id=eq.{idS}&select=diary", tA)
    assert (leak in (None, [])) or all("PRIVATE-XYZ" not in json.dumps(x) for x in (leak or [])), ("DIARY READABLE BY TEACHER", leak)

    # 4) Attribution is set-once: a second code (B) must NOT re-point the student
    s, codeB = rpc("enable_teacher_mode", tB); assert s == 200 and codeB
    s, res2 = rpc("attribute_to_teacher", student, {"p_code": codeB})
    assert res2 is None or res2["teacher_id"] == idA, ("SET-ONCE VIOLATED", res2)

    print("TEACHER_PRIVACY: PASS")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

Run: `python3 tests/teacher_privacy.py`
Expected: `TEACHER_PRIVACY: PASS`. If anonymous signup shape differs, adjust `anon_session()` to the project's `/auth/v1/signup` response during implementation (reconnaissance: print the first response).

- [ ] **Step 3: Commit**
```bash
git add tests/teacher_privacy.py
git commit -m "test(privacy): teacher isolation + diary never exposed + set-once attribution"
```

---

### Task 10: E2E happy path (Playwright)

**Files:**
- Create: `tests/teacher_flow.py`

- [ ] **Step 1: Write the E2E** (follows the `tests/payment_gate.py` boilerplate: guest login, onboarding skip, server on :8081). It drives TWO browser contexts — a teacher and a student — and asserts the student appears on the teacher's dashboard.

```python
# tests/teacher_flow.py — E2E: teacher enables mode → student joins via start_param → shows on dashboard.
# Reuses the guest-login + onboarding-skip pattern from payment_gate.py. Server must run on :8081.
from playwright.sync_api import sync_playwright

VW, VH = 390, 844

def enter(page):
    try:
        page.wait_for_selector('button[aria-label="Войти как гость"]', timeout=20000)
        page.click('button[aria-label="Войти как гость"]')
    except Exception:
        pass
    page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
    for _ in range(4):
        b = page.query_selector('button[aria-label="Пропустить"]') or page.query_selector('button[aria-label="Начать"]')
        if not b: break
        b.click(); page.wait_for_timeout(350)
    page.wait_for_timeout(1500)

def test_flow(url="http://localhost:8081"):
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        # --- teacher ---
        tctx = b.new_context(viewport={"width": VW, "height": VH}); tp = tctx.new_page()
        tp.goto(url, wait_until="domcontentloaded"); enter(tp)
        # navigate to the teacher screen (via Character-screen entry or the teacher tab) and enable
        tp.evaluate("() => { window.__goteacher && window.__goteacher(); }")  # if a test hook exists; else click the entry
        # Discover the real entry during implementation; then:
        tp.get_by_text("Включить режим учителя", exact=False).first.click(timeout=8000)
        tp.wait_for_selector('text=startapp=', timeout=8000)
        link = tp.get_by_text("startapp=", exact=False).first.inner_text()
        code = link.split("startapp=")[1].strip()
        assert code, ("no referral code", link)

        # --- student joins via start_param (simulate the Mini-App deep link) ---
        sctx = b.new_context(viewport={"width": VW, "height": VH}); sp = sctx.new_page()
        sp.add_init_script("window.Telegram = { WebApp: { initData: 'x', initDataUnsafe: { start_param: '%s' }, openInvoice:(l,c)=>c&&c('paid') } };" % code)
        sp.goto(url, wait_until="domcontentloaded"); enter(sp)
        sp.wait_for_timeout(3000)  # allow attribution + adherence write

        # --- teacher refreshes dashboard; student should appear ---
        tp.get_by_text("Ученики", exact=False).first.scroll_into_view_if_needed()
        tp.wait_for_timeout(500)
        # click the refresh affordance, then assert at least one student row (not the empty-state text)
        tp.reload(); enter(tp)
        tp.get_by_text("Включить режим учителя", exact=False)  # should NOT exist now (already a teacher)
        assert tp.get_by_text("Пока никто не присоединился", exact=False).count() == 0, "student not attributed/visible"

        print("TEACHER_FLOW: PASS")
        b.close()

if __name__ == "__main__":
    test_flow()
```

> This E2E is the heaviest task and depends on two backend round-trips (attribution + adherence) reaching the hosted DB. Discover the exact teacher-screen entry point and dashboard refresh selector from the live DOM during implementation (reconnaissance-then-action). If it proves flaky, the privacy test (Task 9) is the authoritative correctness gate; mark this E2E as best-effort and `log` any selector that couldn't be resolved.

- [ ] **Step 2: Run with the dev server up** (`npx expo start --web --port 8081`, then `python3 tests/teacher_flow.py`). Expected: `TEACHER_FLOW: PASS`.

- [ ] **Step 3: Commit**
```bash
git add tests/teacher_flow.py
git commit -m "test(e2e): teacher enable -> student attribution -> dashboard"
```

---

## Group F — Bot reminders (optional / splittable)

### Task 11: Scheduled practice reminders (Premium value-add)

**Files:**
- Create: `supabase/migrations/0007_reminders.sql`
- Create: `supabase/functions/send-practice-reminders/index.ts`

- [ ] **Step 1: Store the Telegram chat id** (needed to message the user). Extend `telegram-auth` (Stage 1) to persist the Telegram id on the user, and add the column:
```sql
-- supabase/migrations/0007_reminders.sql
alter table public.user_data add column if not exists tg_chat_id bigint;
```
In `supabase/functions/telegram-auth/index.ts`, after creating/finding the user, `upsert` `{ id: uid, tg_chat_id: <telegram id from initData> }` into `user_data` via the service-role admin client.

- [ ] **Step 2: Write the scheduled function** `supabase/functions/send-practice-reminders/index.ts`

```ts
// Deno — sends a Telegram reminder to Premium students who have no adherence row for today.
// Invoked on a schedule (pg_cron / Supabase scheduled function). Service-role only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
  const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

  // Premium students with a chat id and no adherence today. Two queries + set intersection
  // (no PostgREST embed: user_data and entitlements have no FK between them, only to auth.users).
  // Kept simple for MVP; paginate if the user base grows large.
  const { data: chats } = await admin.from('user_data').select('id, tg_chat_id').not('tg_chat_id', 'is', null);
  const { data: ents } = await admin.from('entitlements').select('id, premium, premium_until').eq('premium', true);
  const paid = new Set((ents || [])
    .filter((e: any) => !e.premium_until || new Date(e.premium_until) > new Date())
    .map((e: any) => e.id));
  const { data: doneRows } = await admin.from('group_adherence').select('student_id').eq('date', today);
  const done = new Set((doneRows || []).map((r: any) => r.student_id));

  let sent = 0;
  for (const u of chats || []) {
    if (!paid.has((u as any).id) || done.has((u as any).id)) continue;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: (u as any).tg_chat_id, text: '🧘 Время практики. Открой «Путь культивации» и отметь сегодняшние практики.' }),
    });
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { 'Content-Type': 'application/json' } });
});
```

- [ ] **Step 3: Deploy + schedule**
```bash
SUPABASE_ACCESS_TOKEN="$SUPABASE_PAT" npx supabase functions deploy send-practice-reminders --no-verify-jwt --project-ref $REF
```
Schedule it once daily (e.g. 18:00) via pg_cron (apply through the Management API). The schedule SQL calls the function over HTTP with the service-role key; the exact `cron.schedule(...)` + `net.http_post(...)` snippet must be confirmed against the project's enabled extensions (`pg_cron`, `pg_net`) during implementation — **flag if these extensions aren't enabled** (they're a one-time dashboard toggle, a manual user step).

- [ ] **Step 4: Commit**
```bash
git add supabase/migrations/0007_reminders.sql supabase/functions/send-practice-reminders/index.ts supabase/functions/telegram-auth/index.ts
git commit -m "feat(reminders): daily Telegram practice reminders for Premium students"
```

> **Manual user steps for Group F:** enable `pg_cron` + `pg_net` extensions in the Supabase dashboard; confirm the reminder copy/time. Because of these, Group F is the natural split point into a separate plan.

---

## Self-Review

**Spec coverage (Stage 2 of `2026-06-18-b2b-teacher-ambassador-mvp-design.md`):**
- §6.1 teacher mode + referral_code → Task 1 ✓; recommended program → Tasks 4/8 (+8b editor) ✓; dashboard → Tasks 4/8 ✓; deep-link `t.me/<bot>?startapp=<code>` → Task 8 ✓.
- §6.2 attribution on entry (set-once) → Tasks 2/6 ✓; program into «Сегодня» → Task 6 ✓; daily adherence write → Task 7 ✓.
- §6.3 Premium reminders → Task 11 (Group F) ✓ (cap/Paywall already shipped in Stage 1).
- §6.5 rev-share estimate + manual payout → Task 4 (`get_revshare_estimate`) + Task 8 client math ✓.
- §7 data model (teachers, referred_by_teacher, group_adherence numbers-only) → Tasks 1–3 ✓; **diary never exposed** → enforced by SECURITY DEFINER projections + proven in Task 9 ✓.
- §11 tests: HMAC initData (Stage 1) ✓; entitlement gating (Stage 1) ✓; rev-share query → Task 5 test ✓; adherence write → Tasks 5/9 ✓; **RLS (teacher can't read diary / others' students)** → Task 9 ✓; real Stars E2E (Stage 1 manual) ✓.

**Placeholders:** none of the disallowed kind. Two deliberate, flagged discovery points (anonymous-signup response shape in Task 9; live-DOM selectors + pg_cron snippet in Tasks 10/11) cannot be hardcoded correctly ahead of the running system and name their resolution method.

**Type/name consistency:** `referral_code`/`program` columns consistent across Tasks 1/4/8; `attribute_to_teacher` returns `{teacher_id, program}` after Task 6 Step 4 and the client (`attributeToTeacher`) + MainApp effect consume exactly that shape; `get_teacher_dashboard` columns (`student_id, student_label, paid, today_done, today_total, streak, week_pct`) match `Row`/`tests`; `todayCounts`/`saveAdherence`/`group_adherence` fields (`done,total,streak,date`) align across Tasks 3/5/7/9; `injectPractices` defined in Task 6 and used in the MainApp effect.

**Privacy invariant (the whole point):** every teacher→student read path is a SECURITY DEFINER function hard-filtered on `auth.uid()`, returning only numbers + `paid` bool + display name. Direct table RLS is own-row only. Task 9 actively proves a planted diary secret never appears in any teacher-visible response and that attribution is set-once. This is the decision-gate guarantee.

---

## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, controller review between tasks, continuous execution. Sequence A→B→C→D→E; Group F optionally split into its own plan.
2. **Inline Execution** — batch with checkpoints.

**Manual user steps gating real validation:** deploy the new build to GitHub Pages and attach the Mini App in @BotFather (so `start_param` / the teacher link resolve inside Telegram); for Group F, enable `pg_cron`+`pg_net`. The privacy test (Task 9) and unit tests run without any of that.
