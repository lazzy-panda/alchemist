// src/screens/Teacher.js — teacher-ambassador surface: enable mode, share link, dashboard, rev-share
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { C, FONT } from '../theme';
import { KitPanel } from '../kit';
import { Btn } from '../ui';
import { useTeacher, revshareEstimateRub, weekPctLabel } from '../teacher';

const BOT = 'helper_28052025_bot'; // @BotFather bot username
const APP = 'Alchemist';           // Mini App short_name (BotFather /newapp) — direct-link host

function Row({ r }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.paperDeep }}>
      <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, flex: 1 }} numberOfLines={1}>{r.student_label}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 64, textAlign: 'right' }}>{r.today_done}/{r.today_total}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.gold, width: 52, textAlign: 'right' }}>🔥{r.streak}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 56, textAlign: 'right' }}>{weekPctLabel(r.week_pct)}</Text>
      <Text style={{ fontSize: 16, width: 36, textAlign: 'right' }}>{r.paid ? '💎' : '·'}</Text>
    </View>
  );
}

export function TeacherScreen({ ctx }) {
  const { teacher, rows, paying, loading, enable, refresh } = useTeacher(ctx.userId);
  const [copied, setCopied] = useState(false);
  const link = teacher ? `https://t.me/${BOT}/${APP}?startapp=${teacher.referral_code}` : '';

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  // enabling teacher mode must also reveal the «Учитель» nav tab immediately (not just after reload)
  const onEnable = async () => { const code = await enable(); if (code && ctx.onBecameTeacher) ctx.onBecameTeacher(); };

  if (!teacher) {
    return (
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <KitPanel>
          <Text style={{ fontFamily: FONT.display, fontSize: 24, color: C.gold, marginBottom: 10 }}>Режим учителя</Text>
          <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, lineHeight: 26, marginBottom: 16 }}>
            Включи режим учителя — получишь личную ссылку для учеников и приватный дашборд их практики.
            Ученики, пришедшие по ссылке, закрепляются за тобой.
          </Text>
          <Btn variant="gold" block onPress={onEnable}>Включить режим учителя</Btn>
        </KitPanel>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
      <KitPanel>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold, marginBottom: 8 }}>Твоя ссылка</Text>
        <Text selectable style={{ fontFamily: FONT.ui, fontSize: 14, color: C.inkMuted, marginBottom: 10 }}>{link}</Text>
        <Btn variant="gold" block onPress={copy}>{copied ? 'Скопировано ✓' : 'Скопировать ссылку'}</Btn>
      </KitPanel>

      <KitPanel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold }}>Ученики</Text>
          <Pressable onPress={refresh}><Text style={{ fontFamily: FONT.ui, fontSize: 14, color: C.inkMuted }}>{loading ? '…' : '⟳'}</Text></Pressable>
        </View>
        {rows.length === 0
          ? <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.inkFaint, paddingVertical: 8 }}>Пока никто не присоединился. Поделись ссылкой выше.</Text>
          : rows.map((r) => <Row key={r.student_id} r={r} />)}
      </KitPanel>

      <KitPanel>
        <Text style={{ fontFamily: FONT.display, fontSize: 18, color: C.gold, marginBottom: 6 }}>Доход (оценка)</Text>
        <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.ink }}>
          Платящих учеников: {paying}. Примерно ≈ {revshareEstimateRub(paying)}₽/мес (rev-share).
        </Text>
      </KitPanel>
    </ScrollView>
  );
}
