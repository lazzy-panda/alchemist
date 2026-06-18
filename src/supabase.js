/* Supabase client. The URL + anon key are PUBLIC (safe to ship in the frontend) — row-level
   security on the DB is what protects data. The service_role/PAT are never in here. */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nsaeudcqgsupzmlawkhj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYWV1ZGNxZ3N1cHptbGF3a2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODY0ODMsImV4cCI6MjA5NzI2MjQ4M30.-1QzSL6cbmV1ea05euEYl8EN_LX0grA6lrkhWHhkwbc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/* ---- per-user cloud state (table public.user_data, RLS = own row only) ---- */
// make sure the user's row exists without clobbering game/diary already there
export async function ensureUserRow(id, name) {
  try {
    await supabase.from('user_data').upsert({ id, name }, { onConflict: 'id', ignoreDuplicates: true });
  } catch (e) {}
}
export async function loadUserData(id) {
  try {
    const { data } = await supabase.from('user_data').select('name, avatar, game, diary').eq('id', id).maybeSingle();
    return data || null;
  } catch (e) {
    return null;
  }
}
// patch a single column so game-saves and diary-saves don't overwrite each other
export async function saveUserField(id, field, value) {
  try {
    await supabase.from('user_data').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id);
  } catch (e) {}
}

export async function loadEntitlements(id) {
  try {
    const { data } = await supabase.from('entitlements').select('premium, premium_until, plan, provider').eq('id', id).maybeSingle();
    return data || null;
  } catch (e) { return null; }
}

// exchange validated Telegram initData (via the telegram-auth Edge Function) for a Supabase session
export async function signInWithTelegram(initData) {
  const { data, error } = await supabase.functions.invoke('telegram-auth', { body: { initData } });
  if (error || !data?.access_token) return null;
  await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data;
}

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
  try { const { data } = await supabase.rpc('attribute_to_teacher', { p_code: code }); return data || null; }
  catch (e) { return null; }
}
export async function getMyTeacherProgram() {
  try { const { data } = await supabase.rpc('get_my_teacher_program'); return data || []; }
  catch (e) { return []; }
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
