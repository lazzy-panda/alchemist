/* Alchemist — screen scroll + responsive content padding */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { C } from './theme';

export function ScreenScroll({ children, style, contentStyle }) {
  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: C.paper }, style]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function PadView({ wide, children, style }) {
  return (
    <View
      style={[
        wide
          ? { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 40, maxWidth: 980, width: '100%', alignSelf: 'center' }
          : { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 30 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
