/* Alchemist — per-practice streak logic (pure, so vitest can pin it; mirrors the dragMath /
   applyReorder split). Each practice carries `streak` (0..6 pips filled), `level` (starts 1) and
   `streakDay` (the practiceDay index its streak last advanced — the once-per-day guard). Completing
   a practice fills a pip; the 7th fills level the practice up, bumps its category, and resets the
   row. A missed day (or a multi-day gap) resets the streak — see rolloverPracticeStreak. */

// A practice was just marked done. Advance its streak once per day; the 7th step levels it up.
// Returns { p, catLeveled } — catLeveled true means the caller should bump the category's level.
export function advancePracticeStreak(p, today) {
  if (p.streakDay === today) return { p, catLeveled: false }; // already counted this day
  const next = (p.streak || 0) + 1;
  if (next >= 7) {
    return { p: { ...p, streak: 0, level: (p.level || 1) + 1, streakDay: today }, catLeveled: true };
  }
  return { p: { ...p, streak: next, streakDay: today }, catLeveled: false };
}

// A practice was un-checked. Reverse the same-day advance (symmetric to the stat-xp reversal in
// setDone). Returns { p, catDelta } — catDelta -1 means undo a category level-up. streakDay is
// cleared so re-checking the same day counts again.
export function revertPracticeStreak(p, today) {
  if (p.streakDay !== today) return { p, catDelta: 0 }; // the advance being undone wasn't from today
  if ((p.streak || 0) === 0) {
    // streak 0 with streakDay === today can only mean today's advance wrapped 7 → 0 (a level-up)
    return { p: { ...p, streak: 6, level: Math.max(1, (p.level || 1) - 1), streakDay: null }, catDelta: -1 };
  }
  return { p: { ...p, streak: (p.streak || 0) - 1, streakDay: null }, catDelta: 0 };
}

// Daily rollover (03:00): keep the streak only if the just-ended day was consecutive AND the
// practice was done; otherwise it's broken → reset to 0. Archived / non-Today practices are frozen.
// `consecutive` = (currentDay - previousDay === 1), so multi-day gaps also reset (mirrors the
// global streak). The caller clears the `done` flag separately.
export function rolloverPracticeStreak(p, consecutive) {
  if (!(p.today && !p.archived)) return p;
  const keep = consecutive && !!p.done;
  return { ...p, streak: keep ? (p.streak || 0) : 0 };
}
