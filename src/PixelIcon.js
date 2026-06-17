/* Pixel-art icons (Pixelarticons, MIT) rendered as crisp vector pixel blocks via react-native-svg.
   PixelIcon = bare glyph; IconTile = glyph in a tinted pixel tile (for cards / perks / relics). */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PIXEL_PATHS } from './pixel-icons';
import { C, shade } from './theme';

export function PixelIcon({ name, size = 24, color = C.ink, style }) {
  const paths = PIXEL_PATHS[name];
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {paths.map((d, i) => (
        <Path key={i} d={d} fill={color} />
      ))}
    </Svg>
  );
}

// glyph centred in a pixel tile tinted by `color` — gives the icon presence in a card row.
export function IconTile({ name, color = C.gold, size = 44, style }) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: 4, borderWidth: 2, borderColor: color, backgroundColor: shade(color, -62), alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <PixelIcon name={name} size={Math.round(size * 0.6)} color={color} />
    </View>
  );
}
