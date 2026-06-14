/* Alchemist — gem medallions, resource bars, state chips, avatar, mist */
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, clamp } from './theme';
import { STAT } from './data';
import { Gradient, Gloss, Han, ts, angleToStartEnd } from './ui';
import { kf, tr, KF, EASE } from './anim';
import { KitPanel, KitBar } from './kit';

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

/* ---------- progress bar — real kit glossy fill (color = key) ---------- */
export function Bar({ pct, color = 'green', height = 16 }) {
  return <KitBar pct={pct} color={color} height={height} />;
}

/* ---------- resource bar — real kit glossy fill ---------- */
export function ResourceBar({ kind, han, label, value, max, glow }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
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
      <KitBar pct={pct} color={kind} height={18} />
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

/* ---------- avatar — real kit stone slot ---------- */
export function Avatar({ flow, size = 96 }) {
  return (
    <View style={{ width: size, height: size }}>
      <KitPanel
        slice={56}
        border={Math.round(size * 0.2)}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Han style={{ fontSize: size * 0.4, color: C.jadeDeep, ...ts('rgba(255,255,255,0.5)', 0, 1) }}>修</Han>
      </KitPanel>
      {flow ? (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -6, top: -6, right: -6, bottom: -6, borderRadius: 18, borderWidth: 3, borderColor: 'rgba(111,191,146,0.5)', borderTopColor: C.jadeLight },
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
