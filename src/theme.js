/* Alchemist — design tokens (ported 1:1 from prototype styles.css :root) */
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';

export const C = {
  // parchment
  paper: '#EFE6CB',
  paperLight: '#F7F0D9',
  paperCell: '#FBF5E2',
  paperWarm: '#EADFBE',
  paperDeep: '#D7C599',

  // ink (warm brown on parchment) — muted/faint darkened to meet WCAG AA (4.5:1)
  ink: '#553A1E',
  inkMuted: '#6E5230',
  inkFaint: '#74592F',

  // wood frame — light honey planks
  wood1: '#DDB375',
  wood2: '#C5944F',
  wood3: '#A2723A',
  woodLine: '#6E4A22',
  woodEdge: '#EDD199',

  // title purple
  title: '#6A4C93',
  titleDeep: '#4F3675',

  // jade (primary / growth)
  jade: '#3E8C60',
  jadeLight: '#6FBF92',
  jadeDeep: '#235C3E',
  jadeLine: '#163E29',

  // gold (reward / important)
  gold: '#E0A93C',
  goldLight: '#F6D685',
  goldDeep: '#B27C24',
  goldLine: '#835815',

  // cinnabar (cost / danger)
  red: '#D9543B',
  redDeep: '#A8341F',
  redLine: '#6E1D0F',

  // stone (RPG kit frames) — replaces wood framing
  stoneLight: '#C9C4B6',
  stoneMid: '#A29C8C',
  stoneDark: '#6E6A5B',
  stoneLine: '#46433A',
  stoneEdge: '#DCD7C8',

  // blue accent (kit info / secondary pills)
  blue: '#3F92C8',
  blueLight: '#6FBDE8',
  blueDark: '#2A6F9E',
  blueLine: '#1C5478',

  // kit candy palette (extracted from RPG kit) — single source for pill colours
  kitGreen: '#8FCB63',
  kitGreenMid: '#4E9B3A',
  kitGreenLine: '#2E6B22',
  kitGold: '#F6C752',
  kitGoldMid: '#E0902A',
  kitGoldLine: '#9A6212',
  kitBlue: '#6FBDE8',
  kitBlueMid: '#2F86C0',
  kitBlueLine: '#1C5478',
  kitRed: '#EC7257',
  kitRedMid: '#C23725',
  kitRedLine: '#7C1E10',
  kitStone: '#CFCABC',
  kitStoneMid: '#A29C8C',
  kitStoneLine: '#46433A',
  kitGoldText: '#4a3410', // AA-passing dark text on gold pills

  // characteristic semantics (CSS --c-*)
  cEnergy: '#34A18C',
  cStrength: '#C66A38',
  cFlex: '#7CB13F',
  cFocus: '#4574B5',
  cKind: '#D078A6',
  cSex: '#9559B8',

  white: '#FFFFFF',
};

export const R = {
  card: 20,
  btn: 16,
  modal: 26,
  seal: 9,
};

export const FONT = {
  display: 'Fredoka',
  ui: 'Manrope',
  // CJK serif: a real web font on web; system CJK fallback on native
  han: WEB ? 'Noto Serif SC' : undefined,
};

// box-shadow strings (RN 0.85 + react-native-web both support boxShadow)
export const DROP = {
  sm: '0px 3px 8px rgba(80,52,18,0.18)',
  md: '0px 6px 16px rgba(80,52,18,0.22)',
  lg: '0px 14px 34px rgba(60,38,12,0.32)',
};

// cubic-bezier easings (CSS strings — used by web animationTimingFunction)
export const EASE = {
  out: 'cubic-bezier(.22,.61,.36,1)',
  soft: 'cubic-bezier(.4,0,.2,1)',
  overshoot: 'cubic-bezier(.2,.8,.2,1)',
};

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// lighten/darken a hex color by pct (-100..100) — ported from prototype shade()
export function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  const f = pct / 100;
  r = Math.round(Math.max(0, Math.min(255, r + 255 * f)));
  g = Math.round(Math.max(0, Math.min(255, g + 255 * f)));
  b = Math.round(Math.max(0, Math.min(255, b + 255 * f)));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
