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
