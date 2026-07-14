/* Alchemist — nested per-practice streak logic (pure, unit-tested; mirrors the dragMath split).

   A practice's streak is a single count of consecutive days done (`p.streak`). It is shown as four
   9-square bars framing the icon: days (bottom), weeks (left), months (top), years (right). The bars
   are just the base-9 digits of that count — day = total%9, week = ⌊total/9⌋%9, month = ⌊total/81⌋%9,
   year = ⌊total/729⌋%9 — so a full day-bar (9 days) carries into a week square, a full week-bar
   (9 weeks) into a month square, a full month-bar (9 months = 729 days) into a year square.
   Completing a full day-bar (every 9th day) levels the practice + its category up and bursts.
   A missed day / gap resets the whole count to 0 → all four bars clear at once (see rollover). */

export const STREAK_CYCLE = 9; // squares per bar; a full bar carries into the next tier

// filled squares per bar (day / week / month / year) from the total consecutive-day count
export function streakDigits(total) {
  const t = Math.max(0, total || 0);
  const C = STREAK_CYCLE;
  return { day: t % C, week: Math.floor(t / C) % C, month: Math.floor(t / (C * C)) % C, year: Math.floor(t / (C * C * C)) % C };
}

// A practice was marked done. Advance the streak once per day; every 9th day completes a day-bar
// and levels the practice + category up. Returns { p, catLeveled }.
export function advancePracticeStreak(p, today) {
  if (p.streakDay === today) return { p, catLeveled: false }; // already counted this day
  const total = (p.streak || 0) + 1;
  const catLeveled = total % STREAK_CYCLE === 0; // a full day-bar (9 days) → practice + category level up
  return { p: { ...p, streak: total, level: (p.level || 1) + (catLeveled ? 1 : 0), streakDay: today }, catLeveled };
}

// A practice was un-checked. Reverse the same-day advance (symmetric to the stat-xp reversal in
// setDone). Returns { p, catDelta } — catDelta -1 undoes a category level-up.
export function revertPracticeStreak(p, today) {
  if (p.streakDay !== today) return { p, catDelta: 0 }; // the advance being undone wasn't from today
  const total = p.streak || 0;
  const wasLevelUp = total > 0 && total % STREAK_CYCLE === 0; // today's advance completed a day-bar
  return {
    p: { ...p, streak: Math.max(0, total - 1), level: wasLevelUp ? Math.max(1, (p.level || 1) - 1) : (p.level || 1), streakDay: null },
    catDelta: wasLevelUp ? -1 : 0,
  };
}

// Daily rollover (03:00): keep the count only if the just-ended day was consecutive AND the practice
// was done; otherwise the streak is broken → reset to 0, which clears days, weeks AND months at once.
// Archived / non-Today practices are frozen. `consecutive` = (currentDay - previousDay === 1).
export function rolloverPracticeStreak(p, consecutive) {
  if (!(p.today && !p.archived)) return p;
  const keep = consecutive && !!p.done;
  return { ...p, streak: keep ? (p.streak || 0) : 0 };
}
