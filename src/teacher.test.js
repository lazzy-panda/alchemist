// src/teacher.test.js
import { describe, it, expect } from 'vitest';
import { todayCounts } from './engine';
import { revshareEstimateRub, weekPctLabel } from './teacher';

describe('todayCounts', () => {
  const P = (o) => ({ today: true, archived: false, done: false, ...o });
  it('counts today, non-archived done/total', () => {
    const c = todayCounts([P({ done: true }), P({ done: false }), P({ today: false, done: true }), P({ archived: true, done: true })]);
    expect(c).toEqual({ done: 1, total: 2 });
  });
  it('empty list is 0/0', () => expect(todayCounts([])).toEqual({ done: 0, total: 0 }));
});

describe('revshareEstimateRub', () => {
  it('0 paying = 0', () => expect(revshareEstimateRub(0)).toBe(0));
  // 250 Stars/mo ≈ 250₽; net after ~30% Telegram fee × 40% share, rounded
  it('scales with paying count', () => {
    const one = revshareEstimateRub(1);
    expect(one).toBeGreaterThan(0);
    expect(revshareEstimateRub(4)).toBe(one * 4);
  });
});

describe('weekPctLabel', () => {
  it('formats a 0..1 ratio as a percent string', () => {
    expect(weekPctLabel(0.5)).toBe('50%');
    expect(weekPctLabel(0)).toBe('0%');
    expect(weekPctLabel(1)).toBe('100%');
  });
});
