/* Alchemist — Diary screen: six-times-a-day ethical diary (English) */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadUserData, saveUserField } from '../supabase';
import { C, FONT } from '../theme';
import { DIARY_TIMES, DIARY_SETS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, Gradient, T, SectionHead, DiaryInput, SelChip, kf, KF, EASE } from '../ui';
import { KitPill, KitCheckbox } from '../kit';
import { useEffects } from '../effects';

function GoldPill({ children, style }) {
  return (
    <KitPill color="gold" style={style}>
      <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.title }}>{children}</Text>
    </KitPill>
  );
}

function CheckDot({ on }) {
  return <KitCheckbox on={on} size={18} />;
}

const PMT_COLOR = { plus: C.jadeLight, minus: C.red, todo: C.gold };
function PmtRow({ badge, kind, label, value, onChange, mini, placeholder }) {
  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 9 }}>
      <KitPill style={{ marginTop: 2 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 28, color: PMT_COLOR[kind] || C.ink }}>{badge}</Text>
      </KitPill>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label && !mini ? <Text style={[T.caption, { marginBottom: 4 }]}>{label}</Text> : null}
        <DiaryInput value={value} onChangeText={onChange} placeholder={placeholder || 'Реальный пример…'} />
      </View>
    </View>
  );
}

function DiaryCheckInner({ v, c, isOpen, onHeaderPress, onComplete, time, onChange, slotNativeID }) {
  return (
    <>
      <Pressable nativeID={slotNativeID ? `${slotNativeID}-header` : undefined} onPress={onHeaderPress} accessibilityRole="button" accessibilityLabel={`${v.n}. ${v.t}`} accessibilityState={{ expanded: isOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
        <GoldPill>{time}</GoldPill>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, lineHeight: 28, color: C.ink }}>{v.n}. {v.t}</Text>
          {!isOpen ? <Text style={[T.caption, { marginTop: 3 }]}>{c.done ? <Text style={{ color: C.jadeLight }}>✓ отмечено</Text> : 'нажмите, чтобы заполнить'}</Text> : null}
        </View>
        {c.done ? <CheckDot on /> : <Text style={{ color: C.inkFaint, fontSize: 32, transform: isOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>}
      </Pressable>
      {isOpen ? (
        <View style={[{ paddingHorizontal: 14, paddingBottom: 14 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
          <Text style={{ fontStyle: 'italic', color: C.inkMuted, fontSize: 20, lineHeight: 40, marginBottom: 14, fontFamily: FONT.ui }}>{v.q}</Text>
          <PmtRow badge="＋" kind="plus" label="Плюс — доброе дело" value={c.plus} onChange={(val) => onChange('plus', val)} />
          <PmtRow badge="－" kind="minus" label="Минус — вред себе или другим" value={c.minus} onChange={(val) => onChange('minus', val)} />
          <PmtRow badge="✓" kind="todo" label="Сделать — на ближайшие часы" value={c.todo} onChange={(val) => onChange('todo', val)} />
          <Pressable nativeID={slotNativeID ? `${slotNativeID}-complete` : undefined} onPress={onComplete} accessibilityRole="button" accessibilityLabel={c.done ? 'Обновить' : 'Отметить'}>
            {({ pressed }) => (
              <Gradient colors={c.done ? ['#48433a', '#36322b'] : [C.jadeLight, C.jade]} angle={180} style={{ marginTop: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center', borderWidth: 2.5, borderColor: c.done ? '#5a5346' : C.jadeLine, transform: pressed ? [{ translateY: 2 }] : [] }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 18, color: '#fff' }}>{c.done ? '✓ Обновить' : 'Отметить'}</Text>
              </Gradient>
            )}
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

function DiaryCheck({ v, c, isOpen, onHeaderPress, onComplete, time, onChange, refSet, nativeID }) {
  return (
    <View nativeID={nativeID} ref={refSet}>
      <Card frame="grey">
        <DiaryCheckInner v={v} c={c} isOpen={isOpen} onHeaderPress={onHeaderPress} onComplete={onComplete} time={time} onChange={onChange} slotNativeID={nativeID} />
      </Card>
    </View>
  );
}

export function DiaryScreen({ ctx }) {
  const { wide, diaryKey = 'alchemist_diary_v2', userId } = ctx || {};
  const fx = useEffects();
  const TIMES = DIARY_TIMES;
  const SETS = DIARY_SETS;
  const dayNum = Math.floor(Date.now() / 86400000);
  let todayStr = '';
  try { todayStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); } catch (e) { todayStr = ''; }

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
  const [saveError, setSaveError] = useState(false);
  const refs = useRef([]);
  // race-safe persistence: only save once THIS key has hydrated, so the anon→user key
  // switch on reload can't overwrite a saved diary with a fresh/empty one.
  const hydratedKey = useRef(null);
  const cloudTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    hydratedKey.current = null;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(diaryKey);
        if (!cancelled && raw) { const d = JSON.parse(raw); if (d.day === dayNum) setData(d); } // local cache
      } catch (e) {}
      if (userId) {
        const row = await loadUserData(userId); // cloud → authoritative for today's diary
        if (!cancelled && row && row.diary && row.diary.day === dayNum) setData(row.diary);
      }
      if (!cancelled) hydratedKey.current = diaryKey;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryKey]);

  useEffect(() => {
    if (hydratedKey.current !== diaryKey) return;
    AsyncStorage.setItem(diaryKey, JSON.stringify(data)).then(() => setSaveError((e) => (e ? false : e))).catch(() => setSaveError(true));
    if (userId) {
      clearTimeout(cloudTimer.current);
      cloudTimer.current = setTimeout(() => saveUserField(userId, 'diary', data), 600);
    }
  }, [data, diaryKey]);

  const setKey = data.setKey;
  const set = SETS[setKey] || SETS[Object.keys(SETS)[0]]; // never crash on a legacy/unknown set key
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
    <ScreenScroll nativeID="screen-diary">
      <PadView wide={wide}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={T.eyebrow}>Шестиразовый этический дневник</Text>
            <Text accessibilityRole="header" style={[T.displayL, { marginTop: 6 }]}>Дневник</Text>
          </View>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>{todayStr}</Text>
        </View>
        <Text style={[T.body, { color: C.inkMuted, marginBottom: 16 }]}>
          Шесть раз в день остановитесь, проверьте один обет и запишите <Text style={{ color: C.jadeLight }}>Плюс</Text>, <Text style={{ color: C.red }}>Минус</Text> и <Text style={{ color: C.gold }}>дело</Text>.
        </Text>

        {saveError ? (
          <Card frame="grey" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 28 }}>⚠️</Text>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 18, color: C.red, lineHeight: 28 }}>Не удалось сохранить дневник на этом устройстве — записи могут потеряться после закрытия.</Text>
          </Card>
        ) : null}

        {/* set chooser */}
        <View nativeID="diary-set-chooser" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {Object.keys(SETS).map((k) => (
            <SelChip nativeID={`diary-set-${k}`} key={k} on={setKey === k} color={SETS[k].color} icon={SETS[k].icon} label={SETS[k].name} onPress={() => chooseSet(k)} />
          ))}
        </View>

        {/* progress */}
        <Card nativeID="diary-progress" frame="grey" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.ink }}>{doneCount} <Text style={{ color: C.inkFaint }}>из 6 проверок</Text></Text>
          <View style={{ flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'flex-end' }}>
            {data.checks.map((c, i) => <CheckDot key={i} on={c.done} />)}
          </View>
        </Card>

        {/* checks */}
        <View nativeID="diary-checks" style={{ gap: 12 }}>
          {todays.map((v, i) => (
            <DiaryCheck
              nativeID={`diary-check-${i}`}
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
        <SectionHead nativeID="diary-totals" title="Итоги дня" />
        <Card nativeID="diary-totals-card" frame="grey">
          <Text style={[T.label, { color: C.jadeLight, marginBottom: 8 }]}>Три лучших дела</Text>
          {data.best.map((v, i) => <PmtRow key={'b' + i} badge="＋" kind="plus" mini value={v} onChange={(val) => updList('best', i, val)} placeholder={'Лучшее №' + (i + 1)} />)}
          <Text style={[T.label, { color: C.red, marginTop: 14, marginBottom: 8 }]}>Три худших дела</Text>
          {data.worst.map((v, i) => <PmtRow key={'w' + i} badge="－" kind="minus" mini value={v} onChange={(val) => updList('worst', i, val)} placeholder={'Худшее №' + (i + 1)} />)}
          <Text style={[T.label, { marginTop: 14, marginBottom: 8 }]}>🌙 Заметка о медитации</Text>
          <DiaryInput nativeID="diary-note" value={data.note} onChangeText={(val) => setData((d) => ({ ...d, note: val }))} placeholder="Как прошла медитация, что вы заметили…" multiline numberOfLines={2} style={{ minHeight: 56, textAlignVertical: 'top' }} />
        </Card>

        <Text style={[T.caption, { textAlign: 'center', marginTop: 18, fontStyle: 'italic', lineHeight: 28 }]}>
          «Проверяй сердце шесть раз в день» — Геше Майкл Роуч
        </Text>
      </PadView>
    </ScreenScroll>
  );
}
