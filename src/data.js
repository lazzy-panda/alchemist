/* Alchemist — game data & constants (Russian UI; RPGUI icon names per category/stat). */

// ---- characteristics ----  (icon = RPGUI icon class; short = reward-chip label)
// colors lightened so they read as text on the dark RPGUI frames (WCAG AA)
export const STATS = [
  { key: 'energy', icon: 'zap', short: 'ЭН', name: 'Энергия', color: '#5BC2AD' },
  { key: 'strength', icon: 'shield', short: 'СЛ', name: 'Сила', color: '#E0905C' },
  { key: 'flex', icon: 'move', short: 'ГБ', name: 'Гибкость', color: '#A6D173' },
  { key: 'focus', icon: 'bullseye', short: 'ФК', name: 'Фокус', color: '#7AA6E0' },
  { key: 'kind', icon: 'mood-happy', short: 'ДБ', name: 'Доброта', color: '#E2A0C6' },
  { key: 'sex', icon: 'drop-full', short: 'ЖЗ', name: 'Жизненность', color: '#BC8AD8' },
];
export const STAT = Object.fromEntries(STATS.map((s) => [s.key, s]));

// ---- categories ----
export const CATS = {
  med: { name: 'Медитация', icon: 'moon-stars', color: '#7AA6E0' },
  qi: { name: 'Цигун', icon: 'wind', color: '#5BC2AD' },
  zhan: { name: 'Стояние', icon: 'human-handsup', color: '#A6D173' },
  body: { name: 'Тело', icon: 'human-run', color: '#E0905C' },
  know: { name: 'Знание', icon: 'book', color: '#BC8AD8' },
  heart: { name: 'Сердце', icon: 'heart', color: '#E2A0C6' },
};

// ---- practices ----
// r: stat rewards {key:+n}; qi: Qi change (negative = cost); mult: multiplier
let _id = 0;
const P = (o) => ({ id: 'p' + ++_id, ...o });
export const PRACTICES = [
  P({ name: 'Самомассаж в душе', cat: 'body', dur: 5, r: { strength: 2, energy: 1 }, qi: 2, today: true }),
  P({ name: 'Суставная гимнастика', cat: 'body', dur: 10, r: { flex: 3 }, qi: 1 }),
  P({ name: 'Даосская медитация', cat: 'med', dur: 20, r: { focus: 3, energy: 2 }, qi: 4, today: true }),
  P({ name: 'Шесть целебных звуков', cat: 'qi', dur: 12, r: { energy: 2, kind: 2 }, qi: 3, today: true }),
  P({ name: 'Цигун', cat: 'qi', dur: 15, r: { energy: 3, flex: 1 }, qi: 3, today: true }),
  P({ name: 'Самомассаж', cat: 'body', dur: 8, r: { strength: 2, energy: 1 }, qi: 1, today: true }),
  P({ name: 'Чайная церемония', cat: 'heart', dur: 10, r: { kind: 1 }, qi: 1 }),
  P({ name: 'Дыхание Минмэнь x16', cat: 'qi', dur: 5, r: { energy: 2, sex: 2 }, qi: 3, today: true }),
  P({ name: 'Прохладный ветер', cat: 'qi', dur: 7, r: { energy: 2 }, qi: 2 }),
  P({ name: 'Сильный ветер', cat: 'qi', dur: 10, r: { strength: 3, energy: 1 }, qi: -4 }),
  P({ name: 'Изучение учения', cat: 'know', dur: 30, r: { focus: 2, kind: 3 }, qi: 2 }),
  P({ name: 'Тай-чи', cat: 'zhan', dur: 25, r: { flex: 3, focus: 2 }, qi: 3, mult: 1.5 }),
  P({ name: 'Шаматха', cat: 'med', dur: 25, r: { focus: 4 }, qi: 4 }),
  P({ name: 'Четыре безмерных', cat: 'heart', dur: 20, r: { kind: 4 }, qi: 3 }),
  P({ name: 'Растяжка', cat: 'body', dur: 12, r: { flex: 3 }, qi: 1 }),
  P({ name: 'Чтение', cat: 'know', dur: 20, r: { focus: 2, kind: 1 }, qi: 2 }),
];

// ---- starting characteristic levels (level, xp toward next) ----
export const STAT_LEVELS = {
  energy: { lvl: 7, xp: 64, next: 100 },
  strength: { lvl: 4, xp: 30, next: 80 },
  flex: { lvl: 5, xp: 52, next: 90 },
  focus: { lvl: 8, xp: 88, next: 110 },
  kind: { lvl: 6, xp: 41, next: 95 },
  sex: { lvl: 3, xp: 22, next: 70 },
};

// ---- perks ----
export const PERKS = [
  { icon: 'wind', name: 'Поток Ци', color: '#3E9C8A', open: true },
  { icon: 'lightbulb', name: 'Ясный ум', color: '#4A6FA5', open: true },
  { icon: 'move', name: 'Гибкое тело', color: '#7BA84E', open: true },
  { icon: 'shield', name: 'Железная рубашка', color: '#C06B3E', open: false, req: 'Сила 6' },
  { icon: 'heart', name: 'Открытое сердце', color: '#C77BA0', open: false, req: 'Доброта 8' },
  { icon: 'drop-full', name: 'Внутренний эликсир', color: '#8E5AA8', open: false, req: 'Стадия 12' },
];

// ---- relics ----
export const RELICS = [
  { icon: 'moon-stars', got: true, name: 'Лотос покоя' },
  { icon: 'tea', got: true, name: 'Чаша рассвета' },
  { icon: 'music', got: false },
  { icon: 'trophy', got: false },
];

// ---- journal: heatmap (28 days, intensity 0..3) ----
export const HEAT = [0, 1, 2, 1, 3, 2, 1, 0, 2, 3, 2, 1, 2, 3, 1, 2, 1, 3, 2, 2, 1, 2, 3, 2, 1, 3, 2, 0];

// ---- growth lines (chart) ----
export const GROWTH = {
  energy: [3, 4, 4, 5, 5, 6, 7],
  focus: [5, 5, 6, 6, 7, 7, 8],
  flex: [3, 3, 4, 4, 5, 5, 5],
};

// ---- SIX-TIMES-A-DAY ETHICAL DIARY (Geshe Michael Roach) ----
export const DIARY_TIMES = ['08:00', '10:30', '12:00', '15:00', '17:00', '19:00'];
export const DIARY_SETS = {
  ten: {
    name: 'Десять',
    icon: 'checklist',
    color: '#3E8C60',
    vows: [
      { t: 'Защита жизни', q: 'Защитили ли вы сегодня жизнь, пусть в малом — помогли уставшему, убрали опасность?' },
      { t: 'Чужое имущество', q: 'Уважали ли вы чужое имущество и покой — не взяли лишнего, оставили вещи в порядке?' },
      { t: 'Чистота', q: 'Сохранили ли вы здоровое, честное поведение в отношениях — без одержимости и вреда другим?' },
      { t: 'Правдивость', q: 'Были ли вы правдивы весь день? Промолчать лучше, чем ранить словом.' },
      { t: 'Объединяющая речь', q: 'Сближали ли ваши слова людей, а не сеяли раздор?' },
      { t: 'Мягкая речь', q: 'Говорили ли вы мягко и обдуманно, без резкости?' },
      { t: 'Осмысленная речь', q: 'Говорили ли вы по делу — о важном для слушателя, а не пустую болтовню?' },
      { t: 'Сорадование', q: 'Радовались ли вы успехам других без зависти?' },
      { t: 'Сострадание', q: 'Сочувствовали ли вы тем, кто в беде, вместо тихого злорадства?' },
      { t: 'Верное воззрение', q: 'Помнили ли вы: всё благое — от заботы о других, весь вред — от заботы лишь о себе?' },
    ],
  },
  refuge: {
    name: 'Прибежище',
    icon: 'shield',
    color: '#B27C24',
    vows: [
      { t: 'Прибежище в Будде', q: 'Избегали ли вы искать прибежища в мирских вещах и богах?' },
      { t: 'Прибежище в Дхарме', q: 'Избегали ли вы вредить живым существам?' },
      { t: 'Прибежище в Сангхе', q: 'Избегали ли вы близких связей с теми, кто отвергает Путь?' },
      { t: 'Почитание образа', q: 'Почитали ли вы образ Будды как самого Будду?' },
      { t: 'Почитание текста', q: 'Почитали ли вы написанное слово, даже одну букву, как Дхарму?' },
      { t: 'Почитание Сангхи', q: 'Почитали ли вы даже нить шафрановой рясы как Сангху?' },
      { t: 'Памятование качеств', q: 'Принимали ли вы прибежище вновь, вспоминая качества Трёх Драгоценностей?' },
      { t: 'Первое от трапезы', q: 'Подносили ли вы первое от еды и питья объектам прибежища?' },
      { t: 'Побуждение других', q: 'Побуждали ли вы других принять прибежище?' },
      { t: 'Трижды в день', q: 'Принимали ли вы прибежище трижды днём и трижды ночью?' },
      { t: 'Полная опора', q: 'Полностью ли вы опирались на объекты прибежища в своих делах?' },
      { t: 'Не отречься', q: 'Избегали ли вы отречься от Трёх Драгоценностей, даже в мыслях?' },
    ],
  },
  freedom: {
    name: 'Свобода',
    icon: 'lock-open',
    color: '#4574B5',
    vows: [
      { t: 'Не убивать', q: 'Воздержались ли вы от убийства?' },
      { t: 'Не красть', q: 'Воздержались ли вы от воровства?' },
      { t: 'Чистое поведение', q: 'Воздержались ли вы от неверного полового поведения?' },
      { t: 'Не лгать', q: 'Воздержались ли вы от лжи?' },
      { t: 'Не разделять', q: 'Воздержались ли вы от речей, сеющих раздор?' },
      { t: 'Без грубости', q: 'Воздержались ли вы от грубой речи?' },
      { t: 'Без пустословия', q: 'Воздержались ли вы от пустой болтовни?' },
      { t: 'Без алчности', q: 'Воздержались ли вы от жажды чужого?' },
      { t: 'Без злобы', q: 'Воздержались ли вы от недоброжелательства?' },
      { t: 'Верный взгляд', q: 'Воздержались ли вы от ложного взгляда на мир?' },
    ],
  },
  worldly: {
    name: 'Мирские',
    icon: 'home',
    color: '#C66A38',
    vows: [
      { t: 'Жизнь человека', q: 'Избегали ли вы убийства человека или нерождённого ребёнка?' },
      { t: 'Ценности', q: 'Избегали ли вы кражи чего-либо ценного?' },
      { t: 'Достижения', q: 'Избегали ли вы лжи о духовных достижениях?' },
      { t: 'Поведение', q: 'Избегали ли вы неверного полового поведения?' },
      { t: 'Трезвость', q: 'Избегали ли вы алкоголя и одурманивающих веществ?' },
    ],
  },
};
