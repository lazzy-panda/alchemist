/* Alchemist — Today screen (RPGUI, English) */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { ScreenScroll, PadView, WIDE_MAX } from '../layout';
import { Gradient, Card, Btn, T, Seal, kf, KF, EASE } from '../ui';
import { Avatar, WillBar, StateChip } from '../badges';
import { PracticeCard } from '../PracticeCard';
import { dailyWisdom } from '../quotes';

function greeting() {
  let h = 9;
  try { h = new Date().getHours(); } catch (e) {}
  if (h >= 5 && h < 12) return 'Утро';
  if (h >= 12 && h < 18) return 'День';
  if (h >= 18 && h < 23) return 'Вечер';
  return 'Ночь';
}

function DayStateChip({ dayState }) {
  const map = { flow: 'flow', inspired: 'inspired', spent: 'spent', calm: 'calm' };
  return <StateChip state={map[dayState] || 'flow'} />;
}

function DoneSeal() {
  return (
    <View style={{ position: 'absolute', right: 12, top: '50%', marginTop: -14, opacity: 0.92, transform: [{ rotate: '-4deg' }] }} pointerEvents="none">
      <Seal size={28} fontSize={14} />
    </View>
  );
}

function EmptyDay({ onAdd }) {
  return (
    <Card style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 72 }}>🐉</Text>
      <Text style={[T.displayM, { marginTop: 10, marginBottom: 8, textAlign: 'center' }]}>Начни свой путь сегодня</Text>
      <Text style={[T.body, { color: C.inkMuted, marginBottom: 16, textAlign: 'center' }]}>Спящий дракон ждёт первого вдоха. Добавь практику, чтобы развернуть день.</Text>
      <Btn variant="primary" onPress={onAdd}>Добавить практику</Btn>
    </Card>
  );
}

function AllDoneState({ dayXp }) {
  const w = dailyWisdom();
  return (
    <Card frame="golden" style={{ alignItems: 'center', marginBottom: 14 }}>
      <Seal size={44} style={{ marginBottom: 12 }} />
      <Text style={[T.displayM, { marginBottom: 8, textAlign: 'center' }]}>Свиток дня запечатан</Text>
      <Text style={[T.body, { color: C.inkMuted, textAlign: 'center' }]}>Все практики выполнены. +{dayXp} XP сегодня.{'\n'}«{w}»</Text>
    </Card>
  );
}

export function TodayScreen({ ctx }) {
  const { practices, resources, dayState, streak, stage, onToggle, onOpen, onAdd, wide, onShowHelp, userName, avatar, onAvatar } = ctx;
  const today = practices.filter((p) => p.today && !p.archived);
  const done = today.filter((p) => p.done);
  const pending = today.filter((p) => !p.done);
  const allDone = today.length > 0 && pending.length === 0;
  const dayXp = done.reduce((s, p) => s + Object.values(p.r || {}).reduce((a, b) => a + b, 0), 0);
  // keep practices in their original slot when completed (strike-through in place, no jump to bottom)
  const ordered = today;
  const onCompleteAll = () => pending.forEach((pp) => onToggle(pp));
  const name = (userName || '').trim().split(' ')[0] || 'Странник';
  const streakMilestone = streak >= 7 && streak % 7 === 0;

  return (
    <ScreenScroll>
      {/* hero */}
      <Gradient colors={[C.heroBg, C.railBg]} angle={180} style={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 20, overflow: 'hidden', borderBottomWidth: 3, borderBottomColor: C.paperDeep }}>
        <View style={[{ position: 'relative' }, wide ? { width: '100%', maxWidth: WIDE_MAX, alignSelf: 'center' } : null]}>
          <View style={{ position: 'absolute', right: 0, top: 2, alignItems: 'flex-end', gap: 8, zIndex: 3 }}>
            <DayStateChip dayState={dayState} />
            {onShowHelp ? (
              <Pressable onPress={onShowHelp} hitSlop={10} accessibilityRole="button" accessibilityLabel="Как это работает" style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.stoneMid, backgroundColor: C.paperWarm, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 26, color: C.inkMuted }}>?</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, zIndex: 2 }}>
            <Avatar flow={dayState === 'flow'} size={72} stage={stage.lvl} avatar={avatar} onPress={onAvatar} />
            <View style={{ flex: 1, paddingTop: 2, paddingRight: 92 }}>
              <Text style={[T.eyebrow, { marginBottom: 6 }]}>Стадия {stage.lvl}</Text>
              <Text accessibilityRole="header" style={[T.displayM]}>{greeting()},{'\n'}{name}</Text>
            </View>
          </View>
          <View style={{ marginTop: 18, zIndex: 2 }}>
            <WillBar done={done.length} total={today.length} />
          </View>
        </View>
      </Gradient>

      {/* summary ribbon */}
      <View style={{ backgroundColor: C.paperWarm }}>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 12 }, wide ? { maxWidth: WIDE_MAX, width: '100%', alignSelf: 'center' } : null]}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.ink }}>{done.length} <Text style={{ color: C.inkFaint }}>из {today.length}</Text></Text>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>+{dayXp} XP</Text>
          <View style={{ flex: 1 }} />
          <StateChip state="streak" text={(streakMilestone ? '✦ ' : '') + streak + ' дн.'} gold={streakMilestone} />
        </View>
      </View>

      {/* practices */}
      <PadView wide={wide}>
        {dayState === 'spent' ? (
          <Card frame="grey" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Text style={{ fontSize: 36 }}>🌙</Text>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 18, lineHeight: 30, color: C.inkMuted }}>Ци на исходе — это сигнал восстановиться, а не провал. Выбери лёгкую практику или отдохни.</Text>
          </Card>
        ) : null}

        {today.length === 0 ? <EmptyDay onAdd={onAdd} /> : allDone ? <AllDoneState dayXp={dayXp} /> : null}

        {!allDone && pending.length > 0 && pending.length <= 2 ? (
          <Btn variant="primary" block onPress={onCompleteAll} style={{ marginBottom: 12 }}>{`✦ Выполнить всё (${pending.length})`}</Btn>
        ) : null}

        <View style={{ gap: 14 }}>
          {ordered.map((p, i) => (
            <View key={p.id} style={[{ position: 'relative' }, kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: i * 0.06 })]}>
              <PracticeCard p={p} onToggle={onToggle} onOpen={onOpen} locked={p.qi < 0 && resources.qi < Math.abs(p.qi)} />
            </View>
          ))}
        </View>

        <Btn variant="ghost" block onPress={onAdd} style={{ marginTop: 14, minHeight: 44 }}>+ Добавить практику</Btn>
      </PadView>
    </ScreenScroll>
  );
}
