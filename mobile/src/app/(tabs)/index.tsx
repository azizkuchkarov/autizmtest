import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { HomeLessonCard, HomeProgressCard, NextStepCard } from '@/components/home-cards';
import { ThemedText } from '@/components/themed-text';
import { TodayPlan, WeekSchedule } from '@/components/today-plan';
import { Button, Card, GradientCard, IconBadge, Pill, PressableScale, Screen, sym } from '@/components/ui';
import { HeroGradient, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useIsDark } from '@/hooks/use-theme';
import { listAssessments, type StoredAssessment } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';

const TIPS: TranslationKey[] = ['home.tip1', 'home.tip2', 'home.tip3', 'home.tip4', 'home.tip5'];

function greetingKey(): TranslationKey {
  const h = new Date().getHours();
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
}

export default function HomeScreen() {
  const { t } = useLocale();
  const { child } = useProfile();
  const dark = useIsDark();
  const lessons = useAccent('lessons');
  const [items, setItems] = useState<StoredAssessment[]>([]);
  const last = items[0] ?? null;
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);

  useFocusEffect(
    useCallback(() => {
      listAssessments().then(setItems);
    }, []),
  );

  const subtitle = child?.name ? t('home.forChild').replace('{name}', child.name) : t('home.forChildDefault');

  return (
    <Screen withTabBar contentStyle={{ paddingTop: Spacing.three }}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">{t(greetingKey())} 👋</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
        <PressableScale onPress={() => router.navigate('/profile')}>
          <Avatar id={child?.avatar} size={52} />
        </PressableScale>
      </Animated.View>

      {/* Test bo'lmasa — birinchi qadam test; bo'lsa — bugungi navbatdagi vazifa */}
      <Animated.View entering={FadeInDown.delay(80).duration(450)}>
        {last ? (
          <NextStepCard />
        ) : (
          <GradientCard colors={dark ? HeroGradient.dark : HeroGradient.light} style={{ gap: Spacing.three }}>
            <View style={[styles.deco, { top: -30, right: -20, backgroundColor: 'rgba(255,255,255,0.08)', width: 160, height: 160 }]} />
            <Pill label={t('home.heroBadge')} color="#FFFFFF" background="rgba(255,255,255,0.18)" />
            <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontSize: 23, lineHeight: 30, maxWidth: '88%' }}>
              {t('home.heroTitle')}
            </ThemedText>
            <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('home.heroMeta')}
            </ThemedText>
            <Button title={t('home.heroCta')} variant="light" onPress={() => router.push('/screening/run')} icon={sym('arrow.right', 'arrow_forward')} />
          </GradientCard>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <TodayPlan />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(450)}>
        <WeekSchedule />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(450)}>
        <HomeLessonCard />
      </Animated.View>

      {last ? (
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <HomeProgressCard items={items} />
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(240).duration(450)}>
        <Card tone="backgroundElement" style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' }}>
          <IconBadge name={sym('lightbulb.fill', 'lightbulb')} color={lessons.fg} background={lessons.soft} size={40} />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="caption" style={{ color: lessons.fg }}>
              {t('home.tipTitle')}
            </ThemedText>
            <ThemedText type="body">{t(tip)}</ThemedText>
          </View>
        </Card>
      </Animated.View>

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', paddingHorizontal: Spacing.three, marginTop: Spacing.two }}>
        {t('home.disclaimer')}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  deco: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
});
