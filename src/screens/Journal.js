/* Alchemist — Journal screen (RPGUI native): month hero, kindle grid (checkboxes),
   stat growth (progress bars), scroll of deeds. No custom SVG — all native RPGUI. */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { HEAT, GROWTH, STAT, STATS, RELICS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, T, SectionHead, kf, KF, EASE } from '../ui';
import { StateChip, Bar } from '../badges';
import { KitCheckbox } from '../kit';

const MONTH = (() => { try { return new Date().toLocaleString('ru-RU', { month: 'long' }); } catch (e) { return 'июнь'; } })();
// prepositional case ("в июне"): drop trailing ь/й → +е, otherwise +е (март→марте, май→мае)
const MONTH_PREP = /[ьй]$/.test(MONTH) ? MONTH.slice(0, -1) + 'е' : MONTH + 'е';

// each day is a native RPGUI checkbox: checked = practiced, unchecked = rest day
function HeatCell({ v, n, today, onPress, delay }) {
  return (
    <Pressable style={{ flex: 1, alignItems: 'center' }} onPress={onPress} accessibilityRole="button" accessibilityState={{ checked: v > 0 }} accessibilityLabel={`День ${n}${v > 0 ? ', занимался' : ', отдых'}`}>
      <View style={[{ aspectRatio: 1, width: '100%', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: today ? C.gold : 'transparent', borderRadius: 3 }, kf(KF.fadeUp, 0.4, { ease: EASE.out, delay })]}>
        <KitCheckbox on={v > 0} size={30} />
      </View>
    </Pressable>
  );
}

// native RPGUI progress bar per stat (replaces the line chart)
const GROW_BAR = { energy: 'energy', focus: 'kind', flex: 'flex' };
function GrowthRow({ k }) {
  const s = STAT[k];
  const arr = GROWTH[k] || [];
  const cur = arr[arr.length - 1] ?? 0;
  const delta = cur - (arr[0] ?? 0);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 9, color: s.color }}>{s.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.ink }}>Ур {cur}</Text>
          {delta > 0 ? <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.jadeLight }}>▲{delta}</Text> : null}
        </View>
      </View>
      <Bar pct={(cur / 10) * 100} color={GROW_BAR[k] || k} />
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
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
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
        {/* ---- month hero: dominant metric + streak + month progress ---- */}
        <Text style={[T.eyebrow, kf(KF.fadeUp, 0.4, { ease: EASE.out })]}>Хроника Пути</Text>
        <Text accessibilityRole="header" style={[T.displayM, { marginTop: 6, marginBottom: 12 }, kf(KF.fadeUp, 0.45, { ease: EASE.out, delay: 0.04 })]}>Летопись · {MONTH}</Text>
        <Card frame="grey" style={[{ marginBottom: 18 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.08 })]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 38, lineHeight: 42, color: C.title, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 0 }}>{active}</Text>
                <Text style={{ fontFamily: FONT.display, fontSize: 12, color: C.inkFaint }}>/ {total}</Text>
              </View>
              <Text style={{ fontFamily: FONT.ui, fontSize: 9, lineHeight: 14, color: C.inkMuted, marginTop: 4 }}>дней с практикой в {MONTH_PREP}</Text>
            </View>
            <StateChip state="streak" text={streak + ' дн.'} gold />
          </View>
          <View style={{ marginTop: 14 }}>
            <Bar pct={pct} color="xp" />
            <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint, marginTop: 6, textAlign: 'right' }}>{pct}% месяца пройдено</Text>
          </View>
        </Card>

        {/* ---- kindle grid (native checkboxes) ---- */}
        <SectionHead title="Карта горения" right={`${active}/${total}`} style={{ marginTop: 0 }} />
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
          <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkFaint, marginTop: 14 }}>☑ занимался · ☐ отдых — нажмите день для деталей</Text>
        </Card>

        {/* ---- stat growth (native progress bars) ---- */}
        <SectionHead title="Рост характеристик" style={{ marginTop: 0 }} />
        <Card style={[{ padding: 16, marginBottom: 18 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.16 })]}>
          {growKeys.map((k) => <GrowthRow key={k} k={k} />)}
        </Card>

        {/* ---- scroll of deeds ---- */}
        <SectionHead title="За месяц" style={{ marginTop: 0 }} />
        <Card style={[{ paddingHorizontal: 16, paddingVertical: 4, marginBottom: 8 }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: 0.2 })]}>
          <DeedRow glyph="⏳" label="Минут в практике" value={minutes} color={C.jadeLight} />
          <DeedRow glyph="🔥" label="Лучшая серия дней" value={streak} color={C.gold} />
          <DeedRow glyph="💠" label="Реликвий обретено" value={`${relicsGot}/${RELICS.length}`} color={C.cEnergy} />
          <DeedRow glyph="✦" label="Граней мастерства растёт" value={STATS.length} color={C.cKind} last />
        </Card>
      </PadView>
    </ScreenScroll>
  );
}
