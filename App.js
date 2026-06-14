import React from 'react';
import { View } from 'react-native';
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
  return (
    <AuthProvider>
      <Gate />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
