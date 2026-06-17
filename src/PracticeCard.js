/* Alchemist — practice card (RPGUI-framed). */
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, Animated, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, FONT } from './theme';
import { CATS, STAT } from './data';
import { KitPanel, KitCheckbox } from './kit';
import { IconTile } from './PixelIcon';
import { QiTag } from './badges';
import { useEffects } from './effects';
import { kf, KF, EASE } from './anim';

const WEB = Platform.OS === 'web';
const USE_NATIVE = !WEB;
const SWIPE_MAX = 96;
const SWIPE_TRIG = 64;

// practice completion uses the genuine RPGUI checkbox sprite (KitCheckbox)

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
      <Pressable onPress={() => onOpen && onOpen(p)} disabled={locked} accessibilityRole="button" accessibilityLabel={p.name + (locked ? ', заблокировано' : '')}>
        <CardBase
          done={p.done}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 56, opacity: locked ? 0.6 : 1 }}
        >
          <IconTile name={p.icon || cat.icon} color={cat.color} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={2} style={{ fontFamily: FONT.display, fontSize: 20, color: p.done ? C.jadeLight : C.ink, marginBottom: 5, lineHeight: 28, textDecorationLine: p.done ? 'line-through' : 'none', textDecorationColor: C.jadeLight }}>{p.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: cat.color }}>{cat.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.inkFaint }}>{p.dur} мин</Text>
              {p.mult ? <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.gold }}>x{p.mult}</Text> : null}
              {compact ? <QiTag qi={p.qi} /> : null}
            </View>
          </View>
        </CardBase>
      </Pressable>

      {locked ? (
        <View style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', maxWidth: 84 }} pointerEvents="none">
          <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.inkFaint, textAlign: 'right', lineHeight: 24 }}>Мало Ци{'\n'}нужно {Math.abs(p.qi)} ЦИ</Text>
        </View>
      ) : (
        <View ref={checkRef} style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
          <Pressable onPress={handleCheck} hitSlop={8} accessibilityRole="button" accessibilityState={{ checked: !!p.done }} accessibilityLabel={(p.done ? 'Отменить: ' : 'Выполнить: ') + p.name}>
            {({ pressed }) => <KitCheckbox on={p.done} size={30} style={pressed ? { transform: [{ scale: 1.1 }] } : null} />}
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
          <Text style={{ color: '#fff', fontFamily: FONT.display, fontSize: 18, paddingRight: 22 }}>ГОТОВО ✓</Text>
        </View>
      ) : null}
      <Animated.View {...pan.panHandlers} style={{ width: '100%', transform: [{ translateX: tx }] }}>
        {inner}
      </Animated.View>
    </View>
  );
}

export const PracticeCard = React.memo(PracticeCardImpl);
