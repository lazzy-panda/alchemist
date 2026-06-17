/* Alchemist — overlays: PracticeDetail, EditorSheet, DayDetailSheet, LevelUpOverlay, FogVeil */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { C, FONT, shade } from './theme';
import { CATS, STATS, PRACTICES } from './data';
import { ascension } from './quotes';
import { Card, Btn, IconBtn, Gradient, Gloss, Han, T, SectionHead, Seal, Stepper, SelChip, Field, Input, ts, kf, KF, EASE } from './ui';
import { RewardMedal, QiTag, StateChip, MedalPill, Bar } from './badges';
import { CircularTimer } from './svg';
import { PracticeCard } from './PracticeCard';
import { KitPanel, KitClose, KitGem, KitBanner } from './kit';

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
            <KitGem size={48} icon={cat.icon} color={cat.color} />
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <Text style={[T.displayM, { fontSize: 13, lineHeight: 18 }]}>{practice.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: cat.color }}>{cat.name}{practice.mult ? ' · x' + practice.mult : ''}</Text>
            </View>
          </View>

          {/* timer — native rpgui-progress + time readout */}
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <Text style={{ fontFamily: FONT.display, fontSize: 40, fontVariant: ['tabular-nums'], color: C.title, textAlign: 'center', marginBottom: 18, ...ts('rgba(0,0,0,0.5)', 0, 2, 2) }}>
              {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
            </Text>
            <Bar pct={total > 0 ? (remaining / total) * 100 : 0} color="qi" />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <TStep label="−5м" onPress={() => adjust(-5)} disabled={running} />
              <TStep label="+5м" onPress={() => adjust(5)} disabled={running} />
            </View>
          </View>

          {/* controls */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8 }}>
            {!running && remaining > 0 && remaining === total ? <Btn variant="primary" block onPress={() => setRunning(true)} style={{ flex: 1 }}>▶ Начать</Btn> : null}
            {running ? <Btn variant="secondary" block onPress={() => setRunning(false)} style={{ flex: 1 }}>⏸ Пауза</Btn> : null}
            {!running && remaining < total && remaining > 0 ? <Btn variant="primary" block onPress={() => setRunning(true)} style={{ flex: 1 }}>▶ Продолжить</Btn> : null}
            {remaining === 0 ? <Btn variant="gold" block onPress={() => onComplete(practice)} style={{ flex: 1 }}>✦ Завершить</Btn> : null}
            {remaining < total && remaining > 0 ? <Btn variant="ghost" onPress={() => { setRemaining(total); setRunning(false); }}>Сброс</Btn> : null}
          </View>
          <Btn variant="ghost" block onPress={() => onComplete(practice)}>Отметить выполненной</Btn>

          {/* instruction */}
          <Pressable onPress={() => setShowInstr(!showInstr)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <Text style={{ color: C.inkMuted, fontSize: 14, transform: showInstr ? [{ rotate: '90deg' }] : [] }}>›</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.inkMuted }}>Инструкция</Text>
          </Pressable>
          {showInstr ? (
            <Text style={[T.body, { color: C.inkMuted, paddingHorizontal: 4, paddingTop: 8, lineHeight: 20 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
              Сядьте удобно, спина прямая. Дышите в живот, медленно и ровно. Удерживайте внимание на течении Ци по меридианам. Не торопитесь — спокойный ритм важнее длительности.
            </Text>
          ) : null}

          {/* rewards */}
          <SectionHead title="Награды" />
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {rewards.map(([k, v]) => <RewardMedal key={k} stat={k} value={practice.mult ? Math.round(v * practice.mult) : v} />)}
            <QiTag qi={practice.qi} />
            {practice.mult ? (
              <MedalPill>
                <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.gold }}>Чжан Чжуан x{practice.mult}</Text>
              </MedalPill>
            ) : null}
          </Card>
          <Text style={[T.caption, { marginTop: 8, paddingHorizontal: 2, lineHeight: 13 }]}>+N — очки характеристик · ЦИ — изменение запаса Ци{practice.mult ? ' · x' + practice.mult + ' — бонус Чжан Чжуан' : ''}</Text>
        </View>
      </ScrollViewSafe>
    </View>
  );
}

function TStep({ label, onPress, disabled }) {
  return (
    <Btn variant="blue" onPress={disabled ? undefined : onPress} disabled={disabled} style={{ flex: 1 }}>
      {label}
    </Btn>
  );
}

/* Scroll wrapper for sheets — flex:1 fills the sheet's now-definite pixel height (set in Sheet). */
function ScrollViewSafe({ children }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} showsVerticalScrollIndicator={false}>
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
      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round((Dimensions.get('window').height || 800) * maxHeightPct / 100) }, kf(closing ? SHEET_DOWN : SHEET_UP, closing ? 0.28 : 0.38, { ease: EASE.out, fill: 'forwards' })]}>
        <KitPanel slice={[58, 58, 30, 58]} border={{ top: 26, right: 24, bottom: 6, left: 24 }} style={{ width: '100%', flex: 1 }} contentStyle={{ position: 'relative', flex: 1 }}>
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
export function EditorSheet({ practice, onSave, onClose, onArchive, existingNames }) {
  const isNew = !practice;
  const [name, setName] = useState(practice?.name || '');
  const [cat, setCat] = useState(practice?.cat || 'med');
  const [dur, setDur] = useState(practice?.dur || 15);
  const [rewards, setRewards] = useState(practice?.r ? { ...practice.r } : {});
  const [nameError, setNameError] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);

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
              <Input value={name} onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }} placeholder="напр. Утренний цигун" />
            </Field>
            {nameError ? <Text style={{ marginTop: -10, marginBottom: 12, color: C.red, fontFamily: FONT.ui, fontSize: 9 }}>{nameError}</Text> : null}

            <Field label="Категория">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(CATS).map((ck) => (
                  <SelChip key={ck} on={cat === ck} color={CATS[ck].color} icon={CATS[ck].icon} label={CATS[ck].name} onPress={() => setCat(ck)} />
                ))}
              </View>
            </Field>

            <Field label="Длительность">
              <Stepper value={dur} onDec={() => setDur(Math.max(1, dur - 5))} onInc={() => setDur(Math.min(180, dur + 5))} />
            </Field>

            <Field label="Награды-характеристики">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STATS.map((s) => (
                  <SelChip key={s.key} multi on={!!rewards[s.key]} color={s.color} icon={s.icon} label={s.name + (rewards[s.key] ? ' +' + rewards[s.key] : '')} onPress={() => toggleReward(s.key)} />
                ))}
              </View>
            </Field>
            {Object.keys(rewards).length === 0 ? <Text style={{ marginTop: -8, marginBottom: 10, color: C.inkMuted, fontFamily: FONT.ui, fontSize: 9, lineHeight: 14 }}>Совет: привяжите хотя бы одну характеристику, чтобы практика давала очки.</Text> : null}

            {confirmArchive ? (
              <View style={{ marginTop: 22, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: C.redLine, backgroundColor: 'rgba(217,84,59,0.08)' }}>
                <Text style={{ fontFamily: FONT.ui, fontSize: 9, color: C.red, marginBottom: 12, lineHeight: 14 }}>Архивировать «{name || practice?.name}»? Можно восстановить из Библиотеки.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn variant="secondary" style={{ flex: 1 }} onPress={() => setConfirmArchive(false)}>Отмена</Btn>
                  <Btn variant="danger" style={{ flex: 1 }} onPress={() => { close(); setTimeout(() => onArchive && onArchive(practice.id), 290); }}>Архивировать</Btn>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
                <Btn
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={() => {
                    const trimmed = name.trim();
                    if (!trimmed) { setNameError('Введите название практики'); return; }
                    const dup = (existingNames || []).some((n) => n && n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== (practice?.name || '').toLowerCase());
                    if (dup) { setNameError('Практика с таким названием уже существует'); return; }
                    close();
                    setTimeout(() => onSave({ id: practice?.id, name: trimmed, cat, dur, r: rewards, qi: practice?.qi ?? 2, today: practice?.today, done: practice?.done }), 290);
                  }}
                >
                  Сохранить
                </Btn>
                {!isNew ? <Btn variant="danger" onPress={() => setConfirmArchive(true)}>Архивировать</Btn> : null}
              </View>
            )}
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
            <Text style={T.displayM}>День {day + 1}</Text>
            <StateChip state="flow" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 8, color: C.gold }}>+18 XP</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 8, color: C.red }}>ЗД 92%</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 8, color: C.cEnergy }}>ЦИ 78%</Text></MedalPill>
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
  const asc = ascension(stage);
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, []);
  return (
    <Pressable onPress={onClose} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,25,12,0.5)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(246,214,133,0.25)' }, kf(KF.goldBurst, 0.9, { ease: EASE.out, fill: 'forwards' })]} />
      <View style={[{ width: '84%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 26, borderRadius: 26, borderWidth: 4, borderColor: C.stoneDark, backgroundColor: C.paperLight, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 14px 34px rgba(0,0,0,0.4)` }, kf(KF.popIn, 0.5, { ease: EASE.overshoot })]}>
        {/* real kit LEVEL UP! winged banner */}
        <KitBanner width={270} style={{ marginTop: -36, marginBottom: 6 }} />
        <Gradient colors={[C.goldLight, C.gold]} angle={180} style={{ width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: C.goldLine, marginBottom: 12, boxShadow: `inset 0px 3px 0px rgba(255,255,255,0.6), 0px 5px 0px ${C.goldLine}, 0px 9px 16px rgba(154,98,18,0.4)` }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 40, color: '#5a3d10', ...ts('rgba(255,255,255,0.5)', 0, 1) }}>{stage}</Text>
          <Gloss radius={41} />
        </Gradient>
        <Text style={{ fontFamily: FONT.display, fontSize: 12, color: C.title, marginBottom: 8 }}>Стадия {stage}</Text>
        <Text style={[T.body, { color: C.inkMuted, textAlign: 'center' }]}>{asc}</Text>
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

/* ============================================================
   ONBOARDING (first run) — teaches the core loop by doing
   ============================================================ */
const ONBOARD_STEPS = [
  { icon: 'magic-slot', color: C.jade, title: 'Выполняйте практики', body: 'Нажмите на практику, чтобы открыть таймер, затем отметьте её выполненной.' },
  { icon: 'potion-blue', color: C.cEnergy, title: 'Развивайтесь', body: 'Каждая практика даёт очки характеристик, XP стадии и меняет вашу Ци.' },
  { icon: 'potion-red', color: C.red, title: 'Следите за состоянием', body: 'Полоски Здоровья и Ци показывают вашу форму. Держите Ци в потоке для ровного пути.' },
];

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const last = step === ONBOARD_STEPS.length - 1;
  const s = ONBOARD_STEPS[step];
  return (
    <View style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, backgroundColor: 'rgba(35,25,12,0.55)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <View key={step} style={[{ width: '100%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 22, borderRadius: 26, borderWidth: 4, borderColor: C.stoneDark, backgroundColor: C.paperLight, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 14px 34px rgba(0,0,0,0.4)` }, kf(KF.popIn, 0.42, { ease: EASE.overshoot })]}>
        <KitGem size={64} icon={s.icon} color={s.color} />
        <Text style={[T.displayM, { marginTop: 14, marginBottom: 10, textAlign: 'center' }]}>{s.title}</Text>
        <Text style={[T.body, { color: C.inkMuted, textAlign: 'center', marginBottom: 18 }]}>{s.body}</Text>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 18 }}>
          {ONBOARD_STEPS.map((_, i) => (
            <View key={i} style={{ width: i === step ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === step ? C.gold : C.paperDeep }} />
          ))}
        </View>
        <Btn variant="primary" block onPress={() => (last ? onDone() : setStep(step + 1))}>{last ? 'Начать' : 'Далее'}</Btn>
        {!last ? <Btn variant="ghost" onPress={onDone} style={{ marginTop: 2 }}>Пропустить</Btn> : null}
      </View>
    </View>
  );
}

/* ============================================================
   TOAST — transient parchment pill with an optional action (undo)
   ============================================================ */
export function Toast({ message, actionLabel, onAction, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 5000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 92, alignItems: 'center', paddingHorizontal: 18, zIndex: 260 }}>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 420, paddingVertical: 12, paddingLeft: 16, paddingRight: 12, borderRadius: 16, borderWidth: 2.5, borderColor: C.stoneLine, backgroundColor: C.paperLight, boxShadow: '0px 8px 22px rgba(40,28,12,0.4)' }, kf(KF.fadeUp, 0.4, { ease: EASE.out })]}>
        <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 9, lineHeight: 14, color: C.ink }}>{message}</Text>
        {actionLabel ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: C.gold }}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
