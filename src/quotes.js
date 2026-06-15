/* Alchemist — rotating wisdom (English). Stable within a day, fresh across days. */

export const WISDOM = [
  'Great skill looks simple',
  'The highest good is like water',
  'A journey of a thousand miles begins with one step',
  'One who knows enough is rich',
  'The soft overcomes the hard',
  'In non-doing, nothing is left undone',
  'Stillness rules over haste',
  'The Way follows nature',
];

export const ASCENSION = [
  'The mist parts over one more peak. Your cultivation deepens.',
  'One more floor of the tower behind you — the view widens.',
  'Still waters run deep. Power gathers in calm.',
  'The cocoon splits. What slept now spreads its wings.',
];

export function dailyWisdom() {
  let day = 0;
  try { day = Math.floor(Date.now() / 86400000); } catch (e) {}
  return WISDOM[((day % WISDOM.length) + WISDOM.length) % WISDOM.length];
}

export function ascension(stage) {
  const n = ASCENSION.length;
  return ASCENSION[(((stage || 0) % n) + n) % n];
}
