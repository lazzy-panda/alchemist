/* Alchemist — live hero portrait: looping muted <video> (web), бесшовно растворён в стене шапки.
   Края гасятся перьевой альфа-маской (panda-mask.png), рамки нет — фон шапки продолжает стену видео.
   Poster on reduced-motion or error. */
import React from 'react';
import { unstable_createElement } from 'react-native-web';
import { reducedMotion } from './anim';

const VIDEO = require('../assets/avatars/panda-live.mp4');
const POSTER = require('../assets/avatars/panda-live.jpg');
const MASK = require('../assets/avatars/panda-mask.png');
const srcUri = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

const seamlessBox = (size) => ({
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
    return () => document.removeEventListener('visibilitychange', kick);
  }, [still]);

  if (still) {
    return unstable_createElement('img', {
      src: srcUri(POSTER),
      alt: '',
      draggable: false,
      style: [seamlessBox(size), style],
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
    style: [seamlessBox(size), style],
  });
}
