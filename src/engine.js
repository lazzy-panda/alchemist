/* Alchemist — game state & mechanics (ported 1:1 from app.jsx) */
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRACTICES, STAT_LEVELS } from './data';
import { clamp } from './theme';
import { loadUserData, saveUserField } from './supabase';

export function useGame(userId) {
  const [practices, setPractices] = useState(() => PRACTICES.map((p) => ({ ...p })));
  const [statLevels, setStatLevels] = useState(() => JSON.parse(JSON.stringify(STAT_LEVELS)));
  const [resources, setResources] = useState({ hp: 86, hpMax: 100, qi: 64, qiMax: 100 });
  const [stage, setStage] = useState({ lvl: 8, xp: 60, next: 100 });
  const [streak] = useState(14);
  const [levelUp, setLevelUp] = useState(null);
  const [lastArchived, setLastArchived] = useState(null);
  const [avatar, setAvatarState] = useState(null);

  // persist per user: instant local cache (AsyncStorage) + authoritative cloud (Supabase user_data.game).
  // Race-safe: hydratedKey gates saves until this user's data has loaded (anon→user switch can't save seeds).
  const KEY = 'alchemist_game_' + (userId || 'anon');
  const AVATAR_KEY = 'alchemist_avatar_' + (userId || 'anon');
  const hydratedKey = useRef(null);
  const cloudTimer = useRef(null);
  const applyGame = (s) => {
    if (!s) return;
    if (Array.isArray(s.practices)) setPractices(s.practices);
    // merge over seed defaults so a legacy/partial save can't crash the Character screen
    if (s.statLevels) setStatLevels({ ...JSON.parse(JSON.stringify(STAT_LEVELS)), ...s.statLevels });
    if (s.resources) setResources(s.resources);
    if (s.stage) setStage(s.stage);
  };
  useEffect(() => {
    let cancelled = false;
    hydratedKey.current = null;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!cancelled && raw) applyGame(JSON.parse(raw)); // 1) local cache → instant / offline
        const av = await AsyncStorage.getItem(AVATAR_KEY);
        if (!cancelled && av) setAvatarState(av);
      } catch (e) {}
      if (userId) {
        const row = await loadUserData(userId); // 2) cloud → authoritative when signed in
        if (!cancelled && row && row.game) applyGame(row.game);
        if (!cancelled && row && row.avatar) setAvatarState(row.avatar);
      }
      if (!cancelled) hydratedKey.current = KEY;
    })();
    return () => { cancelled = true; };
  }, [KEY]);
  useEffect(() => {
    if (hydratedKey.current !== KEY) return; // don't persist until this key is hydrated
    const snap = { practices, statLevels, resources, stage };
    AsyncStorage.setItem(KEY, JSON.stringify(snap)).catch(() => {});
    if (userId) {
      clearTimeout(cloudTimer.current);
      cloudTimer.current = setTimeout(() => saveUserField(userId, 'game', snap), 600); // debounce cloud writes
    }
  }, [practices, statLevels, resources, stage, KEY]);

  const setDone = useCallback((target, value) => {
    setPractices((curr) => {
      const p = curr.find((x) => x.id === target.id);
      if (!p) return curr;

      if (!!p.done === value) {
        return curr.map((x) => (x.id === p.id ? { ...x, done: value, today: true } : x));
      }
      const sign = value ? 1 : -1;
      const mult = p.mult || 1;

      // stats
      setStatLevels((prev) => {
        const n = JSON.parse(JSON.stringify(prev));
        Object.entries(p.r || {}).forEach(([k, v]) => {
          if (!n[k]) return;
          n[k].xp += sign * Math.round(v * mult);
          while (n[k].xp >= n[k].next) {
            n[k].xp -= n[k].next;
            n[k].lvl += 1;
          }
          while (n[k].xp < 0 && n[k].lvl > 1) {
            n[k].lvl -= 1;
            n[k].xp += n[k].next;
          }
          if (n[k].xp < 0) n[k].xp = 0;
        });
        return n;
      });

      // qi & hp
      setResources((prev) => {
        const dq = (p.qi || 0) * sign;
        const dh = sign * 3;
        return { ...prev, qi: clamp(prev.qi + dq, 0, prev.qiMax), hp: clamp(prev.hp + dh, 0, prev.hpMax) };
      });

      // stage progress
      if (value) {
        const gained = Object.values(p.r || {}).reduce((a, b) => a + b, 0) * mult;
        setStage((prev) => {
          let { lvl, xp, next } = prev;
          xp += Math.round(gained);
          if (xp >= next) {
            xp -= next;
            lvl += 1;
            next = Math.round(next * 1.08);
            setTimeout(() => setLevelUp(lvl), 350);
          }
          return { lvl, xp, next };
        });
      }

      return curr.map((x) => (x.id === p.id ? { ...x, done: value, today: true } : x));
    });
  }, []);

  const toggle = useCallback((p) => setDone(p, !p.done), [setDone]);

  const savePractice = useCallback((data) => {
    setPractices((ps) => {
      if (data.id) return ps.map((x) => (x.id === data.id ? { ...x, ...data } : x));
      return [...ps, { ...data, id: 'p' + Date.now() }];
    });
  }, []);

  // archive (with undo) — keeps the practice in state but hidden from Today & Library
  const archivePractice = useCallback((id) => {
    setPractices((ps) => ps.map((x) => (x.id === id ? { ...x, archived: true } : x)));
    setLastArchived(id);
  }, []);
  const restorePractice = useCallback((id) => {
    setPractices((ps) => ps.map((x) => (x.id === id ? { ...x, archived: false } : x)));
    setLastArchived((cur) => (cur === id ? null : cur));
  }, []);
  const undoArchive = useCallback(() => {
    setLastArchived((id) => {
      if (id) setPractices((ps) => ps.map((x) => (x.id === id ? { ...x, archived: false } : x)));
      return null;
    });
  }, []);
  // permanent delete (archive is the soft/undoable option; this removes the practice entirely)
  const deletePractice = useCallback((id) => {
    setPractices((ps) => ps.filter((x) => x.id !== id));
    setLastArchived((cur) => (cur === id ? null : cur));
  }, []);

  const setAvatar = useCallback((id) => {
    setAvatarState(id);
    AsyncStorage.setItem('alchemist_avatar_' + (userId || 'anon'), id).catch(() => {});
    if (userId) saveUserField(userId, 'avatar', id);
  }, [userId]);

  const qiPct = resources.qi / resources.qiMax;
  const doneCount = practices.filter((p) => p.today && p.done).length;
  const dayState = qiPct < 0.25 ? 'spent' : doneCount >= 1 ? 'flow' : 'calm';

  return {
    practices,
    statLevels,
    resources,
    stage,
    streak,
    dayState,
    levelUp,
    avatar,
    setAvatar,
    clearLevelUp: () => setLevelUp(null),
    setDone,
    toggle,
    savePractice,
    archivePractice,
    restorePractice,
    undoArchive,
    deletePractice,
    lastArchived,
  };
}
