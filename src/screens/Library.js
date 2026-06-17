/* Alchemist — Library screen (ported 1:1 from screens2.jsx) */
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { CATS } from '../data';
import { ScreenScroll, PadView } from '../layout';
import { Card, Btn, T, BrushDivider, Han, kf, KF, EASE } from '../ui';
import { Mh } from '../badges';
import { PracticeCard } from '../PracticeCard';

export function LibraryScreen({ ctx }) {
  const { practices, onEdit, onAdd, onToggle, wide, restorePractice } = ctx;
  const cats = Object.keys(CATS);
  const [collapsed, setCollapsed] = useState({});
  const [archiveOpen, setArchiveOpen] = useState(false);
  const active = practices.filter((p) => !p.archived);
  const archived = practices.filter((p) => p.archived);

  return (
    <ScreenScroll>
      <PadView wide={wide}>
        {/* header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <View>
            <Text style={T.eyebrow}>Зал свитков</Text>
            <Text accessibilityRole="header" style={T.displayM}>Библиотека практик</Text>
          </View>
          <Btn variant="gold" onPress={() => onAdd()}>+ Новая</Btn>
        </View>

        {cats.map((ck) => {
          const cat = CATS[ck];
          const items = active.filter((p) => p.cat === ck);
          if (!items.length) return null;
          const isCol = collapsed[ck];
          return (
            <View key={ck} style={{ marginBottom: 8 }}>
              <Pressable onPress={() => setCollapsed({ ...collapsed, [ck]: !isCol })} accessibilityRole="button" accessibilityLabel={cat.name} accessibilityState={{ expanded: !isCol }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingBottom: 8, paddingHorizontal: 2 }}>
                <Mh size={24} icon={cat.icon} color={cat.color} />
                <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.title }}>{cat.name}</Text>
                <Text style={T.caption}>{items.length}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.inkFaint, fontSize: 36, transform: isCol ? [] : [{ rotate: '90deg' }] }}>›</Text>
              </Pressable>
              <BrushDivider />
              {!isCol ? (
                <View style={{ gap: 12, marginTop: 10 }}>
                  {items.map((p, i) => (
                    <View key={p.id} style={kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: i * 0.04 })}>
                      <PracticeCard p={p} compact onToggle={onToggle} onOpen={() => onEdit(p)} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {/* fallback group: any active practice whose category is unknown/legacy still shows up
            (otherwise it would be invisible here yet still block its name as a duplicate) */}
        {(() => {
          const others = active.filter((p) => !CATS[p.cat]);
          if (!others.length) return null;
          const isCol = collapsed.__other;
          return (
            <View key="__other" style={{ marginBottom: 8 }}>
              <Pressable onPress={() => setCollapsed({ ...collapsed, __other: !isCol })} accessibilityRole="button" accessibilityLabel="Прочее" accessibilityState={{ expanded: !isCol }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingBottom: 8, paddingHorizontal: 2 }}>
                <Mh size={24} icon="flag" color={C.inkMuted} />
                <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.title }}>Прочее</Text>
                <Text style={T.caption}>{others.length}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.inkFaint, fontSize: 36, transform: isCol ? [] : [{ rotate: '90deg' }] }}>›</Text>
              </Pressable>
              <BrushDivider />
              {!isCol ? (
                <View style={{ gap: 12, marginTop: 10 }}>
                  {others.map((p, i) => (
                    <View key={p.id} style={kf(KF.fadeUp, 0.5, { ease: EASE.out, delay: i * 0.04 })}>
                      <PracticeCard p={p} compact onToggle={onToggle} onOpen={() => onEdit(p)} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })()}

        {/* archive */}
        <Pressable onPress={() => setArchiveOpen(!archiveOpen)} accessibilityRole="button" accessibilityLabel="Архивные практики" accessibilityState={{ expanded: archiveOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <Text style={{ color: C.inkFaint, fontSize: 32, transform: archiveOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>
          <Text style={{ color: C.inkFaint, fontSize: 18, fontFamily: FONT.display }}>Архив</Text>
          {archived.length ? <Text style={T.caption}>{archived.length}</Text> : null}
        </Pressable>
        {archiveOpen ? (
          <Card style={[{ padding: 16, marginTop: 10 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
            {archived.length ? (
              <View style={{ gap: 4 }}>
                {archived.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                    <Mh size={22} icon={(CATS[p.cat] || {}).icon || 'flag'} color={(CATS[p.cat] || {}).color || C.inkMuted} />
                    <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: 18, color: C.ink }} numberOfLines={1}>{p.name}</Text>
                    <Btn variant="secondary" onPress={() => restorePractice && restorePractice(p.id)}>Восстановить</Btn>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: C.inkFaint, fontFamily: FONT.ui, fontSize: 18, textAlign: 'center', lineHeight: 30 }}>Архив пуст. Архивные практики появятся здесь — их можно восстановить.</Text>
            )}
          </Card>
        ) : null}
      </PadView>
    </ScreenScroll>
  );
}
