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
  btnGreen: require('../assets/kit/btn_green.png'),
  btnRed: require('../assets/kit/btn_red.png'),
  btnGold: require('../assets/kit/btn_gold.png'),
  btnBlue: require('../assets/kit/btn_blue.png'),
  close: require('../assets/kit/close.png'),
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
