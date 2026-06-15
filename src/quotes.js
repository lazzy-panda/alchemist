/* Alchemist — rotating wisdom: Daoist aphorisms (han + RU).
   Stable within a day, fresh across days, so repeated use stays alive. */

export const WISDOM = [
  { han: '大巧若拙', ru: 'высшее мастерство выглядит простым' },
  { han: '上善若水', ru: 'высшая добродетель подобна воде' },
  { han: '千里之行始於足下', ru: 'путь в тысячу ли начинается с одного шага' },
  { han: '知足者富', ru: 'кто знает меру — поистине богат' },
  { han: '柔弱勝剛強', ru: 'мягкое одолевает твёрдое' },
  { han: '無爲而無不爲', ru: 'в недеянии не остаётся несделанного' },
  { han: '靜爲躁君', ru: 'покой — повелитель суеты' },
  { han: '道法自然', ru: 'Путь следует естественности' },
];

export const ASCENSION = [
  { han: '修真之路', ru: 'Туман рассеялся ещё на один пик. Твоя культивация углубилась.' },
  { han: '更上一層樓', ru: 'Ещё один ярус башни позади — и взгляд стал шире.' },
  { han: '靜水流深', ru: 'Тихие воды текут глубоко. Сила копится в покое.' },
  { han: '破繭成蝶', ru: 'Кокон разорван. Дремавшее расправляет крылья.' },
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
