/* Alchemist — SVG visualisations: radar mandala, circular timer, growth chart */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image } from 'react-native';
import Svg, { Polygon, Line, Circle, Path, G, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { C, FONT } from './theme';
import { STATS, STAT } from './data';
import { kf, KF, EASE } from './anim';
import { KIT } from './kit';

const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);

/* generic rAF tween hook (0 -> 1) */
function useTween(run, dur = 800, deps = []) {
  const [v, setV] = useState(run ? 0 : 1);
  useEffect(() => {
    if (!run) { setV(1); return; }
    let raf;
    let start;
    const tick = (t) => {
      if (start == null) start = t;
      const k = Math.min(1, (t - start) / dur);
      setV(easeOutCubic(k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const t0 = setTimeout(() => { raf = requestAnimationFrame(tick); }, 60);
    return () => { clearTimeout(t0); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

/* ---------- radar mandala ---------- */
export function RadarMandala({ values, size = 230, animate = true, tick = 0 }) {
  const cx = size / 2,
    cy = size / 2,
    Rad = size * 0.34;
  const pt = (i, frac) => {
    const a = -Math.PI / 2 + i * ((Math.PI * 2) / 6);
    return [cx + Math.cos(a) * Rad * frac, cy + Math.sin(a) * Rad * frac];
  };
  const grow = useTween(animate, 800, [tick]);
  const rings = [0.33, 0.66, 1];
  const targetFrac = (s) => Math.max(0.08, values[s.key] ?? 0.3);
  const poly = STATS.map((s, i) => pt(i, targetFrac(s) * grow).join(',')).join(' ');

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* real kit dial backdrop */}
      <Image source={KIT.dial} style={{ position: 'absolute', width: size, height: size }} resizeMode="stretch" />
      <Svg width={size} height={size} style={{ position: 'relative', zIndex: 1 }}>
        {rings.map((rr, ri) => (
          <Polygon key={ri} points={STATS.map((s, i) => pt(i, rr).join(',')).join(' ')} fill="none" stroke="rgba(255,250,235,0.18)" strokeWidth="1" />
        ))}
        {STATS.map((s, i) => {
          const [x, y] = pt(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,250,235,0.14)" strokeWidth="1" />;
        })}
        <Polygon points={poly} fill="rgba(110,200,150,0.34)" stroke="#8FE0B0" strokeWidth="2.5" strokeLinejoin="round" />
        {STATS.map((s, i) => {
          const [x, y] = pt(i, targetFrac(s) * grow);
          return <Circle key={i} cx={x} cy={y} r="4" fill={s.color} stroke="#fff" strokeWidth="1.5" />;
        })}
      </Svg>
      {/* labels */}
      {STATS.map((s, i) => {
        const [x, y] = pt(i, 1.26);
        return (
          <View key={s.key} style={{ position: 'absolute', left: x - 14, top: y - 8, width: 28, alignItems: 'center' }} pointerEvents="none">
            <Text style={{ color: s.color, fontSize: 8, fontFamily: FONT.display }}>{s.short}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ---------- circular timer ---------- */
export function CircularTimer({ remaining, total, running, size = 230 }) {
  const r = size / 2 - 16;
  const Circ = 2 * Math.PI * r;
  const frac = total > 0 ? remaining / total : 0;
  const mm = Math.floor(remaining / 60),
    ss = remaining % 60;
  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
        running ? kf(KF.timerBreathe, 4, { ease: EASE.soft, iter: 'infinite' }) : null,
      ]}
    >
      <Image source={KIT.dial} style={{ position: 'absolute', width: size, height: size }} resizeMode="stretch" />
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGrad id="jadegrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#7BD0A0" />
            <Stop offset="1" stopColor="#2A5740" />
          </SvgGrad>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.35)" strokeWidth="13" fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#jadegrad)"
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={Circ}
          strokeDashoffset={Circ * (1 - frac)}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontVariant: ['tabular-nums'], fontSize: size * 0.26, color: '#F4ECD8', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

/* ---------- growth chart (area + lines + end dots, stat-coloured) ---------- */
export function GrowthChart({ series, keys = ['energy', 'focus', 'flex'], max = 10 }) {
  const W = 300, H = 132, padX = 10, padTop = 10, padBot = 14;
  const draw = useTween(true, 1100, []);
  const n = (series[keys[0]] || []).length || 1;
  const colOf = (k) => (STAT[k] && STAT[k].color) || '#9a8f76';
  const toXY = (arr, i) => {
    const x = padX + (arr.length > 1 ? (i / (arr.length - 1)) * (W - padX * 2) : 0);
    const y = padTop + (1 - arr[i] / max) * (H - padTop - padBot);
    return [x, y];
  };
  const linePath = (arr) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + toXY(arr, i).map((t) => t.toFixed(1)).join(' ')).join(' ');
  const areaPath = (arr) => {
    const base = H - padBot;
    const [x0] = toXY(arr, 0);
    const [xN] = toXY(arr, arr.length - 1);
    return `${linePath(arr)} L ${xN.toFixed(1)} ${base} L ${x0.toFixed(1)} ${base} Z`;
  };
  const lenOf = (arr) => {
    let len = 0;
    for (let i = 1; i < arr.length; i++) {
      const [x0, y0] = toXY(arr, i - 1);
      const [x1, y1] = toXY(arr, i);
      len += Math.hypot(x1 - x0, y1 - y0);
    }
    return len;
  };
  const gy = (g) => padTop + g * (H - padTop - padBot);

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
      {/* horizontal grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <Line key={'h' + g} x1={padX} y1={gy(g)} x2={W - padX} y2={gy(g)} stroke="rgba(255,250,235,0.08)" strokeWidth="1" />
      ))}
      {/* vertical grid (one per data point) */}
      {Array.from({ length: n }).map((_, i) => {
        const x = padX + (n > 1 ? (i / (n - 1)) * (W - padX * 2) : 0);
        return <Line key={'v' + i} x1={x} y1={padTop} x2={x} y2={H - padBot} stroke="rgba(255,250,235,0.05)" strokeWidth="1" />;
      })}
      {/* areas behind lines, fade in */}
      {keys.map((k) => {
        const arr = series[k];
        if (!arr) return null;
        return <Path key={'a' + k} d={areaPath(arr)} fill={colOf(k)} opacity={0.13 * draw} />;
      })}
      {/* lines reveal via dash offset */}
      {keys.map((k) => {
        const arr = series[k];
        if (!arr) return null;
        const len = lenOf(arr);
        return (
          <Path key={'l' + k} d={linePath(arr)} fill="none" stroke={colOf(k)} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        );
      })}
      {/* end dots */}
      {keys.map((k) => {
        const arr = series[k];
        if (!arr) return null;
        const [x, y] = toXY(arr, arr.length - 1);
        return <Circle key={'d' + k} cx={x} cy={y} r={3.4} fill={colOf(k)} stroke="#191510" strokeWidth="1.5" opacity={draw} />;
      })}
    </Svg>
  );
}
