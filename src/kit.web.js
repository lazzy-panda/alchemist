/* Web kit — RPGUI-skinned components (RonenNess RPGUI).
   Emits real DOM with RPGUI classes via react-native-web's unstable_createElement.
   Mirrors the export surface of kit.js so screens/ui/badges import unchanged. */
import React from 'react';
import { Image } from 'react-native';
import { unstable_createElement } from 'react-native-web';
import { C } from './theme';

// unstable_createElement(type, props, options) — children go in props.children; auto-key arrays.
const h = (type, props, ...kids) => {
  let children;
  if (kids.length === 0) children = undefined;
  else if (kids.length === 1) children = kids[0];
  else children = kids.map((c, i) => (React.isValidElement(c) && c.key == null ? React.cloneElement(c, { key: i }) : c));
  return unstable_createElement(type, { ...(props || {}), children });
};

// Full asset map kept so every KIT.* reference resolves during the RPGUI transition.
// Custom viz (radar/timer) still uses KIT.dial; the rest is superseded by RPGUI CSS.
export const KIT = {
  panel: require('../assets/kit/panel.png'),
  parchment: require('../assets/kit/parchment.png'),
  stone: require('../assets/kit/stone.png'),
  btnGreen: require('../assets/kit/btn_green.png'),
  btnRed: require('../assets/kit/btn_red.png'),
  btnGold: require('../assets/kit/btn_gold.png'),
  btnBlue: require('../assets/kit/btn_blue.png'),
  close: require('../assets/kit/close.png'),
  checkOn: require('../assets/kit/check_on.png'),
  xCircle: require('../assets/kit/x_circle.png'),
  dial: require('../assets/kit/dial.png'),
  stoneTab: require('../assets/kit/stone_tab.png'),
  banner: require('../assets/kit/banner.png'),
  star: require('../assets/kit/star.png'),
  fillGreen: require('../assets/kit/fill_green.png'),
  fillRed: require('../assets/kit/fill_red.png'),
  fillBlue: require('../assets/kit/fill_blue.png'),
  fillGold: require('../assets/kit/fill_gold.png'),
  fillOlive: require('../assets/kit/fill_olive.png'),
  fillPurple: require('../assets/kit/fill_purple.png'),
  fillOrange: require('../assets/kit/fill_orange.png'),
  levelupBanner: require('../assets/kit/levelup_banner.png'),
  orb: require('../assets/kit/orb.png'),
};

// genuine RPGUI checkbox / radio sprites (golden) — used for every checkbox & single-select
const CHECKBOX_ON = require('../assets/rpgui/img/checkbox-golden-on.png');
const CHECKBOX_OFF = require('../assets/rpgui/img/checkbox-golden-off.png');
const RADIO_ON = require('../assets/rpgui/img/radio-golden-on.png');
const RADIO_OFF = require('../assets/rpgui/img/radio-golden-off.png');
const srcUri = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

/* ---- progress color mapping (RPGUI offers red/green/blue, default purple) ---- */
function barColor(color) {
  switch (color) {
    case 'hp': case 'red': case 'strength': return 'red';
    case 'qi': case 'blue': case 'energy': case 'focus': return 'blue';
    case 'xp': case 'green': case 'flex': return 'green';
    default: return ''; // purple default (kind / sex / gold / olive…)
  }
}

// raw <div>s from unstable_createElement default to display:block (RN Views default to flex),
// so flex layouts on them collapse. Give containers an RN-View-like base.
const FLEX_COL = { display: 'flex', flexDirection: 'column' };

/* ---- generic frame (covers NineSlice usage) ---- */
export function NineSlice({ style, children, frame }) {
  const cls = 'rpgui-container ' + (frame === 'grey' ? 'framed-grey' : frame === 'golden' ? 'framed-golden' : 'framed');
  return h('div', { className: cls, style: [FLEX_COL, style] }, children);
}

/* ---- candy button → rpgui-button ---- */
export function KitButton({ variant = 'primary', onPress, children, block, style, textStyle, disabled, accessibilityLabel, nativeID }) {
  // golden end-caps (:before/:after) bleed on small inline buttons → golden only for full-width CTAs
  const golden = (variant === 'primary' || variant === 'gold') && block;
  return h(
    'button',
    {
      id: nativeID,
      className: 'rpgui-button' + (golden ? ' golden' : ''),
      disabled: !!disabled,
      onClick: disabled ? undefined : onPress,
      'aria-label': accessibilityLabel || (typeof children === 'string' ? children : undefined),
      style: [{ margin: 0 }, block ? { width: '100%' } : null, style],
    },
    typeof children === 'string' ? h('p', { style: [{ margin: 0 }, textStyle] }, children) : children
  );
}

/* ---- framed container / panel ---- */
export function KitPanel({ style, children, contentStyle, frame = 'golden', nativeID }) {
  const cls = 'rpgui-container ' + (frame === 'grey' ? 'framed-grey' : frame === 'plain' ? 'framed' : 'framed-golden');
  return h('div', { id: nativeID, className: cls, style: [FLEX_COL, style] }, contentStyle ? h('div', { style: [FLEX_COL, contentStyle] }, children) : children);
}

/* ---- close button ---- */
export function KitClose({ onPress, size = 34, style, nativeID }) {
  return h(
    'button',
    { id: nativeID, className: 'rpgui-button', onClick: onPress, 'aria-label': 'Закрыть', style: [{ margin: 0, minWidth: size + 14, padding: '0 8px' }, style] },
    h('p', { style: { margin: 0 } }, '✕')
  );
}

/* ---- progress bar (exact RPGUI structure: container > track > fill + edges) ---- */
export function KitBar({ pct, color = 'green', height, style, nativeID }) {
  const cc = barColor(color);
  const w = Math.max(0, Math.min(100, pct || 0));
  return h(
    'div',
    { id: nativeID, className: 'rpgui-progress' + (cc ? ' ' + cc : ''), style },
    h('div', { className: 'rpgui-progress-track' }, h('div', { className: 'rpgui-progress-fill' + (cc ? ' ' + cc : ''), style: { left: 0, width: w + '%' } })),
    h('div', { className: 'rpgui-progress-left-edge' }),
    h('div', { className: 'rpgui-progress-right-edge' })
  );
}

/* ---- genuine RPGUI checkbox (golden sprite) ---- */
export function KitCheckbox({ on, size = 28, style, nativeID }) {
  return h('img', {
    id: nativeID,
    src: srcUri(on ? CHECKBOX_ON : CHECKBOX_OFF),
    alt: on ? 'checked' : 'unchecked',
    draggable: false,
    style: [{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'fill', display: 'block' }, style],
  });
}
/* kept for back-compat; KitCheckbox is the native control */
export function KitCheck({ size = 28, style }) {
  return KitCheckbox({ on: true, size, style });
}

/* ---- genuine RPGUI radio (golden sprite) ---- */
export function KitRadio({ on, size = 28, style }) {
  return h('img', {
    src: srcUri(on ? RADIO_ON : RADIO_OFF),
    alt: on ? 'selected' : 'unselected',
    draggable: false,
    style: [{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'fill', display: 'block' }, style],
  });
}

/* ---- genuine RPGUI horizontal rule ---- */
export function KitHr({ golden = true, style }) {
  return h('hr', { className: golden ? 'golden' : '', style: [{ width: '100%' }, style] });
}

/* ---- round dial frame (kept custom for radar / timer) ---- */
export function KitRound({ size = 230, style, children }) {
  return h(
    'div',
    { style: [{ width: size, height: size, alignItems: 'center', justifyContent: 'center', display: 'flex', position: 'relative' }, style] },
    h(Image, { source: KIT.dial, style: { position: 'absolute', width: size, height: size }, resizeMode: 'stretch' }),
    children
  );
}

/* ---- gem / medallion → RPGUI icon ---- */
export function KitGem({ size = 54, icon = 'empty-slot', color, style }) {
  return h('div', {
    className: 'rpgui-icon ' + icon,
    style: [{ width: size, height: size, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', margin: 0 }, style],
  });
}

/* ---- colored pill / chip ---- */
export function KitPill({ color = 'primary', children, style, onPress, accessibilityLabel, selected }) {
  if (onPress) {
    return h(
      'button',
      { className: 'rpgui-button', onClick: onPress, 'aria-label': accessibilityLabel, 'aria-pressed': selected != null ? !!selected : undefined, style: [{ margin: 0 }, style] },
      h('div', { style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 } }, children)
    );
  }
  // non-interactive: bare native text/icon group — RPGUI has no small badge/pill widget,
  // so we drop the box and rely on RPGUI-styled (pixel-outlined) text + rpgui-icon sprites.
  return h('div', { style: [{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }, style] }, children);
}

/* ---- neutral parchment chip → grey framed chip ---- */
export function KitParchPill({ children, style, onPress, accessibilityLabel, selected }) {
  const inner = h('div', { style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5 } }, children);
  if (onPress) {
    return h('button', { className: 'rpgui-button', onClick: onPress, 'aria-label': accessibilityLabel, 'aria-pressed': selected != null ? !!selected : undefined, style: [{ margin: 0 }, style] }, inner);
  }
  return h('div', { style: [{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }, style] }, inner);
}

/* ---- level-up banner → golden framed ribbon ---- */
export function KitBanner({ width = 300, style }) {
  return h('div', { className: 'rpgui-container framed-golden', style: [FLEX_COL, { width, padding: '6px 12px', alignItems: 'center' }, style] }, h('p', { style: { margin: 0, color: '#ffe9a8' } }, 'НОВЫЙ УРОВЕНЬ!'));
}
