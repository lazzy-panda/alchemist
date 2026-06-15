/* Alchemist — practice card (RPGUI-framed). */
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, Animated, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, FONT } from './theme';
import { CATS, STAT } from './data';
import { KitCheck, KitGem, KitPanel } from './kit';
import { QiTag } from './badges';
import { useEffects } from './effects';
import { kf, KF, EASE } from './anim';

const WEB = Platform.OS === 'web';
const USE_NATIVE = !WEB;
const SWIPE_MAX = 96;
const SWIPE_TRIG = 64;

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

function CheckMark() {
  const v = useDrawTween(false);
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      <Path d="M4 13 L 10 18 L 20 6" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={28} strokeDashoffset={28 * (1 - v)} />
    </Svg>
  );
}

function CardBase({ done, style, children }) {
  // always grey frame — framed-golden's border-image outsets and overlaps neighbours
  return (
    <KitPanel frame="grey" contentStyle={[style, done ? { opacity: 0.82 } : null]}>
      {children}
    </KitPanel>
  );
}

function PracticeCardImpl({ p, onToggle, onOpen, locked, active, compact }) {
  const cat = CATS[p.cat];
  const cardRef = useRef(null);
  const checkRef = useRef(null);
  const [shake, setShake] = useState(false);
  const fx = useEffects();
  const rewards = Object.entries(p.r || {});

  const swipeable = !locked && !p.done && !compact && !!onToggle;
  const swipeableRef = useRef(swipeable);
  swipeableRef.current = swipeable;
  const tx = useRef(new Animated.Value(0)).current;
  const [swiping, setSwiping] = useState(false);

  const fireComplete = () => {
    if (!p.done) {
      const cols = rewards.map(([k]) => STAT[k]?.color).filter(Boolean);
      if (checkRef.current && checkRef.current.measureInWindow) checkRef.current.measureInWindow((x, y, w, hh) => fx.burst(x + w / 2, y + hh / 2, cols));
      if (cardRef.current && cardRef.current.measureInWindow) cardRef.current.measureInWindow((x, y, w) => fx.floatXp(x + w / 2, y + 12, p.r || {}));
    }
    onToggle && onToggle(p);
  };

  const handleCheck = () => {
    if (locked) { setShake(true); setTimeout(() => setShake(false), 450); return; }
    fireComplete();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) => swipeableRef.current && g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderGrant: () => setSwiping(true),
      onPanResponderMove: (e, g) => tx.setValue(Math.max(-SWIPE_MAX, Math.min(0, g.dx))),
      onPanResponderRelease: (e, g) => {
        if (g.dx < -SWIPE_TRIG) {
          Animated.timing(tx, { toValue: -SWIPE_MAX, duration: 110, useNativeDriver: USE_NATIVE }).start(() => { tx.setValue(0); setSwiping(false); fireComplete(); });
        } else {
          Animated.spring(tx, { toValue: 0, bounciness: 0, speed: 18, useNativeDriver: USE_NATIVE }).start(() => setSwiping(false));
        }
      },
      onPanResponderTerminate: () => Animated.spring(tx, { toValue: 0, bounciness: 0, speed: 18, useNativeDriver: USE_NATIVE }).start(() => setSwiping(false)),
    })
  ).current;

  const inner = (
    <View ref={cardRef} style={[{ position: 'relative' }, active ? kf(KF.breathe, 3.2, { ease: EASE.soft, iter: 'infinite' }) : null, shake ? kf(KF.shakeNo, 0.42, { ease: EASE.soft }) : null]}>
      <Pressable onPress={() => onOpen && onOpen(p)} disabled={locked} accessibilityRole="button" accessibilityLabel={p.name + (locked ? ', locked' : '')}>
        <CardBase
          done={p.done}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 56, opacity: locked ? 0.6 : 1 }}
        >
          <KitGem size={44} icon={cat.icon} color={cat.color} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={2} style={{ fontFamily: FONT.display, fontSize: 10, color: p.done ? C.jadeLight : C.ink, marginBottom: 5, lineHeight: 14 }}>{p.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: cat.color }}>{cat.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: C.inkFaint }}>{p.dur} min</Text>
              {p.mult ? <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: C.gold }}>x{p.mult}</Text> : null}
              {compact ? <QiTag qi={p.qi} /> : null}
            </View>
          </View>
        </CardBase>
      </Pressable>

      {locked ? (
        <View style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', maxWidth: 84 }} pointerEvents="none">
          <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint, textAlign: 'right', lineHeight: 12 }}>Low Qi{'\n'}need {Math.abs(p.qi)} QI</Text>
        </View>
      ) : (
        <View ref={checkRef} style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Pressable onPress={handleCheck} hitSlop={8} accessibilityRole="button" accessibilityState={{ checked: !!p.done }} accessibilityLabel={(p.done ? 'Undo: ' : 'Do: ') + p.name}>
            {({ pressed }) =>
              p.done ? (
                <KitCheck size={36} style={{ transform: pressed ? [{ scale: 1.07 }] : [] }} />
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.stoneMid, backgroundColor: C.paperWarm, transform: pressed ? [{ scale: 1.07 }] : [] }}>
                  <CheckMark />
                </View>
              )
            }
          </Pressable>
        </View>
      )}
    </View>
  );

  if (!swipeable) return inner;

  return (
    <View style={{ position: 'relative' }}>
      {swiping ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 8, backgroundColor: C.jade, alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
          <Text style={{ color: '#fff', fontFamily: FONT.display, fontSize: 9, paddingRight: 22 }}>DONE ✓</Text>
        </View>
      ) : null}
      <Animated.View {...pan.panHandlers} style={{ width: '100%', transform: [{ translateX: tx }] }}>
        {inner}
      </Animated.View>
    </View>
  );
}

export const PracticeCard = React.memo(PracticeCardImpl);
