/* Alchemist — Character screen (RPGUI, English) */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { STATS, CATS, PRACTICES, PERKS, RELICS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, T, kf, KF, EASE } from '../ui';
import { ResourceBar, StatMedal, Bar, Mh } from '../badges';
import { KitGem } from '../kit';

function Section({ title, right, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12, marginHorizontal: 2, opacity: pressed ? 0.6 : 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 8, color: C.gold }}>◆</Text>
          <Text accessibilityRole="header" style={{ fontFamily: FONT.display, fontSize: 11, textTransform: 'uppercase', color: C.title }}>{title}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          {right != null ? <Text style={T.caption}>{right}</Text> : null}
          <Text style={{ color: C.inkFaint, fontSize: 16, transform: open ? [{ rotate: '90deg' }] : [] }}>›</Text>
        </View>
      </Pressable>
      {open ? <View style={kf(KF.fadeUp, 0.4, { ease: EASE.out })}>{children}</View> : null}
    </View>
  );
}

function StatRow({ s, sl, open, onToggle, last }) {
  const feeders = PRACTICES.filter((p) => (p.r || {})[s.key]).slice(0, 4);
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={s.name} accessibilityHint="Show practices that develop it" accessibilityState={{ expanded: open }} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 }, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
        <StatMedal stat={s.key} size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.ink }}>{s.name}</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: s.color }}>Lv {sl.lvl}</Text>
          </View>
          <Bar pct={(sl.xp / sl.next) * 100} color={s.key} />
        </View>
        <Text style={{ color: C.inkFaint, fontSize: 16, transform: open ? [{ rotate: '90deg' }] : [] }}>›</Text>
      </Pressable>
      {open ? (
        <View style={[{ paddingLeft: 56, paddingRight: 12, paddingBottom: 14 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
          <Text style={[T.caption, { marginBottom: 8 }]}>{sl.xp} / {sl.next} XP to Lv {sl.lvl + 1} · grows from:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {feeders.map((f) => (
              <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingLeft: 5, paddingRight: 10, borderRadius: 6, borderWidth: 2, borderColor: s.color, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <Mh size={18} icon={CATS[f.cat].icon} color={CATS[f.cat].color} />
                <Text style={{ fontFamily: FONT.display, fontSize: 8, color: s.color }}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function CharacterScreen({ ctx }) {
  const { statLevels, resources, stage, wide, onShowHelp, onSignOut, userName } = ctx;
  const [expanded, setExpanded] = useState(null);
  const radarValues = {};
  STATS.forEach((s) => {
    const sl = statLevels[s.key];
    radarValues[s.key] = Math.min(1, (sl.lvl + sl.xp / sl.next) / 12);
  });
  const perksOpen = PERKS.filter((p) => p.open).length;
  const relicsGot = RELICS.filter((r) => r.got).length;

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        <View style={{ alignItems: 'center' }}>
          <Text style={[T.eyebrow, { marginBottom: 6 }]}>Master Scroll</Text>
          <Text accessibilityRole="header" style={[T.displayL, { marginBottom: 16 }]}>Stage {stage.lvl}</Text>
          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={[T.caption, { marginBottom: 12 }]}>Facets of mastery</Text>
            {STATS.map((s, i) => {
              const sl = statLevels[s.key];
              const mp = Math.min(100, ((sl.lvl + sl.xp / sl.next) / 12) * 100);
              return (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i === STATS.length - 1 ? 0 : 9 }}>
                  <StatMedal stat={s.key} size={20} />
                  <Text style={{ width: 70, fontFamily: FONT.display, fontSize: 8, color: s.color }}>{s.name}</Text>
                  <View style={{ flex: 1 }}><Bar pct={mp} color={s.key} /></View>
                  <Text style={{ width: 30, textAlign: 'right', fontFamily: FONT.display, fontSize: 8, color: C.ink }}>Lv {sl.lvl}</Text>
                </View>
              );
            })}
          </Card>
          {onShowHelp ? (
            <Pressable onPress={onShowHelp} hitSlop={8} accessibilityRole="button" accessibilityLabel="How it works" style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.gold }}>How it works?</Text>
            </Pressable>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18, alignSelf: 'stretch' }}>
            <Card style={{ flex: 1 }}><ResourceBar kind="hp" label="Health" value={resources.hp} max={resources.hpMax} /></Card>
            <Card style={{ flex: 1 }}><ResourceBar kind="qi" label="Qi" value={resources.qi} max={resources.qiMax} /></Card>
          </View>
        </View>

        <Section title="Stats" defaultOpen>
          <Card style={{ overflow: 'hidden' }}>
            {STATS.map((s, i) => (
              <StatRow key={s.key} s={s} sl={statLevels[s.key]} open={expanded === s.key} onToggle={() => setExpanded(expanded === s.key ? null : s.key)} last={i === STATS.length - 1} />
            ))}
          </Card>
        </Section>

        <Section title="Perks" right={`${perksOpen} / ${PERKS.length}`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PERKS.map((p, i) => (<Perk key={i} p={p} />))}
          </View>
        </Section>

        <Section title="Relics" right={`${relicsGot} / ${RELICS.length}`}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {RELICS.map((r, i) => (<Relic key={i} r={r} />))}
          </View>
        </Section>

        {!wide && onSignOut ? (
          <Pressable onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out" style={{ marginTop: 28, marginBottom: 4, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: C.inkMuted }}>↩ Sign out{userName ? ' · ' + userName : ''}</Text>
          </Pressable>
        ) : null}
      </PadView>
    </ScreenScroll>
  );
}

function Perk({ p }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '30%', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 6, minHeight: 96, borderRadius: 8, borderWidth: 2, borderColor: p.open ? C.goldLine : C.stoneLine, backgroundColor: p.open ? C.frameGoldBg : C.frameDark, opacity: p.open ? 1 : 0.7 }}>
      {p.open ? <KitGem size={34} icon={p.icon} color={p.color} /> : <Text style={{ fontSize: 20 }}>🔒</Text>}
      <Text style={{ fontFamily: FONT.display, fontSize: 8, lineHeight: 12, color: C.inkMuted, textAlign: 'center' }}>{p.name}</Text>
      {!p.open ? <Text style={[T.caption, { fontSize: 8, textAlign: 'center' }]}>{p.req}</Text> : null}
    </View>
  );
}

function Relic({ r }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '22%', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, minHeight: 64, borderRadius: 8, borderWidth: 2, borderColor: C.stoneLine, backgroundColor: C.frameDark, opacity: r.got ? 1 : 0.55 }}>
      <Text style={{ fontSize: 24, opacity: r.got ? 1 : 0.5 }}>{r.got ? r.icon : '◌'}</Text>
    </View>
  );
}
