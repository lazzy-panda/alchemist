/* Alchemist — Journal screen (ported 1:1 from screens2.jsx) */
import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { C, FONT } from '../theme';
import { HEAT, GROWTH, STAT } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, T, SectionHead, Gradient, kf, KF, EASE } from '../ui';
import { GrowthChart } from '../svg';
import { KIT } from '../kit';

// heat levels mapped to real kit assets (parchment → olive → green), with depth tint for lvl 3
const HEAT_STYLES = {
  0: { asset: KIT.parchment, border: 'rgba(118,80,43,0.4)', text: C.inkFaint, tint: null },
  1: { asset: KIT.fillOlive, border: 'rgba(35,92,62,0.5)', text: '#fff', tint: null },
  2: { asset: KIT.fillGreen, border: C.jadeDeep, text: '#2a4a1e', tint: null },
  3: { asset: KIT.fillGreen, border: C.jadeLine, text: '#fff', tint: 'rgba(20,50,30,0.4)' },
};

function HeatCell({ v, n, today, onPress, delay }) {
  const st = HEAT_STYLES[v];
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress}>
      <ImageBackground
        source={st.asset}
        resizeMode="stretch"
        imageStyle={{ borderRadius: 9 }}
        style={[
          { aspectRatio: 1, borderRadius: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: st.border, boxShadow: today ? `0px 0px 0px 3px ${C.gold}, inset 0px 1px 0px rgba(255,255,255,0.4)` : 'inset 0px 1px 0px rgba(255,255,255,0.4)' },
          kf(KF.fadeUp, 0.4, { ease: EASE.out, delay }),
        ]}
      >
        {st.tint ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: st.tint }} /> : null}
        <Text style={{ fontFamily: FONT.display, fontSize: 10, fontWeight: '700', color: st.text }}>{n}</Text>
      </ImageBackground>
    </Pressable>
  );
}

function LegendSwatch({ v }) {
  const st = HEAT_STYLES[v];
  return (
    <ImageBackground source={st.asset} resizeMode="stretch" imageStyle={{ borderRadius: 5 }} style={{ width: 14, height: 14, borderRadius: 5, overflow: 'hidden', borderWidth: 2, borderColor: st.border }}>
      {st.tint ? <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: st.tint }} /> : null}
    </ImageBackground>
  );
}

function SummaryCard({ big, label, sub, color }) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: '47%', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
      <Text style={[T.numXl, { fontSize: 34, color }]}>{big}</Text>
      <Text style={{ fontFamily: FONT.ui, fontWeight: '700', fontSize: 13, marginTop: 2, color: C.ink }}>{label}</Text>
      <Text style={T.caption}>{sub}</Text>
    </Card>
  );
}

export function JournalScreen({ ctx }) {
  const { wide, onOpenDay } = ctx;
  const todayIdx = 26;
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const rows = [];
  for (let i = 0; i < HEAT.length; i += 7) rows.push(HEAT.slice(i, i + 7));

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        <Text style={T.eyebrow}>Летопись пути</Text>
        <Text style={[T.displayM, { marginBottom: 16 }]}>Журнал · Июнь</Text>

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 12 }}>
            <Text style={T.caption}>меньше</Text>
            {[0, 1, 2, 3].map((l) => <LegendSwatch key={l} v={l} />)}
            <Text style={T.caption}>больше</Text>
          </View>
        </Card>

        {/* growth chart */}
        <SectionHead title="Рост характеристик" style={{ marginTop: 4 }} />
        <Card style={{ padding: 16, marginBottom: 18 }}>
          <GrowthChart series={GROWTH} />
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
            {[['energy', 'Энергия'], ['focus', 'Концентрация'], ['flex', 'Гибкость']].map(([k, n]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: STAT[k].color }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.inkMuted, fontFamily: FONT.ui }}>{n}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* period summary */}
        <SectionHead title="Сводка периода" style={{ marginTop: 4 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <SummaryCard big="412" label="минут практик" sub="за 28 дней" color={C.jade} />
          <SummaryCard big="14" label="лучший стрик" sub="🔥 подряд" color={C.cEnergy} />
          <SummaryCard big="2" label="реликвии" sub="открыто" color={C.gold} />
          <SummaryCard big="6" label="характеристик" sub="растут" color={C.cKind} />
        </View>
      </PadView>
    </ScreenScroll>
  );
}
