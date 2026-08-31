/* Alchemist — live hero portrait (web): looping muted <video> с ручной маской Кирилла
   (panda-mask.png, альфа-канал). Poster on reduced-motion or error. */
import React from 'react';
import { unstable_createElement } from 'react-native-web';
import { reducedMotion } from './anim';

const VIDEO = require('../assets/avatars/panda-live.mp4');
const POSTER = require('../assets/avatars/panda-live.jpg');
const MASK = require('../assets/avatars/panda-mask.png'); // нарисована пользователем вручную
const srcUri = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

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
  // Порядок здесь — и есть автозапуск на iOS. WebKit решает, можно ли играть без жеста, в
  // момент загрузки источника, и читает АТРИБУТЫ muted/playsinline. React выставляет muted
  // только как property, а прежний код дописывал атрибуты в useEffect — то есть уже после
  // загрузки, когда отказ был вынесен. Поэтому src не отдаём React: вешаем атрибуты в
  // ref-колбэке (он срабатывает при вставке элемента, до useEffect) и только потом источник.
  const attach = React.useCallback((el) => {
    ref.current = el;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;          // отражается в атрибут muted
    el.setAttribute('muted', '');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.setAttribute('autoplay', '');
    if (!el.getAttribute('src')) el.setAttribute('src', srcUri(VIDEO));
  }, []);
  const [failed, setFailed] = React.useState(false);
  const still = failed || reducedMotion();

  React.useEffect(() => {
    if (still) return;
    const el = ref.current;
    if (!el) return;
    // iOS-вебвью (в т.ч. Chrome на iPhone — там тот же WebKit) отклоняет autoplay в режиме
    // энергосбережения: promise от play() отвергается, кадр замирает навсегда, и WebKit рисует
    // поверх свою кнопку play. Ловим первый жест в ЛЮБОМ месте страницы — жать по самой
    // аватарке не нужно (тап по ней открывает «Сменить образ»).
    const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'];
    function onGesture() { kick(); }
    const arm = () => GESTURES.forEach((g) => document.addEventListener(g, onGesture, true));
    const disarm = () => GESTURES.forEach((g) => document.removeEventListener(g, onGesture, true));
    function kick() {
      if (document.hidden) return;
      const p = el.play();
      // пошло — слушатели больше не нужны; отказ глотаем, ждём жеста
      if (p && p.then) p.then(disarm, () => {});
    }
    // видео встало не по нашей воле (заблокированный autoplay, сворачивание приложения,
    // входящий звонок) — снова ждём жеста, иначе панда замрёт до конца сессии
    const onPause = () => arm();
    el.addEventListener('pause', onPause);
    kick();
    arm();
    document.addEventListener('visibilitychange', kick);
    return () => {
      disarm();
      el.removeEventListener('pause', onPause);
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
    ref: attach,
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
