/* Alchemist — Today list with drag-to-reorder.
   A dedicated grip handle per card owns the drag gesture, so it never fights the card's
   horizontal swipe-to-complete. Lift the dragged card (follows the finger); on drop the
   list reorders by the slot the card was released over. Order persists via engine.reorderPractices.

   Geometry: RNW's onLayout rides ResizeObserver and never re-fires on position-only changes,
   so cached offsets go stale after the first reorder. The fix: at drag start (grant) we re-read
   every row's offsetTop/offsetHeight synchronously. Invariant: rows are direct children of the
   position:'relative' list container, so those offsets live in the same coordinate space as
   onLayout (which stays as the initial seed and the native path — Yoga re-fires on moves). */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Animated, PanResponder, Platform } from 'react-native';
import { C } from './theme';
import { PixelIcon } from './PixelIcon';
import { PracticeCard } from './PracticeCard';
import { computeTarget, computeDropLine, wouldReorder } from './dragMath';
import { kf, KF, EASE } from './anim';
import { haptic } from './telegram.web';

const WEB = Platform.OS === 'web';
const EDGE = 96; // px auto-scroll zone at each viewport edge
const MAX_STEP = 14; // px per frame at full zone depth (~840 px/s)

export function DragList({ items, locked, onToggle, onOpen, onReorder, scrollRef }) {
  const [dragId, setDragId] = useState(null);
  const [dropY, setDropY] = useState(null); // y of the gold "drop here" line (null = hidden)
  const dragIdRef = useRef(null);
  const dropYRef = useRef(null);
  const pan = useRef(new Animated.Value(0)).current;
  const layouts = useRef({}); // id -> { y, h } (offset within this list)
  const rowRefs = useRef({}); // id -> row host node (DOM element on web)
  const responders = useRef({});
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const scrollHostRef = useRef(scrollRef);
  scrollHostRef.current = scrollRef;

  const orderRef = useRef([]);
  orderRef.current = items.map((p) => p.id);

  // auto-scroll bookkeeping (all refs — no re-renders from the rAF loop)
  const scrollStartRef = useRef(0); // scrollTop at grant
  const lastDyRef = useRef(0); // latest gesture dy
  const speedRef = useRef(0); // px per frame, signed
  const rafRef = useRef(0);

  // Every helper below closes over stable refs only, so the first-render instances cached
  // inside each row's PanResponder keep working across renders.
  const scrollNode = useCallback(() => {
    const r = scrollHostRef.current;
    const n = r && r.current && typeof r.current.getScrollableNode === 'function' ? r.current.getScrollableNode() : null;
    return n && typeof n.scrollTop === 'number' ? n : null;
  }, []);

  // gesture dy + content scrolled under the finger since grant = displacement in list coords
  const effDy = useCallback((gdy) => {
    const n = scrollNode();
    return gdy + (n ? n.scrollTop - scrollStartRef.current : 0);
  }, [scrollNode]);

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    speedRef.current = 0;
  }, []);

  const updateDropLine = useCallback((id, dy) => {
    const y = computeDropLine(orderRef.current, layouts.current, id, dy);
    if (y !== dropYRef.current) { dropYRef.current = y; setDropY(y); }
  }, []);

  const autoScrollStep = useCallback((id) => {
    rafRef.current = 0;
    if (dragIdRef.current !== id || speedRef.current === 0) return;
    const n = scrollNode();
    if (!n) return;
    const max = Math.max(0, n.scrollHeight - n.clientHeight);
    const next = Math.min(max, Math.max(0, n.scrollTop + speedRef.current));
    if (next === n.scrollTop) return; // clamped at a content end — pointer moves restart us
    n.scrollTop = next;
    const eff = lastDyRef.current + (next - scrollStartRef.current);
    pan.setValue(eff);
    updateDropLine(id, eff);
    rafRef.current = requestAnimationFrame(() => autoScrollStep(id));
  }, [scrollNode, updateDropLine, pan]);

  // self-driving: keeps scrolling while the finger rests inside an edge zone
  const updateAutoScroll = useCallback((id, moveY) => {
    if (!WEB || typeof window === 'undefined' || !scrollNode()) return;
    const vh = window.innerHeight || 0;
    let sp = 0;
    if (moveY < EDGE) sp = -MAX_STEP * (1 - moveY / EDGE);
    else if (moveY > vh - EDGE) sp = MAX_STEP * (1 - (vh - moveY) / EDGE);
    speedRef.current = Math.max(-MAX_STEP, Math.min(MAX_STEP, sp));
    if (speedRef.current !== 0 && !rafRef.current && dragIdRef.current === id) {
      rafRef.current = requestAnimationFrame(() => autoScrollStep(id));
    }
  }, [scrollNode, autoScrollStep]);

  const measureRowsNow = useCallback(() => {
    for (const id of orderRef.current) {
      const n = rowRefs.current[id];
      if (n && typeof n.offsetTop === 'number' && typeof n.offsetHeight === 'number') {
        layouts.current[id] = { y: n.offsetTop, h: n.offsetHeight };
      }
    }
  }, []);

  const resetDrag = useCallback(() => {
    stopAutoScroll();
    if (WEB && typeof window !== 'undefined') window.removeEventListener('blur', resetDrag);
    pan.stopAnimation();
    pan.setValue(0);
    dropYRef.current = null; setDropY(null);
    dragIdRef.current = null; setDragId(null);
  }, [stopAutoScroll, pan]);

  // ease the lifted card back into its slot (no-op release / cancelled gesture)
  const snapBack = useCallback((id) => {
    stopAutoScroll();
    if (WEB && typeof window !== 'undefined') window.removeEventListener('blur', resetDrag);
    dropYRef.current = null; setDropY(null);
    Animated.spring(pan, { toValue: 0, bounciness: 0, speed: 18, useNativeDriver: !WEB }).start(() => {
      // keep the lift alive while the spring plays; a fresh grant may own dragId by now
      if (dragIdRef.current === id) { dragIdRef.current = null; setDragId(null); }
    });
  }, [stopAutoScroll, resetDrag, pan]);

  // rows can be added/removed/completed between drags — drop dead ids, cancel an orphaned drag
  const sig = orderRef.current.join('|');
  useEffect(() => {
    const have = new Set(orderRef.current);
    for (const k of Object.keys(layouts.current)) if (!have.has(k)) delete layouts.current[k];
    for (const k of Object.keys(responders.current)) if (!have.has(k)) delete responders.current[k];
    for (const k of Object.keys(rowRefs.current)) if (!have.has(k)) delete rowRefs.current[k];
    if (dragIdRef.current && !have.has(dragIdRef.current)) resetDrag();
  }, [sig, resetDrag]);

  useEffect(() => () => {
    stopAutoScroll();
    if (WEB && typeof window !== 'undefined') window.removeEventListener('blur', resetDrag);
  }, [stopAutoScroll, resetDrag]);

  const ensureResponder = (id) => {
    if (!responders.current[id]) {
      responders.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => false, // grab on press only — never hand the drag to a sibling grip mid-gesture
        onPanResponderTerminationRequest: () => false, // and refuse to yield it once granted (prevents responder theft on web)
        onPanResponderGrant: () => {
          measureRowsNow(); // fresh geometry every drag — see header comment
          pan.stopAnimation(); // a previous snap-back may still be springing on the shared value
          pan.setValue(0);
          const n = scrollNode();
          scrollStartRef.current = n ? n.scrollTop : 0;
          lastDyRef.current = 0;
          speedRef.current = 0;
          dropYRef.current = null; setDropY(null);
          dragIdRef.current = id; setDragId(id);
          if (WEB && typeof window !== 'undefined') window.addEventListener('blur', resetDrag); // a release outside the window must not leave a stuck lift
          haptic('selection');
        },
        onPanResponderMove: (e, g) => {
          lastDyRef.current = g.dy;
          const eff = effDy(g.dy);
          pan.setValue(eff);
          updateDropLine(id, eff);
          updateAutoScroll(id, g.moveY);
        },
        onPanResponderRelease: (e, g) => {
          const eff = effDy(g.dy);
          stopAutoScroll();
          if (!orderRef.current.includes(id)) { resetDrag(); return; } // the row vanished mid-drag
          const toId = computeTarget(orderRef.current, layouts.current, id, eff);
          if (wouldReorder(orderRef.current, id, toId)) {
            if (WEB && typeof window !== 'undefined') window.removeEventListener('blur', resetDrag);
            pan.setValue(0);
            dropYRef.current = null; setDropY(null);
            dragIdRef.current = null; setDragId(null);
            onReorderRef.current && onReorderRef.current(id, toId);
            haptic('selection');
          } else {
            snapBack(id); // same slot — ease back instead of teleporting
          }
        },
        onPanResponderTerminate: () => snapBack(id),
      });
    }
    return responders.current[id];
  };

  return (
    <View style={{ gap: 14, position: 'relative' }}>
      {dragId && dropY != null ? (
        <View pointerEvents="none" style={[{ position: 'absolute', left: -2, right: -2, top: dropY, height: 4, borderRadius: 3, backgroundColor: C.gold, zIndex: 60, boxShadow: '0px 0px 7px rgba(255,205,95,0.95), 0px 1px 3px rgba(0,0,0,0.55)' }, kf(KF.fadeIn, 0.15, { ease: EASE.out })]} />
      ) : null}
      {items.map((p) => {
        const isDrag = dragId === p.id;
        const r = ensureResponder(p.id);
        return (
          <Animated.View
            key={p.id}
            ref={(n) => { if (n) rowRefs.current[p.id] = n; else delete rowRefs.current[p.id]; }}
            onLayout={(e) => { const { y, height } = e.nativeEvent.layout; layouts.current[p.id] = { y, h: height }; }}
            style={[
              { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
              isDrag ? { transform: [{ translateY: pan }, { scale: 1.03 }], zIndex: 50, opacity: 0.97 } : null,
            ]}
          >
            <View
              {...r.panHandlers}
              nativeID={'today-grip-' + p.id}
              accessibilityRole="button"
              accessibilityLabel={'Переместить: ' + p.name}
              style={{ width: 32, borderRadius: 6, borderWidth: 2, borderColor: isDrag ? C.gold : C.goldLine, backgroundColor: isDrag ? C.frameGoldBg : C.frameDark, alignItems: 'center', justifyContent: 'center', touchAction: 'none', userSelect: 'none', cursor: isDrag ? 'grabbing' : 'grab' }}
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
