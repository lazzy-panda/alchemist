import { describe, it, expect } from 'vitest';
import { computeTarget, computeDropLine, wouldReorder } from './dragMath';

// build {order, layouts} from row heights stacked with the Today-list gap (14px)
const GAP = 14;
function stack(heights, ids) {
  const order = ids || heights.map((_, i) => 'r' + i);
  const layouts = {};
  let y = 0;
  order.forEach((id, i) => { layouts[id] = { y, h: heights[i] }; y += heights[i] + GAP; });
  return { order, layouts };
}
// real Today mix: three 120px cards, two 92px, one 120px
const MIX = stack([120, 120, 120, 92, 92, 120]);

describe('computeTarget', () => {
  it('down one slot: center crosses next midpoint → insert before the row after it', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r0', 140)).toBe('r2');
  });
  it('up one slot: center crosses previous midpoint → insert before it', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r2', -140)).toBe('r1');
  });
  it('multi-slot down lands before the last row', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r0', 560)).toBe('r5');
  });
  it('past the last midpoint → null (append to end)', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r0', 650)).toBe(null);
  });
  it('to the very top → first id', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r4', -540)).toBe('r0');
  });
  it('tiny upward nudge → own id (no-op sentinel)', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r1', -10)).toBe('r1');
  });
  it('single-item list: small nudge returns own id', () => {
    const one = stack([120]);
    expect(computeTarget(one.order, one.layouts, 'r0', -50)).toBe('r0');
  });
  it('missing start layout → own id (bail out safely)', () => {
    expect(computeTarget(MIX.order, {}, 'r0', 140)).toBe('r0');
  });
  it('rows with missing layouts are skipped in the walk', () => {
    const layouts = { ...MIX.layouts };
    delete layouts.r1;
    expect(computeTarget(MIX.order, layouts, 'r0', 70)).toBe('r2');
  });
  it('mixed heights: 92px card crossing a 92px neighbour before a 120px one', () => {
    expect(computeTarget(MIX.order, MIX.layouts, 'r3', 110)).toBe('r5');
  });

  // THE live regression: after one reorder [A,B,C]→[B,A,C], RNW never re-fires onLayout
  // (ResizeObserver only reacts to size), so stale coords misplace every next drop.
  it('stale post-reorder layouts overshoot (documents the bug), fresh layouts hit the slot', () => {
    const ids = ['B', 'A', 'C']; // real on-screen order after the first reorder
    const stale = { A: { y: 0, h: 120 }, B: { y: 134, h: 120 }, C: { y: 268, h: 120 } }; // pre-reorder coords
    const fresh = { B: { y: 0, h: 120 }, A: { y: 134, h: 120 }, C: { y: 268, h: 120 } };
    // user drags B (visually top) down one slot — wants [A, B, C]
    expect(computeTarget(ids, stale, 'B', 134)).toBe(null); // stale → appended to the very end (the observed bug)
    expect(computeTarget(ids, fresh, 'B', 134)).toBe('C'); // fresh → lands exactly one slot down
  });
});

describe('computeDropLine', () => {
  it('hidden when the resulting order equals the current one', () => {
    expect(computeDropLine(MIX.order, MIX.layouts, 'r1', 10)).toBe(null);
  });
  it('hidden when the target is the dragged row itself (tiny upward nudge)', () => {
    expect(computeDropLine(MIX.order, MIX.layouts, 'r1', -10)).toBe(null);
  });
  it('sits 8px above the target row', () => {
    expect(computeDropLine(MIX.order, MIX.layouts, 'r0', 140)).toBe(MIX.layouts.r2.y - 8);
  });
  it('clamps to 1px when the target is the first row', () => {
    expect(computeDropLine(MIX.order, MIX.layouts, 'r4', -540)).toBe(1);
  });
  it('append: sits 6px below the last row', () => {
    const last = MIX.layouts.r5;
    expect(computeDropLine(MIX.order, MIX.layouts, 'r0', 650)).toBe(last.y + last.h + 6);
  });
  it('hidden when the start layout is missing', () => {
    expect(computeDropLine(MIX.order, {}, 'r0', 140)).toBe(null);
  });
});

describe('wouldReorder', () => {
  const order = ['a', 'b', 'c'];
  it('false for self-target', () => expect(wouldReorder(order, 'b', 'b')).toBe(false));
  it('false for the immediate next sibling (same slot)', () => expect(wouldReorder(order, 'a', 'b')).toBe(false));
  it('false when the last item is dropped past the end', () => expect(wouldReorder(order, 'c', null)).toBe(false));
  it('true for a real move down', () => expect(wouldReorder(order, 'a', 'c')).toBe(true));
  it('true for a real move to the end', () => expect(wouldReorder(order, 'a', null)).toBe(true));
  it('true for a real move up', () => expect(wouldReorder(order, 'c', 'a')).toBe(true));
});
