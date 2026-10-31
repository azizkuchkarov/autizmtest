import { SymbolView } from 'expo-symbols';
import { Redirect, router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MonthGrid } from '@/components/child-form';
import { Questionnaire } from '@/components/questionnaire';
import { useFormatDate } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { createAssessmentV3 } from '@/lib/api';
import { getAssessment, newLocalId, saveAssessment } from '@/lib/history';
import type { ScreeningResult } from '@/lib/screening';
import { BAND_LABEL, bandForMonths, itemsFor, SECTIONS } from '@/shared/lib/screening-v3/items';
import { ageInMonths, needsFollowUp, scoreScreeningV3 } from '@/shared/lib/screening-v3/score';

/** Eski profillarda tug'ilgan oy yo'q — test oldidan bir marta so'raladi. */
function MonthPrompt() {
  const { t } = useLocale();
  const { child, updateChildFields } = useProfile();
  const [month, setMonth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Screen contentStyle={{ gap: Spacing.three }}>
      <Stack.Screen options={{ headerTitle: '' }} />
      <ThemedText style={{ fontSize: 52, lineHeight: 62 }}>🎂</ThemedText>
      <ThemedText type="title">{t('v3.monthTitle')}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {t('v3.monthBody')}
      </ThemedText>
      <MonthGrid birthYear={child?.birthYear ?? null} value={month} onChange={setMonth} />
      <View style={{ marginTop: Spacing.two }}>
        <Button
          title={t('common.next')}
          icon={sym('arrow.right', 'arrow_forward')}
          disabled={!month}
          loading={saving}
          onPress={async () => {
            setSaving(true);
            await updateChildFields({ birthMonth: month }).catch(() => setSaving(false));
          }}
        />
      </View>
    </Screen>
  );
}

/** 16 oydan kichik: skrining o'tkazilmaydi — kuzatish uchun xavf belgilari. */
function TooYoung({ months }: { months: number }) {
  const { t } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const at16 = new Date();
  at16.setMonth(at16.getMonth() + (16 - months));
  return (
    <Screen contentStyle={{ gap: Spacing.three }}>
      <Stack.Screen options={{ headerTitle: '' }} />
      <SymbolView name={sym('calendar.badge.clock', 'event_upcoming')} size={48} tintColor={theme.tint} />
      <ThemedText type="title">{t('v3.youngTitle')}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {t('v3.youngBody').replace('{m}', String(months)).replace('{date}', formatDate(at16.toISOString()))}
      </ThemedText>
      <Card style={{ gap: 10 }}>
        {(['v3.young1', 'v3.young2', 'v3.young3'] as const).map((k) => (
          <View key={k} style={styles.flagRow}>
            <SymbolView name={sym('exclamationmark.triangle.fill', 'warning')} size={15} tintColor={theme.warning} style={{ marginTop: 3 }} />
            <ThemedText type="body" style={{ flex: 1 }}>
              {t(k)}
            </ThemedText>
          </View>
        ))}
      </Card>
      <Button title={t('common.back')} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

export default function ScreeningRunScreen() {
  const { t, locale } = useLocale();
  const { child, phone } = useProfile();

  if (!child) return <Redirect href="/" />;
  if (!child.birthMonth) return <MonthPrompt />;

  const months = ageInMonths(child.birthYear, child.birthMonth);
  const band = bandForMonths(months);
  if (!band) return <TooYoung months={months} />;

  const items = itemsFor(band, months);
  const minutes = Math.max(5, Math.round(items.length * 0.35));
  const age = months < 36 ? t('v3.ageMonths').replace('{m}', String(months)) : `${Math.floor(months / 12)} ${t('common.years')}`;

  return (
    <Questionnaire
      draftKey={`autizm_screening_draft_v3:${child.id}:${band}`}
      welcome={{
        badge: BAND_LABEL[band][locale],
        title: t('v3.welcomeTitle'),
        body: t('v3.welcomeBody').replace('{n}', String(items.length)).replace('{m}', String(minutes)).replace('{age}', age),
        tips: [t('v3.tip1'), t('v3.tip2'), t('v3.tip3')],
      }}
      sections={SECTIONS.map((s) => ({ id: s.id, emoji: s.emoji, title: s.title[locale], intro: s.intro[locale] }))}
      items={items.map((i) => ({ id: i.id, section: i.section, text: i.text[locale], example: i.example?.[locale], kind: i.kind, followUp: i.followUp?.map((f) => f[locale]) }))}
      needsFollowUp={(q, a) => {
        const item = items.find((i) => i.id === q.id);
        return !!item && needsFollowUp(item, a);
      }}
      onSubmit={async (answers, followUps) => {
        const result = scoreScreeningV3({ months, answers, followUps });
        // Natija qurilmada darhol hisoblanadi; server nusxasi akkaunt tarixi va AI xulosa uchun
        let serverId: string | null = null;
        try {
          const res = await createAssessmentV3({ testType: 'screening', ageMonths: months, answers, followUps, childId: child.id, childGender: child.gender, phone: phone || undefined });
          serverId = res.assessmentId;
        } catch {
          serverId = null;
        }
        const id = newLocalId();
        await saveAssessment({ id, serverId, createdAt: new Date().toISOString(), ageGroup: result.ageGroupId, childGender: child.gender, result: result as unknown as ScreeningResult });
        if (!(await getAssessment(id))) throw new Error('not saved');
        return `/result/${id}`;
      }}
    />
  );
}

const styles = StyleSheet.create({
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
});
