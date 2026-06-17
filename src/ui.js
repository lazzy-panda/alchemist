/* Alchemist — core UI primitives (ported 1:1 from styles.css) */
import React from 'react';
import { View, Text, Pressable, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { C, R, FONT } from './theme';
import { kf, tr, KF, EASE } from './anim';
import { KitButton, KitPill, KitGem, KitPanel, KitRadio, KitCheckbox, KitHr } from './kit';

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
// pixel font (Press Start 2P) is large & monospaced → smaller sizes, generous line-height, dark shadow
export const T = {
  displayL: { fontFamily: FONT.display, fontSize: 32, lineHeight: 52, color: C.title, ...ts('rgba(0,0,0,0.55)', 0, 2) },
  displayM: { fontFamily: FONT.display, fontSize: 24, lineHeight: 42, color: C.title, ...ts('rgba(0,0,0,0.5)', 0, 1) },
  body: { fontFamily: FONT.ui, fontSize: 20, lineHeight: 42, color: C.ink },
  label: { fontFamily: FONT.ui, fontSize: 18, lineHeight: 28, letterSpacing: 0.3, color: C.inkMuted },
  caption: { fontFamily: FONT.ui, fontSize: 18, lineHeight: 32, color: C.inkFaint },
  eyebrow: { fontFamily: FONT.ui, fontSize: 16, lineHeight: 28, letterSpacing: 1, textTransform: 'uppercase', color: C.inkFaint },
  numXl: { fontFamily: FONT.display, fontVariant: ['tabular-nums'] },
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
        <Text style={{ fontSize: 16, color: C.gold }}>◆</Text>
        <Text accessibilityRole="header" style={{ fontFamily: FONT.display, fontSize: 22, textTransform: 'uppercase', color: C.title }}>{title}</Text>
      </View>
      {right != null ? (typeof right === 'string' ? <Text style={T.caption}>{right}</Text> : right) : null}
    </View>
  );
}

/* ---------- card (real kit parchment texture) ---------- */
export function Card({ style, children, warm, frame = 'grey', ...rest }) {
  return <KitPanel frame={frame} style={style}>{children}</KitPanel>;
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
// candy variants (primary/gold/blue/danger) render via real kit image assets in KitButton;
// only `secondary` uses this CSS fallback (stone), built from theme tokens.
const BTN_VARIANTS = {
  secondary: {
    colors: [C.kitStone, C.kitStoneMid],
    border: C.kitStoneLine,
    text: '#3a362c',
    shadow: `0px 5px 0px ${C.kitStoneLine}, 0px 8px 14px rgba(70,67,58,0.25), inset 0px 2px 0px rgba(255,255,255,0.6)`,
    pressShadow: `0px 1px 0px ${C.kitStoneLine}, inset 0px 2px 0px rgba(255,255,255,0.6)`,
    tshadow: ts('rgba(255,255,255,0.4)', 0, 1),
  },
};

export function Btn({ variant = 'primary', onPress, children, style, textStyle, block, disabled, accessibilityLabel }) {
  const a11yLabel = accessibilityLabel || (typeof children === 'string' ? children : undefined);
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => [
          { ...BTN_BASE, borderColor: 'transparent', backgroundColor: 'transparent', paddingHorizontal: 16 },
          block && { width: '100%' },
          pressed && { transform: [{ translateY: 1 }], backgroundColor: 'rgba(62,140,96,0.1)' },
          disabled && { opacity: 0.4 },
          style,
        ]}
      >
        <Text style={[{ fontFamily: FONT.display, fontSize: 20, color: C.gold }, textStyle]}>{children}</Text>
      </Pressable>
    );
  }
  // every non-ghost variant renders as a native rpgui-button (secondary = the grey stock button)
  return (
    <KitButton variant={variant} onPress={onPress} block={block} style={style} textStyle={textStyle} disabled={disabled} accessibilityLabel={a11yLabel}>
      {children}
    </KitButton>
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
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', ...ts('rgba(0,0,0,0.3)', 0, 1) }}>{children}</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

/* ---------- stepper — real kit pills ---------- */
export function Stepper({ value, onDec, onInc, suffix = ' мин' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10 }}>
      <KitPill color="primary" onPress={onDec} accessibilityLabel="Уменьшить">
        <Text style={{ fontSize: 28, color: '#fff' }}>−</Text>
      </KitPill>
      <Text style={{ minWidth: 70, textAlign: 'center', fontFamily: FONT.display, fontSize: 22, fontVariant: ['tabular-nums'], color: C.ink }}>{value}{suffix}</Text>
      <KitPill color="primary" onPress={onInc} accessibilityLabel="Увеличить">
        <Text style={{ fontSize: 28, color: '#fff' }}>+</Text>
      </KitPill>
    </View>
  );
}

/* ---------- selectable chip — genuine RPGUI radio (single) / checkbox (multi) + gem + label ---------- */
export function SelChip({ on, color, icon, label, onPress, multi }) {
  const Indicator = multi ? KitCheckbox : KitRadio;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityLabel={label}
      accessibilityState={{ selected: on, checked: on }}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingRight: 10 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Indicator on={on} size={18} />
      {icon ? <KitGem size={18} icon={icon} color={color} /> : null}
      <Text style={{ fontFamily: FONT.display, fontSize: 18, color: on ? C.title : C.inkMuted }}>{label}</Text>
    </Pressable>
  );
}

/* ---------- form fields ---------- */
export function Field({ label, children, style }) {
  // associate the visible label with the input for screen readers
  const child = label && React.isValidElement(children) && !children.props.accessibilityLabel
    ? React.cloneElement(children, { accessibilityLabel: label })
    : children;
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? <Text style={{ fontFamily: FONT.display, fontSize: 26, fontWeight: '700', color: C.inkMuted, marginBottom: 7 }}>{label}</Text> : null}
      {child}
    </View>
  );
}
// flat pixel field — a dark recessed "well" with a 2px border, to match the RPGUI pixel frames
// native RPGUI input look: grey #4e4a4e field + white text (the black pixel outline comes
// from RPGUI's `.rpgui-content input` text-shadow CSS); gold border on focus.
function KitField({ props, radius, fontSize, padV, padH, borderW }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <TextInput
      {...props}
      onFocus={(e) => { setFocus(true); props.onFocus && props.onFocus(e); }}
      onBlur={(e) => { setFocus(false); props.onBlur && props.onBlur(e); }}
      placeholderTextColor="rgba(255,255,255,0.45)"
      style={[{ width: '100%', fontFamily: FONT.ui, fontSize, color: '#fff', backgroundColor: '#4e4a4e', paddingVertical: padV, paddingHorizontal: padH, borderWidth: 2, borderColor: focus ? C.gold : '#2c2a2c', ...(WEB ? { outlineStyle: 'none' } : null) }, props.style]}
    />
  );
}
export function Input(props) {
  return <KitField props={props} radius={2} fontSize={22} padV={11} padH={12} borderW={2} />;
}
export function DiaryInput(props) {
  return <KitField props={props} radius={2} fontSize={20} padV={10} padH={11} borderW={2} />;
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

/* ---------- divider — genuine RPGUI hr ---------- */
export function BrushDivider({ style }) {
  return <KitHr style={style} />;
}

/* ---------- seal 印 ---------- */
// "seal" = the genuine RPGUI checked checkbox sprite (with a little stamp pop)
export function Seal({ size = 48, stamp = true, style }) {
  return (
    <View style={style}>
      <KitCheckbox on size={size} style={stamp ? kf(KF.sealStamp, 0.5, { ease: EASE.overshoot, fill: 'forwards' }) : null} />
    </View>
  );
}

export { kf, tr, KF, EASE };
