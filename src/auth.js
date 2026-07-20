/* Alchemist — authentication backed by Supabase Auth (real accounts + anonymous guest,
   sessions persisted by supabase-js). Same API surface (register/login/guest/signOut) as the
   old localStorage mock, so screens are unchanged. */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, ensureUserRow } from './supabase';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function toUser(session) {
  const u = session?.user;
  if (!u) return null;
  const name = u.user_metadata?.name || (u.is_anonymous ? 'Странник' : (u.email || '').split('@')[0] || 'Алхимик');
  return { id: u.id, email: u.email || '', name, anon: !!u.is_anonymous };
}

function mapErr(error) {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('already') && m.includes('registered')) return 'Аккаунт уже существует';
  if (m.includes('user already exists')) return 'Аккаунт уже существует';
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Неверная почта или пароль';
  if (m.includes('password')) return 'Пароль не короче 6 символов';
  if (m.includes('email')) return 'Неверная почта';
  if (m.includes('network') || m.includes('fetch')) return 'Нет соединения с сервером';
  return error?.message || 'Ошибка';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const markReady = () => { if (mounted) setReady(true); };
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = toUser(data.session);
      setUser(u);
      if (u) ensureUserRow(u.id, u.name);
      markReady();
    }).catch(markReady);
    // anti-hang: never leave the user on a blank screen if the session check stalls on a slow /
    // flaky network — show the UI after a bounded wait; onAuthStateChange still restores the
    // session (and getSession's own resolve still sets the user) once the network responds.
    const t = setTimeout(markReady, 4000);
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = toUser(session);
      setUser(u);
      if (u) ensureUserRow(u.id, u.name);
    });
    return () => { mounted = false; clearTimeout(t); sub.subscription.unsubscribe(); };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const n = (name || '').trim();
    const e = (email || '').trim().toLowerCase();
    if (!n) return { error: 'Введите имя' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { error: 'Неверная почта' };
    if ((password || '').length < 6) return { error: 'Пароль не короче 6 символов' };
    const { data, error } = await supabase.auth.signUp({ email: e, password, options: { data: { name: n } } });
    if (error) return { error: mapErr(error) };
    if (!data.session) return { error: 'Подтвердите почту по ссылке из письма' }; // only if autoconfirm is ever off
    return { ok: true };
  }, []);

  const login = useCallback(async (email, password) => {
    const e = (email || '').trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: e, password });
    if (error) return { error: mapErr(error) };
    return { ok: true };
  }, []);

  const guest = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return { error: mapErr(error) };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, register, login, guest, signOut }}>{children}</AuthCtx.Provider>;
}
