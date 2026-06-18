/* Alchemist — main shell: navigation, responsive layout, overlays */
import React, { useState, useCallback, useEffect } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from './theme';
import { useGame, atPracticeCap, todayCounts } from './engine';
import { useAuth } from './auth';
import { usePremium } from './premium';
import { supabase, signInWithTelegram, attributeToTeacher, getMyTeacherProgram, loadReferredBy, saveAdherence, loadTeacher } from './supabase';
import { inTelegram, getInitData, openInvoice, getStartParam } from './telegram.web';
import { kf, KF, EASE } from './ui';
import { BottomNav, SideRail } from './nav';
import { TodayScreen } from './screens/Today';
import { CharacterScreen } from './screens/Character';
import { DiaryScreen } from './screens/Diary';
import { JournalScreen } from './screens/Journal';
import { TeacherScreen } from './screens/Teacher';
import { PracticeDetail, EditorSheet, DayDetailSheet, LevelUpOverlay, FogVeil, Onboarding, Toast, AvatarPicker, MetricEditor, Paywall, HeaderMenu } from './overlays';
import { KitPanel } from './kit';

const WEB = Platform.OS === 'web';
const SCREENS = {
  today: TodayScreen,
  character: CharacterScreen,
  diary: DiaryScreen,
  journal: JournalScreen,
  teacher: TeacherScreen,
};

export function MainApp() {
  const auth = useAuth();
  const game = useGame(auth?.user?.id);
  const premium = usePremium(auth?.user?.id);
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [route, setRoute] = useState('today');
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [daySheet, setDaySheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [onboard, setOnboard] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [metricEdit, setMetricEdit] = useState(null); // 'med' | 'qi' | 'streak' | null
  const [paywall, setPaywall] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const uid = auth?.user?.id;
    if (uid) loadTeacher(uid).then((t) => setIsTeacher(!!t));
  }, [auth?.user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('alchemist_onboarded_v1');
        if (!seen && !cancelled) setOnboard(true);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (inTelegram()) signInWithTelegram(getInitData()); }, []);

  // attribution + program injection: runs once the user id is known
  useEffect(() => {
    const uid = auth?.user?.id;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const code = getStartParam();
      let teacherId = await loadReferredBy(uid);
      let program = [];
      if (!teacherId && code) {
        const res = await attributeToTeacher(code);   // returns { teacher_id, program } | null
        if (res) { teacherId = res.teacher_id; program = res.program || []; }
      } else if (teacherId) {
        program = await getMyTeacherProgram();
      }
      if (cancelled || !teacherId || !program.length) return;
      // stable ids so re-entry never duplicates; mark source for UI grouping
      const items = program.map((p, i) => ({
        ...p, id: `tp:${teacherId}:${p.id || i}`, today: true, custom: false, fromTeacher: teacherId,
      }));
      game.injectPractices(items);
    })();
    return () => { cancelled = true; };
  }, [auth?.user?.id, game.injectPractices]);

  // write a numbers-only daily adherence summary for attributed students (debounced)
  const adhTimer = React.useRef(null);
  useEffect(() => {
    const uid = auth?.user?.id;
    if (!uid) return;
    let cancelled = false;
    clearTimeout(adhTimer.current);
    adhTimer.current = setTimeout(async () => {
      const teacherId = await loadReferredBy(uid);
      if (cancelled || !teacherId) return;
      const { done, total } = todayCounts(game.practices);
      const date = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // local practice-day (03:00 cutoff)
      await saveAdherence({ teacherId, date, done, total, streak: game.streak });
    }, 1500);
    return () => { cancelled = true; clearTimeout(adhTimer.current); };
  }, [auth?.user?.id, game.practices, game.streak]);

  const dismissOnboard = useCallback(() => {
    setOnboard(false);
    AsyncStorage.setItem('alchemist_onboarded_v1', '1').catch(() => {});
  }, []);
  const onShowHelp = useCallback(() => setOnboard(true), []);

  const onComplete = useCallback((p) => { game.setDone(p, true); setDetail(null); }, [game.setDone]);
  const onSave = useCallback((data) => {
    // cap + paywall apply ONLY inside the Telegram Mini App (where Stars payment exists);
    // the standalone site stays free/unlimited per spec §5.
    if (!data.id && inTelegram() && atPracticeCap(game.practices, premium.premium)) { setEditor(undefined); setPaywall(true); return; }
    game.savePractice(data); setEditor(undefined);
  }, [game.savePractice, game.practices, premium.premium]);
  const onOpen = useCallback((p) => setDetail(p), []);
  const onAdd = useCallback(() => setEditor(null), []);
  const onEdit = useCallback((p) => setEditor(p), []);
  const onOpenDay = useCallback((d) => setDaySheet(d), []);
  const onArchive = useCallback((id) => {
    game.archivePractice(id);
    setToast({ message: 'Практика в архиве', actionLabel: 'Отменить', action: 'undo' });
  }, [game.archivePractice]);
  const onDelete = useCallback((id) => {
    game.deletePractice(id);
    setToast({ message: 'Практика удалена', actionLabel: null });
  }, [game.deletePractice]);

  const ctx = {
    ...game,
    route,
    goRoute: setRoute,
    wide,
    onToggle: game.toggle,
    onOpen,
    onComplete,
    onAdd,
    onEdit,
    onSave,
    onOpenDay,
    onShowHelp,
    onMenu: () => setMenuOpen(true),
    onSignOut: auth?.signOut,
    userName: auth?.user?.name,
    avatar: game.avatar,
    onAvatar: () => setAvatarPicker(true),
    onEditMetric: setMetricEdit,
    premium: premium.premium,
    onPaywall: () => setPaywall(true),
    onBecameTeacher: () => setIsTeacher(true), // reveal the «Учитель» tab right after enabling (no reload)
    diaryKey: 'alchemist_diary_' + (auth?.user?.id || 'anon'),
    userId: auth?.user?.id,
  };

  const Screen = SCREENS[route];
  const screen = (
    <View key={route} style={[{ flex: 1 }, kf(KF.screenIn, 0.42, { ease: EASE.out }), game.dayState === 'spent' && WEB ? { filter: 'saturate(0.55) brightness(0.99)' } : null]}>
      <Screen ctx={ctx} />
    </View>
  );

  const overlays = (
    <>
      {detail ? <PracticeDetail practice={detail} wide={wide} onComplete={onComplete} onClose={() => setDetail(null)} onEdit={() => { const p = detail; setDetail(null); setEditor(p); }} /> : null}
      {editor !== undefined ? <EditorSheet practice={editor} wide={wide} onSave={onSave} onClose={() => setEditor(undefined)} onArchive={onArchive} onDelete={onDelete} existingNames={game.practices.filter((x) => !x.archived).map((x) => x.name)} /> : null}
      {daySheet !== null ? <DayDetailSheet day={daySheet} wide={wide} onClose={() => setDaySheet(null)} /> : null}
      {game.levelUp ? <LevelUpOverlay stage={game.levelUp} onClose={game.clearLevelUp} /> : null}
      {toast ? <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={() => { if (toast.action === 'undo') game.undoArchive(); setToast(null); }} onClose={() => setToast(null)} /> : null}
      {onboard ? <Onboarding onDone={dismissOnboard} /> : null}
      {avatarPicker ? <AvatarPicker current={game.avatar} onPick={game.setAvatar} onClose={() => setAvatarPicker(false)} /> : null}
      {metricEdit ? <MetricEditor metric={metricEdit} value={metricEdit === 'streak' ? game.streak : (game.timeMin?.[metricEdit] || 0)} onSave={(val) => { if (metricEdit === 'streak') game.setStreakValue(val); else game.setTimeMinutes(metricEdit, val); }} onClose={() => setMetricEdit(null)} /> : null}
      {paywall ? <Paywall onClose={() => setPaywall(false)} onSubscribe={async () => { const { data } = await supabase.functions.invoke('create-subscription-invoice', { body: { uid: auth?.user?.id } }); if (data?.link) openInvoice(data.link, () => { premium.refresh(); setPaywall(false); }); else setPaywall(false); }} /> : null}
      {menuOpen ? <HeaderMenu items={[{ key: 'teacher', icon: 'users', label: 'Кабинет учителя', onPress: () => setRoute('teacher') }]} onClose={() => setMenuOpen(false)} /> : null}
      <FogVeil />
    </>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.paper }}>
        <SideRail route={route} setRoute={setRoute} stage={game.stage} onSignOut={auth?.signOut} userName={auth?.user?.name} isTeacher={isTeacher} />
        <View style={{ flex: 1, position: 'relative' }}>
          {screen}
          {overlays}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{screen}</View>
      <BottomNav route={route} setRoute={setRoute} isTeacher={isTeacher} />
      {overlays}
    </View>
  );
}
