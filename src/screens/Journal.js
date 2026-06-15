/* Alchemist — Journal screen (ported 1:1 from screens2.jsx) */
import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { C, FONT } from '../theme';
import { HEAT, GROWTH, STAT } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, T, SectionHead, Gradient, kf, KF, EASE } from '../ui';
import { GrowthChart } from '../svg';
import { KIT } from '../kit';

// heat levels — solid glossy green tiles matching the kit's green progress segments
const HEAT_STYLES = {
  0: { colors: ['#4a443a', '#3a352d'], border: 'rgba(120,108,80,0.5)', text: '#8c8169' },
  1: { colors: ['#a9d6bd', '#8cc4a4'], border: 'rgba(35,92,62,0.45)', text: C.jadeDeep },
  2: { colors: ['#63b88f', '#3f9468'], border: C.jadeDeep, text: '#fff' },
  3: { colors: ['#3e8c60', '#235c3e'], border: C.jadeLine, text: '#fff' },
};

function HeatCell({ v, n, today, onPress, delay }) {
  const st = HEAT_STYLES[v];
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress} accessibilityRole="button" accessibilityLabel={`День ${n}`}>
      <Gradient
        colors={st.colors}
        angle={180}
        style={[
          { aspectRatio: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: st.border, boxShadow: today ? `0px 0px 0px 3px ${C.gold}, inset 0px 2px 0px rgba(255,255,255,0.45)` : 'inset 0px 2px 0px rgba(255,255,255,0.4), inset 0px -3px 5px rgba(0,0,0,0.12)' },
          kf(KF.fadeUp, 0.4, { ease: EASE.out, delay }),
        ]}
      >
        <Text style={{ fontFamily: FONT.display, fontSize: 10, fontWeight: '700', color: st.text }}>{n}</Text>
      </Gradient>
    </Pressable>
  );
}

function LegendSwatch({ v }) {
  const st = HEAT_STYLES[v];
  return <Gradient colors={st.colors} angle={180} style={{ width: 14, height: 14, borderRadius: 5, borderWidth: 2, borderColor: st.border }} />;
}

function SummaryCard({ big, label, sub, color }) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: '47%', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
      <Text style={[T.numXl, { fontSize: 20, color }]}>{big}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 8, marginTop: 4, color: C.ink }}>{label}</Text>
      <Text style={T.caption}>{sub}</Text>
    </Card>
  );
}

export function JournalScreen({ ctx }) {
  const { wide, onOpenDay } = ctx;
  let todayIdx = 26;
  try { todayIdx = Math.min(HEAT.length - 1, Math.max(0, new Date().getDate() - 1)); } catch (e) {}
  const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const rows = [];
  for (let i = 0; i < HEAT.length; i += 7) rows.push(HEAT.slice(i, i + 7));

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        <Text style={T.eyebrow}>Chronicle of the Path</Text>
        <Text accessibilityRole="header" style={[T.displayM, { marginBottom: 16 }]}>Journal · June</Text>

        {/* heatmap */}
        <Card style={{ padding: 16, marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {weekdays.map((w) => (
              <Text key={w} style={[T.caption, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>{w}</Text>
            ))}
          </View>
          <View style={{ gap: 6 }}>
            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 6 }}>
                {row.map((v, ci) => {
                  const idx = ri * 7 + ci;
                  return <HeatCell key={idx} v={v} n={idx + 1} today={idx === todayIdx} delay={idx * 0.012} onPress={() => onOpenDay(idx)} />;
                })}
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <Text style={[T.caption, { flex: 1 }]}>Tap a day for details</Text>
            <Text style={T.caption}>less</Text>
            {[0, 1, 2, 3].map((l) => <LegendSwatch key={l} v={l} />)}
            <Text style={T.caption}>more</Text>
          </View>
        </Card>

        {/* growth chart */}
        <SectionHead title="Stat growth" style={{ marginTop: 4 }} />
        <Card style={{ padding: 16, marginBottom: 18 }}>
          <GrowthChart series={GROWTH} />
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            {[['energy', 'Energy'], ['focus', 'Focus'], ['flex', 'Flexibility']].map(([k, n]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: STAT[k].color }} />
                <Text style={{ fontSize: 8, color: C.inkMuted, fontFamily: FONT.display }}>{n}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* period summary */}
        <SectionHead title="Period summary" style={{ marginTop: 4 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <SummaryCard big="412" label="practice minutes" sub="in 28 days" color={C.jade} />
          <SummaryCard big="14" label="best streak" sub="🔥 in a row" color={C.cEnergy} />
          <SummaryCard big="2" label="relics" sub="unlocked" color={C.gold} />
          <SummaryCard big="6" label="stats" sub="growing" color={C.cKind} />
        </View>
      </PadView>
    </ScreenScroll>
  );
}
