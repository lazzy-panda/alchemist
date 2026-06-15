/* Alchemist — Character screen (ported 1:1 from screens1.jsx) */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { STATS, CATS, PRACTICES, PERKS, RELICS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, Han, T, SectionHead, Gradient, Gloss, kf, KF, EASE } from '../ui';
import { ResourceBar, StatMedal, Bar, Mh } from '../badges';
import { RadarMandala } from '../svg';
import { KitPanel } from '../kit';

function StatRow({ s, sl, open, onToggle, last }) {
  const feeders = PRACTICES.filter((p) => (p.r || {})[s.key]).slice(0, 4);
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(120,92,48,0.08)' }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={s.name} accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16 }}>
        <StatMedal stat={s.key} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: FONT.ui, fontWeight: '700', fontSize: 15, color: C.ink }}>{s.name}</Text>
            <Text style={{ fontFamily: FONT.ui, fontWeight: '800', color: s.color, fontVariant: ['tabular-nums'] }}>ур. {sl.lvl}</Text>
          </View>
          <Bar pct={(sl.xp / sl.next) * 100} color={s.key} height={16} />
        </View>
        <Text style={{ color: C.inkFaint, fontSize: 18, transform: open ? [{ rotate: '90deg' }] : [] }}>›</Text>
      </Pressable>
      {open ? (
        <View style={[{ paddingLeft: 69, paddingRight: 16, paddingBottom: 16 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
          <Text style={[T.caption, { marginBottom: 8 }]}>
            {sl.xp} / {sl.next} очков · питают практики:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {feeders.map((f) => (
              <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingLeft: 7, paddingRight: 13, borderRadius: 999, borderWidth: 2.5, borderColor: s.color, backgroundColor: '#fff8' }}>
                <Mh size={22} color={CATS[f.cat].color} han={CATS[f.cat].han} fontSize={12} />
                <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '600', color: s.color }}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function CharacterScreen({ ctx }) {
  const { statLevels, resources, stage, route, wide } = ctx;
  const [expanded, setExpanded] = useState(null);
  const radarValues = {};
  STATS.forEach((s) => {
    const sl = statLevels[s.key];
    radarValues[s.key] = Math.min(1, (sl.lvl + sl.xp / sl.next) / 12);
  });
  const perksOpen = PERKS.filter((p) => p.open).length;

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        {/* radar + stage */}
        <View style={{ alignItems: 'center' }}>
          <Text style={[T.eyebrow, { marginBottom: 2 }]}>Свиток мастера</Text>
          <Text accessibilityRole="header" style={[T.displayL, { marginBottom: 18 }]}>Ступень {stage.lvl}</Text>
          <RadarMandala values={radarValues} size={250} animate />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' }}>
            <Card style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16 }}>
              <ResourceBar kind="hp" han="生" label="Жизнь" value={resources.hp} max={resources.hpMax} />
            </Card>
            <Card style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 16 }}>
              <ResourceBar kind="qi" han="氣" label="Ци" value={resources.qi} max={resources.qiMax} />
            </Card>
          </View>
        </View>

        {/* stat list */}
        <SectionHead title="Характеристики" />
        <Card style={{ overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <StatRow key={s.key} s={s} sl={statLevels[s.key]} open={expanded === s.key} onToggle={() => setExpanded(expanded === s.key ? null : s.key)} last={i === STATS.length - 1} />
          ))}
        </Card>

        {/* perks */}
        <SectionHead title="Перки" right={`${perksOpen} открыто`} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PERKS.map((p, i) => (
            <Perk key={i} p={p} wide={wide} />
          ))}
        </View>

        {/* relics */}
        <SectionHead title="Реликвии" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {RELICS.map((r, i) => (
            <Relic key={i} r={r} wide={wide} />
          ))}
        </View>
      </PadView>
    </ScreenScroll>
  );
}

function Perk({ p, wide }) {
  return (
    <KitPanel slice={56} border={13} style={{ flexGrow: 1, flexBasis: '31%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: p.open ? 1 : 0.72 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: C.stoneLine, backgroundColor: p.open ? p.color : 'rgba(120,92,48,0.3)', overflow: 'hidden', boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.45), inset 0px -3px 6px rgba(0,0,0,0.2)' }}>
        {p.open ? <Han style={{ fontSize: 19, color: '#fff' }}>{p.han}</Han> : <Text style={{ fontSize: 17 }}>🔒</Text>}
        {p.open ? <Gloss radius={20} /> : null}
      </View>
      <Text style={{ fontFamily: FONT.display, fontSize: 10.5, fontWeight: '600', lineHeight: 13, color: C.inkMuted, textAlign: 'center' }}>{p.name}</Text>
      {!p.open ? <Text style={[T.caption, { fontSize: 9.5, textAlign: 'center' }]}>{p.req}</Text> : null}
    </KitPanel>
  );
}

function Relic({ r, wide }) {
  return (
    <KitPanel slice={56} border={12} style={{ flexGrow: 1, flexBasis: '22%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', opacity: r.got ? 1 : 0.6 }}>
      <Text style={{ fontSize: 26, opacity: r.got ? 1 : 0.5 }}>{r.got ? r.icon : '◌'}</Text>
    </KitPanel>
  );
}
