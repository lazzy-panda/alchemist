/* Alchemist — login / register screen (branded, parchment + wood aesthetic) */
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { C, FONT } from './theme';
import { useAuth } from './auth';
import { Gradient, Han, Btn, Field, Input, T, kf, KF, EASE } from './ui';

export function AuthScreen() {
  const { login, register, guest } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    const res = mode === 'login' ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (res && res.error) setError(res.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#2b4640' }}>
      <Gradient colors={['#36504a', '#243733']} angle={165} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }} showsVerticalScrollIndicator={false}>
            <View style={[{ width: '100%', maxWidth: 380 }, kf(KF.popIn, 0.5, { ease: EASE.overshoot })]}>
              {/* brand */}
              <View style={{ alignItems: 'center', marginBottom: 22 }}>
                <Gradient colors={['#e0654a', '#a93a24']} angle={160} style={{ width: 68, height: 68, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.redLine, marginBottom: 14 }}>
                  <Text style={{ fontSize: 64 }}>⚗️</Text>
                </Gradient>
                <Text style={{ fontFamily: FONT.display, fontSize: 44, color: '#F6D685' }}>Алхимик</Text>
                <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: '#b8c4bd', marginTop: 12, textAlign: 'center', lineHeight: 28 }}>RPG-трекер медитации, цигун и Чжан Чжуан</Text>
              </View>

              {/* card */}
              <Gradient colors={[C.paperCell, C.paperLight]} angle={180} style={{ borderRadius: 26, borderWidth: 5, borderColor: C.stoneDark, padding: 22, boxShadow: `inset 0px 0px 0px 3px ${C.stoneEdge}, 0px 14px 34px rgba(20,12,4,0.45)` }}>
                {/* tabs */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, backgroundColor: 'rgba(120,80,40,0.12)', borderRadius: 999, padding: 4 }}>
                  {[['login', 'Вход'], ['register', 'Регистрация']].map(([m, lbl]) => {
                    const on = mode === m;
                    return (
                      <Pressable key={m} onPress={() => { setMode(m); setError(''); }} accessibilityRole="button" accessibilityLabel={lbl} accessibilityState={{ selected: on }} style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}>
                        {on ? (
                          <Gradient colors={[C.jadeLight, C.jade]} angle={180} style={{ paddingVertical: 9, alignItems: 'center', borderRadius: 999, boxShadow: `0px 2px 0px ${C.jadeLine}` }}>
                            <Text style={{ fontFamily: FONT.display, fontWeight: '700', fontSize: 18, color: '#fff' }}>{lbl}</Text>
                          </Gradient>
                        ) : (
                          <View style={{ paddingVertical: 9, alignItems: 'center' }}>
                            <Text style={{ fontFamily: FONT.display, fontWeight: '600', fontSize: 18, color: C.inkMuted }}>{lbl}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {mode === 'register' ? (
                  <Field label="Имя">
                    <Input value={name} onChangeText={setName} placeholder="Ваше имя" autoCapitalize="words" />
                  </Field>
                ) : null}
                <Field label="Почта">
                  <Input value={email} onChangeText={setEmail} placeholder="вы@почта.рф" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </Field>
                <Field label="Пароль">
                  <Input value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry onSubmitEditing={submit} />
                </Field>

                {error ? (
                  <View style={{ backgroundColor: 'rgba(217,84,59,0.12)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(217,84,59,0.4)' }}>
                    <Text style={{ color: C.redDeep, fontFamily: FONT.ui, fontWeight: '600', fontSize: 26 }}>{error}</Text>
                  </View>
                ) : null}

                <Btn variant="primary" block onPress={submit} disabled={busy} style={{ marginTop: 4 }}>
                  {busy ? '…' : mode === 'login' ? 'Войти' : 'Начать путь'}
                </Btn>

                <Pressable onPress={async () => { setBusy(true); await guest(); setBusy(false); }} accessibilityRole="button" accessibilityLabel="Войти как гость" style={{ marginTop: 14, alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.ui, fontSize: 18, color: C.inkMuted }}>Войти как гость →</Text>
                </Pressable>
              </Gradient>

              <Text style={{ textAlign: 'center', color: '#8fa39a', fontSize: 16, marginTop: 18, fontFamily: FONT.ui }}>Путь следует природе</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Gradient>
    </View>
  );
}
