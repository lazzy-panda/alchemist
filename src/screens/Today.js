/* Alchemist — Today screen (ported 1:1 from screens1.jsx) */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { ScreenScroll, PadView } from '../layout';
import { Gradient, Card, Btn, Han, T, Seal, kf, KF, EASE } from '../ui';
import { Avatar, ResourceBar, StateChip, Mist } from '../badges';
import { PracticeCard } from '../PracticeCard';
import { dailyWisdom } from '../quotes';

function greeting() {
  let h = 9;
  try { h = new Date().getHours(); } catch (e) {}
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h >= 12 && h < 18) return 'Добрый день';
  if (h >= 18 && h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

function DayStateChip({ dayState }) {
  const map = { flow: 'flow', inspired: 'inspired', spent: 'spent', calm: 'calm' };
  return <StateChip state={map[dayState] || 'flow'} />;
}

function DoneSeal() {
  return (
    <View style={{ position: 'absolute', right: 14, top: '50%', marginTop: -15, opacity: 0.92, transform: [{ rotate: '-4deg' }] }} pointerEvents="none">
      <Seal size={30} fontSize={15} />
    </View>
  );
}

function EmptyDay({ onAdd }) {
  return (
    <Card style={{ paddingVertical: 34, paddingHorizontal: 22, alignItems: 'center', marginBottom: 16 }}>
      <Text style={{ fontSize: 44, opacity: 0.5 }}>🐉</Text>
      <Text style={[T.displayM, { marginTop: 10, marginBottom: 6, textAlign: 'center' }]}>Начни свой путь сегодня</Text>
      <Text style={[T.body, { color: C.inkMuted, marginBottom: 16, textAlign: 'center' }]}>Спящий дракон ждёт первого вдоха. Добавь практику, чтобы развернуть свиток дня.</Text>
      <Btn variant="primary" onPress={onAdd}>Добавить практику</Btn>
    </Card>
  );
}

function AllDoneState({ dayXp }) {
  const w = dailyWisdom();
  return (
    <Gradient colors={['#FBF3DC', '#F2E3B6']} angle={180} style={{ paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center', marginBottom: 16, borderRadius: 20, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 6px 16px rgba(80,52,18,0.22)` }}>
      <Seal size={48} style={{ marginBottom: 12 }} />
      <Text style={[T.displayM, { marginBottom: 6, textAlign: 'center' }]}>Свиток дня свёрнут</Text>
      <Text style={[T.body, { color: C.inkMuted, textAlign: 'center' }]}>Все практики завершены. +{dayXp} XP сегодня.{'\n'}«{w.han} — {w.ru}».</Text>
    </Gradient>
  );
}

export function TodayScreen({ ctx }) {
  const { practices, resources, dayState, streak, stage, onToggle, onOpen, onAdd, wide, onShowHelp, userName } = ctx;
  const today = practices.filter((p) => p.today && !p.archived);
  const done = today.filter((p) => p.done);
  const pending = today.filter((p) => !p.done);
  const allDone = today.length > 0 && pending.length === 0;
  const dayXp = done.reduce((s, p) => s + Object.values(p.r || {}).reduce((a, b) => a + b, 0), 0);
  const ordered = [...pending, ...done];
  const onCompleteAll = () => pending.forEach((pp) => onToggle(pp));
  const name = (userName || '').trim().split(' ')[0] || 'странник';
  const streakMilestone = streak >= 7 && streak % 7 === 0;

  return (
    <ScreenScroll>
      {/* hero */}
      <Gradient colors={['#FBEFC9', '#F2E3B6']} angle={180} style={{ paddingHorizontal: 20, paddingTop: 26, paddingBottom: 22, overflow: 'hidden', borderBottomWidth: 3, borderBottomColor: C.stoneLine, boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.6), 0px 4px 12px rgba(40,28,12,0.18)' }}>
        <Mist count={3} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16, zIndex: 2 }}>
          <Avatar flow={dayState === 'flow'} size={84} stage={stage.lvl} />
          <View style={{ flex: 1, paddingTop: 4 }}>
            <Text style={[T.eyebrow, { marginBottom: 4 }]}>Ступень {stage.lvl}</Text>
            <Text accessibilityRole="header" style={T.displayM}>{greeting()},{'\n'}{name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <DayStateChip dayState={dayState} />
            {onShowHelp ? (
              <Pressable onPress={onShowHelp} hitSlop={10} accessibilityRole="button" accessibilityLabel="Как это работает" style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.stoneMid, backgroundColor: C.paperWarm, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 14, fontWeight: '800', color: C.inkMuted }}>?</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={{ gap: 12, marginTop: 20, zIndex: 2 }}>
          <ResourceBar kind="hp" han="生" label="Жизнь" value={resources.hp} max={resources.hpMax} />
          <ResourceBar kind="qi" han="氣" label="Ци" value={resources.qi} max={resources.qiMax} glow={dayState === 'flow'} />
        </View>
      </Gradient>

      {/* summary ribbon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.paperWarm }}>
        <Text style={{ fontFamily: FONT.ui, fontWeight: '800', fontSize: 14, color: C.ink }}>
          {done.length} <Text style={{ color: C.inkFaint, fontWeight: '600' }}>из {today.length}</Text>
        </Text>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.inkFaint }} />
        <Text style={{ fontFamily: FONT.ui, fontWeight: '800', fontSize: 14, color: C.gold }}>+{dayXp} XP</Text>
        <View style={{ flex: 1 }} />
        <StateChip state="streak" text={(streakMilestone ? '✦ ' : '') + streak + ' дней'} gold={streakMilestone} />
      </View>

      {/* practices */}
      <PadView wide={wide}>
        {dayState === 'spent' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.paperWarm, borderRadius: 14, borderWidth: 2, borderColor: C.paperDeep, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14 }}>
            <Text style={{ fontSize: 20 }}>🌙</Text>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 12.5, lineHeight: 17, color: C.inkMuted }}>Ци на исходе — это сигнал восстановиться, а не провал. Выбери лёгкую практику или дай себе отдых.</Text>
          </View>
        ) : null}

        {today.length === 0 ? <EmptyDay onAdd={onAdd} /> : allDone ? <AllDoneState dayXp={dayXp} /> : null}

        {!allDone && pending.length > 0 && pending.length <= 2 ? (
          <Btn variant="primary" block onPress={onCompleteAll} style={{ marginBottom: 12 }}>{`✦ Завершить всё (${pending.length})`}</Btn>
        ) : null}

        <View style={{ gap: 12 }}>
          {ordered.map((p, i) => (
            <View key={p.id} style={[{ position: 'relative' }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: i * 0.06 })]}>
              <PracticeCard p={p} onToggle={onToggle} onOpen={onOpen} locked={p.qi < 0 && resources.qi < Math.abs(p.qi)} />
              {p.done ? <DoneSeal /> : null}
            </View>
          ))}
        </View>

        <Btn variant="ghost" block onPress={onAdd} style={{ marginTop: 14, borderWidth: 1.5, borderColor: 'rgba(120,92,48,0.25)', borderStyle: 'dashed' }}>
          + Добавить практику
        </Btn>
      </PadView>
    </ScreenScroll>
  );
}
