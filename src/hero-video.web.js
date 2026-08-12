/* Alchemist — live hero portrait (web): looping muted <video>, кадр показывается ЦЕЛИКОМ, без масок.
   HeroWall — живая амбиент-подложка шапки: играющий кадр видео рисуется в размытый canvas,
   так что фон шапки — та же стена, мерцает синхронно с порталом. Poster on reduced-motion or error. */
import React from 'react';
import { unstable_createElement } from 'react-native-web';
import { reducedMotion } from './anim';

const VIDEO = require('../assets/avatars/panda-live.mp4');
const POSTER = require('../assets/avatars/panda-live.jpg');
const WALL = require('../assets/avatars/panda-wall.jpg');
const MASK = require('../assets/avatars/panda-mask.png'); // нарисована пользователем вручную
const srcUri = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

/* текущий играющий <video> героя — источник для живой подложки */
let liveVideoEl = null;

const box = (size) => ({
  width: size,
  height: size,
  display: 'block',
  objectFit: 'cover',
  WebkitMaskImage: `url(${srcUri(MASK)})`,
  maskImage: `url(${srcUri(MASK)})`,
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
});

export function HeroVideoArt({ size = 144, style }) {
  const ref = React.useRef(null);
  const [failed, setFailed] = React.useState(false);
  const still = failed || reducedMotion();

  React.useEffect(() => {
    if (still) return;
    const el = ref.current;
    if (!el) return;
    // React ставит muted только как property; вебвью-эвристики autoplay смотрят атрибут.
    el.muted = true;
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    const kick = () => {
      if (document.hidden) return;
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    };
    kick();
    document.addEventListener('visibilitychange', kick);
    liveVideoEl = el;
    return () => {
      if (liveVideoEl === el) liveVideoEl = null;
      document.removeEventListener('visibilitychange', kick);
    };
  }, [still]);

  if (still) {
    return unstable_createElement('img', {
      src: srcUri(POSTER),
      alt: '',
      draggable: false,
      style: [box(size), style],
    });
  }
  return unstable_createElement('video', {
    ref,
    src: srcUri(VIDEO),
    poster: srcUri(POSTER),
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: 'auto',
    controls: false,
    disablePictureInPicture: true,
    disableRemotePlayback: true,
    'aria-hidden': true,
    tabIndex: -1,
    onError: () => setFailed(true),
    style: [box(size), style],
  });
}

/* Абсолютная подложка на всю шапку: живой размытый кадр видео + затемнение для читаемости.
   Слои: кладка из кадра → живой тон (multiply) → затемнение → «эмбилайт»-ореол.
   Ореол — зеркальная 3×3 сетка кадра: центральная ячейка совпадает с порталом, соседние —
   отражения, т.е. на границе портала фон по построению продолжает его крайние пиксели.
   Ореол лежит ПОВЕРХ затемнения, чтобы яркость на стыке совпадала с незатемнённым видео.
   Пока видео не играет (загрузка/reduced-motion/ошибка) — рисуется постер. */
const WALL_RES = 64; // внутреннее разрешение базового canvas; блюр всё равно съедает детали
const HALO_SCALE = 3; // ореол в 3 размера портала, по центру
const HALO_CELL = 96; // внутреннее разрешение одной ячейки зеркальной сетки

export function HeroWall() {
  const wallRef = React.useRef(null);
  const haloRef = React.useRef(null);

  React.useEffect(() => {
    const wall = wallRef.current;
    const halo = haloRef.current;
    if (!wall || !halo) return;
    const wctx = wall.getContext('2d');
    const hctx = halo.getContext('2d');
    // offscreen: кадр с наложенной пользовательской маской — свечение только от видимого
    const off = document.createElement('canvas');
    off.width = HALO_CELL;
    off.height = HALO_CELL;
    const octx = off.getContext('2d');
    const maskImg = new window.Image();
    let maskReady = false;
    maskImg.onload = () => { maskReady = true; };
    maskImg.src = srcUri(MASK);
    let poster = null;
    let posterReady = false;
    const drawFrom = (src) => {
      // база — верхняя полоса кадра (чистая стена), растянутая на шапку
      wctx.drawImage(src, 0, 0, 480, 70, 0, 0, WALL_RES, WALL_RES);
      // кадр × маска
      const c = HALO_CELL;
      octx.clearRect(0, 0, c, c);
      octx.drawImage(src, 0, 0, c, c);
      if (maskReady) {
        octx.globalCompositeOperation = 'destination-in';
        octx.drawImage(maskImg, 0, 0, c, c);
        octx.globalCompositeOperation = 'source-over';
      }
      // ореол — зеркальная 3×3 сетка из замаскированного кадра
      hctx.clearRect(0, 0, c * 3, c * 3);
      for (let gx = 0; gx < 3; gx++) {
        for (let gy = 0; gy < 3; gy++) {
          const fx = gx !== 1;
          const fy = gy !== 1;
          hctx.save();
          hctx.translate(gx * c + (fx ? c : 0), gy * c + (fy ? c : 0));
          hctx.scale(fx ? -1 : 1, fy ? -1 : 1);
          hctx.drawImage(off, 0, 0, c, c);
          hctx.restore();
        }
      }
    };
    let raf = 0;
    const tick = () => {
      raf = window.requestAnimationFrame(tick);
      if (document.hidden) return;
      const el = liveVideoEl;
      if (el && el.readyState >= 2 && !el.paused) drawFrom(el);
      else if (posterReady) drawFrom(poster);
      else if (!poster) {
        poster = new window.Image();
        poster.onload = () => { posterReady = true; drawFrom(poster); };
        poster.src = srcUri(POSTER);
      }
      // совместить ореол и кайму с порталом (координаты относительно шапки)
      const av = document.getElementById('today-avatar');
      const hero = halo.parentElement;
      if (av && hero) {
        const a = av.getBoundingClientRect();
        const h = hero.getBoundingClientRect();
        const size = a.width * HALO_SCALE;
        halo.style.width = size + 'px';
        halo.style.height = size + 'px';
        halo.style.left = (a.left - h.left + a.width / 2 - size / 2) + 'px';
        halo.style.top = (a.top - h.top + a.height / 2 - size / 2) + 'px';
      }
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const haloMask = 'radial-gradient(circle closest-side, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 92%)';
  return unstable_createElement('div', {
    'aria-hidden': true,
    style: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    },
    children: [
      // каменная кладка из чистого участка кадра — «та же стена», зеркальная плитка
      unstable_createElement('div', {
        key: 'stone',
        style: {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${srcUri(WALL)})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '228px 180px',
          filter: 'brightness(1.12) saturate(1.05)',
        },
      }),
      // живой средний тон стены поверх кладки — связывает её яркость с мерцанием кадра
      unstable_createElement('canvas', {
        key: 'wall',
        ref: wallRef,
        width: WALL_RES,
        height: WALL_RES,
        style: {
          position: 'absolute',
          top: '-25%', left: '-25%',
          width: '150%', height: '150%',
          filter: 'blur(36px) saturate(1.05)',
          opacity: 0.35,
          mixBlendMode: 'multiply',
        },
      }),
      unstable_createElement('div', {
        key: 'dim',
        style: {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(26,16,7,0.05) 0%, rgba(22,13,6,0.30) 100%)',
        },
      }),
      unstable_createElement('canvas', {
        key: 'halo',
        ref: haloRef,
        width: HALO_CELL * 3,
        height: HALO_CELL * 3,
        style: {
          position: 'absolute',
          top: 0, left: 0, width: 0, height: 0,
          filter: 'blur(16px)',
          WebkitMaskImage: haloMask,
          maskImage: haloMask,
        },
      }),
    ],
  });
}
