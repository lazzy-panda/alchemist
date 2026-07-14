import { describe, it, expect } from 'vitest';
import { advancePracticeStreak, revertPracticeStreak, rolloverPracticeStreak } from './streaks';

const mk = (o) => ({ id: 'p1', cat: 'qi', today: true, archived: false, done: false, streak: 0, level: 1, streakDay: null, ...o });
const TODAY = 100;

describe('advancePracticeStreak', () => {
  it('fresh completion fills the first pip', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 0, streakDay: null }), TODAY);
    expect(p.streak).toBe(1);
    expect(p.streakDay).toBe(TODAY);
    expect(p.level).toBe(1);
    expect(catLeveled).toBe(false);
  });
  it('advances mid-streak', () => {
    const { p } = advancePracticeStreak(mk({ streak: 3, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(4);
    expect(p.streakDay).toBe(TODAY);
  });
  it('counts only once per practice-day', () => {
    const before = mk({ streak: 4, streakDay: TODAY });
    const { p, catLeveled } = advancePracticeStreak(before, TODAY);
    expect(p.streak).toBe(4);
    expect(catLeveled).toBe(false);
  });
  it('reaching 7 levels the practice up, flags the category, resets the streak', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 6, level: 4, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(0);
    expect(p.level).toBe(5);
    expect(p.streakDay).toBe(TODAY);
    expect(catLeveled).toBe(true);
  });
  it('defaults a missing level to 1 (so a wrap makes it 2)', () => {
    const { p } = advancePracticeStreak({ id: 'x', cat: 'med', streak: 6, streakDay: TODAY - 1 }, TODAY);
    expect(p.level).toBe(2);
  });
});

describe('revertPracticeStreak', () => {
  it('un-checking the same day drops one pip', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 4, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(3);
    expect(p.streakDay).toBe(null);
    expect(catDelta).toBe(0);
  });
  it('does nothing when the advance was on an earlier day', () => {
    const before = mk({ streak: 4, streakDay: TODAY - 1 });
    const { p, catDelta } = revertPracticeStreak(before, TODAY);
    expect(p.streak).toBe(4);
    expect(catDelta).toBe(0);
  });
  it('un-checking a same-day level-up reverses the level and category', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 0, level: 5, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(6);
    expect(p.level).toBe(4);
    expect(p.streakDay).toBe(null);
    expect(catDelta).toBe(-1);
  });
  it('never drops the practice level below 1', () => {
    const { p } = revertPracticeStreak(mk({ streak: 0, level: 1, streakDay: TODAY }), TODAY);
    expect(p.level).toBe(1);
  });
});

describe('rolloverPracticeStreak', () => {
  it('keeps the streak when yesterday was consecutive AND done', () => {
    expect(rolloverPracticeStreak(mk({ streak: 3, done: true }), true).streak).toBe(3);
  });
  it('resets when the practice was missed (not done)', () => {
    expect(rolloverPracticeStreak(mk({ streak: 3, done: false }), true).streak).toBe(0);
  });
  it('resets on a multi-day gap even if the last active day was done', () => {
    expect(rolloverPracticeStreak(mk({ streak: 3, done: true }), false).streak).toBe(0);
  });
  it('freezes archived practices (untouched)', () => {
    const before = mk({ streak: 5, done: false, archived: true });
    expect(rolloverPracticeStreak(before, true).streak).toBe(5);
  });
  it('freezes practices not on Today (untouched)', () => {
    const before = mk({ streak: 5, done: false, today: false });
    expect(rolloverPracticeStreak(before, true).streak).toBe(5);
  });
});
