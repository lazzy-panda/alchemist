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
                <Mh size={26} color={cat.color} han={cat.han} fontSize={15} square />
                <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, color: C.title }}>{cat.name}</Text>
                <Text style={T.caption}>{items.length}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.inkFaint, fontSize: 18, transform: isCol ? [] : [{ rotate: '90deg' }] }}>›</Text>
              </Pressable>
              <BrushDivider />
              {!isCol ? (
                <View style={{ gap: 10, marginTop: 10 }}>
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

        {/* archive */}
        <Pressable onPress={() => setArchiveOpen(!archiveOpen)} accessibilityRole="button" accessibilityLabel="Архив" accessibilityState={{ expanded: archiveOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <Text style={{ color: C.inkFaint, fontSize: 16, transform: archiveOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>
          <Text style={{ color: C.inkFaint, fontWeight: '700', fontSize: 13, fontFamily: FONT.ui }}>Архив</Text>
          {archived.length ? <Text style={T.caption}>{archived.length}</Text> : null}
        </Pressable>
        {archiveOpen ? (
          <Card style={[{ padding: 16, marginTop: 10 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
            {archived.length ? (
              <View style={{ gap: 4 }}>
                {archived.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                    <Mh size={26} color={CATS[p.cat].color} han={CATS[p.cat].han} fontSize={14} />
                    <Text style={{ flex: 1, fontFamily: FONT.display, fontWeight: '600', fontSize: 14, color: C.ink }} numberOfLines={1}>{p.name}</Text>
                    <Btn variant="secondary" onPress={() => restorePractice && restorePractice(p.id)} style={{ paddingVertical: 8, paddingHorizontal: 14 }}>Вернуть</Btn>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: C.inkFaint, fontFamily: FONT.ui, textAlign: 'center' }}>Архив пуст. Заархивированные практики появятся здесь — их можно вернуть.</Text>
            )}
          </Card>
        ) : null}
      </PadView>
    </ScreenScroll>
  );
}
