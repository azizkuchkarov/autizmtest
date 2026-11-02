import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ContinueCard, sectionLook } from '@/components/lesson-sections';
import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, ProgressBar, Screen, SectionHeader, Skeleton, sym } from '@/components/ui';
import { VideoRow } from '@/components/video-cards';
import { Accents, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useContent } from '@/hooks/use-content';
import { buildSections, syncVideoProgress, useVideoProgress } from '@/lib/video-progress';

/** Bo'lim ichi: nechtasi ko'rilgani, navbatdagi dars va mavzular bo'yicha videolar. */
export default function SectionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLocale();
  const { categories, professions, error, reload } = useContent('lesson');
  const progress = useVideoProgress();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    syncVideoProgress();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), syncVideoProgress()]);
    setRefreshing(false);
  };

  const section = categories ? buildSections(professions, categories, progress).find((s) => s.slug === slug) : undefined;
  const look = sectionLook(slug);
  const a = Accents[look.accent];

  if (error && !categories)
    return (
      <Screen>
        <EmptyState
          icon={sym('wifi.slash', 'wifi_off')}
          title={t('common.offlineTitle')}
          body={t('common.offline')}
          actionTitle={t('common.retry')}
          onAction={reload}
        />
      </Screen>
    );

  if (!section)
    return (
      <Screen>
        <Skeleton height={108} />
        <Skeleton height={84} />
        <Skeleton height={84} />
      </Screen>
    );

  const total = section.videos.length;
  if (total === 0)
    return (
      <Screen>
        <Stack.Screen options={{ title: section.title }} />
        <EmptyState icon={look.icon} title={t('content.emptyTitle')} body={t('content.empty')} color={a.fg} background={a.soft} />
      </Screen>
    );

  const allDone = section.done === total;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Stack.Screen options={{ title: section.title }} />
      <Card>
        <View style={{ gap: 8 }}>
          <ThemedText type="heading" style={{ fontSize: 17, color: allDone ? Accents.exercises.fg : undefined }}>
            {allDone
              ? t('lessons.allDone')
              : t('lessons.watchedOf').replace('{done}', String(section.done)).replace('{total}', String(total))}
          </ThemedText>
          <ProgressBar value={(section.done / total) * 100} color={allDone ? Accents.exercises.fg : a.fg} />
          {allDone ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('lessons.allDoneBody')}
            </ThemedText>
          ) : null}
        </View>
      </Card>
      {section.next ? (
        <ContinueCard video={section.next} accent={look.accent} started={section.done > 0 || (progress[section.next.id]?.pos ?? 0) > 0} />
      ) : null}
      {section.categories.map((category, ci) => (
        <Animated.View key={category.id} entering={FadeInDown.delay(70 * ci).duration(380)} style={{ gap: Spacing.two + 2 }}>
          <SectionHeader title={category.title} />
          {category.description ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: -4 }}>
              {category.description}
            </ThemedText>
          ) : null}
          {category.videos.map((video, i) => (
            <VideoRow key={video.id} video={video} accent={look.accent} index={i} onPress={() => router.push(`/video/${video.id}`)} />
          ))}
        </Animated.View>
      ))}
    </Screen>
  );
}
