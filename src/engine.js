/* Alchemist — game state & mechanics (ported 1:1 from app.jsx) */
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRACTICES, STAT_LEVELS } from './data';
import { clamp } from './theme';
import { loadUserData, saveUserField } from './supabase';

export const FREE_PRACTICE_CAP = 10;
// only user-created, non-archived practices count toward the free cap (seed practices are always free)
export function atPracticeCap(practices, isPremium) {
  if (isPremium) return false;
  return practices.filter((p) => p.custom && !p.archived).length >= FREE_PRACTICE_CAP;
}

// done/total over the day's visible practices (today, not archived) — used for adherence + dashboard
export function todayCounts(practices) {
  const today = (practices || []).filter((p) => p.today && !p.archived);
  return { done: today.filter((p) => p.done).length, total: today.length };
}

// Normalize a loaded practices snapshot before it ever renders:
//  • remap the retired 'zhan' (Стояние) category to 'qi' (Цигун) for legacy saves
//  • drop orphaned seeds — the old library-only practices that carry no `today` flag and were
//    never user- or teacher-made. With the Библиотека screen unwired they appear on no screen,
//    yet still populated the duplicate-name guard and the Character feeders. Keep everything the
//    user can actually reach: today's plan, the archive, and anything they or their teacher made.
export function migratePractices(practices) {
  if (!Array.isArray(practices)) return null;
  return practices
    .map((p) => (p.cat === 'zhan' ? { ...p, cat: 'qi' } : p))
    .filter((p) => p.today || p.archived || p.custom || p.fromTeacher);
}

// reorder: drop `fromId` ONTO `toId` → the dragged practice takes the target's slot and the
// target shifts after it (insert BEFORE the target, recomputing its index after removal so the
// direction doesn't matter). `toId == null` means dropped past the last item → move to the end.
// Returns the SAME instance when nothing changes so setState can bail out (no phantom saves).
export function applyReorder(list, fromId, toId) {
  const from = list.findIndex((x) => x.id === fromId);
  if (from < 0 || fromId === toId) return list;
  const next = list.slice();
  const [moved] = next.splice(from, 1);
  if (toId == null) {
    next.push(moved);
  } else {
    const to = next.findIndex((x) => x.id === toId);
    if (to < 0) return list;
    next.splice(to, 0, moved);
  }
  for (let i = 0; i < list.length; i++) if (list[i] !== next[i]) return next;
  return list;
}

// practice-day index that flips at local 03:00 (checkboxes reset at 3am, not midnight)
function practiceDay() {
  const t = new Date(Date.now() - 3 * 3600e3);
  t.setHours(0, 0, 0, 0);
  return Math.round(t.getTime() / 864e5);
}

export function useGame(userId) {
  const [practices, setPractices] = useState(() => PRACTICES.map((p) => ({ ...p })));
  const [statLevels, setStatLevels] = useState(() => JSON.parse(JSON.stringify(STAT_LEVELS)));
  const [resources, setResources] = useState({ hp: 86, hpMax: 100, qi: 64, qiMax: 100 });
  const [stage, setStage] = useState({ lvl: 8, xp: 60, next: 100 });
  const [timeMin, setTimeMin] = useState({ med: 0, qi: 0, know: 0, body: 0 }); // accumulated practice minutes per category
  const [streak, setStreak] = useState(0); // consecutive days with >=85% of the day's practices done
  const [dayStamp, setDayStamp] = useState(null); // practice-day index the `done` flags belong to
  const [levelUp, setLevelUp] = useState(null);
  const [lastArchived, setLastArchived] = useState(null);
  const [avatar, setAvatarState] = useState(null);

  // persist per user: instant local cache (AsyncStorage) + authoritative cloud (Supabase user_data.game).
  // Race-safe: hydratedKey gates saves until this user's data has loaded (anon→user switch can't save seeds).
  const KEY = 'alchemist_game_' + (userId || 'anon');
  const AVATAR_KEY = 'alchemist_avatar_' + (userId || 'anon');
  const hydratedKey = useRef(null);
  const cloudTimer = useRef(null);
  const latestSnap = useRef(null); // newest game snapshot — for an immediate flush on app hide/close
  const stateRef = useRef({});
  stateRef.current = { practices, dayStamp, streak };
  // apply a loaded snapshot AND bake in the 03:00 daily rollover deterministically (no effect-timing
  // race): if the loaded data belongs to an earlier practice-day — or predates the dayStamp system —
  // clear the checkboxes here, before they ever render, and (for a real day flip) score the streak.
  const applyGame = (s) => {
    if (!s) return;
    const cur = practiceDay();
    let ps = migratePractices(s.practices);
    let stamp = typeof s.dayStamp === 'number' ? s.dayStamp : null;
    let strk = typeof s.streak === 'number' ? s.streak : 0;
    const crossed = stamp == null || cur > stamp; // legacy (no stamp) OR a new day → reset checkboxes
    if (ps && crossed) {
      if (stamp != null) {
        const td = ps.filter((p) => p.today && !p.archived);
        const pct = td.length ? td.filter((p) => p.done).length / td.length : 0;
        strk = pct >= 0.85 ? (cur - stamp === 1 ? strk + 1 : 1) : 0;
      }
      ps = ps.map((p) => (p.done ? { ...p, done: false } : p));
    }
    if (ps) setPractices(ps);
    // merge over seed defaults so a legacy/partial save can't crash the Character screen
    if (s.statLevels) setStatLevels({ ...JSON.parse(JSON.stringify(STAT_LEVELS)), ...s.statLevels });
    if (s.resources) setResources(s.resources);
    if (s.stage) setStage(s.stage);
    if (s.timeMin) setTimeMin({ med: 0, qi: 0, know: 0, body: 0, ...s.timeMin });
    setStreak(strk);
    setDayStamp(cur);
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
      if (!cancelled) { hydratedKey.current = KEY; setDayStamp((d) => (d == null ? practiceDay() : d)); }
    })();
    return () => { cancelled = true; };
  }, [KEY]);
  useEffect(() => {
    if (hydratedKey.current !== KEY) return; // don't persist until this key is hydrated
    const snap = { practices, statLevels, resources, stage, timeMin, streak, dayStamp };
    latestSnap.current = snap;
    AsyncStorage.setItem(KEY, JSON.stringify(snap)).catch(() => {});
    if (userId) {
      clearTimeout(cloudTimer.current);
      cloudTimer.current = setTimeout(() => saveUserField(userId, 'game', snap), 600); // debounce cloud writes
    }
  }, [practices, statLevels, resources, stage, timeMin, streak, dayStamp, KEY]);

  // Flush the debounced cloud save when the app is hidden/closed (Telegram Mini App close, tab switch,
  // reload). Without this, the user's LAST action before closing — typically ticking practices, which
  // bumps the accumulated time — fell inside the 600ms debounce window and was dropped, so the all-time
  // med/qi totals appeared to reset each session while structure (saved earlier) persisted.
  useEffect(() => {
    if (!userId) return;
    const flush = () => {
      if (hydratedKey.current !== KEY || !latestSnap.current) return;
      clearTimeout(cloudTimer.current);
      saveUserField(userId, 'game', latestSnap.current);
    };
    const onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    if (typeof window !== 'undefined') window.addEventListener('pagehide', flush);
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis);
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', flush);
    };
  }, [userId, KEY]);

  // daily rollover at 03:00: evaluate prev-day 85% → streak, clear checkboxes, advance dayStamp
  const maybeRollover = useCallback(() => {
    const cur = practiceDay();
    const { practices: ps, dayStamp: prevStamp } = stateRef.current;
    if (prevStamp == null) { stateRef.current.dayStamp = cur; setDayStamp(cur); return; }
    if (cur <= prevStamp) return;
    const todayP = (ps || []).filter((p) => p.today && !p.archived);
    const pct = todayP.length ? todayP.filter((p) => p.done).length / todayP.length : 0;
    stateRef.current.dayStamp = cur; // guard re-entrancy before the re-render lands
    setStreak((s) => (pct >= 0.85 ? (cur - prevStamp === 1 ? s + 1 : 1) : 0));
    setPractices((arr) => arr.map((p) => (p.done ? { ...p, done: false } : p)));
    setDayStamp(cur);
  }, []);
  useEffect(() => {
    const id = setInterval(() => { if (hydratedKey.current === KEY) maybeRollover(); }, 60000);
    const onVis = () => { if (hydratedKey.current === KEY) maybeRollover(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVis); };
  }, [KEY, maybeRollover]);

  const setDone = useCallback((target, value) => {
    setPractices((curr) => {
      const p = curr.find((x) => x.id === target.id);
      if (!p) return curr;

      if (!!p.done === value) {
        return curr.map((x) => (x.id === p.id ? { ...x, done: value } : x));
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

      // accumulated practice minutes per category (minutes practices only; reps have no time)
      if (p.unit !== 'reps' && p.dur) {
        setTimeMin((prev) => ({ ...prev, [p.cat]: Math.max(0, (prev[p.cat] || 0) + sign * p.dur) }));
      }

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

      return curr.map((x) => (x.id === p.id ? { ...x, done: value } : x));
    });
  }, []);

  const toggle = useCallback((p) => setDone(p, !p.done), [setDone]);

  const savePractice = useCallback((data) => {
    setPractices((ps) => {
      if (data.id) return ps.map((x) => (x.id === data.id ? { ...x, ...data } : x));
      return [...ps, { ...data, id: 'p' + Date.now(), custom: true }];
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

  // add teacher-program practices once (idempotent by stable id `tp:<teacherId>:<srcId>`)
  const injectPractices = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) return;
    setPractices((ps) => {
      const have = new Set(ps.map((x) => x.id));
      const fresh = items.filter((it) => !have.has(it.id));
      return fresh.length ? [...ps, ...fresh] : ps;
    });
  }, []);

  // reorder: drop `fromId` ONTO `toId` (see applyReorder above useGame)
  const reorderPractices = useCallback((fromId, toId) => {
    setPractices((ps) => applyReorder(ps, fromId, toId));
  }, []);

  // header-metric editors (clamped, integer)
  const setTimeMinutes = useCallback((cat, minutes) => {
    setTimeMin((prev) => ({ ...prev, [cat]: Math.max(0, Math.round(minutes || 0)) }));
  }, []);
  const setStreakValue = useCallback((n) => setStreak(Math.max(0, Math.round(n || 0))), []);

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
    timeMin,
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
    reorderPractices,
    setTimeMinutes,
    setStreakValue,
    lastArchived,
    injectPractices,
  };
}
