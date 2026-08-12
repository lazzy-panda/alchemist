/* Alchemist — live hero portrait: looping muted <video> (web). Poster on reduced-motion or error. */
import React from 'react';
import { Image } from 'react-native';
import { unstable_createElement } from 'react-native-web';
import { C } from './theme';
import { reducedMotion } from './anim';

const VIDEO = require('../assets/avatars/panda-live.mp4');
const POSTER = require('../assets/avatars/panda-live.jpg');
const srcUri = (a) => (a && typeof a === 'object' && a.uri ? a.uri : a);

/* same square frame as AvatarArt */
const frameBox = (size) => ({
  width: size,
  height: size,
  borderRadius: 8,
  borderWidth: 3,
  borderColor: C.goldLine,
  backgroundColor: C.frameDark,
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
    return <Image source={POSTER} resizeMode="cover" style={[frameBox(size), style]} />;
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
    style: [
      frameBox(size),
      { display: 'block', objectFit: 'cover', borderStyle: 'solid', boxSizing: 'border-box' },
      style,
    ],
  });
}
