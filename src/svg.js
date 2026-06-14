/* Alchemist — SVG visualisations: radar mandala, circular timer, growth chart */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle, Path, G, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { C, FONT } from './theme';
import { STATS } from './data';
import { Han } from './ui';
import { kf, KF, EASE } from './anim';

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
      {/* medallion backdrop */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: C.paperLight,
          borderWidth: 4,
          borderColor: C.wood3,
          boxShadow: `inset 0px 0px 0px 4px ${C.gold}, inset 0px 0px 22px rgba(120,80,30,0.18), 0px 6px 16px rgba(80,52,18,0.22)`,
        }}
      >
        <View style={{ position: 'absolute', left: 18, top: 18, right: 18, bottom: 18, borderRadius: size / 2, borderWidth: 1.5, borderColor: 'rgba(120,80,40,0.22)', borderStyle: 'dashed' }} />
      </View>
      <Svg width={size} height={size} style={{ position: 'relative', zIndex: 1 }}>
        {rings.map((rr, ri) => (
          <Polygon key={ri} points={STATS.map((s, i) => pt(i, rr).join(',')).join(' ')} fill="none" stroke="rgba(120,92,48,0.14)" strokeWidth="1" />
        ))}
        {STATS.map((s, i) => {
          const [x, y] = pt(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(120,92,48,0.12)" strokeWidth="1" />;
        })}
        <Polygon points={poly} fill="rgba(62,124,90,0.22)" stroke={C.jade} strokeWidth="2" strokeLinejoin="round" />
        {STATS.map((s, i) => {
          const [x, y] = pt(i, targetFrac(s) * grow);
          return <Circle key={i} cx={x} cy={y} r="4" fill={s.color} stroke="#fff" strokeWidth="1.5" />;
        })}
      </Svg>
      {/* labels */}
      {STATS.map((s, i) => {
        const [x, y] = pt(i, 1.26);
        return (
          <View key={s.key} style={{ position: 'absolute', left: x - 12, top: y - 10, width: 24, alignItems: 'center' }} pointerEvents="none">
            <Han style={{ color: s.color, fontSize: 17, fontWeight: '700', lineHeight: 18 }}>{s.han}</Han>
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
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGrad id="jadegrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#5EA37D" />
            <Stop offset="1" stopColor="#2A5740" />
          </SvgGrad>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#4f371b" strokeWidth="13" fill="none" />
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
        <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontVariant: ['tabular-nums'], fontSize: size * 0.26, color: C.titleDeep }}>
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

/* ---------- growth chart ---------- */
export function GrowthChart({ series }) {
  const W = 300,
    H = 120,
    pad = 8;
  const max = 10;
  const draw = useTween(true, 1100, []);
  const keys = [
    ['flex', '#7BA84E'],
    ['focus', '#4A6FA5'],
    ['energy', '#3E9C8A'],
  ];
  const toXY = (arr, i) => {
    const x = pad + (i / (arr.length - 1)) * (W - pad * 2);
    const y = H - pad - (arr[i] / max) * (H - pad * 2);
    return [x, y];
  };
  const pathOf = (arr) => arr.map((v, i) => (i === 0 ? 'M' : 'L') + toXY(arr, i).map((n) => n.toFixed(1)).join(' ')).join(' ');
  const lenOf = (arr) => {
    let len = 0;
    for (let i = 1; i < arr.length; i++) {
      const [x0, y0] = toXY(arr, i - 1);
      const [x1, y1] = toXY(arr, i);
      len += Math.hypot(x1 - x0, y1 - y0);
    }
    return len;
  };

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet">
      {[0.25, 0.5, 0.75].map((g) => (
        <Line key={g} x1={pad} y1={H * g} x2={W - pad} y2={H * g} stroke="rgba(120,92,48,0.1)" strokeWidth="1" />
      ))}
      {keys.map(([k, col]) => {
        const arr = series[k];
        const len = lenOf(arr);
        return (
          <Path
            key={k}
            d={pathOf(arr)}
            fill="none"
            stroke={col}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - draw)}
          />
        );
      })}
    </Svg>
  );
}
