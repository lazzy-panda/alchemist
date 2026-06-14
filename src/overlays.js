/* Alchemist — overlays: PracticeDetail, EditorSheet, DayDetailSheet, LevelUpOverlay, FogVeil */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT, shade } from './theme';
import { CATS, STATS, PRACTICES } from './data';
import { Card, Btn, IconBtn, Gradient, Gloss, Han, T, SectionHead, Seal, Stepper, SelChip, Field, Input, ts, kf, KF, EASE } from './ui';
import { RewardMedal, QiTag, StateChip, MedalPill } from './badges';
import { CircularTimer } from './svg';
import { PracticeCard } from './PracticeCard';
import { KitPanel, KitClose } from './kit';

const SHEET_UP = { '0%': { transform: [{ translateY: 820 }] }, '100%': { transform: [{ translateY: 0 }] } };
const SHEET_DOWN = { '0%': { transform: [{ translateY: 0 }] }, '100%': { transform: [{ translateY: 820 }] } };

/* ============================================================
   PRACTICE DETAIL (full-screen, timer)
   ============================================================ */
export function PracticeDetail({ practice, onComplete, onClose, wide }) {
  const cat = CATS[practice.cat];
  const [total, setTotal] = useState(practice.dur * 60);
  const [remaining, setRemaining] = useState(practice.dur * 60);
  const [running, setRunning] = useState(false);
  const [showInstr, setShowInstr] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (running) {
      timer.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            clearInterval(timer.current);
            setRunning(false);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer.current);
  }, [running]);

  const adjust = (delta) => {
    if (running) return;
    const nt = Math.max(60, total + delta * 60);
    setTotal(nt);
    setRemaining(nt);
  };
  const rewards = Object.entries(practice.r || {});

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: C.paper, zIndex: 200 }}>
      <ScrollViewSafe>
        <View style={[{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30, minHeight: '100%' }, wide && { maxWidth: 720, width: '100%', alignSelf: 'center', paddingHorizontal: 40 }]}>
          {/* header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Btn variant="ghost" onPress={onClose} style={{ paddingVertical: 8, paddingHorizontal: 10, marginLeft: -8 }}>‹ Назад</Btn>
            <KitClose onPress={onClose} size={34} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 22 }}>
            <Gradient colors={[cat.color, shade(cat.color, -18)]} angle={150} style={{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: C.stoneLine, overflow: 'hidden', boxShadow: 'inset 0px 3px 0px rgba(255,255,255,0.5), inset 0px -4px 8px rgba(0,0,0,0.25), 0px 3px 0px rgba(0,0,0,0.18)' }}>
              <Han style={{ fontSize: 25, color: '#fff' }}>{cat.han}</Han>
              <Gloss radius={16} />
            </Gradient>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text style={[T.displayM, { fontSize: 22, lineHeight: 24 }]}>{practice.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 11, fontWeight: '700', color: cat.color }}>{cat.name}{practice.mult ? ' · ×' + practice.mult : ''}</Text>
            </View>
          </View>

          {/* timer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, marginBottom: 6 }}>
            <TStep label="−5м" onPress={() => adjust(-5)} disabled={running} />
            <CircularTimer remaining={remaining} total={total} running={running} size={234} />
            <TStep label="+5м" onPress={() => adjust(5)} disabled={running} />
          </View>

          {/* controls */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8 }}>
            {!running && remaining > 0 && remaining === total ? <Btn variant="primary" block onPress={() => setRunning(true)} style={{ flex: 1 }}>▶ Старт</Btn> : null}
            {running ? <Btn variant="secondary" block onPress={() => setRunning(false)} style={{ flex: 1 }}>⏸ Пауза</Btn> : null}
            {!running && remaining < total && remaining > 0 ? <Btn variant="primary" block onPress={() => setRunning(true)} style={{ flex: 1 }}>▶ Продолжить</Btn> : null}
            {remaining === 0 ? <Btn variant="gold" block onPress={() => onComplete(practice)} style={{ flex: 1 }}>✦ Завершить</Btn> : null}
            {remaining < total && remaining > 0 ? <Btn variant="ghost" onPress={() => { setRemaining(total); setRunning(false); }}>Сброс</Btn> : null}
          </View>
          <Btn variant="ghost" block onPress={() => onComplete(practice)} textStyle={{ color: C.jadeDeep }}>Отметить выполненной</Btn>

          {/* instruction */}
          <Pressable onPress={() => setShowInstr(!showInstr)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <Text style={{ color: C.inkMuted, fontSize: 16, transform: showInstr ? [{ rotate: '90deg' }] : [] }}>›</Text>
            <Text style={{ fontFamily: FONT.ui, fontWeight: '700', fontSize: 14, color: C.inkMuted }}>Руководство</Text>
          </Pressable>
          {showInstr ? (
            <Text style={[T.body, { color: C.inkMuted, paddingHorizontal: 4, paddingTop: 8, lineHeight: 24 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
              Сядь удобно, спина прямая. Дыши животом, медленно и ровно. Сосредоточь внимание на потоке Ци по меридианам. Не торопись — ритм спокойного дыхания важнее длительности.
            </Text>
          ) : null}

          {/* rewards */}
          <SectionHead title="Награды" />
          <Card style={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {rewards.map(([k, v]) => <RewardMedal key={k} stat={k} value={practice.mult ? Math.round(v * practice.mult) : v} />)}
            <QiTag qi={practice.qi} />
            {practice.mult ? (
              <MedalPill>
                <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 12.5, color: C.gold }}>Чжан Чжуан ×{practice.mult}</Text>
              </MedalPill>
            ) : null}
          </Card>
        </View>
      </ScrollViewSafe>
    </View>
  );
}

function TStep({ label, onPress, disabled }) {
  return (
    <Pressable onPress={disabled ? undefined : onPress}>
      {({ pressed }) => (
        <Gradient colors={['#CFCABC', '#A29C8C']} angle={180} style={{ borderRadius: 999, borderWidth: 2.5, borderColor: '#46433A', paddingVertical: 9, paddingHorizontal: 12, opacity: disabled ? 0.35 : 1, boxShadow: disabled ? 'none' : '0px 3px 0px #46433A, inset 0px 2px 0px rgba(255,255,255,0.6)', transform: pressed && !disabled ? [{ translateY: 3 }] : [] }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 13, color: '#3a362c' }}>{label}</Text>
        </Gradient>
      )}
    </Pressable>
  );
}

/* simple scroll wrapper to keep overlay scrollable */
function ScrollViewSafe({ children }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: '100%' }}>
      {children}
    </ScrollView>
  );
}

/* ============================================================
   SHEET shell
   ============================================================ */
function Sheet({ children, onClose, maxHeightPct = 90 }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(() => onClose && onClose(), 280);
  };
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 150, justifyContent: 'flex-end' }}>
      <Pressable onPress={close} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(35,25,12,0.45)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out, dir: closing ? 'reverse' : 'normal' })]} />
      <View style={[{ maxHeight: maxHeightPct + '%' }, kf(closing ? SHEET_DOWN : SHEET_UP, closing ? 0.28 : 0.38, { ease: EASE.out, fill: 'forwards' })]}>
        <KitPanel slice={[58, 58, 30, 58]} border={{ top: 26, right: 24, bottom: 6, left: 24 }} style={{ width: '100%' }} contentStyle={{ position: 'relative' }}>
          <View style={{ position: 'absolute', right: 6, top: -6, zIndex: 6 }}>
            <KitClose onPress={close} size={34} />
          </View>
          {typeof children === 'function' ? children(close) : children}
        </KitPanel>
      </View>
    </View>
  );
}

/* ============================================================
   EDITOR SHEET
   ============================================================ */
export function EditorSheet({ practice, onSave, onClose }) {
  const isNew = !practice;
  const [name, setName] = useState(practice?.name || '');
  const [cat, setCat] = useState(practice?.cat || 'med');
  const [dur, setDur] = useState(practice?.dur || 15);
  const [rewards, setRewards] = useState(practice?.r ? { ...practice.r } : {});

  const toggleReward = (k) => {
    setRewards((r) => {
      const n = { ...r };
      if (n[k]) delete n[k];
      else n[k] = 2;
      return n;
    });
  };

  return (
    <Sheet onClose={onClose}>
      {(close) => (
        <ScrollViewSafe>
          <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 }}>
            <Text style={[T.displayM, { marginTop: 6, marginBottom: 18 }]}>{isNew ? 'Новая практика' : 'Изменить практику'}</Text>

            <Field label="Название">
              <Input value={name} onChangeText={setName} placeholder="Напр. Утренний цигун" />
            </Field>

            <Field label="Категория">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(CATS).map((ck) => (
                  <SelChip key={ck} on={cat === ck} color={CATS[ck].color} hanColor={CATS[ck].color} han={CATS[ck].han} label={CATS[ck].name} onPress={() => setCat(ck)} />
                ))}
              </View>
            </Field>

            <Field label="Длительность">
              <Stepper value={dur} onDec={() => setDur(Math.max(1, dur - 5))} onInc={() => setDur(dur + 5)} />
            </Field>

            <Field label="Привязка характеристик">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STATS.map((s) => (
                  <SelChip key={s.key} on={!!rewards[s.key]} color={s.color} hanColor={s.color} han={s.han} label={s.name + (rewards[s.key] ? ' +' + rewards[s.key] : '')} onPress={() => toggleReward(s.key)} />
                ))}
              </View>
            </Field>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              <Btn
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  if (!name.trim()) return;
                  close();
                  setTimeout(() => onSave({ id: practice?.id, name: name.trim(), cat, dur, r: rewards, qi: practice?.qi ?? 2, today: practice?.today, done: practice?.done }), 290);
                }}
              >
                Сохранить
              </Btn>
              {!isNew ? <Btn variant="danger" onPress={close}>Архивировать</Btn> : null}
            </View>
          </View>
        </ScrollViewSafe>
      )}
    </Sheet>
  );
}

/* ============================================================
   DAY DETAIL SHEET
   ============================================================ */
export function DayDetailSheet({ day, onClose }) {
  const sample = PRACTICES.filter((p) => p.today).slice(0, 3);
  return (
    <Sheet onClose={onClose} maxHeightPct={70}>
      <ScrollViewSafe>
        <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 }}>
            <Text style={T.displayM}>{day + 1} июня</Text>
            <StateChip state="flow" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 12.5, color: C.gold }}>+18 XP</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 12.5, color: C.red }}>生 92%</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 12.5, color: C.cEnergy }}>氣 78%</Text></MedalPill>
          </View>
          <Text style={[T.label, { marginBottom: 8 }]}>Выполнено</Text>
          <View style={{ gap: 10 }}>
            {sample.map((p) => <PracticeCard key={p.id} p={{ ...p, done: true }} compact />)}
          </View>
        </View>
      </ScrollViewSafe>
    </Sheet>
  );
}

/* ============================================================
   LEVEL-UP OVERLAY
   ============================================================ */
function LevelWing({ side }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, transform: [{ scaleX: side === 'l' ? 1 : -1 }] }}>
      {[10, 16, 22].map((h, i) => (
        <View key={i} style={{ width: 6, height: h, borderRadius: 3, backgroundColor: i === 2 ? C.goldLight : C.gold, borderWidth: 1.5, borderColor: C.goldLine, transform: [{ rotate: '-14deg' }] }} />
      ))}
    </View>
  );
}

export function LevelUpOverlay({ stage, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable onPress={onClose} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,25,12,0.5)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(246,214,133,0.25)' }, kf(KF.goldBurst, 0.9, { ease: EASE.out, fill: 'forwards' })]} />
      <View style={[{ width: '84%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 26, borderRadius: 26, borderWidth: 4, borderColor: C.stoneDark, backgroundColor: C.paperLight, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 14px 34px rgba(0,0,0,0.4)` }, kf(KF.popIn, 0.5, { ease: EASE.overshoot })]}>
        {/* winged number medallion (kit LEVEL UP banner) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <LevelWing side="l" />
          <Gradient colors={[C.goldLight, C.gold]} angle={180} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: C.goldLine, boxShadow: `inset 0px 3px 0px rgba(255,255,255,0.6), 0px 5px 0px ${C.goldLine}, 0px 9px 16px rgba(154,98,18,0.4)` }}>
            <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 42, color: '#5a3d10', ...ts('rgba(255,255,255,0.5)', 0, 1) }}>{stage}</Text>
            <Gloss radius={42} />
          </Gradient>
          <LevelWing side="r" />
        </View>
        <Gradient colors={[C.goldLight, C.gold]} angle={180} style={{ paddingVertical: 7, paddingHorizontal: 22, borderRadius: 9, borderWidth: 2.5, borderColor: C.goldLine, marginBottom: 12, boxShadow: `0px 3px 0px ${C.goldLine}, inset 0px 2px 0px rgba(255,255,255,0.5)` }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 15, letterSpacing: 1, color: '#5a3d10', ...ts('rgba(255,255,255,0.4)', 0, 1) }}>НОВАЯ СТУПЕНЬ</Text>
        </Gradient>
        <Text style={[T.body, { color: C.inkMuted, marginBottom: 6, textAlign: 'center' }]}>Туман рассеялся ещё на один пик. Твоя культивация углубилась.</Text>
        <Han style={{ fontSize: 14, color: C.inkFaint, letterSpacing: 3, marginTop: 2 }}>修真之路</Han>
      </View>
    </Pressable>
  );
}

/* ============================================================
   FOG VEIL (launch intro)
   ============================================================ */
export function FogVeil() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1600);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 300, backgroundColor: 'rgba(241,228,195,0.97)' },
        kf(KF.fogClear, 1.6, { ease: EASE.soft, fill: 'forwards' }),
      ]}
    />
  );
}
