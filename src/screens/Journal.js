/* Alchemist — Journal screen (RPGUI): month hero, kindle heatmap, living growth chart, scroll of deeds */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { HEAT, GROWTH, STAT, STATS, RELICS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, T, SectionHead, Gradient, kf, KF, EASE } from '../ui';
import { StateChip, Bar } from '../badges';
import { GrowthChart } from '../svg';

const MONTH = (() => { try { return new Date().toLocaleString('en-US', { month: 'long' }); } catch (e) { return 'June'; } })();

// heat levels — solid glossy green tiles matching the kit's green progress segments
const HEAT_STYLES = {
  0: { colors: ['#403a31', '#332e27'], border: 'rgba(120,108,80,0.45)', text: '#7d735d' },
  1: { colors: ['#a9d6bd', '#8cc4a4'], border: 'rgba(35,92,62,0.45)', text: C.jadeDeep },
  2: { colors: ['#63b88f', '#3f9468'], border: C.jadeDeep, text: '#fff' },
  3: { colors: ['#3e8c60', '#235c3e'], border: C.jadeLine, text: '#fff' },
};

function HeatCell({ v, n, today, onPress, delay }) {
  const st = HEAT_STYLES[v];
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Day ${n}, intensity ${v}`}>
      <Gradient
        colors={st.colors}
        angle={180}
        style={[
          { aspectRatio: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: today ? C.gold : st.border, boxShadow: today ? `0px 0px 0px 2px ${C.gold}, inset 0px 2px 0px rgba(255,255,255,0.4)` : 'inset 0px 2px 0px rgba(255,255,255,0.35), inset 0px -2px 4px rgba(0,0,0,0.14)' },
          kf(KF.fadeUp, 0.4, { ease: EASE.out, delay }),
        ]}
      >
        <Text style={{ fontFamily: FONT.display, fontSize: 9, color: st.text }}>{n}</Text>
      </Gradient>
    </Pressable>
  );
}

function LegendSwatch({ v }) {
  const st = HEAT_STYLES[v];
  return <Gradient colors={st.colors} angle={180} style={{ width: 13, height: 13, borderRadius: 4, borderWidth: 2, borderColor: st.border }} />;
}

/* one growth line in the legend: gem + name + current value + delta */
function GrowthLegend({ k }) {
  const s = STAT[k];
  const arr = GROWTH[k] || [];
  const cur = arr[arr.length - 1] ?? 0;
  const delta = cur - (arr[0] ?? 0);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 2, borderColor: C.stoneLine, backgroundColor: C.chipBg }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: s.color }} />
      <Text style={{ fontFamily: FONT.display, fontSize: 8, color: s.color }}>{s.name}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 8, color: C.ink }}>Lv {cur}</Text>
      {delta > 0 ? <Text style={{ fontFamily: FONT.display, fontSize: 8, color: C.jadeLight }}>▲{delta}</Text> : null}
    </View>
  );
}

/* one row in the "scroll of deeds" summary */
function DeedRow({ glyph, label, value, color, last }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
      <View style={{ width: 34, height: 34, borderRadius: 6, borderWidth: 2, borderColor: C.stoneLine, backgroundColor: C.frameDark, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 17 }}>{glyph}</Text>
      </View>
      <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 9, lineHeight: 14, color: C.inkMuted }}>{label}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: color || C.title }}>{value}</Text>
    </View>
  );
}

export function JournalScreen({ ctx }) {
  const { wide, onOpenDay, streak = 14 } = ctx;
  let todayIdx = 14;
  try { todayIdx = Math.min(HEAT.length - 1, Math.max(0, new Date().getDate() - 1)); } catch (e) {}
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const rows = [];
  for (let i = 0; i < HEAT.length; i += 7) rows.push(HEAT.slice(i, i + 7));

  const total = HEAT.length;
  const active = HEAT.filter((v) => v > 0).length;
  const pct = Math.round((active / total) * 100);
  const minutes = 412; // demo aggregate
  const relicsGot = RELICS.filter((r) => r.got).length;
  const growKeys = ['energy', 'focus', 'flex'];

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        {/* ---- month hero: dominant metric + streak + month progress ----
             grey frame (its border-image outset is small; golden's ~18px outset both hides
             the title above it and mis-sizes with this much content). */}
        <Text style={[T.eyebrow, kf(KF.fadeUp, 0.4, { ease: EASE.out })]}>Chronicle of the Path</Text>
        <Text accessibilityRole="header" style={[T.displayM, { marginTop: 6, marginBottom: 12 }, kf(KF.fadeUp, 0.45, { ease: EASE.out, delay: 0.04 })]}>Journal · {MONTH}</Text>
        <Card frame="grey" style={[{ marginBottom: 18 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.08 })]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 38, lineHeight: 42, color: C.title, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 }}>{active}</Text>
                <Text style={{ fontFamily: FONT.display, fontSize: 12, color: C.inkFaint }}>/ {total}</Text>
              </View>
              <Text style={{ fontFamily: FONT.ui, fontSize: 9, lineHeight: 14, color: C.inkMuted, marginTop: 4 }}>days kindled in {MONTH}</Text>
            </View>
            <StateChip state="streak" text={streak + ' days'} gold />
          </View>
          <View style={{ marginTop: 14 }}>
            <Bar pct={pct} color="xp" />
            <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint, marginTop: 6, textAlign: 'right' }}>{pct}% of the month tended</Text>
          </View>
        </Card>

        {/* ---- kindle heatmap ---- */}
        <SectionHead title="Kindle map" right={`${active}/${total}`} style={{ marginTop: 0 }} />
        <Card style={[{ padding: 16, marginBottom: 18 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.12 })]}>
          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 8 }}>
            {weekdays.map((w) => (
              <Text key={w} style={{ flex: 1, textAlign: 'center', fontFamily: FONT.display, fontSize: 8, color: C.inkFaint }}>{w}</Text>
            ))}
          </View>
          <View style={{ gap: 5 }}>
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 5 }}>
                {row.map((v, ci) => {
                  const idx = ri * 7 + ci;
                  return <HeatCell key={idx} v={v} n={idx + 1} today={idx === todayIdx} delay={idx * 0.015} onPress={() => onOpenDay(idx)} />;
                })}
                {row.length < 7 ? Array.from({ length: 7 - row.length }).map((_, k) => <View key={'pad' + k} style={{ flex: 1 }} />) : null}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint }}>Tap a day for its scroll</Text>
            <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint }}>rest</Text>
            {[0, 1, 2, 3].map((l) => <LegendSwatch key={l} v={l} />)}
            <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint }}>ablaze</Text>
          </View>
        </Card>

        {/* ---- living growth chart ---- */}
        <SectionHead title="Stat growth" style={{ marginTop: 0 }} />
        <Card style={[{ padding: 16, marginBottom: 18 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.16 })]}>
          <GrowthChart series={GROWTH} keys={growKeys} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {growKeys.map((k) => <GrowthLegend key={k} k={k} />)}
          </View>
        </Card>

        {/* ---- scroll of deeds (summary, not a metric grid) ---- */}
        <SectionHead title="This month" style={{ marginTop: 0 }} />
        <Card style={[{ paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.2 })]}>
          <DeedRow glyph="⏳" label="Minutes spent in practice" value={minutes} color={C.jadeLight} />
          <DeedRow glyph="🔥" label="Longest streak of days" value={streak} color={C.gold} />
          <DeedRow glyph="💠" label="Relics drawn from the path" value={`${relicsGot}/${RELICS.length}`} color={C.cEnergy} />
          <DeedRow glyph="✦" label="Facets of mastery growing" value={STATS.length} color={C.cKind} last />
        </Card>
      </PadView>
    </ScreenScroll>
  );
}
