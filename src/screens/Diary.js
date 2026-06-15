/* Alchemist — Diary screen: six-times-a-day ethical diary (ported 1:1 from screens3.jsx) */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, FONT } from '../theme';
import { DIARY_TIMES, DIARY_SETS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, Gradient, T, SectionHead, DiaryInput, kf, KF, EASE } from '../ui';
import { SelChip } from '../ui';
import { KitPill } from '../kit';
import { useEffects } from '../effects';

function GoldPill({ children, style }) {
  return (
    <KitPill color="gold" style={[{ paddingHorizontal: 12, minHeight: 26 }, style]}>
      <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 13, color: '#4a3410', textShadowColor: 'rgba(255,255,255,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>{children}</Text>
    </KitPill>
  );
}

function CheckDot({ on }) {
  if (on) {
    return <Gradient colors={[C.jadeLight, C.jade]} angle={180} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: C.stoneLine, boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.4)' }} />;
  }
  return <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: C.stoneLine, backgroundColor: '#e3d8bf', boxShadow: 'inset 0px 1px 0px rgba(255,255,255,0.4)' }} />;
}

const PMT = { plus: 'primary', minus: 'danger', todo: 'gold' };
function PmtRow({ badge, kind, label, value, onChange, mini, placeholder }) {
  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginBottom: 9 }}>
      <KitPill color={PMT[kind]} style={{ width: 34, minHeight: 34, paddingHorizontal: 0, marginTop: 2 }}>
        <Text style={{ fontFamily: FONT.display, fontWeight: '800', fontSize: 16, color: kind === 'todo' ? '#4a3410' : '#fff', textShadowColor: kind === 'todo' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }}>{badge}</Text>
      </KitPill>
      <View style={{ flex: 1, minWidth: 0 }}>
        {label && !mini ? <Text style={[T.caption, { marginBottom: 4 }]}>{label}</Text> : null}
        <DiaryInput value={value} onChangeText={onChange} placeholder={placeholder || 'Конкретный, реальный случай…'} />
      </View>
    </View>
  );
}

function DiaryCheck({ v, c, isOpen, onHeaderPress, onComplete, time, onChange, refSet }) {
  return (
    <View ref={refSet} style={{ borderRadius: 20, overflow: 'hidden' }}>
      {c.done ? (
        <Gradient colors={['#ecf6ee', '#ddeee2']} angle={180} style={{ borderRadius: 20, borderWidth: 2.5, borderColor: '#a7d2b8' }}>
          <DiaryCheckInner v={v} c={c} isOpen={isOpen} onHeaderPress={onHeaderPress} onComplete={onComplete} time={time} onChange={onChange} />
        </Gradient>
      ) : (
        <Card style={{ borderRadius: 20 }}>
          <DiaryCheckInner v={v} c={c} isOpen={isOpen} onHeaderPress={onHeaderPress} onComplete={onComplete} time={time} onChange={onChange} />
        </Card>
      )}
    </View>
  );
}

function DiaryCheckInner({ v, c, isOpen, onHeaderPress, onComplete, time, onChange }) {
  return (
    <>
      <Pressable onPress={onHeaderPress} accessibilityRole="button" accessibilityLabel={`${v.n}. ${v.t}`} accessibilityState={{ expanded: isOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 15 }}>
        <GoldPill>{time}</GoldPill>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '600', fontSize: 15.5, color: C.ink }}>{v.n}. {v.t}</Text>
          {!isOpen ? (
            <Text style={[T.caption, { marginTop: 2 }]}>
              {c.done ? <Text style={{ color: C.jadeDeep, fontWeight: '700' }}>✓ проверено</Text> : 'нажми, чтобы заполнить'}
            </Text>
          ) : null}
        </View>
        {c.done ? <CheckDot on /> : <Text style={{ color: C.inkFaint, fontSize: 18, transform: isOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>}
      </Pressable>
      {isOpen ? (
        <View style={[{ paddingHorizontal: 15, paddingBottom: 16 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
          <Text style={{ fontStyle: 'italic', color: C.inkMuted, fontSize: 14, lineHeight: 22, marginBottom: 14, fontFamily: FONT.ui }}>{v.q}</Text>
          <PmtRow badge="＋" kind="plus" label="Плюс — что хорошего сделал" value={c.plus} onChange={(val) => onChange('plus', val)} />
          <PmtRow badge="－" kind="minus" label="Минус — чем навредил себе/другим" value={c.minus} onChange={(val) => onChange('minus', val)} />
          <PmtRow badge="✓" kind="todo" label="Сделать — на ближайшие часы" value={c.todo} onChange={(val) => onChange('todo', val)} />
          <Pressable onPress={onComplete} accessibilityRole="button" accessibilityLabel={c.done ? 'Обновить проверку' : 'Отметить проверку'}>
            {({ pressed }) => (
              <Gradient colors={c.done ? ['#CFCABC', '#A29C8C'] : [C.jadeLight, C.jade]} angle={180} style={{ marginTop: 12, paddingVertical: 12, borderRadius: 16, alignItems: 'center', borderWidth: 2.5, borderColor: c.done ? '#46433A' : C.jadeLine, boxShadow: c.done ? '0px 4px 0px #46433A' : `0px 4px 0px ${C.jadeLine}`, transform: pressed ? [{ translateY: 3 }] : [] }}>
                <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, color: c.done ? '#3a362c' : '#fff' }}>{c.done ? '✓ Обновить проверку' : 'Отметить проверку'}</Text>
              </Gradient>
            )}
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

export function DiaryScreen({ ctx }) {
  const { wide, diaryKey = 'alchemist_diary_v2' } = ctx || {};
  const fx = useEffects();
  const TIMES = DIARY_TIMES;
  const SETS = DIARY_SETS;
  const dayNum = Math.floor(Date.now() / 86400000);
  let todayStr = '';
  try {
    todayStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  } catch (e) {
    todayStr = '';
  }

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
        if (raw) {
          const d = JSON.parse(raw);
          if (d.day === dayNum && !cancelled) setData(d);
        }
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
        <Text style={T.eyebrow}>Шестиразовый этический дневник</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <Text accessibilityRole="header" style={T.displayL}>Дневник</Text>
          <GoldPill style={{ marginBottom: 4 }}>{todayStr}</GoldPill>
        </View>
        <Text style={[T.body, { color: C.inkMuted, marginBottom: 16 }]}>
          Шесть раз в день остановись, проверь один обет и запиши <Text style={{ color: C.jadeDeep, fontWeight: '700' }}>плюс</Text>, <Text style={{ color: C.redDeep, fontWeight: '700' }}>минус</Text> и <Text style={{ color: C.goldDeep, fontWeight: '700' }}>дело</Text>.
        </Text>

        {saveError ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(217,84,59,0.1)', borderWidth: 2, borderColor: C.redLine, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 }}>
            <Text style={{ fontSize: 15 }}>⚠️</Text>
            <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 12, fontWeight: '700', color: C.redDeep, lineHeight: 16 }}>Не удалось сохранить дневник на устройстве — записи могут пропасть после закрытия.</Text>
          </View>
        ) : null}

        {/* set chooser */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {Object.keys(SETS).map((k) => (
            <SelChip key={k} on={setKey === k} color={SETS[k].color} hanColor={SETS[k].color} han={SETS[k].han} label={SETS[k].name} onPress={() => chooseSet(k)} />
          ))}
        </View>

        {/* progress */}
        <Card style={{ paddingVertical: 13, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 15, color: C.ink }}>
            {doneCount} <Text style={{ color: C.inkFaint }}>из 6 проверок</Text>
          </Text>
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
        <SectionHead title="Итоги дня" />
        <Card style={{ padding: 16 }}>
          <Text style={[T.label, { color: C.jadeDeep, marginBottom: 8 }]}>Три лучших дела</Text>
          {data.best.map((v, i) => <PmtRow key={'b' + i} badge="＋" kind="plus" mini value={v} onChange={(val) => updList('best', i, val)} placeholder={'Лучшее №' + (i + 1)} />)}
          <Text style={[T.label, { color: C.redDeep, marginTop: 14, marginBottom: 8 }]}>Три худших дела</Text>
          {data.worst.map((v, i) => <PmtRow key={'w' + i} badge="－" kind="minus" mini value={v} onChange={(val) => updList('worst', i, val)} placeholder={'Худшее №' + (i + 1)} />)}
          <Text style={[T.label, { marginTop: 14, marginBottom: 8 }]}>🌙 Заметка о медитации</Text>
          <DiaryInput value={data.note} onChangeText={(val) => setData((d) => ({ ...d, note: val }))} placeholder="Как прошла медитация, что заметил…" multiline numberOfLines={2} style={{ minHeight: 56, textAlignVertical: 'top' }} />
        </Card>

        <Text style={[T.caption, { textAlign: 'center', marginTop: 18, fontStyle: 'italic' }]}>
          «Проверяй своё сердце шесть раз в день» — Геше Майкл Роуч
        </Text>
      </PadView>
    </ScreenScroll>
  );
}
