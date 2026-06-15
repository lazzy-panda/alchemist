import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './src/theme';
import { useAppFonts } from './src/fonts';
import { AuthProvider, useAuth } from './src/auth';
import { EffectsProvider } from './src/effects';
import { AuthScreen } from './src/AuthScreen';
import { MainApp } from './src/MainApp';

function Gate() {
  const fontsReady = useAppFonts();
  const { ready, user } = useAuth();
  if (!fontsReady || !ready) return <View style={{ flex: 1, backgroundColor: C.paper }} />;
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
      console.log('%c修真之路 · Alchemist', 'font-size:15px;font-weight:700;color:#3E8C60');
      console.log('%c「大道至简」— великий Путь предельно прост.  Код открыт: github.com/lazzy-panda/alchemist', 'color:#B27C24');
    }
  }, []);
  return (
    <AuthProvider>
      <Gate />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
