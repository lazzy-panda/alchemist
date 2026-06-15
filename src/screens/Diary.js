/* Alchemist — Diary screen: six-times-a-day ethical diary (English) */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, FONT } from '../theme';
import { DIARY_TIMES, DIARY_SETS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, Gradient, T, SectionHead, DiaryInput, SelChip, kf, KF, EASE } from '../ui';
import { KitPill } from '../kit';
import { useEffects } from '../effects';

function GoldPill({ children, style }) {
  return (
    <KitPill color="gold" style={style}>
      <Text style={{ fontFamily: FONT.display, fontSize: 8, color: '#4a3410' }}>{children}</Text>
    </KitPill>
  );
}

function CheckDot({ on }) {
  if (on) return <Gradient colors={[C.jadeLight, C.jade]} angle={180} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.jadeLine }} />;
  return <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: C.stoneMid, backgroundColor: C.paperWarm }} />;
}

const PMT = { plus: 'primary', minus: 'danger', todo: 'gold' };
function PmtRow({ badge, kind, label, value, onChange, mini, placeholder }) {
  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 9 }}>
      <KitPill color={PMT[kind]} style={{ marginTop: 2 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 11, color: kind === 'todo' ? '#4a3410' : '#fff' }}>{badge}</Text>
      </KitPill>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label && !mini ? <Text style={[T.caption, { marginBottom: 4 }]}>{label}</Text> : null}
        <DiaryInput value={value} onChangeText={onChange} placeholder={placeholder || 'A concrete, real example…'} />
      </View>
    </View>
  );
}

function DiaryCheckInner({ v, c, isOpen, onHeaderPress, onComplete, time, onChange }) {
  return (
    <>
      <Pressable onPress={onHeaderPress} accessibilityRole="button" accessibilityLabel={`${v.n}. ${v.t}`} accessibilityState={{ expanded: isOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
        <GoldPill>{time}</GoldPill>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 9, lineHeight: 14, color: C.ink }}>{v.n}. {v.t}</Text>
          {!isOpen ? <Text style={[T.caption, { marginTop: 3 }]}>{c.done ? <Text style={{ color: C.jadeLight }}>✓ checked</Text> : 'tap to fill'}</Text> : null}
        </View>
        {c.done ? <CheckDot on /> : <Text style={{ color: C.inkFaint, fontSize: 16, transform: isOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>}
      </Pressable>
      {isOpen ? (
        <View style={[{ paddingHorizontal: 14, paddingBottom: 14 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
          <Text style={{ fontStyle: 'italic', color: C.inkMuted, fontSize: 10, lineHeight: 16, marginBottom: 14, fontFamily: FONT.ui }}>{v.q}</Text>
          <PmtRow badge="＋" kind="plus" label="Plus — a good thing you did" value={c.plus} onChange={(val) => onChange('plus', val)} />
          <PmtRow badge="－" kind="minus" label="Minus — harm to self or others" value={c.minus} onChange={(val) => onChange('minus', val)} />
          <PmtRow badge="✓" kind="todo" label="To do — for the next hours" value={c.todo} onChange={(val) => onChange('todo', val)} />
          <Pressable onPress={onComplete} accessibilityRole="button" accessibilityLabel={c.done ? 'Update check' : 'Mark check'}>
            {({ pressed }) => (
              <Gradient colors={c.done ? ['#48433a', '#36322b'] : [C.jadeLight, C.jade]} angle={180} style={{ marginTop: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center', borderWidth: 2.5, borderColor: c.done ? '#5a5346' : C.jadeLine, transform: pressed ? [{ translateY: 2 }] : [] }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 9, color: '#fff' }}>{c.done ? '✓ Update check' : 'Mark check'}</Text>
              </Gradient>
            )}
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

function DiaryCheck({ v, c, isOpen, onHeaderPress, onComplete, time, onChange, refSet }) {
  return (
    <View ref={refSet}>
      <Card frame={c.done ? 'golden' : 'grey'}>
        <DiaryCheckInner v={v} c={c} isOpen={isOpen} onHeaderPress={onHeaderPress} onComplete={onComplete} time={time} onChange={onChange} />
      </Card>
    </View>
  );
}

export function DiaryScreen({ ctx }) {
  const { wide, diaryKey = 'alchemist_diary_v2' } = ctx || {};
  const fx = useEffects();
  const TIMES = DIARY_TIMES;
  const SETS = DIARY_SETS;
  const dayNum = Math.floor(Date.now() / 86400000);
  let todayStr = '';
  try { todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); } catch (e) { todayStr = ''; }

  const fresh = (setKey) => ({
    day: dayNum,
    setKey,
    checks: Array.from({ length: 6 }, () => ({ plus: '', minus: '', todo: '', done: false })),
    best: ['', '', ''],
    worst: ['', '', ''],
    note: '',
  });

  const [data, setData] = useState(() => fresh('ten'));
  const [open, setOpen] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(diaryKey);
        if (raw) { const d = JSON.parse(raw); if (d.day === dayNum && !cancelled) setData(d); }
      } catch (e) {}
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryKey]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(diaryKey, JSON.stringify(data)).then(() => setSaveError((e) => (e ? false : e))).catch(() => setSaveError(true));
  }, [data, loaded, diaryKey]);

  const setKey = data.setKey;
  const set = SETS[setKey];
  const vows = set.vows;
  const start = (((dayNum * 6) % vows.length) + vows.length) % vows.length;
  const todays = Array.from({ length: 6 }, (_, i) => ({ ...vows[(start + i) % vows.length], n: ((start + i) % vows.length) + 1 }));
  const doneCount = data.checks.filter((c) => c.done).length;

  const chooseSet = (k) => setData((d) => ({ ...fresh(k), best: d.best, worst: d.worst, note: d.note }));
  const upd = (i, field, val) => setData((d) => ({ ...d, checks: d.checks.map((x, j) => (j === i ? { ...x, [field]: val } : x)) }));
  const updList = (key, i, val) => setData((d) => { const a = [...d[key]]; a[i] = val; return { ...d, [key]: a }; });

  const complete = (i) => {
    const wasUndone = !data.checks[i].done;
    upd(i, 'done', true);
    if (wasUndone && refs.current[i] && refs.current[i].measureInWindow) {
      refs.current[i].measureInWindow((x, y, w, h) => fx.burst(x + w - 28, y + 28, ['#3E8C60', '#E0A93C', '#D078A6']));
    }
    if (i < 5) setTimeout(() => setOpen(i + 1), 350);
  };

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={T.eyebrow}>Six-times ethical diary</Text>
            <Text accessibilityRole="header" style={[T.displayL, { marginTop: 6 }]}>Diary</Text>
          </View>
          <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.gold }}>{todayStr}</Text>
        </View>
        <Text style={[T.body, { color: C.inkMuted, marginBottom: 16 }]}>
          Six times a day, pause, check one vow, and note a <Text style={{ color: C.jadeLight }}>plus</Text>, <Text style={{ color: C.red }}>minus</Text> and <Text style={{ color: C.gold }}>to-do</Text>.
        </Text>

        {saveError ? (
          <Card frame="grey" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 14 }}>⚠️</Text>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 9, color: C.red, lineHeight: 14 }}>Couldn't save the diary on this device — entries may be lost after closing.</Text>
          </Card>
        ) : null}

        {/* set chooser */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {Object.keys(SETS).map((k) => (
            <SelChip key={k} on={setKey === k} color={SETS[k].color} icon={SETS[k].icon} label={SETS[k].name} onPress={() => chooseSet(k)} />
          ))}
        </View>

        {/* progress */}
        <Card frame="grey" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.ink }}>{doneCount} <Text style={{ color: C.inkFaint }}>of 6 checks</Text></Text>
          <View style={{ flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'flex-end' }}>
            {data.checks.map((c, i) => <CheckDot key={i} on={c.done} />)}
          </View>
        </Card>

        {/* checks */}
        <View style={{ gap: 12 }}>
          {todays.map((v, i) => (
            <DiaryCheck
              key={i}
              refSet={(el) => (refs.current[i] = el)}
              v={v}
              c={data.checks[i]}
              time={TIMES[i]}
              isOpen={open === i}
              onHeaderPress={() => setOpen(open === i ? -1 : i)}
              onComplete={() => complete(i)}
              onChange={(field, val) => upd(i, field, val)}
            />
          ))}
        </View>

        {/* day totals */}
        <SectionHead title="Day totals" />
        <Card frame="grey">
          <Text style={[T.label, { color: C.jadeLight, marginBottom: 8 }]}>Three best deeds</Text>
          {data.best.map((v, i) => <PmtRow key={'b' + i} badge="＋" kind="plus" mini value={v} onChange={(val) => updList('best', i, val)} placeholder={'Best #' + (i + 1)} />)}
          <Text style={[T.label, { color: C.red, marginTop: 14, marginBottom: 8 }]}>Three worst deeds</Text>
          {data.worst.map((v, i) => <PmtRow key={'w' + i} badge="－" kind="minus" mini value={v} onChange={(val) => updList('worst', i, val)} placeholder={'Worst #' + (i + 1)} />)}
          <Text style={[T.label, { marginTop: 14, marginBottom: 8 }]}>🌙 Meditation note</Text>
          <DiaryInput value={data.note} onChangeText={(val) => setData((d) => ({ ...d, note: val }))} placeholder="How the meditation went, what you noticed…" multiline numberOfLines={2} style={{ minHeight: 56, textAlignVertical: 'top' }} />
        </Card>

        <Text style={[T.caption, { textAlign: 'center', marginTop: 18, fontStyle: 'italic', lineHeight: 14 }]}>
          «Check your heart six times a day» — Geshe Michael Roach
        </Text>
      </PadView>
    </ScreenScroll>
  );
}
