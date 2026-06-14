/* Alchemist — navigation: bottom nav (mobile) + side rail (desktop).
   Frames transferred to the RPG kit's stone material. */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from './theme';
import { Gradient, Han } from './ui';
import { Bar as ProgressBar } from './badges';

export const NAV = [
  { key: 'today', glyph: '日', label: 'Сегодня' },
  { key: 'character', glyph: '我', label: 'Персонаж' },
  { key: 'library', glyph: '書', label: 'Практики' },
  { key: 'diary', glyph: '記', label: 'Дневник' },
  { key: 'journal', glyph: '史', label: 'Журнал' },
];

const STONE = [C.stoneLight, C.stoneDark];

export function BottomNav({ route, setRoute }) {
  return (
    <Gradient colors={STONE} angle={180} style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 12, paddingHorizontal: 8, borderTopWidth: 3, borderTopColor: C.stoneLine, boxShadow: 'inset 0px 3px 0px rgba(255,255,255,0.4), inset 0px -3px 7px rgba(0,0,0,0.22), 0px -4px 12px rgba(0,0,0,0.22)' }}>
      {NAV.map((n) => {
        const on = route === n.key;
        const inner = (
          <>
            <Han style={{ fontSize: 22, lineHeight: 24, color: on ? '#fff' : '#46433A', transform: on ? [{ translateY: -2 }, { scale: 1.1 }] : [] }}>{n.glyph}</Han>
            <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.2, color: on ? '#fff' : '#46433A', fontFamily: FONT.ui }}>{n.label}</Text>
          </>
        );
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} style={{ borderRadius: 16, overflow: 'hidden' }}>
            {on ? (
              <Gradient colors={['#8FCB63', '#4E9B3A']} angle={180} style={{ alignItems: 'center', gap: 3, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: '#2E6B22', boxShadow: '0px 3px 0px #2E6B22, inset 0px 1px 0px rgba(255,255,255,0.5)' }}>
                {inner}
              </Gradient>
            ) : (
              <View style={{ alignItems: 'center', gap: 3, paddingVertical: 6, paddingHorizontal: 14 }}>{inner}</View>
            )}
          </Pressable>
        );
      })}
    </Gradient>
  );
}

export function SideRail({ route, setRoute, stage, onSignOut, userName }) {
  return (
    <Gradient colors={STONE} angle={180} style={{ width: 264, paddingVertical: 24, paddingHorizontal: 16, borderRightWidth: 4, borderRightColor: C.stoneLine, boxShadow: 'inset -3px 0px 0px rgba(0,0,0,0.22), inset 3px 0px 0px rgba(255,255,255,0.35), inset 0px 3px 0px rgba(255,255,255,0.3)' }}>
      {/* brand */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2, marginHorizontal: 6, marginBottom: 26 }}>
        <Gradient colors={['#e0654a', '#a93a24']} angle={160} style={{ width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: C.redLine, boxShadow: `inset 0px 2px 0px rgba(255,255,255,0.3), 0px 3px 0px ${C.redLine}`, transform: [{ rotate: '-3deg' }] }}>
          <Han style={{ fontSize: 25, color: '#fff', fontWeight: '700' }}>修</Han>
        </Gradient>
        <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 22, color: '#33302A' }}>Alchemist</Text>
      </View>

      {NAV.map((n) => {
        const on = route === n.key;
        const content = (
          <>
            <Han style={{ fontSize: 22, width: 26, textAlign: 'center', color: on ? C.goldLight : '#46433A' }}>{n.glyph}</Han>
            <Text style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: '600', color: on ? '#fff' : '#46433A' }}>{n.label}</Text>
          </>
        );
        return (
          <Pressable key={n.key} onPress={() => setRoute(n.key)} style={{ marginBottom: 7, borderRadius: 14, overflow: 'hidden' }}>
            {({ hovered }) =>
              on ? (
                <Gradient colors={['#8FCB63', '#4E9B3A']} angle={180} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 14, borderWidth: 2.5, borderColor: '#2E6B22', boxShadow: '0px 3px 0px #2E6B22, inset 0px 1px 0px rgba(255,255,255,0.4)' }}>
                  {content}
                </Gradient>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 14, borderWidth: 2.5, borderColor: 'transparent', backgroundColor: hovered ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                  {content}
                </View>
              )
            }
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {/* stage card */}
      <View style={{ padding: 16, borderRadius: 18, backgroundColor: C.paper, borderWidth: 2, borderColor: C.paperDeep, boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.6)' }}>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: C.inkFaint, marginBottom: 4, fontFamily: FONT.ui }}>Ступень</Text>
        <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontVariant: ['tabular-nums'], fontSize: 30, color: C.jadeDeep }}>{stage.lvl}</Text>
        <View style={{ marginTop: 8 }}>
          <ProgressBar pct={(stage.xp / stage.next) * 100} colors={['#66ccba', '#259081']} height={16} />
        </View>
      </View>

      {/* account / sign out */}
      <Pressable onPress={onSignOut} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12 }}>
        <Text style={{ fontFamily: FONT.ui, fontWeight: '700', fontSize: 13, color: '#33302A' }}>↩ Выйти{userName ? ' · ' + userName : ''}</Text>
      </Pressable>
    </Gradient>
  );
}
