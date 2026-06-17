/* Alchemist — navigation: bottom nav (mobile footer) + side rail (desktop). RPGUI dark.
   Icons are crisp monochrome SVG (no emoji) so the footer reads as part of the pixel skin;
   the active item rises into a gold "equipped slot". */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from './theme';
import { Bar as ProgressBar } from './badges';
import { PixelIcon } from './PixelIcon';

export const NAV = [
  { key: 'today', label: 'Сегодня' },
  { key: 'character', label: 'Герой' },
  { key: 'library', label: 'Практики' },
  { key: 'diary', label: 'Дневник' },
];

/* ---- pixel-art nav icons (Pixelarticons), tinted gold when active ---- */
const NAV_ICON = { today: 'sun', character: 'user', library: 'list-box', diary: 'notes', journal: 'script-text' };
function NavIcon({ name, size = 22, on }) {
  return <PixelIcon name={NAV_ICON[name] || 'circle'} size={size} color={on ? C.gold : C.inkFaint} />;
}

/* ---- bottom footer (mobile) ---- */
export function BottomNav({ route, setRoute }) {
  return (
    <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'flex-end', paddingTop: 9, paddingBottom: 8, paddingHorizontal: 4, backgroundColor: C.railBg, borderTopWidth: 2, borderTopColor: C.goldLine }}>
      {/* carved top highlight above the gold rule */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,225,160,0.14)' }} />
      {NAV.map((n) => {
        const on = route === n.key;
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} accessibilityRole="button" accessibilityLabel={n.label} accessibilityState={{ selected: on }} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'flex-end' }}>
            <View
              style={[
                // transparent 2px border on every item keeps sizing stable between states
                { alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingTop: 6, paddingBottom: 5, borderRadius: 5, borderWidth: 2, borderColor: 'transparent' },
                on ? { backgroundColor: C.frameGoldBg, borderColor: C.goldLine, boxShadow: `0px 2px 0px ${C.goldLine}`, transform: [{ translateY: -3 }] } : null,
              ]}
            >
              <NavIcon name={n.key} size={22} on={on} />
              <Text style={{ fontFamily: FONT.display, fontSize: 14, color: on ? C.gold : C.inkFaint }}>{n.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---- side rail (desktop) — same icon language, gold-framed active row ---- */
export function SideRail({ route, setRoute, stage, onSignOut, userName }) {
  return (
    <View style={{ width: 240, paddingVertical: 22, paddingHorizontal: 14, backgroundColor: C.railBg, borderRightWidth: 3, borderRightColor: C.paperDeep }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22, marginHorizontal: 4 }}>
        <Text style={{ fontSize: 48 }}>⚗️</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 26, color: C.gold }}>Алхимик</Text>
      </View>
      {NAV.map((n) => {
        const on = route === n.key;
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} accessibilityRole="button" accessibilityLabel={n.label} accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 11, marginBottom: 4, borderRadius: 6, minHeight: 44, borderWidth: 2, borderColor: on ? C.goldLine : 'transparent', backgroundColor: on ? C.frameGoldBg : 'transparent' }}>
            <NavIcon name={n.key} size={20} on={on} />
            <Text style={{ fontFamily: FONT.display, fontSize: 18, color: on ? C.gold : C.inkMuted }}>{n.label}</Text>
          </Pressable>
        );
      })}
      <View style={{ flex: 1 }} />
      <View style={{ padding: 12, backgroundColor: C.paperWarm, borderWidth: 2, borderColor: C.paperDeep, borderRadius: 6 }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>Стадия</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 40, color: C.gold }}>{stage.lvl}</Text>
        <View style={{ marginTop: 8 }}>
          <ProgressBar pct={(stage.xp / stage.next) * 100} color="xp" />
        </View>
      </View>
      <Pressable onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Выход" style={{ marginTop: 10, paddingVertical: 8, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.inkMuted }}>↩ Выход{userName ? ' · ' + userName : ''}</Text>
      </Pressable>
    </View>
  );
}
