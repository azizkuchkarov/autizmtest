import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { assessmentTier, LevelBadge, useFormatDate, useRiskColors } from '@/components/result-summary';
import { TodayPlayCard } from '@/components/play';
import { HomeProgressHero } from '@/components/progress/home-hero';
import { TalkPromo } from '@/components/talk/promo';
import { ThemedText } from '@/components/themed-text';
import { TodayPlan } from '@/components/today-plan';
import { Button, Card, GradientCard, IconBadge, Pill, PressableScale, Screen, sym, type IconName } from '@/components/ui';
import { VideoCarousel } from '@/components/video-carousel';
import { HeroGradient, Radius, Spacing, type AccentName } from '@/constants/theme';
import { SHOW_CENTERS } from '@/constants/features';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useIsDark, useTheme } from '@/hooks/use-theme';
import { listAssessments, type StoredAssessment } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';

const TIPS: TranslationKey[] = ['home.tip1', 'home.tip2', 'home.tip3', 'home.tip4', 'home.tip5'];

function greetingKey(): TranslationKey {
  const h = new Date().getHours();
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
}

function QuickAction({ icon, label, hint, accent, onPress }: { icon: IconName; label: string; hint?: string; accent: AccentName; onPress: () => void }) {
  const a = useAccent(accent);
  return (
    <PressableScale onPress={onPress} style={styles.quick}>
      <IconBadge name={icon} color={a.fg} background={a.soft} size={56} />
      <View style={{ alignItems: 'center' }}>
        <ThemedText type="small" style={{ textAlign: 'center' }} numberOfLines={1}>
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 11.5, lineHeight: 15 }} numberOfLines={1}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </PressableScale>
  );
}

function StatusCard({ last }: { last: StoredAssessment | null }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const tier = last ? assessmentTier(last) : 'low';
  const colors = useRiskColors(tier);

  return (
    <Card>
      <ThemedText type="caption" themeColor="textTertiary">
        {t('home.statusTitle')}
      </ThemedText>
      {last ? (
        <PressableScale onPress={() => router.push(`/result/${last.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.one }}>
          <LevelBadge tier={tier} size={64} />
          <View style={{ flex: 1, gap: Spacing.one }}>
            <Pill label={t(`result.${tier}`)} color={colors.fg} background={colors.bg} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('home.statusLast')}: {formatDate(last.createdAt)}
            </ThemedText>
            <ThemedText type="smallBold" themeColor="tint" onPress={() => router.push('/screening/run')}>
              {t('home.statusRetake')} →
            </ThemedText>
          </View>
        </PressableScale>
      ) : (
        <ThemedText type="body" themeColor="textSecondary">
          {t('home.statusEmpty')}
        </ThemedText>
      )}
    </Card>
  );
}

/** Rivojlanish sahifasiga kirish: skrining va mashg'ulotlar natijasi bir joyda. */
function ProgressLink() {
  const { t } = useLocale();
  const theme = useTheme();
  const test = useAccent('test');
  return (
    <Card onPress={() => router.push('/progress')} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
      <IconBadge name={sym('chart.line.uptrend.xyaxis', 'monitoring')} color={test.fg} background={test.soft} size={46} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading">{t('progress.title')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('progress.subtitleDefault')}
        </ThemedText>
      </View>
      <SymbolView name={sym('chevron.right', 'chevron_right')} size={16} tintColor={theme.textTertiary} />
    </Card>
  );
}

export default function HomeScreen() {
  const { t } = useLocale();
  const { child } = useProfile();
  const dark = useIsDark();
  const lessons = useAccent('lessons');
  const [last, setLast] = useState<StoredAssessment | null>(null);
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);

  useFocusEffect(
    useCallback(() => {
      listAssessments().then((items) => setLast(items[0] ?? null));
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

      {/* Test topshirilgandan keyin — skrining taklifi o'rniga rivojlanish (testni "Test" tabidan qayta topshirish mumkin) */}
      <Animated.View entering={FadeInDown.delay(80).duration(450)}>
        {last ? (
          <HomeProgressHero last={last} />
        ) : (
          <GradientCard colors={dark ? HeroGradient.dark : HeroGradient.light} style={{ gap: Spacing.three }}>
            <View style={[styles.deco, { top: -30, right: -20, backgroundColor: 'rgba(255,255,255,0.08)', width: 160, height: 160 }]} />
            <View style={[styles.deco, { top: 60, right: 40, backgroundColor: 'rgba(250,204,21,0.9)', width: 18, height: 18 }]} />
            <View style={[styles.deco, { top: 24, right: 76, backgroundColor: 'rgba(34,197,94,0.9)', width: 12, height: 12 }]} />
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

      <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.quickRow}>
        <QuickAction icon={sym('play.rectangle.fill', 'smart_display')} label={t('home.quickLessons')} hint={t('home.quickLessonsHint')} accent="lessons" onPress={() => router.navigate('/lessons')} />
        <QuickAction icon={sym('figure.and.child.holdinghands', 'family_restroom')} label={t('home.quickExercises')} hint={t('home.quickExercisesHint')} accent="exercises" onPress={() => router.navigate('/exercises')} />
        {SHOW_CENTERS ? (
          <QuickAction icon={sym('building.2.fill', 'apartment')} label={t('home.quickCenters')} accent="centers" onPress={() => router.push('/centers')} />
        ) : null}
        <QuickAction icon={sym('chart.bar.fill', 'bar_chart')} label={t('home.quickHistory')} accent="test" onPress={() => router.navigate('/test')} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(450)}>
        <TodayPlayCard />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(450)}>
        <TalkPromo />
      </Animated.View>

      {/* Test bo'lmasa — holat kartasi va Rivojlanish havolasi; bo'lsa — bularning hammasi yuqoridagi kartada */}
      {last ? null : (
        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <StatusCard last={last} />
        </Animated.View>
      )}
      {last ? null : (
        <Animated.View entering={FadeInDown.delay(270).duration(450)}>
          <ProgressLink />
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(300).duration(450)}>
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

      <VideoCarousel kind="lesson" title={t('home.lessonsSection')} accent="lessons" seeAllHref="/lessons" />
      <VideoCarousel kind="exercise" title={t('home.exercisesSection')} accent="exercises" seeAllHref="/exercises" />

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', paddingHorizontal: Spacing.three, marginTop: Spacing.three }}>
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
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
