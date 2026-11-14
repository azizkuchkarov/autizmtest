import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { assessmentTier, LevelBadge, useAssessmentAge, useFormatDate, useRiskColors } from '@/components/result-summary';
import { ResultV3, ResultV3Details, v3WeakDomains } from '@/components/result-v3';
import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, IconBadge, ListRow, LoadingState, Pill, ProgressBar, Screen, SectionHeader, sym } from '@/components/ui';
import { VideoTile } from '@/components/video-cards';
import { Spacing } from '@/constants/theme';
import { SHOW_CENTERS } from '@/constants/features';
import { useLocale } from '@/contexts/locale';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { fetchContent, type Video } from '@/lib/api';
import { domainStyle } from '@/lib/domains';
import { getAssessment, type StoredAssessment } from '@/lib/history';
import { getTestConfig, riskTier, weakDomains, type RiskTier } from '@/lib/screening';
import { isScreeningV3 } from '@/shared/lib/screening-v3/score';

const LEVEL_KEY: Record<RiskTier, 'result.levelLow' | 'result.levelModerate' | 'result.levelHigh'> = {
  low: 'result.levelLow',
  moderate: 'result.levelModerate',
  high: 'result.levelHigh',
};

function DomainCard({ id, title, score }: { id: string; title: string; score: number }) {
  const { t } = useLocale();
  const style = domainStyle(id);
  const accent = useAccent(style.accent);
  const tier = riskTier(score);
  const colors = useRiskColors(tier);
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <IconBadge name={style.icon} color={accent.fg} background={accent.soft} size={40} />
        <ThemedText type="heading" style={{ flex: 1, fontSize: 15 }} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: colors.fg }}>
          {t(LEVEL_KEY[tier])}
        </ThemedText>
      </View>
      <ProgressBar value={score} color={colors.fg} />
    </View>
  );
}

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const ageOf = useAssessmentAge();
  const centers = useAccent('centers');
  const lessons = useAccent('lessons');
  const exercises = useAccent('exercises');
  const [item, setItem] = useState<StoredAssessment | null | undefined>(undefined);
  const [recommended, setRecommended] = useState<Video[]>([]);

  useEffect(() => {
    getAssessment(id).then(setItem);
  }, [id]);

  // Zaif sohalarga mos uy mashqlari
  useEffect(() => {
    if (!item) return;
    const weak = isScreeningV3(item.result) ? v3WeakDomains(item.result) : weakDomains(item.result);
    fetchContent('lesson', locale)
      .then(({ categories }) => {
        const videos = categories.flatMap((c) => c.videos);
        const matches = videos.filter(
          (v) =>
            (v.domains.length === 0 || v.domains.some((d) => weak.includes(d))) &&
            (v.ageGroups.length === 0 || v.ageGroups.includes(item.ageGroup)),
        );
        setRecommended(matches.slice(0, 6));
      })
      .catch(() => setRecommended([]));
  }, [item, locale]);

  // Soha nomlari va savol matnlari tanlangan tilda
  const config = useMemo(() => (item ? getTestConfig(item.ageGroup, locale) : null), [item, locale]);
  const domainTitle = (blockId: string, fallback: string) => config?.domains.find((d) => d.id === blockId)?.title ?? fallback;
  const questionText = (qid: string, fallback: string) => config?.questions.find((q) => q.id === qid)?.text ?? fallback;

  const tier = item ? assessmentTier(item) : 'low';
  const colors = useRiskColors(tier);

  if (item === undefined) return <LoadingState />;
  if (item === null) return <EmptyState icon={sym('exclamationmark.triangle', 'error')} title={t('common.error')} />;

  const v3 = isScreeningV3(item.result) ? item.result : null;

  return (
    <Screen>
      {v3 ? <ResultV3 result={v3} createdAt={item.createdAt} age={ageOf(item)} /> : null}
      {!v3 && (
        <>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three }}>
          <ThemedText type="small" themeColor="textTertiary">
            {formatDate(item.createdAt)} · {ageOf(item)}
          </ThemedText>
          <LevelBadge tier={tier} size={88} />
          <ThemedText type="subtitle" style={{ color: colors.fg, textAlign: 'center' }}>
            {t(`result.${tier}`)}
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
            {t(`result.${tier}Body`)}
          </ThemedText>
        </Card>
      </Animated.View>

      <SectionHeader title={t('result.domains')} />
      <Animated.View entering={FadeInDown.delay(100).duration(450)}>
        <Card style={{ gap: Spacing.four }}>
          {item.result.blocks.map((b) => (
            <DomainCard key={b.blockId} id={b.blockId} title={domainTitle(b.blockId, b.title)} score={b.score} />
          ))}
        </Card>
      </Animated.View>

      {item.result.redFlagCount > 0 && (
        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <Card tone="dangerSoft" flat style={{ borderWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <SymbolView name={sym('exclamationmark.triangle.fill', 'warning')} size={18} tintColor={theme.danger} />
              <ThemedText type="heading" style={{ color: theme.danger, flex: 1 }}>
                {t('result.redFlags')} · {item.result.redFlagCount}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('result.redFlagsBody')}
            </ThemedText>
            {item.result.redFlags.map((f) => (
              <ThemedText key={f.questionId} type="body">
                • {questionText(f.questionId, f.text)}
              </ThemedText>
            ))}
          </Card>
        </Animated.View>
      )}
        </>
      )}

      {recommended.length > 0 && (
        <>
          <SectionHeader title={t('result.recommended')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: Spacing.three, paddingBottom: Spacing.three }}>
            {recommended.map((v) => (
              <VideoTile key={v.id} video={v} accent="exercises" width={240} onPress={() => router.push(`/video/${v.id}`)} />
            ))}
          </ScrollView>
        </>
      )}

      {v3 ? <ResultV3Details result={v3} /> : null}

      {!v3 && (
        <>
      <SectionHeader title={t('result.nextSteps')} />
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <ListRow
          icon={sym('stethoscope', 'medical_services')}
          iconColor={centers.fg}
          iconBackground={centers.soft}
          title={t('result.stepSpecialist')}
          subtitle={t('result.stepSpecialistBody')}
          onPress={SHOW_CENTERS ? () => router.push('/centers') : undefined}
        />
        <ListRow
          icon={sym('play.rectangle.fill', 'smart_display')}
          iconColor={lessons.fg}
          iconBackground={lessons.soft}
          title={t('result.stepLearn')}
          subtitle={t('result.stepLearnBody')}
          onPress={() => router.navigate('/lessons')}
        />
        <ListRow
          icon={sym('figure.and.child.holdinghands', 'family_restroom')}
          iconColor={exercises.fg}
          iconBackground={exercises.soft}
          title={t('result.stepPractice')}
          subtitle={t('result.stepPracticeBody')}
          onPress={() => router.navigate('/exercises')}
          last
        />
      </Card>
        </>
      )}

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
        {t('home.disclaimer')}
      </ThemedText>
    </Screen>
  );
}
