/* Alchemist — practice card (ported 1:1 from components.jsx) */
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, FONT, shade } from './theme';
import { CATS, STAT } from './data';
import { Gradient, Gloss, Han } from './ui';
import { RewardMedal, QiTag } from './badges';
import { useEffects } from './effects';
import { kf, KF, EASE } from './anim';

const WEB = Platform.OS === 'web';

function useDrawTween(active, dur = 340) {
  const [v, setV] = useState(active ? 1 : 0);
  useEffect(() => {
    if (!active) { setV(0); return; }
    let raf, start;
    const tick = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / dur);
      setV(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [active]);
  return v;
}

function CheckMark({ done }) {
  const v = useDrawTween(done);
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      <Path d="M4 13 L 10 18 L 20 6" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={28} strokeDashoffset={28 * (1 - v)} />
    </Svg>
  );
}

export function PracticeCard({ p, onToggle, onOpen, locked, active, compact }) {
  const cat = CATS[p.cat];
  const cardRef = useRef(null);
  const checkRef = useRef(null);
  const [shake, setShake] = useState(false);
  const fx = useEffects();
  const rewards = Object.entries(p.r || {});

  const handleCheck = () => {
    if (locked) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    if (!p.done) {
      const cols = rewards.map(([k]) => STAT[k]?.color).filter(Boolean);
      if (checkRef.current && checkRef.current.measureInWindow) {
        checkRef.current.measureInWindow((x, y, w, h) => fx.burst(x + w / 2, y + h / 2, cols));
      }
      if (cardRef.current && cardRef.current.measureInWindow) {
        cardRef.current.measureInWindow((x, y, w) => fx.floatXp(x + w / 2, y + 12, p.r || {}));
      }
    }
    onToggle && onToggle(p);
  };

  const bgColors = p.done ? ['#d8efdd', '#c2e6cd'] : locked ? [C.paperWarm, C.paperWarm] : [C.paperCell, C.paperLight];

  return (
    <View
      ref={cardRef}
      style={[
        { position: 'relative', borderRadius: 20 },
        active ? kf(KF.breathe, 3.2, { ease: EASE.soft, iter: 'infinite' }) : null,
        shake ? kf(KF.shakeNo, 0.42, { ease: EASE.soft }) : null,
      ]}
    >
      <Pressable onPress={() => onOpen && onOpen(p)} disabled={locked}>
        {({ pressed }) => (
          <Gradient
            colors={bgColors}
            angle={180}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              paddingLeft: 15,
              paddingRight: 64,
              borderRadius: 20,
              borderWidth: 2.5,
              borderColor: p.done ? '#8fc9a6' : active ? C.jade : C.paperDeep,
              opacity: locked ? 0.6 : 1,
              overflow: 'hidden',
              boxShadow: pressed && !locked ? 'inset 0px 2px 0px rgba(255,255,255,0.7), 0px 6px 16px rgba(80,52,18,0.22)' : 'inset 0px 2px 0px rgba(255,255,255,0.7), 0px 3px 8px rgba(80,52,18,0.18)',
              transform: pressed && !locked ? [{ translateY: -3 }] : [],
            }}
          >
            {/* category gem */}
            <Gradient
              colors={[cat.color, shade(cat.color, -18)]}
              angle={150}
              style={{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: C.stoneLine, overflow: 'hidden', boxShadow: 'inset 0px 3px 0px rgba(255,255,255,0.5), inset 0px -4px 8px rgba(0,0,0,0.25), 0px 3px 0px rgba(0,0,0,0.18)' }}
            >
              <Han style={{ fontSize: 25, color: '#fff', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{cat.han}</Han>
              <Gloss radius={16} />
            </Gradient>

            {/* body */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={{ fontFamily: FONT.display, fontWeight: '600', fontSize: 16, color: p.done ? C.jadeDeep : C.ink, marginBottom: 4, lineHeight: 18 }}>{p.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontFamily: FONT.ui, fontSize: 11, fontWeight: '700', color: cat.color }}>{cat.name}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.inkFaint }} />
                <Text style={{ fontFamily: FONT.ui, fontSize: 11, fontWeight: '600', color: C.inkFaint }}>{p.dur} мин</Text>
                {p.mult ? (
                  <>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.inkFaint }} />
                    <Text style={{ fontFamily: FONT.ui, fontSize: 11, fontWeight: '700', color: C.gold }}>×{p.mult}</Text>
                  </>
                ) : null}
                {!compact && rewards.slice(0, 3).map(([k, v]) => <RewardMedal key={k} stat={k} value={v} />)}
                {compact ? <QiTag qi={p.qi} /> : null}
              </View>
            </View>
          </Gradient>
        )}
      </Pressable>

      {/* check / locked — sibling overlay so taps don't open the card */}
      {locked ? (
        <View style={{ position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center', maxWidth: 90 }} pointerEvents="none">
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.inkFaint, textAlign: 'right' }}>◌ нужно {Math.abs(p.qi)} 氣</Text>
        </View>
      ) : (
        <View ref={checkRef} style={{ position: 'absolute', right: 15, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Pressable onPress={handleCheck} accessibilityLabel={p.done ? 'Отменить' : 'Выполнить'}>
            {({ pressed }) =>
              p.done ? (
                <Gradient colors={[C.jadeLight, C.jade]} angle={180} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.jadeLine, boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.4), 0px 3px 0px ' + C.jadeLine, transform: pressed ? [{ scale: 1.07 }] : [] }}>
                  <CheckMark done />
                </Gradient>
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.stoneMid, backgroundColor: C.paperWarm, boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.7), 0px 3px 0px rgba(120,80,40,0.25)', transform: pressed ? [{ scale: 1.07 }] : [] }}>
                  <CheckMark done={false} />
                </View>
              )
            }
          </Pressable>
        </View>
      )}
    </View>
  );
}
