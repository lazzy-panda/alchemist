/* Pixel-art icons (Pixelarticons, MIT) rendered as crisp vector pixel blocks via react-native-svg.
   PixelIcon = bare glyph; IconTile = glyph in a tinted pixel tile (for cards / perks / relics). */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PIXEL_PATHS } from './pixel-icons';
import { C, shade } from './theme';

// hand-drawn pixel icons not in Pixelarticons (24x24 grid). Kept here so they survive a
// regeneration of pixel-icons.js. `brain` = rounded mass + central fissure + gyri folds.
const CUSTOM_PATHS = {
  brain: ['M9 4H15V5H9ZM7 5H17V6H7ZM6 6H11V7H6ZM13 6H18V7H13ZM5 7H6V8H5ZM8 7H11V8H8ZM13 7H16V8H13ZM18 7H19V8H18ZM5 8H11V9H5ZM13 8H19V9H13ZM4 9H7V10H4ZM10 9H11V10H10ZM13 9H14V10H13ZM17 9H20V10H17ZM4 10H11V11H4ZM13 10H20V11H13ZM4 11H6V12H4ZM9 11H11V12H9ZM13 11H15V12H13ZM18 11H20V12H18ZM5 12H11V13H5ZM13 12H19V13H13ZM5 13H8V14H5ZM10 13H11V14H10ZM13 13H14V14H13ZM16 13H19V14H16ZM6 14H11V15H6ZM13 14H18V15H13ZM7 15H17V16H7ZM9 16H15V17H9ZM11 17H13V18H11ZM11 18H13V19H11Z'],
  // hamburger menu — three pixel bars (not in the Pixelarticons set)
  menu: ['M2 5h20v2H2V5zm0 6h20v2H2v-2zm0 6h20v2H2v-2z'],
};
const PATHS = { ...PIXEL_PATHS, ...CUSTOM_PATHS };

export function PixelIcon({ name, size = 24, color = C.ink, style }) {
  const paths = PATHS[name];
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
