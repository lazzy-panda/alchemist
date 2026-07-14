/* Alchemist — practice card (RPGUI-framed). */
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Platform, Animated, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, FONT } from './theme';
import { CATS, STAT, durLabel } from './data';
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

// per-practice streak: 7 tiny squares under the icon (icon-width), grey → green as the streak grows
function StreakPips({ streak = 0, width = 44 }) {
  return (
    <View style={{ flexDirection: 'row', width, marginTop: 4, gap: 2 }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 5, borderRadius: 1, backgroundColor: i < streak ? C.jadeLight : 'rgba(255,255,255,0.15)' }} />
      ))}
    </View>
  );
}

function PracticeCardImpl({ p, onToggle, onOpen, locked, active, compact }) {
  // never crash on an unknown/legacy category — fall back to a neutral one
  const cat = CATS[p.cat] || { name: p.cat || 'Прочее', icon: 'flag', color: C.inkMuted };
  const cardRef = useRef(null);
  const checkRef = useRef(null);
  const iconColRef = useRef(null);
  const prevLevel = useRef(p.level || 1);
  const [shake, setShake] = useState(false);
  const fx = useEffects();

  // celebrate a 7-streak level-up with a green burst over the icon (fires only when level rises)
  useEffect(() => {
    const lvl = p.level || 1;
    if (lvl > prevLevel.current && iconColRef.current && iconColRef.current.measureInWindow) {
      iconColRef.current.measureInWindow((x, y, w, h) => fx.burst(x + w / 2, y + h / 2, [C.jadeLight, C.jade, C.gold]));
    }
    prevLevel.current = lvl;
  }, [p.level]);
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
      <Pressable nativeID={'practice-card-' + p.id} onPress={() => onOpen && onOpen(p)} disabled={locked} accessibilityRole="button" accessibilityLabel={p.name + (locked ? ', заблокировано' : '')}>
        <CardBase
          done={p.done}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 56, opacity: locked ? 0.6 : 1 }}
        >
          <View ref={iconColRef} style={{ alignItems: 'center' }}>
            <View style={{ position: 'relative' }}>
              <IconTile name={p.icon || cat.icon} color={cat.color} size={44} />
              {/* practice level as a small math-style exponent in the icon's top-right corner */}
              <Text style={{ position: 'absolute', top: 4, right: 4, fontFamily: FONT.display, fontSize: 13, lineHeight: 13, color: cat.color, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{p.level || 1}</Text>
            </View>
            {compact ? null : <StreakPips streak={p.streak || 0} />}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={2} style={{ fontFamily: FONT.display, fontSize: 20, color: p.done ? C.jadeLight : C.ink, marginBottom: 5, lineHeight: 28, textDecorationLine: p.done ? 'line-through' : 'none', textDecorationColor: C.jadeLight }}>{p.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: cat.color }}>{cat.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.inkFaint }}>{durLabel(p)}</Text>
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
          <Pressable nativeID={'practice-check-' + p.id} onPress={handleCheck} hitSlop={8} accessibilityRole="button" accessibilityState={{ checked: !!p.done }} accessibilityLabel={(p.done ? 'Отменить: ' : 'Выполнить: ') + p.name}>
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
