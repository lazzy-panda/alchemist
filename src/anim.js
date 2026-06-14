/* Alchemist — animation layer.
   On web, react-native-web compiles `animationKeyframes` + `animation*` style
   props into real CSS @keyframes (1:1 with the prototype's styles.css).
   On native these props are ignored, so we return {} to avoid StyleSheet warnings. */
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';

export const EASE = {
  out: 'cubic-bezier(.22,.61,.36,1)',
  soft: 'cubic-bezier(.4,0,.2,1)',
  overshoot: 'cubic-bezier(.2,.8,.2,1)',
  linear: 'linear',
};

// kf(keyframes, durationSeconds, options) -> style fragment (web only)
export function kf(keyframes, dur, opts = {}) {
  if (!WEB) return {};
  const { ease = EASE.out, iter = 1, delay = 0, dir = 'normal', fill = 'both' } = opts;
  return {
    animationKeyframes: keyframes,
    animationDuration: dur + 's',
    animationTimingFunction: ease,
    animationIterationCount: iter,
    animationDelay: delay + 's',
    animationDirection: dir,
    animationFillMode: fill,
  };
}

// transition fragment (web only)
export function tr(props, dur = 0.3, ease = EASE.out) {
  if (!WEB) return {};
  return {
    transitionProperty: Array.isArray(props) ? props.join(', ') : props,
    transitionDuration: dur + 's',
    transitionTimingFunction: ease,
  };
}

export function reducedMotion() {
  if (!WEB || typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

/* ---- shared keyframes (ported from styles.css) ---- */
export const KF = {
  screenIn: { '0%': { opacity: 0, transform: [{ translateY: 10 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }] } },
  fadeUp: { '0%': { opacity: 0, transform: [{ translateY: 14 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }] } },
  fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
  popIn: { '0%': { opacity: 0, transform: [{ scale: 0.8 }] }, '100%': { opacity: 1, transform: [{ scale: 1 }] } },
  goldBurst: {
    '0%': { opacity: 0, transform: [{ scale: 0.3 }] },
    '30%': { opacity: 1, transform: [{ scale: 0.85 }] },
    '100%': { opacity: 0, transform: [{ scale: 1.6 }] },
  },
  spin: { '0%': { transform: [{ rotate: '0deg' }] }, '100%': { transform: [{ rotate: '360deg' }] } },
  mistDrift: {
    '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }], opacity: 0.5 },
    '50%': { transform: [{ translateX: 18 }, { translateY: -8 }, { scale: 1.08 }], opacity: 0.8 },
    '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }], opacity: 0.5 },
  },
  barGlow: { '0%': { opacity: 0.4 }, '50%': { opacity: 0.95 }, '100%': { opacity: 0.4 } },
  breathe: { '0%': { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1.014 }] }, '100%': { transform: [{ scale: 1 }] } },
  timerBreathe: { '0%': { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1.012 }] }, '100%': { transform: [{ scale: 1 }] } },
  shakeNo: {
    '0%': { transform: [{ translateX: 0 }] },
    '20%': { transform: [{ translateX: -6 }] },
    '40%': { transform: [{ translateX: 6 }] },
    '60%': { transform: [{ translateX: -4 }] },
    '80%': { transform: [{ translateX: 4 }] },
    '100%': { transform: [{ translateX: 0 }] },
  },
  sealStamp: {
    '0%': { opacity: 0, transform: [{ rotate: '-4deg' }, { scale: 2.2 }] },
    '55%': { opacity: 1, transform: [{ rotate: '-4deg' }, { scale: 0.9 }] },
    '70%': { opacity: 1, transform: [{ rotate: '-4deg' }, { scale: 1.06 }] },
    '100%': { opacity: 1, transform: [{ rotate: '-4deg' }, { scale: 1 }] },
  },
  fogClear: { '0%': { opacity: 1 }, '100%': { opacity: 0 } },
  sheen: { '0%': { transform: [{ translateX: -160 }] }, '100%': { transform: [{ translateX: 420 }] } },
};
