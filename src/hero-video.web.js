/* Alchemist — live hero portrait (web): анимированный GIF с ручной маской Кирилла
   (panda-mask.png, альфа-канал). Статичный кадр при prefers-reduced-motion. */
import React from 'react';
import { unstable_createElement } from 'react-native-web';
import { reducedMotion } from './anim';

const GIF = require('../assets/avatars/panda-live.gif');
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

/* Раньше здесь был <video>. iOS-вебвью (в т.ч. Chrome на iPhone — там тот же WebKit) отказывал
   в автозапуске, кадр замирал, и поверх висела кнопка play. Анимация в <img> политикам
   автозапуска не подчиняется: играет всегда, везде и без жеста, рисовать поверх нечего. */
export function HeroVideoArt({ size = 144, style }) {
  const [failed, setFailed] = React.useState(false);
  const still = failed || reducedMotion();
  return unstable_createElement('img', {
    src: srcUri(still ? POSTER : GIF),
    alt: '',
    draggable: false,
    'aria-hidden': true,
    tabIndex: -1,
    onError: () => setFailed(true), // не догрузился GIF — показываем статичный кадр
    style: [box(size), style],
  });
}
