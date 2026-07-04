/* Alchemist — gem medallions (RPGUI icons), resource bars, state chips, avatar. */
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { C, FONT } from './theme';
import { STAT, AVATARS, AVATAR_BY_ID } from './data';
import { KitBar, KitGem, KitPill, KitParchPill } from './kit';
import { PixelIcon, IconTile } from './PixelIcon';

/* ---------- icon medallion ---------- */
export function Mh({ size = 20, icon, color }) {
  return <PixelIcon name={icon} size={size} color={color} />;
}

export function StatMedal({ stat, size = 18 }) {
  const s = STAT[stat] || stat;
  return <PixelIcon name={s.icon} size={size} color={s.color} />;
}

/* ---------- reward medallion (+N) ---------- */
export function RewardMedal({ stat, value }) {
  const s = STAT[stat];
  if (!s) return null;
  return (
    <KitParchPill style={{ paddingLeft: 5, paddingRight: 9, gap: 4 }}>
      <PixelIcon name={s.icon} size={18} color={s.color} />
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

/* ---------- "Воля" — single gold bar = % of today's practices done ---------- */
export function WillBar({ done = 0, total = 0, nativeID }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <View nativeID={nativeID} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>Воля</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.inkMuted }}>{done} / {total} · {pct}%</Text>
      </View>
      <KitBar pct={pct} color="green" />
    </View>
  );
}

/* ---------- state chip ---------- */
export const STATE_DEFS = {
  flow: { ico: 'wind', label: 'В потоке', pill: 'primary' },
  inspired: { ico: 'lightbulb-on', label: 'Вдохновение', pill: 'gold' },
  spent: { ico: 'battery-1', label: 'Истощение', pill: 'danger' },
  streak: { ico: 'trending-up', label: '', pill: 'primary' },
  calm: { ico: 'moon', label: 'Покой', pill: 'blue' },
};

export function StateChip({ state, text, gold }) {
  const base = STATE_DEFS[state] || STATE_DEFS.flow;
  const d = gold ? { ...base, pill: 'gold' } : base;
  const tc = { primary: C.jadeLight, gold: C.gold, danger: C.red, blue: C.blueLight }[d.pill] || C.ink;
  return (
    <KitPill color={d.pill} accessibilityLabel={text || d.label}>
      <PixelIcon name={d.ico} size={20} color={tc} />
      <Text style={{ fontFamily: FONT.display, fontSize: 16, color: tc }}>{text || d.label}</Text>
    </KitPill>
  );
}

/* ---------- header metric chip (icon + value, tappable to edit) ---------- */
export function MetricChip({ icon, color, value, onPress, accessibilityLabel, nativeID }) {
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 7, paddingHorizontal: 3, borderRadius: 6, borderWidth: 2, borderColor: C.goldLine, backgroundColor: C.frameDark }}>
      <PixelIcon name={icon} size={14} color={color} />
      <Text numberOfLines={1} style={{ fontFamily: FONT.display, fontSize: 13, color: C.ink }}>{value}</Text>
    </View>
  );
  if (!onPress) return <View nativeID={nativeID} style={{ flex: 1, minWidth: 0 }}>{inner}</View>;
  return (
    <Pressable nativeID={nativeID} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ flex: 1, minWidth: 0 }}>
      {inner}
    </Pressable>
  );
}

/* ---------- avatar art — pixel portrait (image) when the archetype has one, else the icon tile ---------- */
export function AvatarArt({ av, size = 88, style }) {
  if (av && av.img) {
    return (
      <Image
        source={av.img}
        resizeMode="cover"
        style={[{ width: size, height: size, borderRadius: 8, borderWidth: 3, borderColor: C.goldLine, backgroundColor: C.frameDark }, style]}
      />
    );
  }
  return <IconTile name={av.icon} color={av.color} size={size} style={style} />;
}

/* ---------- avatar — chosen pixel portrait + stage badge (tappable to change) ---------- */
export function Avatar({ flow, size = 96, stage, avatar, onPress, nativeID }) {
  const av = AVATAR_BY_ID[avatar] || AVATARS[0];
  const inner = (
    <View nativeID={onPress ? undefined : nativeID} style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <AvatarArt av={av} size={size} style={{ borderRadius: 8, borderWidth: 3 }} />
      {stage != null ? (
        <View pointerEvents="none" style={{ position: 'absolute', right: -3, bottom: -3, minWidth: 22, height: 20, paddingHorizontal: 5, backgroundColor: C.gold, borderWidth: 2, borderColor: C.goldLine, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.kitGoldText }}>{stage}</Text>
        </View>
      ) : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable nativeID={nativeID} onPress={onPress} accessibilityRole="button" accessibilityLabel="Сменить образ">
      {inner}
    </Pressable>
  );
}

/* ---------- mist (removed in RPGUI skin) ---------- */
export function Mist() {
  return null;
}
