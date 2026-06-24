// src/screens/Teacher.js — teacher-ambassador surface: enable mode, share link, dashboard, rev-share.
// Uses the app's standard screen layout (ScreenScroll + PadView + SectionHead + grey Card) so it
// matches every other screen; the bare golden KitPanel was overflowing its frame.
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { C, FONT } from '../theme';
import { ScreenScroll, PadView } from '../layout';
import { Card, Btn, SectionHead } from '../ui';
import { useTeacher, revshareEstimateRub, weekPctLabel } from '../teacher';

const BOT = 'helper_28052025_bot'; // @BotFather bot username
const APP = 'Alchemist';           // Mini App short_name (BotFather /newapp) — direct-link host

// one student row in the dashboard: name · today done/total · streak · week% · paid
function Row({ r, last, nativeID }) {
  return (
    <View nativeID={nativeID} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(120,96,52,0.28)' }}>
      <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, flex: 1 }} numberOfLines={1}>{r.student_label}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 58, textAlign: 'right' }}>{r.today_done}/{r.today_total}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.gold, width: 48, textAlign: 'right' }}>🔥{r.streak}</Text>
      <Text style={{ fontFamily: FONT.display, fontSize: 14, color: C.inkMuted, width: 50, textAlign: 'right' }}>{weekPctLabel(r.week_pct)}</Text>
      <Text style={{ fontSize: 16, width: 30, textAlign: 'right' }}>{r.paid ? '💎' : '·'}</Text>
    </View>
  );
}

export function TeacherScreen({ ctx }) {
  const { wide } = ctx;
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
      <ScreenScroll nativeID="screen-teacher">
        <PadView wide={wide}>
          <SectionHead nativeID="teacher-enable-head" title="Режим учителя" />
          <Card nativeID="teacher-enable-card" frame="grey">
            <Text style={{ fontFamily: FONT.ui, fontSize: 16, color: C.ink, lineHeight: 26, marginBottom: 18 }}>
              Включи режим учителя — получишь личную ссылку для учеников и приватный дашборд их практики.
              Ученики, пришедшие по ссылке, закрепляются за тобой.
            </Text>
            <Btn nativeID="teacher-enable" variant="gold" block onPress={onEnable}>Включить режим учителя</Btn>
          </Card>
        </PadView>
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll nativeID="screen-teacher">
      <PadView wide={wide}>
        <SectionHead nativeID="teacher-link-head" title="Твоя ссылка" />
        <Card nativeID="teacher-link-card" frame="grey">
          <Text nativeID="teacher-link" selectable style={{ fontFamily: FONT.ui, fontSize: 14, color: C.inkMuted, lineHeight: 20, marginBottom: 14 }}>{link}</Text>
          <Btn nativeID="teacher-copy" variant="gold" block onPress={copy}>{copied ? 'Скопировано ✓' : 'Скопировать ссылку'}</Btn>
        </Card>

        <SectionHead
          nativeID="teacher-students"
          title="Ученики"
          right={(
            <Pressable nativeID="teacher-refresh" onPress={refresh} hitSlop={10} accessibilityRole="button" accessibilityLabel="Обновить">
              <Text style={{ fontFamily: FONT.display, fontSize: 20, color: C.inkMuted }}>{loading ? '…' : '⟳'}</Text>
            </Pressable>
          )}
        />
        <Card nativeID="teacher-students-card" frame="grey">
          {rows.length === 0 ? (
            <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.inkFaint, lineHeight: 22, paddingVertical: 4 }}>
              Пока никто не присоединился. Поделись ссылкой выше — ученики, открывшие её, появятся здесь.
            </Text>
          ) : (
            rows.map((r, i) => <Row nativeID={`teacher-student-${r.student_id}`} key={r.student_id} r={r} last={i === rows.length - 1} />)
          )}
        </Card>

        <SectionHead nativeID="teacher-income" title="Доход (оценка)" />
        <Card nativeID="teacher-revshare" frame="grey">
          <Text style={{ fontFamily: FONT.ui, fontSize: 15, color: C.ink, lineHeight: 24 }}>
            Платящих учеников: <Text style={{ color: C.gold }}>{paying}</Text>.{'\n'}
            Примерный доход ≈ <Text style={{ color: C.gold }}>{revshareEstimateRub(paying)}₽/мес</Text> (rev-share).
          </Text>
        </Card>
      </PadView>
    </ScreenScroll>
  );
}
