/* Alchemist — game state & mechanics (ported 1:1 from app.jsx) */
import { useState, useCallback } from 'react';
import { PRACTICES, STAT_LEVELS } from './data';
import { clamp } from './theme';

export function useGame() {
  const [practices, setPractices] = useState(() => PRACTICES.map((p) => ({ ...p })));
  const [statLevels, setStatLevels] = useState(() => JSON.parse(JSON.stringify(STAT_LEVELS)));
  const [resources, setResources] = useState({ hp: 86, hpMax: 100, qi: 64, qiMax: 100 });
  const [stage, setStage] = useState({ lvl: 8, xp: 60, next: 100 });
  const [streak] = useState(14);
  const [levelUp, setLevelUp] = useState(null);

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
    clearLevelUp: () => setLevelUp(null),
    setDone,
    toggle,
    savePractice,
  };
}
