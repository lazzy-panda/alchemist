/* Alchemist — navigation: bottom nav (mobile) + side rail (desktop). RPGUI dark. */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from './theme';
import { Bar as ProgressBar } from './badges';

export const NAV = [
  { key: 'today', glyph: '☀', label: 'Today' },
  { key: 'character', glyph: '🧙', label: 'Character' },
  { key: 'library', glyph: '📖', label: 'Practices' },
  { key: 'diary', glyph: '📝', label: 'Diary' },
  { key: 'journal', glyph: '📊', label: 'Journal' },
];

export function BottomNav({ route, setRoute }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8, paddingBottom: 10, paddingHorizontal: 6, backgroundColor: '#2a251d', borderTopWidth: 3, borderTopColor: C.paperDeep }}>
      {NAV.map((n) => {
        const on = route === n.key;
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} accessibilityRole="button" accessibilityLabel={n.label} accessibilityState={{ selected: on }} style={{ alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 16, opacity: on ? 1 : 0.45 }}>{n.glyph}</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 7, color: on ? C.gold : C.inkFaint }}>{n.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SideRail({ route, setRoute, stage, onSignOut, userName }) {
  return (
    <View style={{ width: 240, paddingVertical: 22, paddingHorizontal: 14, backgroundColor: '#2a251d', borderRightWidth: 3, borderRightColor: C.paperDeep }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22, marginHorizontal: 4 }}>
        <Text style={{ fontSize: 24 }}>⚗️</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 13, color: C.gold }}>Alchemist</Text>
      </View>
      {NAV.map((n) => {
        const on = route === n.key;
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} accessibilityRole="button" accessibilityLabel={n.label} accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 4, borderRadius: 6, backgroundColor: on ? 'rgba(255,209,128,0.16)' : 'transparent' }}>
            <Text style={{ fontSize: 15, opacity: on ? 1 : 0.5 }}>{n.glyph}</Text>
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: on ? C.gold : C.inkMuted }}>{n.label}</Text>
          </Pressable>
        );
      })}
      <View style={{ flex: 1 }} />
      <View style={{ padding: 12, backgroundColor: C.paperWarm, borderWidth: 2, borderColor: C.paperDeep, borderRadius: 6 }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>Stage</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.gold }}>{stage.lvl}</Text>
        <View style={{ marginTop: 8 }}>
          <ProgressBar pct={(stage.xp / stage.next) * 100} color="xp" />
        </View>
      </View>
      <Pressable onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out" style={{ marginTop: 10, paddingVertical: 8, alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkMuted }}>↩ Sign out{userName ? ' · ' + userName : ''}</Text>
      </Pressable>
    </View>
  );
}
