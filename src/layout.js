/* Alchemist — screen scroll + responsive content padding */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { C } from './theme';

// comfortable single-column reading width on desktop (shared by PadView + full-bleed banners)
export const WIDE_MAX = 760;

export function ScreenScroll({ children, style, contentStyle, nativeID, scrollRef }) {
  return (
    <ScrollView
      ref={scrollRef}
      nativeID={nativeID}
      style={[{ flex: 1, backgroundColor: C.paper }, style]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function PadView({ wide, children, style, nativeID }) {
  return (
    <View
      nativeID={nativeID}
      style={[
        wide
          ? { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40, maxWidth: WIDE_MAX, width: '100%', alignSelf: 'center' }
          : { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
