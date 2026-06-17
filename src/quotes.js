/* Alchemist — rotating wisdom (English). Stable within a day, fresh across days. */

export const WISDOM = [
  'Великое мастерство выглядит простым',
  'Высшее благо подобно воде',
  'Путь в тысячу ли начинается с одного шага',
  'Богат тот, кому достаточно',
  'Мягкое одолевает твёрдое',
  'В недеянии не остаётся несделанного',
  'Покой повелевает суетой',
  'Путь следует природе',
];

export const ASCENSION = [
  'Туман расступается над новой вершиной. Твоё совершенствование углубляется.',
  'Ещё один ярус башни позади — и шире становится вид.',
  'Тихие воды глубоки. Сила собирается в покое.',
  'Кокон раскрывается. То, что дремало, расправляет крылья.',
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
