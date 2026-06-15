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
            <Text style={T.eyebrow}>Hall of Scrolls</Text>
            <Text accessibilityRole="header" style={T.displayM}>Practice Library</Text>
          </View>
          <Btn variant="gold" onPress={() => onAdd()}>+ New</Btn>
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
                <Text style={{ fontFamily: FONT.display, fontSize: 10, color: C.title }}>{cat.name}</Text>
                <Text style={T.caption}>{items.length}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.inkFaint, fontSize: 18, transform: isCol ? [] : [{ rotate: '90deg' }] }}>›</Text>
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

        {/* archive */}
        <Pressable onPress={() => setArchiveOpen(!archiveOpen)} accessibilityRole="button" accessibilityLabel="Archived practices" accessibilityState={{ expanded: archiveOpen }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <Text style={{ color: C.inkFaint, fontSize: 16, transform: archiveOpen ? [{ rotate: '90deg' }] : [] }}>›</Text>
          <Text style={{ color: C.inkFaint, fontSize: 9, fontFamily: FONT.display }}>Archive</Text>
          {archived.length ? <Text style={T.caption}>{archived.length}</Text> : null}
        </Pressable>
        {archiveOpen ? (
          <Card style={[{ padding: 16, marginTop: 10 }, kf(KF.fadeUp, 0.5, { ease: EASE.out })]}>
            {archived.length ? (
              <View style={{ gap: 4 }}>
                {archived.map((p) => (
                  <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                    <Mh size={22} icon={CATS[p.cat].icon} color={CATS[p.cat].color} />
                    <Text style={{ flex: 1, fontFamily: FONT.display, fontSize: 9, color: C.ink }} numberOfLines={1}>{p.name}</Text>
                    <Btn variant="secondary" onPress={() => restorePractice && restorePractice(p.id)}>Restore</Btn>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: C.inkFaint, fontFamily: FONT.ui, fontSize: 9, textAlign: 'center', lineHeight: 15 }}>Archive is empty. Archived practices appear here — you can restore them.</Text>
            )}
          </Card>
        ) : null}
      </PadView>
    </ScreenScroll>
  );
}
