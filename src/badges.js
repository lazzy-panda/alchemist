/* Alchemist — gem medallions, resource bars, state chips, avatar, mist */
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, clamp } from './theme';
import { STAT } from './data';
import { Gradient, Gloss, Han, ts, angleToStartEnd } from './ui';
import { kf, tr, KF, EASE } from './anim';
import { KitPanel, KitBar, KitGem, KitPill, KitParchPill } from './kit';

const WEB = Platform.OS === 'web';

/* ---------- gem medallion (.mh) ---------- */
export function Mh({ size = 20, color, han, fontSize }) {
  // every small gem is the real kit gem (hue-rotated centre)
  return <KitGem size={size} color={color} han={han} fontSize={fontSize} />;
}

export function StatMedal({ stat, size = 18, fontSize }) {
  const s = STAT[stat] || stat;
  return <KitGem size={size} color={s.color} han={s.han} fontSize={fontSize} />;
}

/* ---------- reward medallion (+N) — real kit parchment chip + kit gem ---------- */
export function RewardMedal({ stat, value }) {
  const s = STAT[stat];
  if (!s) return null;
  return (
    <KitParchPill style={{ height: 26, paddingLeft: 3, paddingRight: 9, gap: 4 }}>
      <KitGem size={19} color={s.color} han={s.han} fontSize={11} />
      <Text style={{ fontFamily: FONT.display, fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'], color: s.color }}>+{value}</Text>
    </KitParchPill>
  );
}

/* ---------- plain medal pill (real kit parchment chip) ---------- */
export function MedalPill({ children, style }) {
  return <KitParchPill style={[{ height: 26 }, style]}>{children}</KitParchPill>;
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
  flow: { ico: '🌀', label: 'В потоке', pill: 'primary' },
  inspired: { ico: '✨', label: 'Вдохновлён', pill: 'gold' },
  spent: { ico: '🥀', label: 'Истощён', pill: 'danger' },
  streak: { ico: '🔥', label: '', pill: 'primary' },
  calm: { ico: '🌙', label: 'Покой', pill: 'blue' },
};

export function StateChip({ state, text }) {
  const d = STATE_DEFS[state] || STATE_DEFS.flow;
  return (
    <KitPill color={d.pill} style={{ paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 13 }}>{d.ico}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '700', color: '#fff', ...ts('rgba(0,0,0,0.3)', 0, 1) }}>{text || d.label}</Text>
    </KitPill>
  );
}

/* ---------- avatar — real kit stone slot ---------- */
export function Avatar({ flow, size = 96 }) {
  return (
    <View style={{ width: size, height: size }}>
      <KitPanel
        slice={56}
        border={Math.round(size * 0.17)}
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: size * 0.56, height: size * 0.56, borderRadius: Math.round(size * 0.1), backgroundColor: '#3b4654', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0px 3px 8px rgba(0,0,0,0.6), inset 0px -2px 4px rgba(255,255,255,0.12)' }}>
          <Han style={{ fontSize: size * 0.34, color: '#ECE0BA', ...ts('rgba(0,0,0,0.5)', 0, 1) }}>修</Han>
        </View>
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
