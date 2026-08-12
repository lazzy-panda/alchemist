/* Alchemist — live hero portrait, native fallback: статичный постер целиком, без рамки. */
import React from 'react';
import { Image } from 'react-native';

const POSTER = require('../assets/avatars/panda-live.jpg');

export function HeroVideoArt({ size = 144, style }) {
  return (
    <Image
      source={POSTER}
      resizeMode="cover"
      style={[{ width: size, height: size, borderRadius: 6 }, style]}
    />
  );
}

/* Подложка шапки существует только на вебе. */
export function HeroWall() {
  return null;
}
