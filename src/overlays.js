/* Alchemist — overlays: PracticeDetail, EditorSheet, DayDetailSheet, LevelUpOverlay, FogVeil */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, AppState } from 'react-native';
import { C, FONT, shade } from './theme';
import { CATS, STATS, PRACTICES, AVATARS, repWord, durLabel, hoursLabel } from './data';
import { ascension } from './quotes';
import { Card, Btn, IconBtn, Gradient, Gloss, Han, T, SectionHead, Seal, Stepper, SelChip, Field, Input, ts, kf, KF, EASE } from './ui';
import { RewardMedal, QiTag, StateChip, MedalPill, Bar, AvatarArt } from './badges';
import { CircularTimer } from './svg';
import { PracticeCard } from './PracticeCard';
import { KitPanel, KitClose, KitGem, KitBanner } from './kit';
import { IconTile, PixelIcon } from './PixelIcon';
import { scheduleBell, cancelBell, ringBellNow, primeAudio } from './sound';

// curated pixel icons a user can pick for their own practice
const ICON_CHOICES = ['moon-stars', 'wind', 'human-handsup', 'human-run', 'book', 'brain', 'heart', 'zap', 'shield', 'move', 'bullseye', 'mood-happy', 'drop-full', 'lightbulb', 'tea', 'trophy', 'music', 'sun', 'gift', 'coffee', 'lock'];

// shown on the detail screen when a practice has no custom instruction of its own
const DEFAULT_INSTRUCTION = 'Сядьте удобно, спина прямая. Дышите в живот, медленно и ровно. Удерживайте внимание на течении Ци по меридианам. Не торопитесь — спокойный ритм важнее длительности.';

/* ============================================================
   PRACTICE DETAIL (full-screen page, timer)
   ============================================================ */
export function PracticeDetail({ practice, onComplete, onClose, onEdit, wide }) {
  const cat = CATS[practice.cat] || { name: practice.cat || 'Прочее', icon: 'flag', color: C.inkMuted };
  const [total, setTotal] = useState(practice.dur * 60);
  const [remaining, setRemaining] = useState(practice.dur * 60);
  const [running, setRunning] = useState(false);
  const [showInstr, setShowInstr] = useState(false);
  const endAtRef = useRef(0); // wall-clock ms when the countdown reaches zero
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const chimedRef = useRef(false); // ring the meditation bell once per run when time is up

  // The countdown is anchored to a wall-clock deadline (endAtRef), not a tick counter, so it stays
  // correct when the phone screen turns off / the app is backgrounded and setInterval is frozen or
  // throttled. On resume — tab visible, window focus/pageshow, or app foreground — we recompute
  // straight from Date.now(), so the time (and completion) reflect the real elapsed wall-clock time.
  useEffect(() => {
    if (!running) return;
    endAtRef.current = Date.now() + remainingRef.current * 1000;
    chimedRef.current = false;
    scheduleBell(remainingRef.current); // pre-arm the chime on the audio clock (rings on time even backgrounded where the OS keeps audio alive)

    // Keep the screen awake while the timer runs: on iOS a web page can't play audio once the
    // screen locks (JS + audio are frozen), but holding a Screen Wake Lock stops the auto-lock, so
    // JS keeps running and the bell rings on time when the phone is simply set down. Non-intrusive:
    // unlike a background audio session it doesn't stop the user's music or drain the battery.
    let wake = null;
    const acquireWake = () => {
      if (typeof navigator === 'undefined' || !navigator.wakeLock || wake) return;
      navigator.wakeLock.request('screen').then((s) => {
        wake = s;
        s.addEventListener && s.addEventListener('release', () => { wake = null; });
      }).catch(() => { wake = null; });
    };
    const releaseWake = () => { try { wake && wake.release && wake.release(); } catch (e) {} wake = null; };

    const finish = () => {
      if (!chimedRef.current) { chimedRef.current = true; ringBellNow(); }
      setRemaining(0);
      setRunning(false);
    };
    const tick = () => {
      const rem = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      if (rem <= 0) { finish(); return; }
      setRemaining(rem);
    };
    // resume from a hidden tab / screen-off: re-read the wall clock, finish if due, else re-anchor
    // the pre-armed chime (the audio clock froze while suspended, so it must be rescheduled) and
    // re-acquire the wake lock (the browser drops it whenever the page is hidden).
    const onResume = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      primeAudio();
      const rem = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      if (rem <= 0) { finish(); return; }
      setRemaining(rem);
      scheduleBell(rem);
      acquireWake();
    };
    acquireWake();
    const id = setInterval(tick, 250);
    const appSub = AppState.addEventListener('change', (st) => { if (st === 'active') onResume(); });
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onResume);
    if (typeof window !== 'undefined') { window.addEventListener('focus', onResume); window.addEventListener('pageshow', onResume); }
    return () => {
      clearInterval(id);
      cancelBell(); // a paused / left timer must not ring; a finished one already rang
      releaseWake();
      if (appSub && appSub.remove) appSub.remove();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onResume);
      if (typeof window !== 'undefined') { window.removeEventListener('focus', onResume); window.removeEventListener('pageshow', onResume); }
    };
  }, [running]);

  const adjust = (delta) => {
    if (running) return;
    const nt = Math.max(60, total + delta * 60);
    setTotal(nt);
    setRemaining(nt);
  };
  const rewards = Object.entries(practice.r || {});

  return (
    <PageShell nativeID="detail-root" onClose={onClose} wide={wide}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 22 }}>
            <IconTile name={practice.icon || cat.icon} color={cat.color} size={48} />
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <Text style={[T.displayM, { fontSize: 26, lineHeight: 36 }]}>{practice.name}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: cat.color }}>{cat.name}{practice.mult ? ' · x' + practice.mult : ''}</Text>
            </View>
            {onEdit ? <Btn nativeID="detail-edit" variant="ghost" onPress={onEdit}>Изменить</Btn> : null}
          </View>

          {practice.unit === 'reps' ? (
            /* reps practice: show the count + complete (a countdown makes no sense) */
            <View style={{ marginTop: 14, marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.display, fontSize: 80, fontVariant: ['tabular-nums'], color: C.title, textAlign: 'center', ...ts('rgba(0,0,0,0.5)', 0, 2, 2) }}>{practice.dur}</Text>
              <Text style={{ fontFamily: FONT.ui, fontSize: 22, color: C.inkMuted, marginTop: -2, marginBottom: 22 }}>{repWord(practice.dur)}</Text>
              <Btn nativeID="detail-complete" variant="gold" block onPress={() => onComplete(practice)}>✦ Завершить</Btn>
            </View>
          ) : (
            <>
              {/* timer — native rpgui-progress + time readout */}
              <View style={{ marginTop: 14, marginBottom: 8 }}>
                <Text style={{ fontFamily: FONT.display, fontSize: 80, fontVariant: ['tabular-nums'], color: C.title, textAlign: 'center', marginBottom: 18, ...ts('rgba(0,0,0,0.5)', 0, 2, 2) }}>
                  {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
                </Text>
                <Bar pct={total > 0 ? (remaining / total) * 100 : 0} color="qi" />
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                  <TStep nativeID="detail-timer-minus" label="−1м" onPress={() => adjust(-1)} disabled={running} />
                  <TStep nativeID="detail-timer-plus" label="+1м" onPress={() => adjust(1)} disabled={running} />
                </View>
              </View>

              {/* controls */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8 }}>
                {!running && remaining > 0 && remaining === total ? <Btn nativeID="detail-start" variant="primary" block onPress={() => { primeAudio(); setRunning(true); }} style={{ flex: 1 }}>▶ Начать</Btn> : null}
                {running ? <Btn nativeID="detail-pause" variant="secondary" block onPress={() => setRunning(false)} style={{ flex: 1 }}>⏸ Пауза</Btn> : null}
                {!running && remaining < total && remaining > 0 ? <Btn nativeID="detail-resume" variant="primary" block onPress={() => { primeAudio(); setRunning(true); }} style={{ flex: 1 }}>▶ Продолжить</Btn> : null}
                {remaining === 0 ? <Btn nativeID="detail-complete" variant="gold" block onPress={() => onComplete(practice)} style={{ flex: 1 }}>✦ Завершить</Btn> : null}
                {remaining < total && remaining > 0 ? <Btn nativeID="detail-reset" variant="ghost" onPress={() => { setRemaining(total); setRunning(false); }}>Сброс</Btn> : null}
              </View>
              <Btn nativeID="detail-mark-done" variant="ghost" block onPress={() => onComplete(practice)}>Отметить выполненной</Btn>
            </>
          )}

          {/* instruction */}
          <Pressable nativeID="detail-instr-toggle" onPress={() => setShowInstr(!showInstr)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <Text style={{ fontFamily: FONT.ui, color: C.inkMuted, fontSize: 28, transform: showInstr ? [{ rotate: '90deg' }] : [] }}>›</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.inkMuted }}>Инструкция</Text>
          </Pressable>
          {showInstr ? (
            <Text style={[T.body, { color: C.inkMuted, paddingHorizontal: 4, paddingTop: 8, lineHeight: 40 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
              {practice.instruction || DEFAULT_INSTRUCTION}
            </Text>
          ) : null}

          {/* rewards */}
          <SectionHead nativeID="detail-rewards-head" title="Награды" />
          <Card nativeID="detail-rewards-card" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {rewards.map(([k, v]) => <RewardMedal key={k} stat={k} value={practice.mult ? Math.round(v * practice.mult) : v} />)}
            <QiTag qi={practice.qi} />
            {practice.mult ? (
              <MedalPill>
                <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>Чжан Чжуан x{practice.mult}</Text>
              </MedalPill>
            ) : null}
          </Card>
          <Text style={[T.caption, { marginTop: 8, paddingHorizontal: 2, lineHeight: 26 }]}>+N — очки характеристик · ЦИ — изменение запаса Ци{practice.mult ? ' · x' + practice.mult + ' — бонус Чжан Чжуан' : ''}</Text>
    </PageShell>
  );
}

function TStep({ label, onPress, disabled, nativeID }) {
  return (
    <Btn nativeID={nativeID} variant="blue" onPress={disabled ? undefined : onPress} disabled={disabled} style={{ flex: 1 }}>
      {label}
    </Btn>
  );
}

/* Scroll wrapper for full-screen pages — flex:1 fills the PageShell's absolute-filled height. */
function ScrollViewSafe({ children }) {
  const { ScrollView } = require('react-native');
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

/* ============================================================
   PAGE shell — full-screen routed page (replaces the old modal bottom-sheet)
   opaque, fills the content area, owns the back affordance + scroll.
   ============================================================ */
function PageShell({ children, onClose, wide, nativeID }) {
  return (
    <View nativeID={nativeID} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: C.paper, zIndex: 200 }, kf(KF.screenIn, 0.4, { ease: EASE.out })]}>
      <ScrollViewSafe>
        <View style={[{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 30, minHeight: '100%' }, wide && { maxWidth: 720, width: '100%', alignSelf: 'center', paddingHorizontal: 40 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Btn variant="ghost" onPress={onClose} style={{ paddingVertical: 8, paddingHorizontal: 10, marginLeft: -8 }}>‹ Назад</Btn>
            <KitClose onPress={onClose} size={34} />
          </View>
          {children}
        </View>
      </ScrollViewSafe>
    </View>
  );
}

/* ============================================================
   EDITOR SHEET
   ============================================================ */
export function EditorSheet({ practice, onSave, onClose, onArchive, onDelete, existingNames, wide }) {
  const isNew = !practice;
  const [name, setName] = useState(practice?.name || '');
  const [cat, setCat] = useState(practice?.cat || 'med');
  const [dur, setDur] = useState(practice?.dur || 15);
  const [rewards, setRewards] = useState(practice?.r ? { ...practice.r } : {});
  const [instruction, setInstruction] = useState(practice?.instruction || '');
  const [icon, setIcon] = useState(practice?.icon || '');
  const [unit, setUnit] = useState(practice?.unit === 'reps' ? 'reps' : 'min');
  const [today, setToday] = useState(practice ? !!practice.today : true);
  const [nameError, setNameError] = useState('');
  const [confirm, setConfirm] = useState(null); // null | 'archive' | 'delete'

  const toggleReward = (k) => {
    setRewards((r) => {
      const n = { ...r };
      if (n[k]) delete n[k];
      else n[k] = 2;
      return n;
    });
  };

  return (
    <PageShell nativeID="editor-root" onClose={onClose} wide={wide}>
            <Text style={[T.displayM, { marginTop: 2, marginBottom: 18 }]}>{isNew ? 'Новая практика' : 'Изменить практику'}</Text>

            <Field nativeID="editor-name-field" label="Название">
              <Input nativeID="editor-name-input" value={name} onChangeText={(t) => { setName(t); if (nameError) setNameError(''); }} placeholder="напр. Утренний цигун" />
            </Field>
            {nameError ? <Text style={{ marginTop: -10, marginBottom: 12, color: C.red, fontFamily: FONT.ui, fontSize: 18 }}>{nameError}</Text> : null}

            <Field nativeID="editor-instr-field" label="Инструкция / описание">
              <Input
                nativeID="editor-instr-input"
                value={instruction}
                onChangeText={setInstruction}
                placeholder="Как выполнять практику — поза, дыхание, на чём держать внимание…"
                multiline
                numberOfLines={4}
                style={{ minHeight: 104, textAlignVertical: 'top', lineHeight: 30 }}
              />
            </Field>

            <Field nativeID="editor-cat-field" label="Категория">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(CATS).map((ck) => (
                  <SelChip nativeID={`editor-cat-${ck}`} key={ck} on={cat === ck} color={CATS[ck].color} icon={CATS[ck].icon} label={CATS[ck].name} onPress={() => setCat(ck)} />
                ))}
              </View>
            </Field>

            <Field nativeID="editor-icon-field" label="Иконка">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ICON_CHOICES.map((ic) => {
                  const sel = (icon || CATS[cat].icon) === ic;
                  return (
                    <Pressable
                      key={ic}
                      nativeID={`editor-icon-${ic}`}
                      onPress={() => setIcon(ic)}
                      accessibilityRole="button"
                      accessibilityLabel={'Иконка ' + ic}
                      accessibilityState={{ selected: sel }}
                      style={{ width: 46, height: 46, borderRadius: 4, borderWidth: 2, borderColor: sel ? C.gold : C.stoneLine, backgroundColor: sel ? C.frameGoldBg : C.frameDark, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <PixelIcon name={ic} size={26} color={sel ? C.gold : C.inkMuted} />
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field nativeID="editor-unit-field" label="Мера">
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <SelChip nativeID="editor-unit-min" on={unit === 'min'} color={C.gold} label="Минуты" onPress={() => setUnit('min')} />
                <SelChip nativeID="editor-unit-reps" on={unit === 'reps'} color={C.gold} label="Разы" onPress={() => setUnit('reps')} />
              </View>
              <Stepper
                nativeID="editor-dur-stepper"
                value={dur}
                onDec={() => setDur(Math.max(1, dur - 1))}
                onInc={() => setDur(Math.min(unit === 'reps' ? 999 : 180, dur + 1))}
                suffix={unit === 'reps' ? ' ' + repWord(dur) : ' мин'}
              />
            </Field>

            <Field nativeID="editor-rewards-field" label="Награды-характеристики">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {STATS.map((s) => (
                  <SelChip nativeID={`editor-reward-${s.key}`} key={s.key} multi on={!!rewards[s.key]} color={s.color} icon={s.icon} label={s.name + (rewards[s.key] ? ' +' + rewards[s.key] : '')} onPress={() => toggleReward(s.key)} />
                ))}
              </View>
            </Field>
            {Object.keys(rewards).length === 0 ? <Text style={{ marginTop: -8, marginBottom: 10, color: C.inkMuted, fontFamily: FONT.ui, fontSize: 18, lineHeight: 28 }}>Совет: привяжите хотя бы одну характеристику, чтобы практика давала очки.</Text> : null}

            {confirm ? (
              <View nativeID="editor-confirm-panel" style={{ marginTop: 22, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: C.redLine, backgroundColor: 'rgba(217,84,59,0.08)' }}>
                <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.red, marginBottom: 12, lineHeight: 28 }}>
                  {confirm === 'delete'
                    ? `Удалить «${name || practice?.name}» навсегда? Это действие необратимо.`
                    : `Архивировать «${name || practice?.name}»? Она скроется из списка.`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn nativeID="editor-confirm-cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setConfirm(null)}>Отмена</Btn>
                  <Btn
                    nativeID="editor-confirm-ok"
                    variant="danger"
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (confirm === 'delete') onDelete && onDelete(practice.id);
                      else onArchive && onArchive(practice.id);
                      onClose && onClose();
                    }}
                  >
                    {confirm === 'delete' ? 'Удалить' : 'Архивировать'}
                  </Btn>
                </View>
              </View>
            ) : (
              <View style={{ marginTop: 22 }}>
                <Btn
                  nativeID="editor-save"
                  variant="primary"
                  block
                  onPress={() => {
                    const trimmed = name.trim();
                    if (!trimmed) { setNameError('Введите название практики'); return; }
                    const dup = (existingNames || []).some((n) => n && n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== (practice?.name || '').toLowerCase());
                    if (dup) { setNameError('Практика с таким названием уже существует'); return; }
                    onSave({ id: practice?.id, name: trimmed, cat, dur, unit, r: rewards, qi: practice?.qi ?? 2, icon: icon || undefined, instruction: instruction.trim() || undefined, today: true, done: practice?.done });
                  }}
                >
                  Сохранить
                </Btn>
                {!isNew ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <Btn nativeID="editor-archive" variant="secondary" style={{ flex: 1 }} onPress={() => setConfirm('archive')}>Архивировать</Btn>
                    <Btn nativeID="editor-delete" variant="danger" style={{ flex: 1 }} onPress={() => setConfirm('delete')}>Удалить</Btn>
                  </View>
                ) : null}
              </View>
            )}
    </PageShell>
  );
}

/* ============================================================
   DAY DETAIL SHEET
   ============================================================ */
export function DayDetailSheet({ day, onClose, wide }) {
  const sample = PRACTICES.filter((p) => p.today).slice(0, 3);
  return (
    <PageShell nativeID="day-sheet-root" onClose={onClose} wide={wide}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 }}>
            <Text style={T.displayM}>День {day + 1}</Text>
            <StateChip state="flow" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.gold }}>+18 XP</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.red }}>ЗД 92%</Text></MedalPill>
            <MedalPill><Text style={{ fontFamily: FONT.display, fontSize: 16, color: C.cEnergy }}>ЦИ 78%</Text></MedalPill>
          </View>
          <Text style={[T.label, { marginBottom: 8 }]}>Выполнено</Text>
          <View style={{ gap: 10 }}>
            {sample.map((p) => <PracticeCard key={p.id} p={{ ...p, done: true }} compact />)}
          </View>
    </PageShell>
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
    <Pressable nativeID="levelup-root" onPress={onClose} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 250, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(35,25,12,0.5)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(246,214,133,0.25)' }, kf(KF.goldBurst, 0.9, { ease: EASE.out, fill: 'forwards' })]} />
      <View nativeID="levelup-card" style={[{ width: '84%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 26, borderRadius: 26, borderWidth: 4, borderColor: C.stoneDark, backgroundColor: C.paperLight, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 14px 34px rgba(0,0,0,0.4)` }, kf(KF.popIn, 0.5, { ease: EASE.overshoot })]}>
        {/* real kit LEVEL UP! winged banner */}
        <KitBanner width={270} style={{ marginTop: -36, marginBottom: 6 }} />
        <Gradient colors={[C.goldLight, C.gold]} angle={180} style={{ width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: C.goldLine, marginBottom: 12, boxShadow: `inset 0px 3px 0px rgba(255,255,255,0.6), 0px 5px 0px ${C.goldLine}, 0px 9px 16px rgba(154,98,18,0.4)` }}>
          <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 80, color: '#5a3d10', ...ts('rgba(255,255,255,0.5)', 0, 1) }}>{stage}</Text>
          <Gloss radius={41} />
        </Gradient>
        <Text style={{ fontFamily: FONT.display, fontSize: 24, color: C.title, marginBottom: 8 }}>Стадия {stage}</Text>
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
      nativeID="fog-root"
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
  { icon: 'checklist', color: C.jade, title: 'Выполняйте практики', body: 'Нажмите на практику, чтобы открыть таймер, затем отметьте её выполненной.' },
  { icon: 'trending-up', color: C.cEnergy, title: 'Развивайтесь', body: 'Каждая практика даёт очки характеристик, XP стадии и меняет вашу Ци.' },
  { icon: 'heart', color: C.red, title: 'Следите за состоянием', body: 'Полоски Здоровья и Ци показывают вашу форму. Держите Ци в потоке для ровного пути.' },
];

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const last = step === ONBOARD_STEPS.length - 1;
  const s = ONBOARD_STEPS[step];
  return (
    <View nativeID="onboarding-root" style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, backgroundColor: 'rgba(35,25,12,0.55)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <View nativeID="onboarding-card" key={step} style={[{ width: '100%', maxWidth: 340, alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 22, borderRadius: 26, borderWidth: 4, borderColor: C.stoneDark, backgroundColor: C.paperLight, boxShadow: `inset 0px 0px 0px 3px ${C.gold}, 0px 14px 34px rgba(0,0,0,0.4)` }, kf(KF.popIn, 0.42, { ease: EASE.overshoot })]}>
        <IconTile name={s.icon} color={s.color} size={64} />
        <Text style={[T.displayM, { marginTop: 14, marginBottom: 10, textAlign: 'center' }]}>{s.title}</Text>
        <Text style={[T.body, { color: C.inkMuted, textAlign: 'center', marginBottom: 18 }]}>{s.body}</Text>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 18 }}>
          {ONBOARD_STEPS.map((_, i) => (
            <View key={i} style={{ width: i === step ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === step ? C.gold : C.paperDeep }} />
          ))}
        </View>
        <Btn nativeID="onboarding-next" variant="primary" block onPress={() => (last ? onDone() : setStep(step + 1))}>{last ? 'Начать' : 'Далее'}</Btn>
        {!last ? <Btn nativeID="onboarding-skip" variant="ghost" onPress={onDone} style={{ marginTop: 2 }}>Пропустить</Btn> : null}
      </View>
    </View>
  );
}

/* ============================================================
   METRIC EDITOR — small popover to correct a header metric
   ============================================================ */
const METRIC_META = {
  med: { name: 'Часы медитации', unit: 'min', icon: 'moon-stars' },
  qi: { name: 'Часы цигун', unit: 'min', icon: 'wind' },
  know: { name: 'Часы знания', unit: 'min', icon: 'book' },
  body: { name: 'Часы тела', unit: 'min', icon: 'human-run' },
  streak: { name: 'Страйк · дни ≥75%', unit: 'day', icon: 'trending-up' },
};
export function MetricEditor({ metric, value, onSave, onClose }) {
  const meta = METRIC_META[metric] || METRIC_META.med;
  const isMin = meta.unit === 'min';
  const step = isMin ? 15 : 1;
  const [v, setV] = useState(Math.max(0, Math.round(value || 0)));
  return (
    <Pressable
      nativeID="metric-edit-root"
      onPress={onClose}
      style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(35,25,12,0.6)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}
    >
      <Pressable
        nativeID="metric-edit-panel"
        onPress={() => {}}
        style={[{ width: '100%', maxWidth: 340, padding: 22, borderRadius: 18, borderWidth: 3, borderColor: C.goldLine, backgroundColor: C.paperWarm }, kf(KF.popIn, 0.42, { ease: EASE.overshoot })]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={T.displayM}>{meta.name}</Text>
          <KitClose nativeID="metric-edit-close" onPress={onClose} size={34} />
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Stepper nativeID="metric-edit-stepper" value={v} onDec={() => setV(Math.max(0, v - step))} onInc={() => setV(v + step)} suffix={isMin ? ' мин' : ' дн.'} />
          {isMin ? <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.inkMuted }}>≈ {hoursLabel(v)}</Text> : null}
        </View>
        <Btn nativeID="metric-edit-save" variant="gold" block onPress={() => { onSave(v); onClose(); }} style={{ marginTop: 18 }}>Сохранить</Btn>
      </Pressable>
    </Pressable>
  );
}

/* ============================================================
   AVATAR PICKER — choose your portrait (Baldur's Gate-style grid)
   ============================================================ */
export function AvatarPicker({ current, onPick, onClose }) {
  return (
    <Pressable
      nativeID="avatar-picker-root"
      onPress={onClose}
      style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 270, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(35,25,12,0.6)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}
    >
      <Pressable
        nativeID="avatar-picker-panel"
        onPress={() => {}}
        style={[{ width: '100%', maxWidth: 380, padding: 22, borderRadius: 18, borderWidth: 3, borderColor: C.goldLine, backgroundColor: C.paperWarm }, kf(KF.popIn, 0.42, { ease: EASE.overshoot })]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={T.displayM}>Выберите образ</Text>
          <KitClose nativeID="avatar-picker-close" onPress={onClose} size={34} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {AVATARS.map((a) => {
            const sel = current === a.id;
            return (
              <Pressable
                key={a.id}
                nativeID={`avatar-${a.id}`}
                onPress={() => { onPick && onPick(a.id); onClose && onClose(); }}
                accessibilityRole="button"
                accessibilityLabel={'Образ ' + a.id}
                accessibilityState={{ selected: sel }}
                style={{ padding: 3, borderRadius: 12, borderWidth: 3, borderColor: sel ? C.gold : 'transparent' }}
              >
                <AvatarArt av={a} size={88} style={{ borderRadius: 8 }} />
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  );
}

/* ============================================================
   HEADER MENU — hamburger dropdown (top-right); holds the teacher entry
   ============================================================ */
export function HeaderMenu({ items, onClose }) {
  return (
    <Pressable nativeID="menu-root" onPress={onClose} accessibilityLabel="Закрыть меню" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 300 }}>
      <View nativeID="menu-panel" style={[{ position: 'absolute', right: 14, top: 56, minWidth: 214, borderWidth: 3, borderColor: C.goldLine, borderRadius: 12, backgroundColor: C.paperWarm, paddingVertical: 6, boxShadow: '0px 4px 0px rgba(20,12,0,0.28)' }, kf(KF.popIn, 0.3, { ease: EASE.overshoot })]}>
        {items.map((it) => (
          <Pressable
            key={it.key}
            nativeID={`menu-item-${it.key}`}
            onPress={() => { onClose(); it.onPress(); }}
            accessibilityRole="button"
            accessibilityLabel={it.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 46 }}
          >
            <PixelIcon name={it.icon} size={20} color={C.gold} />
            <Text style={{ fontFamily: FONT.ui, fontSize: 17, color: C.ink }}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

/* ============================================================
   PAYWALL — premium upsell overlay
   ============================================================ */
export function Paywall({ onSubscribe, onClose }) {
  return (
    <Pressable nativeID="paywall-root" onPress={onClose} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 290, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(35,25,12,0.6)' }, kf(KF.fadeIn, 0.3, { ease: EASE.out })]}>
      <Pressable nativeID="paywall-panel" onPress={() => {}} style={[{ width: '100%', maxWidth: 360, padding: 22, borderRadius: 18, borderWidth: 3, borderColor: C.goldLine, backgroundColor: C.paperWarm }, kf(KF.popIn, 0.42, { ease: EASE.overshoot })]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={T.displayM}>Premium</Text><KitClose nativeID="paywall-close" onPress={onClose} size={34} />
        </View>
        <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.ink, lineHeight: 28, marginBottom: 16 }}>Безлимит практик и полный трекер. Подписка через Telegram Stars — и ты поддерживаешь своего учителя.</Text>
        <Btn nativeID="paywall-subscribe" variant="gold" block onPress={onSubscribe}>Оформить за Stars</Btn>
      </Pressable>
    </Pressable>
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
      <View nativeID="toast-root" style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', maxWidth: 420, paddingVertical: 12, paddingLeft: 16, paddingRight: 12, borderRadius: 16, borderWidth: 2.5, borderColor: C.stoneLine, backgroundColor: C.paperLight, boxShadow: '0px 8px 22px rgba(40,28,12,0.4)' }, kf(KF.fadeUp, 0.4, { ease: EASE.out })]}>
        <Text style={{ flex: 1, fontFamily: FONT.ui, fontSize: 18, lineHeight: 28, color: C.ink }}>{message}</Text>
        {actionLabel ? (
          <Pressable nativeID="toast-action" onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
