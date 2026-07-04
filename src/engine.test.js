import { describe, it, expect } from 'vitest';
import { atPracticeCap, FREE_PRACTICE_CAP, migratePractices, applyReorder } from './engine';
describe('atPracticeCap', () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, custom: true, archived: false }));
  it('premium never capped', () => expect(atPracticeCap(mk(50), true)).toBe(false));
  it('free under cap not capped', () => expect(atPracticeCap(mk(FREE_PRACTICE_CAP - 1), false)).toBe(false));
  it('free at cap is capped', () => expect(atPracticeCap(mk(FREE_PRACTICE_CAP), false)).toBe(true));
  it('seed (non-custom) practices do not count', () => expect(atPracticeCap(mk(0).concat(Array.from({length:20},(_,i)=>({id:'s'+i}))), false)).toBe(false));
});

describe('migratePractices', () => {
  it('drops orphaned library-only seeds (no today flag) — the "уже существует" ghosts', () => {
    const out = migratePractices([
      { id: 'a', name: 'Растяжка' },          // orphan seed → dropped
      { id: 'b', name: 'Цигун', today: true },
    ]);
    expect(out.map((p) => p.name)).toEqual(['Цигун']);
  });
  it('keeps archived, custom and teacher practices even without today', () => {
    const out = migratePractices([
      { id: 'arch', archived: true },
      { id: 'mine', custom: true },
      { id: 'teach', fromTeacher: 't1' },
      { id: 'ghost' },                        // orphan seed → dropped
    ]);
    expect(out.map((p) => p.id)).toEqual(['arch', 'mine', 'teach']);
  });
  it('remaps the retired zhan category to qi', () => {
    expect(migratePractices([{ id: 'a', cat: 'zhan', today: true }])[0].cat).toBe('qi');
  });
  it('returns null when there is no practices array', () => {
    expect(migratePractices(undefined)).toBe(null);
  });
});

describe('applyReorder', () => {
  const mk = (...ids) => ids.map((id) => ({ id }));
  const ids = (l) => l.map((p) => p.id);
  it('moves before target (down)', () => expect(ids(applyReorder(mk('a', 'b', 'c', 'd'), 'a', 'c'))).toEqual(['b', 'a', 'c', 'd']));
  it('moves before target (up)', () => expect(ids(applyReorder(mk('a', 'b', 'c', 'd'), 'c', 'b'))).toEqual(['a', 'c', 'b', 'd']));
  it('null target → end of the FULL array (past archived tail too)', () => {
    expect(ids(applyReorder(mk('a', 'b', 'arch', 'c'), 'a', null))).toEqual(['b', 'arch', 'c', 'a']);
  });
  it('self-drop returns the same instance', () => {
    const l = mk('a', 'b');
    expect(applyReorder(l, 'a', 'a')).toBe(l);
  });
  it('unknown fromId → same instance', () => {
    const l = mk('a', 'b');
    expect(applyReorder(l, 'zzz', 'a')).toBe(l);
  });
  it('unknown toId → same instance', () => {
    const l = mk('a', 'b');
    expect(applyReorder(l, 'a', 'zzz')).toBe(l);
  });
  it('no-op drop before the immediate next sibling → same instance (no phantom state churn)', () => {
    const l = mk('a', 'b', 'c');
    expect(applyReorder(l, 'a', 'b')).toBe(l);
  });
  it('relative order of untouched practices is preserved (incl. archived in the middle)', () => {
    expect(ids(applyReorder(mk('a', 'x', 'b', 'c'), 'c', 'a'))).toEqual(['c', 'a', 'x', 'b']);
  });
});
