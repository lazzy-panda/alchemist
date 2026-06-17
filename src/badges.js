/* Alchemist — gem medallions (RPGUI icons), resource bars, state chips, avatar. */
import React from 'react';
import { View, Text } from 'react-native';
import { C, FONT } from './theme';
import { STAT } from './data';
import { KitBar, KitGem, KitPill, KitParchPill } from './kit';

/* ---------- icon medallion ---------- */
export function Mh({ size = 20, icon, color }) {
  return <KitGem size={size} icon={icon} color={color} />;
}

export function StatMedal({ stat, size = 18 }) {
  const s = STAT[stat] || stat;
  return <KitGem size={size} icon={s.icon} color={s.color} />;
}

/* ---------- reward medallion (+N) ---------- */
export function RewardMedal({ stat, value }) {
  const s = STAT[stat];
  if (!s) return null;
  return (
    <KitParchPill style={{ paddingLeft: 5, paddingRight: 9, gap: 4 }}>
      <KitGem size={18} icon={s.icon} color={s.color} />
      <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.ink }}>+{value}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 16, color: s.color }}>{s.short}</Text>
    </KitParchPill>
  );
}

/* ---------- plain medal pill ---------- */
export function MedalPill({ children, style }) {
  return <KitParchPill style={style}>{children}</KitParchPill>;
}

/* ---------- qi tag ---------- */
export function QiTag({ qi }) {
  if (!qi) return null;
  const cost = qi < 0;
  const col = cost ? C.red : C.cEnergy;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 16, color: col }}>ЦИ {cost ? '-' + Math.abs(qi) : '+' + qi}</Text>
    </View>
  );
}

/* ---------- progress bar ---------- */
export function Bar({ pct, color = 'green', height = 16 }) {
  return <KitBar pct={pct} color={color} />;
}

/* ---------- resource bar ---------- */
export function ResourceBar({ kind, label, value, max, glow }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: kind === 'hp' ? C.red : C.cEnergy }}>{label}</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.inkMuted }}>{Math.round(value)} / {max}</Text>
      </View>
      <KitBar pct={pct} color={kind} />
    </View>
  );
}

/* ---------- state chip ---------- */
export const STATE_DEFS = {
  flow: { ico: 'potion-blue', label: 'В потоке', pill: 'primary' },
  inspired: { ico: 'magic-slot', label: 'Вдохновение', pill: 'gold' },
  spent: { ico: 'exclamation', label: 'Истощение', pill: 'danger' },
  streak: { ico: 'sword', label: '', pill: 'primary' },
  calm: { ico: 'potion-green', label: 'Покой', pill: 'blue' },
};

export function StateChip({ state, text, gold }) {
  const base = STATE_DEFS[state] || STATE_DEFS.flow;
  const d = gold ? { ...base, pill: 'gold' } : base;
  const tc = { primary: C.jadeLight, gold: C.gold, danger: C.red, blue: C.blueLight }[d.pill] || C.ink;
  return (
    <KitPill color={d.pill} accessibilityLabel={text || d.label}>
      <KitGem size={22} icon={d.ico} />
      <Text style={{ fontFamily: FONT.display, fontSize: 16, color: tc }}>{text || d.label}</Text>
    </KitPill>
  );
}

/* ---------- avatar — RPGUI helmet slot + stage badge ---------- */
export function Avatar({ flow, size = 96, stage }) {
  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <KitGem size={size} icon="helmet-slot" />
      {stage != null ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: -3, bottom: -3, minWidth: 22, height: 20, paddingHorizontal: 5, backgroundColor: C.gold, borderWidth: 2, borderColor: C.goldLine, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.kitGoldText }}>{stage}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ---------- mist (removed in RPGUI skin) ---------- */
export function Mist() {
  return null;
}
