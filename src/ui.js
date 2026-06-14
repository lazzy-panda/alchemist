/* Alchemist — core UI primitives (ported 1:1 from styles.css) */
import React from 'react';
import { View, Text, Pressable, TextInput, ImageBackground, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C, R, FONT } from './theme';
import { kf, tr, KF, EASE } from './anim';
import { KitButton, KitPill, KitParchPill, KitGem, KIT } from './kit';

const WEB = Platform.OS === 'web';

/* ---------- text-shadow helper ---------- */
export function ts(color, x, y, radius = 0) {
  return { textShadowColor: color, textShadowOffset: { width: x, height: y }, textShadowRadius: radius };
}

/* ---------- gradient ---------- */
export function angleToStartEnd(angle) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad) / 2;
  const dy = -Math.cos(rad) / 2;
  return { start: { x: 0.5 - dx, y: 0.5 - dy }, end: { x: 0.5 + dx, y: 0.5 + dy } };
}
export function Gradient({ colors, angle = 180, style, children, pointerEvents, ...rest }) {
  const se = angleToStartEnd(angle);
  return (
    <LinearGradient colors={colors} start={se.start} end={se.end} style={style} pointerEvents={pointerEvents} {...rest}>
      {children}
    </LinearGradient>
  );
}

/* ---------- gloss highlight (approximates CSS radial ::after on gems) ---------- */
export function Gloss({ radius = 50 }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: '16%',
        top: '8%',
        width: '54%',
        height: '36%',
        borderRadius: radius,
        backgroundColor: 'rgba(255,255,255,0.55)',
        ...(WEB ? { filter: 'blur(1px)' } : null),
      }}
    />
  );
}

/* ---------- typography ---------- */
export const T = {
  displayL: { fontFamily: FONT.display, fontWeight: '700', fontSize: 34, lineHeight: 36, color: C.title, ...ts('rgba(255,255,255,0.55)', 0, 2) },
  displayM: { fontFamily: FONT.display, fontWeight: '700', fontSize: 24, lineHeight: 27, color: C.titleDeep, ...ts('rgba(255,255,255,0.55)', 0, 1) },
  body: { fontFamily: FONT.ui, fontSize: 15, lineHeight: 23, color: C.ink },
  label: { fontFamily: FONT.ui, fontSize: 12, fontWeight: '700', letterSpacing: 0.3, color: C.inkMuted },
  caption: { fontFamily: FONT.ui, fontSize: 11, fontWeight: '600', color: C.inkFaint },
  eyebrow: { fontFamily: FONT.ui, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: C.inkFaint },
  numXl: { fontFamily: FONT.display, fontWeight: '700', fontVariant: ['tabular-nums'] },
};

export function Txt({ style, children, ...rest }) {
  return (
    <Text style={[{ fontFamily: FONT.ui, color: C.ink }, style]} {...rest}>
      {children}
    </Text>
  );
}
export function Han({ style, children, ...rest }) {
  return (
    <Text style={[{ fontFamily: FONT.han, color: C.ink }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function SectionHead({ title, right, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 13, marginHorizontal: 2 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 9, color: C.stoneMid }}>◆</Text>
        <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.6, color: C.title, ...ts('rgba(255,255,255,0.6)', 0, 1) }}>{title}</Text>
      </View>
      {right != null ? (typeof right === 'string' ? <Text style={T.caption}>{right}</Text> : right) : null}
    </View>
  );
}

/* ---------- card (real kit parchment texture) ---------- */
export function Card({ style, children, warm, ...rest }) {
  return (
    <ImageBackground
      source={KIT.parchment}
      resizeMode="stretch"
      imageStyle={{ borderRadius: R.card }}
      style={[
        {
          borderRadius: R.card,
          overflow: 'hidden',
          borderWidth: 2.5,
          borderColor: C.paperDeep,
          boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.5), 0px 3px 8px rgba(80,52,18,0.18)',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </ImageBackground>
  );
}

/* ---------- buttons — glossy candy ---------- */
const BTN_BASE = {
  borderRadius: R.btn,
  borderWidth: 2.5,
  paddingVertical: 12,
  paddingHorizontal: 22,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
};
// candy buttons — palette transferred 1:1 from the RPG kit (NORMAL/PRESSED states)
const BTN_VARIANTS = {
  primary: {
    colors: ['#8FCB63', '#4E9B3A'],
    border: '#2E6B22',
    text: '#fff',
    shadow: `0px 5px 0px #2E6B22, 0px 9px 16px rgba(46,107,34,0.35), inset 0px 2px 0px rgba(255,255,255,0.55)`,
    pressShadow: `0px 1px 0px #2E6B22, inset 0px 2px 0px rgba(255,255,255,0.55)`,
    tshadow: ts('rgba(0,0,0,0.28)', 0, 1),
  },
  gold: {
    colors: ['#F6C752', '#E0902A'],
    border: '#9A6212',
    text: '#fff',
    shadow: `0px 5px 0px #9A6212, 0px 9px 16px rgba(154,98,18,0.35), inset 0px 2px 0px rgba(255,255,255,0.6)`,
    pressShadow: `0px 1px 0px #9A6212, inset 0px 2px 0px rgba(255,255,255,0.6)`,
    tshadow: ts('rgba(0,0,0,0.25)', 0, 1),
  },
  blue: {
    colors: ['#6FBDE8', '#2F86C0'],
    border: '#1C5478',
    text: '#fff',
    shadow: `0px 5px 0px #1C5478, 0px 9px 16px rgba(28,84,120,0.35), inset 0px 2px 0px rgba(255,255,255,0.55)`,
    pressShadow: `0px 1px 0px #1C5478, inset 0px 2px 0px rgba(255,255,255,0.55)`,
    tshadow: ts('rgba(0,0,0,0.28)', 0, 1),
  },
  secondary: {
    colors: ['#CFCABC', '#A29C8C'],
    border: '#46433A',
    text: '#3a362c',
    shadow: `0px 5px 0px #46433A, 0px 8px 14px rgba(70,67,58,0.25), inset 0px 2px 0px rgba(255,255,255,0.6)`,
    pressShadow: `0px 1px 0px #46433A, inset 0px 2px 0px rgba(255,255,255,0.6)`,
    tshadow: ts('rgba(255,255,255,0.4)', 0, 1),
  },
  danger: {
    colors: ['#EC7257', '#C23725'],
    border: '#7C1E10',
    text: '#fff',
    shadow: `0px 5px 0px #7C1E10, 0px 8px 14px rgba(124,30,16,0.3), inset 0px 2px 0px rgba(255,255,255,0.5)`,
    pressShadow: `0px 1px 0px #7C1E10, inset 0px 2px 0px rgba(255,255,255,0.5)`,
    tshadow: ts('rgba(0,0,0,0.28)', 0, 1),
  },
};

export function Btn({ variant = 'primary', onPress, children, style, textStyle, block, disabled }) {
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          { ...BTN_BASE, borderColor: 'transparent', backgroundColor: 'transparent', paddingHorizontal: 16 },
          block && { width: '100%' },
          pressed && { transform: [{ translateY: 1 }], backgroundColor: 'rgba(62,140,96,0.1)' },
          disabled && { opacity: 0.4 },
          style,
        ]}
      >
        <Text style={[{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, color: C.jadeDeep }, textStyle]}>{children}</Text>
      </Pressable>
    );
  }
  // real RPG-kit pill assets for the candy variants
  if (variant === 'primary' || variant === 'gold' || variant === 'blue' || variant === 'danger') {
    return (
      <KitButton variant={variant} onPress={onPress} block={block} style={style} textStyle={textStyle} disabled={disabled}>
        {children}
      </KitButton>
    );
  }
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const se = angleToStartEnd(180);
  return (
    <Pressable onPress={disabled ? undefined : onPress} style={[block && { width: '100%' }, disabled && { opacity: 0.45 }, style]}>
      {({ pressed }) => (
        <LinearGradient
          colors={v.colors}
          start={se.start}
          end={se.end}
          style={[
            BTN_BASE,
            { borderColor: v.border, boxShadow: pressed ? v.pressShadow : v.shadow },
            pressed && { transform: [{ translateY: 4 }] },
          ]}
        >
          {typeof children === 'string' ? (
            <Text style={[{ fontFamily: FONT.display, fontWeight: '700', fontSize: 16, color: v.text }, v.tshadow, textStyle]}>{children}</Text>
          ) : (
            children
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

/* round icon button (close) */
export function IconBtn({ onPress, children, style }) {
  const se = angleToStartEnd(180);
  return (
    <Pressable onPress={onPress} style={style}>
      {({ pressed }) => (
        <LinearGradient
          colors={['#EC7257', '#C23725']}
          start={se.start}
          end={se.end}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2.5,
            borderColor: '#7C1E10',
            boxShadow: pressed ? `0px 0px 0px #7C1E10, inset 0px 2px 0px rgba(255,255,255,0.5)` : `0px 3px 0px #7C1E10, inset 0px 2px 0px rgba(255,255,255,0.5)`,
            transform: pressed ? [{ translateY: 3 }] : [],
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', ...ts('rgba(0,0,0,0.3)', 0, 1) }}>{children}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

/* ---------- stepper — real kit pills ---------- */
export function Stepper({ value, onDec, onInc, suffix = ' мин' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10 }}>
      <KitPill color="primary" onPress={onDec} style={{ minHeight: 44, paddingHorizontal: 18 }}>
        <Text style={{ fontSize: 22, color: '#fff', fontWeight: '800', ...ts('rgba(0,0,0,0.3)', 0, 1) }}>−</Text>
      </KitPill>
      <Text style={{ minWidth: 84, textAlign: 'center', fontFamily: FONT.display, fontWeight: '700', fontSize: 16, fontVariant: ['tabular-nums'], color: C.ink }}>{value}{suffix}</Text>
      <KitPill color="primary" onPress={onInc} style={{ minHeight: 44, paddingHorizontal: 18 }}>
        <Text style={{ fontSize: 22, color: '#fff', fontWeight: '800', ...ts('rgba(0,0,0,0.3)', 0, 1) }}>+</Text>
      </KitPill>
    </View>
  );
}

/* ---------- selectable chip — real kit parchment chip + kit gem ---------- */
export function SelChip({ on, color, han, hanColor, label, onPress }) {
  return (
    <KitParchPill onPress={onPress} style={{ paddingLeft: 5, paddingRight: 13, gap: 7, minHeight: 34, opacity: on ? 1 : 0.72, borderColor: on ? color || C.ink : '#b9a06f' }}>
      <KitGem size={24} color={on ? hanColor || color : C.inkFaint} han={han} fontSize={12} />
      <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '600', color: on ? C.ink : C.inkMuted }}>{label}</Text>
    </KitParchPill>
  );
}

/* ---------- form fields ---------- */
export function Field({ label, children, style }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: '700', color: C.inkMuted, marginBottom: 7 }}>{label}</Text> : null}
      {children}
    </View>
  );
}
function KitField({ props, radius, fontSize, fontWeight, padV, padH, borderW }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <ImageBackground
      source={KIT.parchment}
      resizeMode="stretch"
      imageStyle={{ borderRadius: radius }}
      style={{ width: '100%', borderRadius: radius, overflow: 'hidden', borderWidth: borderW, borderColor: focus ? C.jade : C.stoneMid, boxShadow: focus ? 'inset 0px 2px 6px rgba(120,80,30,0.28), 0px 0px 0px 3px rgba(94,200,150,0.35)' : 'inset 0px 2px 6px rgba(120,80,30,0.3)' }}
    >
      <TextInput
        {...props}
        onFocus={(e) => { setFocus(true); props.onFocus && props.onFocus(e); }}
        onBlur={(e) => { setFocus(false); props.onBlur && props.onBlur(e); }}
        placeholderTextColor={C.inkMuted}
        style={[{ width: '100%', fontFamily: FONT.ui, fontSize, fontWeight, color: C.ink, backgroundColor: 'transparent', paddingVertical: padV, paddingHorizontal: padH, ...(WEB ? { outlineStyle: 'none' } : null) }, props.style]}
      />
    </ImageBackground>
  );
}
export function Input(props) {
  return <KitField props={props} radius={12} fontSize={15} fontWeight="600" padV={12} padH={14} borderW={2.5} />;
}
export function DiaryInput(props) {
  return <KitField props={props} radius={10} fontSize={14} fontWeight="500" padV={9} padH={11} borderW={2} />;
}

/* ---------- wood plank surface ---------- */
export function WoodPlank({ colors = [C.stoneLight, C.stoneDark], angle = 180, style, children, lines = true, ...rest }) {
  return (
    <Gradient colors={colors} angle={angle} style={style} {...rest}>
      {lines ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', overflow: 'hidden' }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View key={i} style={{ width: 47, borderRightWidth: 2, borderRightColor: 'rgba(110,72,30,0.14)' }} />
          ))}
        </View>
      ) : null}
      {children}
    </Gradient>
  );
}

/* ---------- brush divider (svg) ---------- */
export function BrushDivider({ style }) {
  return (
    <View style={[{ width: '100%', height: 10, opacity: 0.5 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 300 12" preserveAspectRatio="none">
        <Path
          d="M2 7 C 40 3, 70 9, 110 6 C 150 3, 185 8, 220 6 C 250 4, 280 8, 298 6 L 298 8 C 280 10, 250 6, 220 8 C 185 10, 150 5, 110 8 C 70 11, 40 5, 2 9 Z"
          fill={C.stoneMid}
          opacity={0.4}
        />
      </Svg>
    </View>
  );
}

/* ---------- seal 印 ---------- */
export function Seal({ size = 48, fontSize = 26, stamp = true, style }) {
  const se = angleToStartEnd(160);
  return (
    <View style={style}>
      <LinearGradient
        colors={['#e0654a', '#a83a24']}
        start={se.start}
        end={se.end}
        style={[
          {
            width: size,
            height: size,
            borderRadius: R.seal,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderColor: C.redLine,
            boxShadow: `inset 0px 2px 0px rgba(255,255,255,0.3), 0px 4px 0px ${C.redLine}, 0px 8px 16px rgba(120,30,16,0.4)`,
            transform: [{ rotate: '-4deg' }],
          },
          stamp && kf(KF.sealStamp, 0.5, { ease: EASE.overshoot, fill: 'forwards' }),
        ]}
      >
        <Han style={{ color: '#fff', fontSize, fontWeight: '700', ...ts('rgba(0,0,0,0.4)', 0, 1, 2) }}>印</Han>
        <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 4, bottom: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 5 }} />
      </LinearGradient>
    </View>
  );
}

export { kf, tr, KF, EASE };
