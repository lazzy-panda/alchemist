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
};
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
export function NineSlice({ source, slice = 12, border, style, children, ...rest }) {
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
  }, [uri, sliceArr.join(','), b.top, b.right, b.bottom, b.left]);

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

export function KitButton({ variant = 'primary', onPress, children, block, style, textStyle, disabled }) {
  const asset = BTN_ASSET[variant] || KIT.btnGreen;
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[block && { width: '100%' }, disabled && { opacity: 0.5 }, style]}>
      {({ pressed }) => (
        <NineSlice
          source={asset}
          slice={[7, 22, 9, 22]}
          border={{ top: 7, right: 17, bottom: 9, left: 17 }}
          style={[
            { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 14 },
            pressed && { transform: [{ translateY: 2 }], opacity: 0.93 },
          ]}
        >
          {typeof children === 'string' ? (
            <Text style={[{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, color: '#fff', ...ts('rgba(0,0,0,0.3)', 0, 1) }, textStyle]}>{children}</Text>
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
    <Pressable onPress={onPress} style={style}>
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

/* ---------- round check (real kit green ✓) ---------- */
export function KitCheck({ size = 40, style }) {
  return <Image source={KIT.checkOn} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
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

/* ---------- gem / medallion on a real kit stone slot ---------- */
export function KitGem({ size = 54, color = '#fff', han, fontSize, glyphStyle }) {
  const b = Math.max(7, Math.round(size * 0.26));
  return (
    <NineSlice source={KIT.panel} slice={56} border={b} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[{ fontFamily: FONT.han, fontSize: fontSize || size * 0.5, color, lineHeight: (fontSize || size * 0.5) * 1.02, textAlign: 'center' }, glyphStyle]}>{han}</Text>
    </NineSlice>
  );
}

/* ---------- colored candy pill (real kit) for chips / state ---------- */
export function KitPill({ color = 'primary', children, style, onPress }) {
  const asset = BTN_ASSET[color] || KIT.btnGreen;
  const body = (
    <NineSlice source={asset} slice={[7, 22, 9, 22]} border={{ top: 6, right: 15, bottom: 8, left: 15 }} style={[{ minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 }, style]}>
      {children}
    </NineSlice>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

/* ---------- neutral parchment chip (real kit parchment) ---------- */
export function KitParchPill({ children, style, onPress }) {
  const body = (
    <ImageBackground source={KIT.parchment} resizeMode="stretch" imageStyle={{ borderRadius: 999 }} style={[{ minHeight: 26, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderWidth: 2, borderColor: '#b9a06f' }, style]}>
      {children}
    </ImageBackground>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

/* ---------- level-up banner ribbon (real kit) ---------- */
export function KitBanner({ width = 300, style }) {
  const ar = 468 / 117;
  return <Image source={KIT.levelupBanner} style={[{ width, height: width / ar }, style]} resizeMode="contain" />;
}
