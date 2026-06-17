/* Alchemist — real RPG-kit assets (extracted from /Design) wired in as 9-slice images.
   Web: CSS border-image (true 9-slice, resolution-independent).
   Native: ImageBackground with capInsets fallback. */
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Image, ImageBackground, Platform } from 'react-native';
import { FONT } from './theme';

const WEB = Platform.OS === 'web';
const ts = (color, x, y, radius = 0) => ({ textShadowColor: color, textShadowOffset: { width: x, height: y }, textShadowRadius: radius });

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

function hexHue(hex) {
  try {
    const n = parseInt(hex.slice(1), 16);
    let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return h;
  } catch (e) { return 0; }
}
const ORB_BASE_HUE = 212; // hue of the kit blue gem center
const FILLS = {
  // resources
  hp: KIT.fillRed, qi: KIT.fillBlue, xp: KIT.fillGreen,
  // plain colors
  red: KIT.fillRed, green: KIT.fillGreen, blue: KIT.fillBlue, gold: KIT.fillGold, olive: KIT.fillOlive, purple: KIT.fillPurple, orange: KIT.fillOrange,
  // stat keys (Character)
  energy: KIT.fillBlue, strength: KIT.fillOrange, flex: KIT.fillOlive, focus: KIT.fillBlue, kind: KIT.fillPurple, sex: KIT.fillPurple,
};

function uriOf(source) {
  if (!source) return null;
  if (typeof source === 'string') return source;
  if (source.uri) return source.uri; // Metro web returns {uri,width,height}
  if (Image.resolveAssetSource) {
    try {
      const r = Image.resolveAssetSource(source);
      return r && r.uri ? r.uri : null;
    } catch (e) {}
  }
  return null;
}
function norm(v, d = 0) {
  if (v == null) return { top: d, right: d, bottom: d, left: d };
  if (typeof v === 'number') return { top: v, right: v, bottom: v, left: v };
  return { top: v.top ?? d, right: v.right ?? d, bottom: v.bottom ?? d, left: v.left ?? d };
}

/* ---------- 9-slice from a kit asset ---------- */
export function NineSlice({ source, slice = 12, border, style, children, webFilter, ...rest }) {
  const ref = useRef(null);
  const uri = useMemo(() => uriOf(source), [source]);
  const b = norm(border, typeof slice === 'number' ? slice : 12);
  const sliceArr = Array.isArray(slice) ? slice : [slice, slice, slice, slice]; // t r b l

  useEffect(() => {
    if (!WEB || !ref.current || !uri) return;
    const el = ref.current;
    el.style.borderStyle = 'solid';
    el.style.borderColor = 'transparent';
    el.style.borderImageSource = `url("${uri}")`;
    el.style.borderImageSlice = `${sliceArr.join(' ')} fill`;
    el.style.borderImageRepeat = 'stretch';
    el.style.borderImageWidth = `${b.top}px ${b.right}px ${b.bottom}px ${b.left}px`;
    el.style.filter = webFilter || '';
  }, [uri, sliceArr.join(','), b.top, b.right, b.bottom, b.left, webFilter]);

  const borderStyle = {
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderTopWidth: b.top,
    borderRightWidth: b.right,
    borderBottomWidth: b.bottom,
    borderLeftWidth: b.left,
  };

  if (!WEB) {
    return (
      <ImageBackground source={source} resizeMode="stretch" capInsets={{ top: sliceArr[0], right: sliceArr[1], bottom: sliceArr[2], left: sliceArr[3] }} style={style} {...rest}>
        {children}
      </ImageBackground>
    );
  }
  return (
    <View ref={ref} style={[borderStyle, style]} {...rest}>
      {children}
    </View>
  );
}

/* ---------- candy button (real kit pill, 9-slice horizontally) ---------- */
const BTN_ASSET = { primary: KIT.btnGreen, gold: KIT.btnGold, blue: KIT.btnBlue, danger: KIT.btnRed };
// web-only brightness trim so the white label clears WCAG AA (4.5:1) on the bright green/blue kit pills
const BTN_FILTER = { primary: 'brightness(0.85) saturate(1.06)', blue: 'brightness(0.9) saturate(1.04)' };

export function KitButton({ variant = 'primary', onPress, children, block, style, textStyle, disabled, accessibilityLabel }) {
  const asset = BTN_ASSET[variant] || KIT.btnGreen;
  const txtColor = variant === 'gold' ? '#4a3410' : '#fff'; // dark text on gold for WCAG AA
  const shadow = variant === 'gold' ? ts('rgba(255,255,255,0.45)', 0, 1) : ts('rgba(0,0,0,0.3)', 0, 1);
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: !!disabled }}
      style={[block && { width: '100%' }, disabled && { opacity: 0.5 }, style]}
    >
      {({ pressed }) => (
        <NineSlice
          source={asset}
          slice={[7, 22, 9, 22]}
          border={{ top: 7, right: 17, bottom: 9, left: 17 }}
          webFilter={BTN_FILTER[variant]}
          style={[
            { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 14 },
            pressed && { transform: [{ translateY: 2 }], opacity: 0.93 },
          ]}
        >
          {typeof children === 'string' ? (
            <Text style={[{ fontFamily: FONT.display, fontWeight: '800', fontSize: 32, color: txtColor, ...shadow }, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </NineSlice>
      )}
    </Pressable>
  );
}

/* ---------- stone panel (real kit frame, 9-slice) ---------- */
export function KitPanel({ style, children, contentStyle, slice = 56, border = 26, ...rest }) {
  return (
    <NineSlice source={KIT.panel} slice={slice} border={border} style={style} {...rest}>
      <View style={[{ flex: WEB ? undefined : 1 }, contentStyle]}>{children}</View>
    </NineSlice>
  );
}

/* ---------- close button (real kit ×) ---------- */
export function KitClose({ onPress, size = 34, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Закрыть" style={style}>
      {({ pressed }) => <Image source={KIT.close} style={{ width: size, height: size, transform: pressed ? [{ translateY: 2 }] : [] }} resizeMode="contain" />}
    </Pressable>
  );
}

/* ---------- progress bar: dark track + real kit glossy fill clipped to % ---------- */
export function KitBar({ pct, color = 'green', height = 18 }) {
  const fill = FILLS[color] || KIT.fillGreen;
  const w = Math.max(0, Math.min(100, pct || 0));
  return (
    <View style={{ height, borderRadius: 999, overflow: 'hidden', borderWidth: 2.5, borderColor: '#3a3327', backgroundColor: '#2b2620', boxShadow: 'inset 0px 2px 5px rgba(0,0,0,0.55)' }}>
      <View style={{ width: w + '%', height: '100%', overflow: 'hidden' }}>
        <ImageBackground source={fill} resizeMode="stretch" style={{ width: '100%', height: '100%' }} />
      </View>
    </View>
  );
}

/* ---------- genuine RPGUI checkbox (golden sprite) ---------- */
const CHECKBOX_ON = require('../assets/rpgui/img/checkbox-golden-on.png');
const CHECKBOX_OFF = require('../assets/rpgui/img/checkbox-golden-off.png');
export function KitCheckbox({ on, size = 28, style }) {
  return <Image source={on ? CHECKBOX_ON : CHECKBOX_OFF} style={[{ width: size, height: size }, style]} resizeMode="stretch" />;
}
export function KitCheck({ size = 28, style }) {
  return <KitCheckbox on size={size} style={style} />;
}

const RADIO_ON = require('../assets/rpgui/img/radio-golden-on.png');
const RADIO_OFF = require('../assets/rpgui/img/radio-golden-off.png');
export function KitRadio({ on, size = 28, style }) {
  return <Image source={on ? RADIO_ON : RADIO_OFF} style={[{ width: size, height: size }, style]} resizeMode="stretch" />;
}
export function KitHr({ style }) {
  return <View style={[{ width: '100%', height: 6, backgroundColor: 'rgba(168,144,102,0.35)', borderRadius: 2 }, style]} />;
}

/* ---------- round dial frame (real kit), content centered on top ---------- */
export function KitRound({ size = 230, style, children }) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Image source={KIT.dial} style={{ position: 'absolute', width: size, height: size }} resizeMode="stretch" />
      {children}
    </View>
  );
}

/* ---------- gem / medallion — real kit gem (stone ring + glossy centre),
   centre hue-rotated to the category/stat colour; han symbol on top ---------- */
export function KitGem({ size = 54, color = '#888', han, fontSize, glyphStyle }) {
  const ref = useRef(null);
  const rot = Math.round((hexHue(color) - ORB_BASE_HUE + 360) % 360);
  useEffect(() => {
    if (WEB && ref.current) ref.current.style.filter = `hue-rotate(${rot}deg) saturate(1.55)`;
  }, [rot]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image ref={ref} source={KIT.orb} style={{ position: 'absolute', width: size, height: size }} resizeMode="contain" />
      <Text style={[{ fontFamily: FONT.han, fontSize: fontSize || size * 0.42, color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, glyphStyle]}>{han}</Text>
    </View>
  );
}

/* ---------- colored candy pill (real kit) for chips / state ---------- */
export function KitPill({ color = 'primary', children, style, onPress, accessibilityLabel, selected }) {
  const asset = BTN_ASSET[color] || KIT.btnGreen;
  const body = (
    <NineSlice source={asset} slice={[7, 22, 9, 22]} border={{ top: 6, right: 15, bottom: 8, left: 15 }} webFilter={BTN_FILTER[color]} style={[{ minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 }, style]}>
      {children}
    </NineSlice>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={selected != null ? { selected } : undefined}>
      {body}
    </Pressable>
  ) : body;
}

/* ---------- neutral parchment chip (real kit parchment) ---------- */
export function KitParchPill({ children, style, onPress, accessibilityLabel, selected }) {
  const body = (
    <ImageBackground source={KIT.parchment} resizeMode="stretch" imageStyle={{ borderRadius: 999 }} style={[{ minHeight: 26, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderWidth: 2, borderColor: '#b9a06f' }, style]}>
      {children}
    </ImageBackground>
  );
  return onPress ? (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={selected != null ? { selected } : undefined}>
      {body}
    </Pressable>
  ) : body;
}

/* ---------- level-up banner ribbon (real kit) ---------- */
export function KitBanner({ width = 300, style }) {
  const ar = 468 / 117;
  return <Image source={KIT.levelupBanner} style={[{ width, height: width / ar }, style]} resizeMode="contain" />;
}
