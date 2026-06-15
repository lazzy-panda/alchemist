/* Alchemist — navigation: bottom nav (mobile footer) + side rail (desktop). RPGUI dark.
   Icons are crisp monochrome SVG (no emoji) so the footer reads as part of the pixel skin;
   the active item rises into a gold "equipped slot". */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Circle, Rect, Line, Path, Polyline } from 'react-native-svg';
import { C, FONT } from './theme';
import { Bar as ProgressBar } from './badges';

export const NAV = [
  { key: 'today', label: 'Today' },
  { key: 'character', label: 'Character' },
  { key: 'library', label: 'Practices' },
  { key: 'diary', label: 'Diary' },
  { key: 'journal', label: 'Journal' },
];

/* ---- monochrome nav glyphs (24x24, tinted via `color`) ---- */
function NavIcon({ name, size = 22, color = '#fff' }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const fill = { fill: color };
  let body;
  switch (name) {
    case 'today': // sun
      body = (
        <>
          <Circle cx={12} cy={12} r={3.8} {...fill} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            return <Line key={i} x1={12 + Math.cos(a) * 6.6} y1={12 + Math.sin(a) * 6.6} x2={12 + Math.cos(a) * 9.4} y2={12 + Math.sin(a) * 9.4} {...stroke} />;
          })}
        </>
      );
      break;
    case 'character': // bust
      body = (
        <>
          <Circle cx={12} cy={8} r={3.4} {...fill} />
          <Path d="M5.5 19 C5.5 13.6 9 12.6 12 12.6 C15 12.6 18.5 13.6 18.5 19 Z" {...fill} />
        </>
      );
      break;
    case 'library': // open book
      body = (
        <>
          <Path d="M12 6.6 C9.5 5.1 7 5.3 4.6 6 L4.6 17.6 C7 16.8 9.5 16.8 12 18 Z" {...stroke} />
          <Path d="M12 6.6 C14.5 5.1 17 5.3 19.4 6 L19.4 17.6 C17 16.8 14.5 16.8 12 18 Z" {...stroke} />
        </>
      );
      break;
    case 'diary': // page with lines + check
      body = (
        <>
          <Rect x={5.5} y={4} width={13} height={16} rx={1.5} {...stroke} />
          <Line x1={8.4} y1={9} x2={15.6} y2={9} {...stroke} />
          <Line x1={8.4} y1={12.4} x2={15.6} y2={12.4} {...stroke} />
          <Polyline points="8.4,16 9.8,17.4 12.4,14.6" {...stroke} />
        </>
      );
      break;
    case 'journal': // ascending bars
    default:
      body = (
        <>
          <Rect x={5} y={13} width={3.4} height={5} {...fill} />
          <Rect x={10.3} y={9} width={3.4} height={9} {...fill} />
          <Rect x={15.6} y={5.6} width={3.4} height={12.4} {...fill} />
        </>
      );
      break;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
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
              <NavIcon name={n.key} size={20} color={on ? C.gold : C.inkFaint} />
              <Text style={{ fontFamily: FONT.display, fontSize: 7, color: on ? C.gold : C.inkFaint }}>{n.label}</Text>
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
        <Text style={{ fontSize: 24 }}>⚗️</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 13, color: C.gold }}>Alchemist</Text>
      </View>
      {NAV.map((n) => {
        const on = route === n.key;
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} accessibilityRole="button" accessibilityLabel={n.label} accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 11, marginBottom: 4, borderRadius: 6, minHeight: 44, borderWidth: 2, borderColor: on ? C.goldLine : 'transparent', backgroundColor: on ? C.frameGoldBg : 'transparent' }}>
            <NavIcon name={n.key} size={18} color={on ? C.gold : C.inkMuted} />
            <Text style={{ fontFamily: FONT.display, fontSize: 9, color: on ? C.gold : C.inkMuted }}>{n.label}</Text>
          </Pressable>
        );
      })}
      <View style={{ flex: 1 }} />
      <View style={{ padding: 12, backgroundColor: C.paperWarm, borderWidth: 2, borderColor: C.paperDeep, borderRadius: 6 }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: C.inkFaint, marginBottom: 6 }}>Stage</Text>
        <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.gold }}>{stage.lvl}</Text>
        <View style={{ marginTop: 8 }}>
          <ProgressBar pct={(stage.xp / stage.next) * 100} color="xp" />
        </View>
      </View>
      <Pressable onPress={onSignOut} accessibilityRole="button" accessibilityLabel="Sign out" style={{ marginTop: 10, paddingVertical: 8, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONT.ui, fontSize: 8, color: C.inkMuted }}>↩ Sign out{userName ? ' · ' + userName : ''}</Text>
      </Pressable>
    </View>
  );
}
