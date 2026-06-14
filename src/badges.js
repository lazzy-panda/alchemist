/* Alchemist — gem medallions, resource bars, state chips, avatar, mist */
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, clamp } from './theme';
import { STAT } from './data';
import { Gradient, Gloss, Han, ts, angleToStartEnd } from './ui';
import { kf, tr, KF, EASE } from './anim';

const WEB = Platform.OS === 'web';

/* ---------- gem medallion (.mh) ---------- */
export function Mh({ size = 20, color, han, fontSize, radius, opacity = 1, square = false }) {
  const br = radius != null ? radius : square ? Math.round(size * 0.28) : size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: br,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color,
        borderWidth: 2,
        borderColor: C.stoneLine,
        overflow: 'hidden',
        opacity,
        boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.45), inset 0px -2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <Han style={{ fontSize: fontSize || size * 0.62, color: '#fff', textAlign: 'center' }}>{han}</Han>
      <Gloss radius={br} />
    </View>
  );
}

export function StatMedal({ stat, size = 18, fontSize }) {
  const s = STAT[stat] || stat;
  return <Mh size={size} color={s.color} han={s.han} fontSize={fontSize} square />;
}

/* ---------- reward medallion (+N) ---------- */
export function RewardMedal({ stat, value }) {
  const s = STAT[stat];
  if (!s) return null;
  return (
    <Gradient
      colors={['#fff', C.paperWarm]}
      angle={180}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 26,
        paddingLeft: 4,
        paddingRight: 10,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: C.paperDeep,
        boxShadow: 'inset 0px 1px 0px rgba(255,255,255,0.8), 0px 2px 0px rgba(120,80,40,0.18)',
      }}
    >
      <Mh size={20} color={s.color} han={s.han} fontSize={11} />
      <Text style={{ fontFamily: FONT.display, fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'], color: s.color }}>+{value}</Text>
    </Gradient>
  );
}

/* ---------- plain medal pill (custom content) ---------- */
export function MedalPill({ children, style }) {
  return (
    <Gradient
      colors={['#fff', C.paperWarm]}
      angle={180}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 26,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: C.paperDeep,
          boxShadow: 'inset 0px 1px 0px rgba(255,255,255,0.8), 0px 2px 0px rgba(120,80,40,0.18)',
        },
        style,
      ]}
    >
      {children}
    </Gradient>
  );
}

/* ---------- qi tag ---------- */
export function QiTag({ qi }) {
  if (!qi) return null;
  const cost = qi < 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Han style={{ fontSize: 12, color: cost ? C.red : C.cEnergy }}>氣</Han>
      <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 12.5, fontVariant: ['tabular-nums'], color: cost ? C.red : C.cEnergy }}>
        {cost ? '−' + Math.abs(qi) : '+' + qi}
      </Text>
    </View>
  );
}

/* ---------- plain progress bar (dark track + colored fill) ---------- */
export function Bar({ pct, colors, color, height = 16 }) {
  const cols = colors || [color, color];
  return (
    <View style={{ height, borderRadius: 999, overflow: 'hidden', borderWidth: 2.5, borderColor: C.stoneLine, backgroundColor: '#46301a', boxShadow: 'inset 0px 2px 5px rgba(0,0,0,0.5)' }}>
      <Gradient colors={cols} angle={180} style={[{ height: '100%', width: clamp(pct, 0, 100) + '%', borderRadius: 999, boxShadow: 'inset 0px 3px 0px rgba(255,255,255,0.45), inset 0px -4px 7px rgba(0,0,0,0.22)' }, tr('width', 0.6)]} />
    </View>
  );
}

/* ---------- resource bar ---------- */
export function ResourceBar({ kind, han, label, value, max, glow }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fillColors = kind === 'hp' ? ['#e8836a', C.red] : ['#66ccba', '#259081'];
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Han style={{ fontSize: 16, color: kind === 'hp' ? C.red : C.cEnergy }}>{han}</Han>
          <Text style={{ fontFamily: FONT.ui, fontSize: 12, fontWeight: '600', color: C.inkMuted }}>{label}</Text>
        </View>
        <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], color: C.inkMuted }}>
          {Math.round(value)} / {max}
        </Text>
      </View>
      <View
        style={{
          height: 18,
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 2.5,
          borderColor: C.stoneLine,
          backgroundColor: '#46301a',
          boxShadow: 'inset 0px 2px 5px rgba(0,0,0,0.5)',
        }}
      >
        <Gradient
          colors={fillColors}
          angle={180}
          style={[{ height: '100%', width: pct + '%', borderRadius: 999, overflow: 'hidden', boxShadow: 'inset 0px 3px 0px rgba(255,255,255,0.45), inset 0px -4px 7px rgba(0,0,0,0.22)' }, tr('width', 0.6)]}
        >
          {/* sheen */}
          <View
            pointerEvents="none"
            style={[
              { position: 'absolute', top: 0, bottom: 0, width: '40%', backgroundColor: 'transparent' },
              WEB ? { backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' } : { backgroundColor: 'rgba(255,255,255,0.18)' },
              kf(KF.sheen, 3.4, { ease: EASE.linear, iter: 'infinite' }),
            ]}
          />
          {/* glow */}
          {glow ? (
            <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, boxShadow: '0px 0px 14px 2px rgba(94,205,186,0.8)' }, kf(KF.barGlow, 2.6, { ease: EASE.soft, iter: 'infinite' })]} />
          ) : null}
        </Gradient>
      </View>
    </View>
  );
}

/* ---------- state chip ---------- */
export const STATE_DEFS = {
  flow: { ico: '🌀', label: 'В потоке', colors: [C.jadeLight, C.jade], border: C.jadeLine, text: '#fff' },
  inspired: { ico: '✨', label: 'Вдохновлён', colors: [C.goldLight, C.gold], border: C.goldLine, text: '#4a3410' },
  spent: { ico: '🥀', label: 'Истощён', colors: ['#e08a76', C.red], border: C.redLine, text: '#fff' },
  streak: { ico: '🔥', label: '', colors: ['#5bc0a8', '#2c8c7b'], border: '#1c5d50', text: '#fff' },
  calm: { ico: '🌙', label: 'Покой', colors: ['#8ba6d6', '#5571a6'], border: '#38507c', text: '#fff' },
};

export function StateChip({ state, text }) {
  const d = STATE_DEFS[state] || STATE_DEFS.flow;
  return (
    <Gradient
      colors={d.colors}
      angle={180}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingVertical: 7,
        paddingLeft: 9,
        paddingRight: 14,
        borderRadius: 999,
        borderWidth: 2.5,
        borderColor: d.border,
        boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.3), 0px 3px 0px rgba(0,0,0,0.18)',
      }}
    >
      <Text style={{ fontSize: 14 }}>{d.ico}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '600', color: d.text, ...(d.text === '#fff' ? ts('rgba(0,0,0,0.25)', 0, 1) : ts('rgba(255,255,255,0.4)', 0, 1)) }}>
        {text || d.label}
      </Text>
    </Gradient>
  );
}

/* ---------- avatar ---------- */
export function Avatar({ flow, size = 96 }) {
  const se = angleToStartEnd(150);
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={['#fcf3da', '#e2cfa0']}
        start={se.start}
        end={se.end}
        style={{
          width: size,
          height: size,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: C.stoneLine,
          boxShadow: flow
            ? `inset 0px 0px 0px 3px ${C.jadeLight}, inset 0px 3px 6px rgba(255,255,255,0.6), 0px 0px 16px rgba(94,200,150,0.6), 0px 4px 0px ${C.stoneLine}`
            : `inset 0px 0px 0px 3px ${C.gold}, inset 0px 3px 6px rgba(255,255,255,0.6), 0px 4px 0px ${C.stoneLine}`,
        }}
      >
        <Han style={{ fontSize: size * 0.42, color: C.jadeDeep, ...ts('rgba(255,255,255,0.5)', 0, 1) }}>修</Han>
      </LinearGradient>
      {flow ? (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -8, top: -8, right: -8, bottom: -8, borderRadius: 22, borderWidth: 3, borderColor: 'rgba(111,191,146,0.45)', borderTopColor: C.jadeLight },
            kf(KF.spin, 7, { ease: EASE.linear, iter: 'infinite' }),
          ]}
        />
      ) : null}
    </View>
  );
}

/* ---------- mist puffs ---------- */
export function Mist({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: 120 + i * 50,
              height: 70 + i * 26,
              left: ((i * 33) % 90) + '%',
              top: 8 + i * 14 + '%',
              borderRadius: 999,
              backgroundColor: 'rgba(255,250,235,0.55)',
              ...(WEB ? { filter: 'blur(8px)' } : null),
            },
            kf(KF.mistDrift, 5 + i, { ease: EASE.soft, iter: 'infinite', delay: -i * 1.5 }),
          ]}
        />
      ))}
    </>
  );
}
