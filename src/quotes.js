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

/* приветствие на «Сегодня» — четыре безмерных (любовь, сострадание, сорадование,
   равностность); меняется раз в сутки, как и WISDOM */
export const BLESSINGS = [
  'Да обретёшь ты счастье и причины для счастья!',
  'Да избавишься ты от страданий и от причин страданий',
  'Пусть твоя радость и благополучие длятся вечно',
  'Пусть ты никогда не потеряешь то хорошее, что у тебя есть',
  'Пребывай в равностности, свободной от предвзятости, привязанности и гнева!',
];

export const ASCENSION = [
  'Туман расступается над новой вершиной. Твоё совершенствование углубляется.',
  'Ещё один ярус башни позади — и шире становится вид.',
  'Тихие воды глубоки. Сила собирается в покое.',
  'Кокон раскрывается. То, что дремало, расправляет крылья.',
];

export function dailyBlessing() {
  let day = 0;
  try { day = Math.floor(Date.now() / 86400000); } catch (e) {}
  return BLESSINGS[((day % BLESSINGS.length) + BLESSINGS.length) % BLESSINGS.length];
}

export function dailyWisdom() {
  let day = 0;
  try { day = Math.floor(Date.now() / 86400000); } catch (e) {}
  return WISDOM[((day % WISDOM.length) + WISDOM.length) % WISDOM.length];
}

export function ascension(stage) {
  const n = ASCENSION.length;
  return ASCENSION[(((stage || 0) % n) + n) % n];
}
