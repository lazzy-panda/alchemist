/* Alchemist — Today list with drag-to-reorder.
   A dedicated grip handle per card owns the drag gesture, so it never fights the card's
   horizontal swipe-to-complete. Lift the dragged card (follows the finger); on drop the
   list reorders by the slot the card was released over. Order persists via engine.reorderPractices. */
import React, { useRef, useState } from 'react';
import { View, Animated, PanResponder } from 'react-native';
import { C } from './theme';
import { PixelIcon } from './PixelIcon';
import { PracticeCard } from './PracticeCard';

export function DragList({ items, locked, onToggle, onOpen, onReorder }) {
  const [dragId, setDragId] = useState(null);
  const pan = useRef(new Animated.Value(0)).current;
  const layouts = useRef({}); // id -> { y, h } (offset within this list)
  const responders = useRef({});
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  const orderRef = useRef([]);
  orderRef.current = items.map((p) => p.id);

  // which item should the dragged card land BEFORE? returns that item's id, or null to drop at the
  // very end. Threshold is each item's vertical midpoint, so the dragged card swaps into a slot as
  // its center crosses the neighbour's middle (smooth, predictable in both directions).
  const targetFor = (startId, dy) => {
    const ids = orderRef.current;
    const L = layouts.current;
    const start = L[startId];
    if (!start) return startId;
    const center = start.y + start.h / 2 + dy;
    for (let i = 0; i < ids.length; i++) {
      const l = L[ids[i]];
      if (!l) continue;
      if (center < l.y + l.h / 2) return ids[i];
    }
    return null; // below every midpoint → append at the end
  };

  const ensureResponder = (id) => {
    if (!responders.current[id]) {
      responders.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => { pan.setValue(0); setDragId(id); },
        onPanResponderMove: (e, g) => pan.setValue(g.dy),
        onPanResponderRelease: (e, g) => {
          const toId = targetFor(id, g.dy);
          pan.setValue(0);
          setDragId(null);
          if (toId !== id) onReorderRef.current && onReorderRef.current(id, toId);
        },
        onPanResponderTerminate: () => { pan.setValue(0); setDragId(null); },
      });
    }
    return responders.current[id];
  };

  return (
    <View style={{ gap: 14 }}>
      {items.map((p) => {
        const isDrag = dragId === p.id;
        const r = ensureResponder(p.id);
        return (
          <Animated.View
            key={p.id}
            onLayout={(e) => { const { y, height } = e.nativeEvent.layout; layouts.current[p.id] = { y, h: height }; }}
            style={[
              { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
              isDrag ? { transform: [{ translateY: pan }, { scale: 1.03 }], zIndex: 50, opacity: 0.97 } : null,
            ]}
          >
            <View
              {...r.panHandlers}
              accessibilityRole="button"
              accessibilityLabel={'Переместить: ' + p.name}
              style={{ width: 32, borderRadius: 6, borderWidth: 2, borderColor: isDrag ? C.gold : C.goldLine, backgroundColor: isDrag ? C.frameGoldBg : C.frameDark, alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', cursor: 'grab' }}
            >
              <PixelIcon name="move" size={18} color={C.gold} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <PracticeCard p={p} onToggle={onToggle} onOpen={onOpen} locked={locked(p)} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
