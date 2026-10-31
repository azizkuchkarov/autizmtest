import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { assessmentTier, nextScreeningDate, ResultRow, useFormatDate } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, GradientCard, PageHeader, Screen, SectionHeader, sym } from '@/components/ui';
import { HeroGradient, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { listAssessments, type StoredAssessment } from '@/lib/history';
import { bandForMonths, itemsFor, SECTIONS } from '@/shared/lib/screening-v3/items';
import { ageInMonths } from '@/shared/lib/screening-v3/score';

function SectionRow({ emoji, title, intro }: { emoji: string; title: string; intro: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.backgroundMuted }}>
        <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</ThemedText>
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="heading" style={{ fontSize: 15.5 }}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {intro}
        </ThemedText>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ThemedText type="number" style={{ color: '#FFFFFF' }}>
        {value}
      </ThemedText>
      <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {label}
      </ThemedText>
    </View>
  );
}

export default function TestTab() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const dark = useIsDark();
  // Savollar soni bolaning yoshiga qarab (oy noma'lum bo'lsa — taxminiy)
  const months = child ? ageInMonths(child.birthYear, child.birthMonth) : 42;
  const band = bandForMonths(months) ?? 'toddler';
  const questionCount = itemsFor(band, Math.max(16, months)).length;
  const minutes = Math.max(5, Math.round(questionCount * 0.35));
  const formatDate = useFormatDate();
  const [history, setHistory] = useState<StoredAssessment[]>([]);
  const lastScreening = history[0];

  useFocusEffect(
    useCallback(() => {
      listAssessments().then(setHistory);
    }, []),
  );

  return (
    <Screen withTabBar>
      <PageHeader title={t('test.title')} subtitle={t('test.subtitle')} />

      <Animated.View entering={FadeInDown.duration(400)}>
        <GradientCard colors={dark ? HeroGradient.dark : HeroGradient.light} style={{ gap: Spacing.three }}>
          <ThemedText type="subtitle" style={{ color: '#FFFFFF' }}>
            {t('test.heroTitle')}
          </ThemedText>
          <ThemedText type="body" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('test.heroBody')}
          </ThemedText>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 12 }}>
            <Stat value={String(questionCount)} label={t('test.statQuestions')} />
            <Stat value={`~${minutes}`} label={t('test.statMinutes')} />
            <Stat value="7" label={t('test.statDomains')} />
          </View>
          {lastScreening ? (
            <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('test.lastNext')
                .replace('{last}', formatDate(lastScreening.createdAt))
                .replace('{next}', formatDate(nextScreeningDate(lastScreening.createdAt, assessmentTier(lastScreening))))}
            </ThemedText>
          ) : null}
          <Button title={t('common.start')} variant="light" onPress={() => router.push('/screening/run')} icon={sym('play.fill', 'play_arrow')} />
        </GradientCard>
      </Animated.View>

      <SectionHeader title={t('test.domainsTitle')} />
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Card style={{ gap: Spacing.three + 2 }}>
          {SECTIONS.filter((x) => x.id !== 'history').map((x) => (
            <SectionRow key={x.id} emoji={x.emoji} title={x.title[locale]} intro={x.intro[locale]} />
          ))}
        </Card>
      </Animated.View>

      <Card tone="tintSoft" flat style={{ gap: Spacing.two }}>
        <ThemedText type="heading" style={{ fontSize: 16 }}>
          {t('test.howOftenTitle')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('test.howOften')}
        </ThemedText>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button title={t('test.skillsLink')} size="md" variant="secondary" onPress={() => router.push('/skills/run')} />
        </View>
      </Card>

      {history.length > 0 && (
        <>
          <SectionHeader title={t('test.history')} />
          {history.map((item) => (
            <ResultRow key={item.id} item={item} onPress={() => router.push(`/result/${item.id}`)} />
          ))}
        </>
      )}
    </Screen>
  );
}
