/* Alchemist — qi-particle bursts + floating +XP medallions */
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { C, FONT } from './theme';
import { STAT } from './data';
import { Mh } from './badges';
import { kf, EASE, reducedMotion } from './anim';

const WEB = Platform.OS === 'web';
const EffectsCtx = createContext({ burst: () => {}, floatXp: () => {} });
export const useEffects = () => useContext(EffectsCtx);

function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function EffectsProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const add = useCallback((node, ttl) => {
    const id = ++idRef.current;
    setItems((s) => [...s, { id, node }]);
    setTimeout(() => setItems((s) => s.filter((it) => it.id !== id)), ttl);
  }, []);

  const burst = useCallback(
    (x, y, colors) => {
      if (!WEB || reducedMotion()) return;
      const cols = colors && colors.length ? colors : ['#5EA37D'];
      const n = 16;
      for (let i = 0; i < n; i++) {
        const col = cols[i % cols.length];
        const size = rand(5, 12);
        const ang = -Math.PI / 2 + rand(-1, 1);
        const dist = rand(50, 140);
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist - 30;
        const dur = rand(0.8, 1.2);
        const frames = {
          '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
          '100%': { opacity: 0, transform: [{ translateX: dx }, { translateY: dy }, { scale: 0 }] },
        };
        add(
          <View
            key={'p'}
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: col,
                boxShadow: `0px 0px 8px 1px ${col}`,
              },
              kf(frames, dur, { ease: EASE.overshoot, fill: 'forwards' }),
            ]}
          />,
          dur * 1000 + 60
        );
      }
    },
    [add]
  );

  const floatXp = useCallback(
    (x, y, rewards) => {
      if (!WEB) return;
      const reduce = reducedMotion();
      const entries = Object.entries(rewards || {});
      entries.forEach(([k, v], i) => {
        const s = STAT[k];
        if (!s) return;
        const dur = reduce ? 0.2 : 1.3;
        const frames = {
          '0%': { opacity: 0, transform: [{ translateX: -50 }, { translateY: 0 }, { scale: 0.6 }] },
          '35%': { opacity: 1, transform: [{ translateX: -50 }, { translateY: -(30 + i * 26) }, { scale: 1 }] },
          '100%': { opacity: 0, transform: [{ translateX: -50 }, { translateY: -(70 + i * 26) }, { scale: 1 }] },
        };
        add(
          <View
            key={'x'}
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: x,
                top: y,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: C.paperLight,
                borderRadius: 999,
                paddingVertical: 3,
                paddingLeft: 4,
                paddingRight: 9,
                boxShadow: '0px 4px 14px rgba(120,92,48,0.25)',
              },
              kf(frames, dur, { ease: EASE.overshoot, delay: i * 0.08, fill: 'forwards' }),
            ]}
          >
            <Mh size={18} color={s.color} han={s.han} fontSize={11} />
            <Text style={{ fontFamily: FONT.ui, fontWeight: '800', fontSize: 14, color: s.color }}>+{v}</Text>
          </View>,
          dur * 1000 + i * 80 + 120
        );
      });
    },
    [add]
  );

  return (
    <EffectsCtx.Provider value={{ burst, floatXp }}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 9999, overflow: 'visible' }}>
        {items.map((it) => (
          <React.Fragment key={it.id}>{it.node}</React.Fragment>
        ))}
      </View>
    </EffectsCtx.Provider>
  );
}
