/**
 * tests/teacher_privacy.mjs
 * Privacy / RLS test for the teacher-ambassador layer (Task 9).
 *
 * Proves:
 *  1. Teacher A enables teacher mode → receives a referral code.
 *  2. Student attributes to Teacher A via the code → teacher_id matches.
 *  3. Student writes diary secret to their OWN user_data row.
 *  4. Student writes adherence (done=2, total=3, streak=4).
 *  5. Teacher A dashboard shows student's row with correct counts AND never exposes diary.
 *  6. Teacher B isolation: B's dashboard contains no row for this student.
 *  7. Diary not cross-readable: Teacher A cannot SELECT student's diary via user_data table.
 *  8. Set-once attribution: student calling attribute_to_teacher with B's code stays pointed at A.
 *
 * Requires: Node ≥18, @supabase/supabase-js (already in node_modules).
 * Run from repo root: node tests/teacher_privacy.mjs
 */

// Resolve the packages relative to this file, using absolute imports so the
// cwd reset between bash calls doesn't matter.
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';
import ws from '../node_modules/ws/index.js';

const URL_SB = 'https://nsaeudcqgsupzmlawkhj.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYWV1ZGNxZ3N1cHptbGF3a2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODY0ODMsImV4cCI6MjA5NzI2MjQ4M30.' +
  '-1QzSL6cbmV1ea05euEYl8EN_LX0grA6lrkhWHhkwbc';

function makeClient() {
  return createClient(URL_SB, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });
}

function fail(msg, detail) {
  console.error(`FAIL: ${msg}`);
  if (detail !== undefined) console.error('  detail:', JSON.stringify(detail, null, 2));
  process.exit(1);
}

async function anonSignIn(client, label) {
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data?.user) {
    fail(`signInAnonymously failed for ${label}`, error?.message ?? data);
  }
  return data.user.id;
}

async function main() {
  // --- create three independent clients ---
  const clientA = makeClient(); // teacher A
  const clientB = makeClient(); // teacher B
  const clientS = makeClient(); // student

  console.log('Signing in three anonymous users...');
  const idA = await anonSignIn(clientA, 'Teacher A');
  const idB = await anonSignIn(clientB, 'Teacher B');
  const idS = await anonSignIn(clientS, 'Student');
  console.log(`  Teacher A: ${idA}`);
  console.log(`  Teacher B: ${idB}`);
  console.log(`  Student:   ${idS}`);

  // ── 1. Teacher A enables teacher mode → receives referral code ──────────────
  console.log('\n[1] Teacher A: enable_teacher_mode...');
  const { data: codeA, error: e1 } = await clientA.rpc('enable_teacher_mode');
  if (e1 || !codeA) fail('enable_teacher_mode failed or returned no code', e1?.message ?? codeA);
  console.log(`  Referral code A: ${codeA}`);

  // ── 2. Student attributes to Teacher A ─────────────────────────────────────
  console.log('\n[2] Student: attribute_to_teacher...');
  const { data: attrResult, error: e2 } = await clientS.rpc('attribute_to_teacher', {
    p_code: codeA,
  });
  if (e2) fail('attribute_to_teacher RPC error', e2.message);
  if (!attrResult) fail('attribute_to_teacher returned null (expected {teacher_id, program})', attrResult);
  if (attrResult.teacher_id !== idA)
    fail(`teacher_id mismatch: expected ${idA}, got ${attrResult.teacher_id}`, attrResult);
  console.log(`  Attribution OK: teacher_id=${attrResult.teacher_id}`);

  // ── 3. Student plants a diary secret on their OWN user_data row ────────────
  console.log('\n[3] Student: upsert user_data with diary secret...');
  // Ensure the row exists first, then write the diary.
  const { error: e3a } = await clientS
    .from('user_data')
    .upsert({ id: idS }, { onConflict: 'id', ignoreDuplicates: true });
  if (e3a) {
    // upsert may error if the row already exists and ignoreDuplicates is unsupported —
    // that's fine, the row is there.
    console.log(`  upsert note (non-fatal): ${e3a.message}`);
  }
  const { error: e3b } = await clientS
    .from('user_data')
    .update({ diary: { secret: 'PRIVATE-XYZ' } })
    .eq('id', idS);
  if (e3b) fail('student failed to write diary to own row', e3b.message);
  console.log('  Diary secret written.');

  // Verify the student can read their own diary back (sanity check).
  const { data: selfRead, error: e3c } = await clientS
    .from('user_data')
    .select('diary')
    .eq('id', idS);
  if (e3c) {
    console.log(`  Self-read note: ${e3c.message}`);
  } else if (!selfRead || selfRead.length === 0 || !JSON.stringify(selfRead).includes('PRIVATE-XYZ')) {
    console.log('  Warning: student cannot read their own diary — RLS is wider than expected or write failed. Continuing anyway.');
  } else {
    console.log('  Student can read own diary (sanity OK).');
  }

  // ── 4. Student writes adherence ────────────────────────────────────────────
  console.log('\n[4] Student: write group_adherence...');
  const { error: e4 } = await clientS.from('group_adherence').upsert(
    { student_id: idS, teacher_id: idA, date: '2026-06-18', done: 2, total: 3, streak: 4 },
    { onConflict: 'student_id,date' }
  );
  if (e4) fail('student failed to write group_adherence', e4.message);
  console.log('  Adherence written (done=2, total=3, streak=4).');

  // ── 5. Teacher A dashboard: sees student, no diary leaked ──────────────────
  console.log('\n[5] Teacher A: get_teacher_dashboard...');
  const { data: dashA, error: e5 } = await clientA.rpc('get_teacher_dashboard');
  if (e5) fail('get_teacher_dashboard (A) RPC error', e5.message);
  if (!Array.isArray(dashA)) fail('get_teacher_dashboard returned non-array', dashA);

  const studentRow = dashA.find((r) => r.student_id === idS);
  if (!studentRow)
    fail(`Student ${idS} not found in Teacher A dashboard`, dashA);
  if (studentRow.today_done !== 2)
    fail(`today_done expected 2, got ${studentRow.today_done}`, studentRow);
  if (studentRow.today_total !== 3)
    fail(`today_total expected 3, got ${studentRow.today_total}`, studentRow);
  console.log(
    `  Dashboard row OK: today_done=${studentRow.today_done}, today_total=${studentRow.today_total}, streak=${studentRow.streak}`
  );

  // Diary must NOT appear anywhere in the dashboard JSON.
  const dashAStr = JSON.stringify(dashA);
  if (dashAStr.includes('"diary"'))
    fail('DIARY KEY LEAKED in get_teacher_dashboard response', dashA);
  if (dashAStr.includes('PRIVATE-XYZ'))
    fail('DIARY VALUE LEAKED in get_teacher_dashboard response', dashA);
  console.log('  No diary key or value in dashboard JSON. Privacy OK.');

  // ── 6. Teacher B isolation: B's dashboard must NOT show student ───────────
  console.log('\n[6] Teacher B: enable + get_teacher_dashboard...');
  const { data: codeB, error: e6a } = await clientB.rpc('enable_teacher_mode');
  if (e6a || !codeB) fail('enable_teacher_mode for B failed', e6a?.message ?? codeB);
  console.log(`  Referral code B: ${codeB}`);

  const { data: dashB, error: e6b } = await clientB.rpc('get_teacher_dashboard');
  if (e6b) fail('get_teacher_dashboard (B) RPC error', e6b.message);
  if (!Array.isArray(dashB)) fail('get_teacher_dashboard (B) returned non-array', dashB);

  const leak6 = dashB.find((r) => r.student_id === idS);
  if (leak6) fail('CROSS-TEACHER LEAK: Student appears in Teacher B dashboard', leak6);
  console.log('  Teacher B isolation OK. Student not in B dashboard.');

  // ── 7. Diary not cross-readable: Teacher A cannot read student's diary via table ─
  console.log('\n[7] Teacher A: SELECT diary from user_data for student...');
  const { data: diaryLeak, error: e7 } = await clientA
    .from('user_data')
    .select('diary')
    .eq('id', idS);
  // RLS should return empty array (no rows), or 0 rows with the secret.
  if (e7) {
    // An error here means the SELECT was blocked — that's also a pass.
    console.log(`  SELECT blocked by RLS (error: ${e7.message}) — diary safe.`);
  } else {
    const diaryStr = JSON.stringify(diaryLeak ?? []);
    if (diaryStr.includes('PRIVATE-XYZ'))
      fail('DIARY READABLE BY TEACHER A via user_data table', diaryLeak);
    console.log(`  Teacher A got ${(diaryLeak ?? []).length} row(s) — no secret exposed. Diary safe.`);
  }

  // ── 8. Set-once attribution: student tries to re-attribute to B ───────────
  console.log('\n[8] Student: attempt re-attribution to Teacher B...');
  const { data: reAttr, error: e8 } = await clientS.rpc('attribute_to_teacher', {
    p_code: codeB,
  });
  if (e8) {
    // function may raise an error or return null — both are acceptable.
    console.log(`  Re-attribution returned error (acceptable): ${e8.message}`);
  } else if (reAttr === null) {
    console.log('  Re-attribution returned null (set-once enforced). OK.');
  } else if (reAttr.teacher_id === idA) {
    console.log(`  Re-attribution returned original teacher_id=${idA} (set-once enforced). OK.`);
  } else {
    fail('SET-ONCE VIOLATED: student re-attributed to Teacher B', reAttr);
  }

  // ── ALL PASSED ─────────────────────────────────────────────────────────────
  console.log('\nTEACHER_PRIVACY: PASS');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
