/* Alchemist — main shell: navigation, responsive layout, overlays */
import React, { useState, useCallback, useEffect } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from './theme';
import { useGame } from './engine';
import { useAuth } from './auth';
import { kf, KF, EASE } from './ui';
import { BottomNav, SideRail } from './nav';
import { TodayScreen } from './screens/Today';
import { CharacterScreen } from './screens/Character';
import { LibraryScreen } from './screens/Library';
import { DiaryScreen } from './screens/Diary';
import { JournalScreen } from './screens/Journal';
import { PracticeDetail, EditorSheet, DayDetailSheet, LevelUpOverlay, FogVeil, Onboarding, Toast } from './overlays';
import { KitPanel } from './kit';

const WEB = Platform.OS === 'web';
const SCREENS = {
  today: TodayScreen,
  character: CharacterScreen,
  library: LibraryScreen,
  diary: DiaryScreen,
  journal: JournalScreen,
};

export function MainApp() {
  const game = useGame();
  const auth = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [route, setRoute] = useState('today');
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [daySheet, setDaySheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [onboard, setOnboard] = useState(false);

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

  const dismissOnboard = useCallback(() => {
    setOnboard(false);
    AsyncStorage.setItem('alchemist_onboarded_v1', '1').catch(() => {});
  }, []);
  const onShowHelp = useCallback(() => setOnboard(true), []);

  const onComplete = useCallback((p) => { game.setDone(p, true); setDetail(null); }, [game.setDone]);
  const onSave = useCallback((data) => { game.savePractice(data); setEditor(undefined); }, [game.savePractice]);
  const onOpen = useCallback((p) => setDetail(p), []);
  const onAdd = useCallback(() => setEditor(null), []);
  const onEdit = useCallback((p) => setEditor(p), []);
  const onOpenDay = useCallback((d) => setDaySheet(d), []);
  const onArchive = useCallback((id) => {
    game.archivePractice(id);
    setToast({ message: 'Практика убрана в архив', actionLabel: 'Вернуть', action: 'undo' });
  }, [game.archivePractice]);

  const ctx = {
    ...game,
    route,
    wide,
    onToggle: game.toggle,
    onOpen,
    onComplete,
    onAdd,
    onEdit,
    onSave,
    onOpenDay,
    onShowHelp,
    userName: auth?.user?.name,
    diaryKey: 'alchemist_diary_' + (auth?.user?.id || 'anon'),
  };

  const Screen = SCREENS[route];
  const screen = (
    <View key={route} style={[{ flex: 1 }, kf(KF.screenIn, 0.42, { ease: EASE.out }), game.dayState === 'spent' && WEB ? { filter: 'saturate(0.55) brightness(0.99)' } : null]}>
      <Screen ctx={ctx} />
    </View>
  );

  const overlays = (
    <>
      {detail ? <PracticeDetail practice={detail} wide={wide} onComplete={onComplete} onClose={() => setDetail(null)} /> : null}
      {editor !== undefined ? <EditorSheet practice={editor} onSave={onSave} onClose={() => setEditor(undefined)} onArchive={onArchive} existingNames={game.practices.filter((x) => !x.archived).map((x) => x.name)} /> : null}
      {daySheet !== null ? <DayDetailSheet day={daySheet} onClose={() => setDaySheet(null)} /> : null}
      {game.levelUp ? <LevelUpOverlay stage={game.levelUp} onClose={game.clearLevelUp} /> : null}
      {toast ? <Toast message={toast.message} actionLabel={toast.actionLabel} onAction={() => { if (toast.action === 'undo') game.undoArchive(); setToast(null); }} onClose={() => setToast(null)} /> : null}
      {onboard ? <Onboarding onDone={dismissOnboard} /> : null}
      <FogVeil />
    </>
  );

  if (wide) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2b4640' }}>
        <View style={{ flex: 1, backgroundColor: 'transparent', padding: 28, alignItems: 'center', ...(WEB ? { backgroundImage: 'radial-gradient(900px 500px at 70% -8%, #4a6e63 0%, rgba(74,110,99,0) 60%), linear-gradient(165deg, #36504a 0%, #243733 100%)' } : null) }}>
          <KitPanel slice={60} border={24} style={{ flex: 1, width: '100%', maxWidth: 1240 }} contentStyle={{ flex: 1, flexDirection: 'row', overflow: 'hidden', borderRadius: 6 }}>
            <SideRail route={route} setRoute={setRoute} stage={game.stage} onSignOut={auth?.signOut} userName={auth?.user?.name} />
            <View style={{ flex: 1, position: 'relative' }}>
              {screen}
              {overlays}
            </View>
          </KitPanel>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{screen}</View>
      <BottomNav route={route} setRoute={setRoute} />
      {overlays}
    </View>
  );
}
