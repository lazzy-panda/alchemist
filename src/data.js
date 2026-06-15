/* Alchemist — game data & constants (English; RPGUI icon names per category/stat). */

// ---- characteristics ----  (icon = RPGUI icon class; short = radar axis label)
// colors lightened so they read as text on the dark RPGUI frames (WCAG AA)
export const STATS = [
  { key: 'energy', icon: 'potion-blue', short: 'EN', name: 'Energy', color: '#5BC2AD' },
  { key: 'strength', icon: 'sword', short: 'ST', name: 'Strength', color: '#E0905C' },
  { key: 'flex', icon: 'shoes-slot', short: 'FL', name: 'Flexibility', color: '#A6D173' },
  { key: 'focus', icon: 'magic-slot', short: 'FO', name: 'Focus', color: '#7AA6E0' },
  { key: 'kind', icon: 'potion-green', short: 'KI', name: 'Kindness', color: '#E2A0C6' },
  { key: 'sex', icon: 'ring-slot', short: 'VI', name: 'Vitality', color: '#BC8AD8' },
];
export const STAT = Object.fromEntries(STATS.map((s) => [s.key, s]));

// ---- categories ----
export const CATS = {
  med: { name: 'Meditation', icon: 'magic-slot', color: '#7AA6E0' },
  qi: { name: 'Qigong', icon: 'potion-blue', color: '#5BC2AD' },
  zhan: { name: 'Standing', icon: 'shoes-slot', color: '#A6D173' },
  body: { name: 'Body', icon: 'armor-slot', color: '#E0905C' },
  know: { name: 'Knowledge', icon: 'helmet-slot', color: '#BC8AD8' },
  heart: { name: 'Heart', icon: 'potion-red', color: '#E2A0C6' },
};

// ---- practices ----
// r: stat rewards {key:+n}; qi: Qi change (negative = cost); mult: multiplier
let _id = 0;
const P = (o) => ({ id: 'p' + ++_id, ...o });
export const PRACTICES = [
  P({ name: 'Shower self-massage', cat: 'body', dur: 5, r: { strength: 2, energy: 1 }, qi: 2, today: true, done: true }),
  P({ name: 'Joint mobility', cat: 'body', dur: 10, r: { flex: 3 }, qi: 1 }),
  P({ name: 'Taoist meditation', cat: 'med', dur: 20, r: { focus: 3, energy: 2 }, qi: 4, today: true }),
  P({ name: 'Six Healing Sounds', cat: 'qi', dur: 12, r: { energy: 2, kind: 2 }, qi: 3, today: true }),
  P({ name: 'Qigong', cat: 'qi', dur: 15, r: { energy: 3, flex: 1 }, qi: 3, today: true }),
  P({ name: 'Self-massage', cat: 'body', dur: 8, r: { strength: 2, energy: 1 }, qi: 1, today: true }),
  P({ name: 'Tea ritual', cat: 'heart', dur: 10, r: { kind: 1 }, qi: 1 }),
  P({ name: 'Mingmen breathing x16', cat: 'qi', dur: 5, r: { energy: 2, sex: 2 }, qi: 3, today: true, done: true }),
  P({ name: 'Cool breeze', cat: 'qi', dur: 7, r: { energy: 2 }, qi: 2 }),
  P({ name: 'Strong wind', cat: 'qi', dur: 10, r: { strength: 3, energy: 1 }, qi: -4 }),
  P({ name: 'Study the teachings', cat: 'know', dur: 30, r: { focus: 2, kind: 3 }, qi: 2 }),
  P({ name: 'Tai Chi', cat: 'zhan', dur: 25, r: { flex: 3, focus: 2 }, qi: 3, mult: 1.5 }),
  P({ name: 'Shamatha', cat: 'med', dur: 25, r: { focus: 4 }, qi: 4 }),
  P({ name: 'Four Immeasurables', cat: 'heart', dur: 20, r: { kind: 4 }, qi: 3 }),
  P({ name: 'Stretching', cat: 'body', dur: 12, r: { flex: 3 }, qi: 1 }),
  P({ name: 'Reading', cat: 'know', dur: 20, r: { focus: 2, kind: 1 }, qi: 2 }),
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
  { icon: 'potion-blue', name: 'Qi Flow', color: '#3E9C8A', open: true },
  { icon: 'magic-slot', name: 'Clear Mind', color: '#4A6FA5', open: true },
  { icon: 'shoes-slot', name: 'Supple Body', color: '#7BA84E', open: true },
  { icon: 'armor-slot', name: 'Iron Shirt', color: '#C06B3E', open: false, req: 'Strength 6' },
  { icon: 'potion-red', name: 'Open Heart', color: '#C77BA0', open: false, req: 'Kindness 8' },
  { icon: 'ring-slot', name: 'Inner Elixir', color: '#8E5AA8', open: false, req: 'Stage 12' },
];

// ---- relics ----
export const RELICS = [
  { icon: '🪷', got: true, name: 'Lotus of Calm' },
  { icon: '🫖', got: true, name: 'Dawn Bowl' },
  { icon: '🪈', got: false },
  { icon: '🐉', got: false },
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
    name: 'The Ten',
    icon: 'exclamation',
    color: '#3E8C60',
    vows: [
      { t: 'Protect life', q: 'Did you protect life today, even in a small way — helped someone tired, removed a hazard?' },
      { t: 'Others property', q: "Did you respect others' property and peace — took nothing extra, left things in order?" },
      { t: 'Purity', q: 'Did you keep healthy, honest conduct in relationships — without obsession or harm to others?' },
      { t: 'Truthfulness', q: 'Were you truthful all day? Staying silent beats wounding with words.' },
      { t: 'Uniting speech', q: 'Did your words bring people together rather than sow discord?' },
      { t: 'Gentle speech', q: 'Did you speak gently and thoughtfully, without harshness?' },
      { t: 'Meaningful speech', q: 'Did you speak with purpose — what matters to the listener, not idle chatter?' },
      { t: 'Rejoicing', q: "Did you rejoice in others' success, without envy?" },
      { t: 'Compassion', q: 'Did you feel for those in trouble, instead of quietly enjoying their problems?' },
      { t: 'Right view', q: 'Did you remember: all good comes from caring for others, all harm from self-concern?' },
    ],
  },
  refuge: {
    name: 'Refuge',
    icon: 'shield',
    color: '#B27C24',
    vows: [
      { t: 'Refuge in Buddha', q: 'Did you avoid seeking refuge in worldly objects and gods?' },
      { t: 'Refuge in Dharma', q: 'Did you avoid harming living beings?' },
      { t: 'Refuge in Sangha', q: 'Did you avoid close ties with those who reject the Path?' },
      { t: 'Honor the image', q: 'Did you honor an image of the Buddha as the Buddha himself?' },
      { t: 'Honor the text', q: 'Did you honor the written word, even one letter, as the Dharma?' },
      { t: 'Honor the Sangha', q: 'Did you honor even a thread of the saffron robe as the Sangha?' },
      { t: 'Recall the qualities', q: 'Did you take refuge again, recalling the qualities of the Three Jewels?' },
      { t: 'First of the meal', q: 'Did you offer the first of food and drink to the objects of refuge?' },
      { t: 'Encourage others', q: 'Did you encourage others to take refuge?' },
      { t: 'Three times a day', q: 'Did you take refuge three times by day and three by night?' },
      { t: 'Rely fully', q: 'Did you rely fully on the objects of refuge in your affairs?' },
      { t: 'Never forsake', q: 'Did you avoid forsaking the Three Jewels, even in thought?' },
    ],
  },
  freedom: {
    name: 'Freedom',
    icon: 'ring-slot',
    color: '#4574B5',
    vows: [
      { t: 'No killing', q: 'Did you refrain from killing?' },
      { t: 'No stealing', q: 'Did you refrain from stealing?' },
      { t: 'Pure conduct', q: 'Did you refrain from wrong sexual conduct?' },
      { t: 'No lying', q: 'Did you refrain from lying?' },
      { t: 'No dividing', q: 'Did you refrain from divisive speech?' },
      { t: 'No harshness', q: 'Did you refrain from harsh speech?' },
      { t: 'No idle talk', q: 'Did you refrain from useless speech?' },
      { t: 'No coveting', q: "Did you refrain from craving others' things?" },
      { t: 'No ill will', q: 'Did you refrain from ill will?' },
      { t: 'Right worldview', q: 'Did you refrain from a wrong view of the world?' },
    ],
  },
  worldly: {
    name: 'Worldly',
    icon: 'potion-red',
    color: '#C66A38',
    vows: [
      { t: 'Human life', q: 'Did you avoid killing a human or unborn child?' },
      { t: 'Valuables', q: 'Did you avoid stealing anything of value?' },
      { t: 'Attainments', q: 'Did you avoid lying about spiritual attainments?' },
      { t: 'Conduct', q: 'Did you avoid wrong sexual conduct?' },
      { t: 'Sobriety', q: 'Did you avoid alcohol and intoxicants?' },
    ],
  },
};
