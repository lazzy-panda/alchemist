import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './src/theme';
import { useAppFonts } from './src/fonts';
import { AuthProvider, useAuth } from './src/auth';
import { EffectsProvider } from './src/effects';
import { AuthScreen } from './src/AuthScreen';
import { MainApp } from './src/MainApp';
import { RpguiRoot } from './src/RpguiRoot';

function Splash() {
  // a branded loading screen (not a blank background) while fonts/session initialise
  return (
    <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 56, marginBottom: 18 }}>⚗️</Text>
      <ActivityIndicator size="large" color={C.gold} />
    </View>
  );
}

function Gate() {
  const fontsReady = useAppFonts();
  const { ready, user } = useAuth();
  if (!fontsReady || !ready) return <Splash />;
  if (!user) return <AuthScreen />;
  return (
    <EffectsProvider>
      <MainApp />
    </EffectsProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof console !== 'undefined') {
      console.log('%c⚗ Alchemist', 'font-size:15px;font-weight:700;color:#7BD0A0');
      console.log('%cThe great Way is simple.  Open source: github.com/lazzy-panda/alchemist', 'color:#E0A93C');
    }
  }, []);
  return (
    <AuthProvider>
      <RpguiRoot>
        <Gate />
        <StatusBar style="dark" />
      </RpguiRoot>
    </AuthProvider>
  );
}
