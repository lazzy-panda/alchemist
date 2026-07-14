import { describe, it, expect } from 'vitest';
import { advancePracticeStreak, revertPracticeStreak, rolloverPracticeStreak, streakDigits } from './streaks';

const mk = (o) => ({ id: 'p1', cat: 'qi', today: true, archived: false, done: false, streak: 0, level: 1, streakDay: null, ...o });
const TODAY = 100;

describe('streakDigits (base-9 day/week/month bars)', () => {
  it('empty', () => expect(streakDigits(0)).toEqual({ day: 0, week: 0, month: 0 }));
  it('mid day-bar', () => expect(streakDigits(5)).toEqual({ day: 5, week: 0, month: 0 }));
  it('day-bar full carries to one week (bar resets)', () => expect(streakDigits(9)).toEqual({ day: 0, week: 1, month: 0 }));
  it('one week + one day', () => expect(streakDigits(10)).toEqual({ day: 1, week: 1, month: 0 }));
  it('eight weeks, eight days', () => expect(streakDigits(80)).toEqual({ day: 8, week: 8, month: 0 }));
  it('week-bar full carries to one month', () => expect(streakDigits(81)).toEqual({ day: 0, week: 0, month: 1 }));
  it('one month + one day', () => expect(streakDigits(82)).toEqual({ day: 1, week: 0, month: 1 }));
});

describe('advancePracticeStreak', () => {
  it('fresh completion → 1', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 0, streakDay: null }), TODAY);
    expect(p.streak).toBe(1);
    expect(p.streakDay).toBe(TODAY);
    expect(p.level).toBe(1);
    expect(catLeveled).toBe(false);
  });
  it('counts only once per practice-day', () => {
    const before = mk({ streak: 4, streakDay: TODAY });
    const { p, catLeveled } = advancePracticeStreak(before, TODAY);
    expect(p.streak).toBe(4);
    expect(catLeveled).toBe(false);
  });
  it('completing the 9th day levels the practice up and flags the category', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 8, level: 3, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(9);
    expect(streakDigits(p.streak)).toEqual({ day: 0, week: 1, month: 0 });
    expect(p.level).toBe(4);
    expect(catLeveled).toBe(true);
  });
  it('every 9th day levels up again (18th)', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 17, level: 5, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(18);
    expect(p.level).toBe(6);
    expect(catLeveled).toBe(true);
  });
  it('a non-cycle day does not level up', () => {
    const { p, catLeveled } = advancePracticeStreak(mk({ streak: 9, level: 4, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(10);
    expect(p.level).toBe(4);
    expect(catLeveled).toBe(false);
  });
});

describe('revertPracticeStreak', () => {
  it('un-checking the same day drops one', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 4, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(3);
    expect(p.streakDay).toBe(null);
    expect(catDelta).toBe(0);
  });
  it('does nothing when the advance was on an earlier day', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 4, streakDay: TODAY - 1 }), TODAY);
    expect(p.streak).toBe(4);
    expect(catDelta).toBe(0);
  });
  it('un-checking a same-day day-bar completion reverses the level & category', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 9, level: 4, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(8);
    expect(p.level).toBe(3);
    expect(catDelta).toBe(-1);
  });
  it('reverses across a month boundary too (81 → 80)', () => {
    const { p, catDelta } = revertPracticeStreak(mk({ streak: 81, level: 10, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(80);
    expect(streakDigits(p.streak)).toEqual({ day: 8, week: 8, month: 0 });
    expect(p.level).toBe(9);
    expect(catDelta).toBe(-1);
  });
  it('never drops below streak 0 / level 1', () => {
    const { p } = revertPracticeStreak(mk({ streak: 0, level: 1, streakDay: TODAY }), TODAY);
    expect(p.streak).toBe(0);
    expect(p.level).toBe(1);
  });
});

describe('rolloverPracticeStreak (miss resets everything)', () => {
  it('keeps the count when yesterday was consecutive AND done', () => {
    expect(rolloverPracticeStreak(mk({ streak: 25, done: true }), true).streak).toBe(25);
  });
  it('a missed day wipes days, weeks AND months (→ 0)', () => {
    expect(rolloverPracticeStreak(mk({ streak: 25, done: false }), true).streak).toBe(0);
  });
  it('a multi-day gap wipes everything even if the last day was done', () => {
    expect(rolloverPracticeStreak(mk({ streak: 25, done: true }), false).streak).toBe(0);
  });
  it('freezes archived practices', () => {
    expect(rolloverPracticeStreak(mk({ streak: 25, done: false, archived: true }), true).streak).toBe(25);
  });
  it('freezes practices not on Today', () => {
    expect(rolloverPracticeStreak(mk({ streak: 25, done: false, today: false }), true).streak).toBe(25);
  });
});
