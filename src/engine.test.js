import { describe, it, expect } from 'vitest';
import { atPracticeCap, FREE_PRACTICE_CAP } from './engine';
describe('atPracticeCap', () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, custom: true, archived: false }));
  it('premium never capped', () => expect(atPracticeCap(mk(50), true)).toBe(false));
  it('free under cap not capped', () => expect(atPracticeCap(mk(FREE_PRACTICE_CAP - 1), false)).toBe(false));
  it('free at cap is capped', () => expect(atPracticeCap(mk(FREE_PRACTICE_CAP), false)).toBe(true));
  it('seed (non-custom) practices do not count', () => expect(atPracticeCap(mk(0).concat(Array.from({length:20},(_,i)=>({id:'s'+i}))), false)).toBe(false));
});
