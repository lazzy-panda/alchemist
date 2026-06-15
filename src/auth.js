/* Alchemist — authentication (local accounts via AsyncStorage, persistent session).
   Self-contained so the deployed app needs no backend. The API surface
   (register / login / signOut) is intentionally swappable for a real backend later. */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = 'alchemist_users_v1';
const SESSION_KEY = 'alchemist_session_v1';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// lightweight, cross-platform salted hash (demo-grade gate, not crypto-strong)
function hash(str) {
  let h = 5381;
  const s = 'alchemist::' + str;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16);
}

async function readUsers() {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
async function writeUsers(users) {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const email = await AsyncStorage.getItem(SESSION_KEY);
        if (email) {
          const users = await readUsers();
          const u = users[email.toLowerCase()];
          if (u && !cancelled) setUser({ id: u.id, name: u.name, email: u.email });
        }
      } catch (e) {}
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const e = (email || '').trim().toLowerCase();
    const n = (name || '').trim();
    if (!n) return { error: 'Enter your name' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { error: 'Invalid email' };
    if ((password || '').length < 4) return { error: 'Password must be 4+ characters' };
    const users = await readUsers();
    if (users[e]) return { error: 'This account already exists' };
    const u = { id: 'u' + Date.now(), name: n, email: e, hash: hash(password) };
    users[e] = u;
    await writeUsers(users);
    await AsyncStorage.setItem(SESSION_KEY, e);
    setUser({ id: u.id, name: u.name, email: u.email });
    return { ok: true };
  }, []);

  const login = useCallback(async (email, password) => {
    const e = (email || '').trim().toLowerCase();
    const users = await readUsers();
    const u = users[e];
    if (!u) return { error: 'Account not found' };
    if (u.hash !== hash(password)) return { error: 'Wrong password' };
    await AsyncStorage.setItem(SESSION_KEY, e);
    setUser({ id: u.id, name: u.name, email: u.email });
    return { ok: true };
  }, []);

  const guest = useCallback(async () => {
    const e = 'guest@alchemist.local';
    const users = await readUsers();
    if (!users[e]) {
      users[e] = { id: 'guest', name: 'Wanderer', email: e, hash: hash('guest') };
      await writeUsers(users);
    }
    await AsyncStorage.setItem(SESSION_KEY, e);
    setUser({ id: users[e].id, name: users[e].name, email: e });
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, register, login, guest, signOut }}>{children}</AuthCtx.Provider>;
}
