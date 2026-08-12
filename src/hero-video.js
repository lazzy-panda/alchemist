/* Alchemist — live hero portrait, native fallback: статичный постер в той же рамке. */
import React from 'react';
import { Image } from 'react-native';
import { C } from './theme';

const POSTER = require('../assets/avatars/panda-live.jpg');

export function HeroVideoArt({ size = 144, style }) {
  return (
    <Image
      source={POSTER}
      resizeMode="cover"
      style={[{ width: size, height: size, borderRadius: 8, borderWidth: 3, borderColor: C.goldLine, backgroundColor: C.frameDark }, style]}
    />
  );
}
