import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EmptyState, OptionChip, PageHeader, Screen, SectionHeader, Skeleton, sym } from '@/components/ui';
import { VideoRow, VideoTile } from '@/components/video-cards';
import { Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useContent } from '@/hooks/use-content';
import { useAccent } from '@/hooks/use-theme';
import type { ContentKind } from '@/lib/api';

/** Darslar va Mashqlar tablari: yo'nalish filtri, tavsiya etilgan video va mavzular bo'yicha ro'yxat. */
export function ContentList({
  kind,
  accent,
  title,
  subtitle,
  tabs,
  extra,
}: {
  kind: ContentKind;
  accent: AccentName;
  title: string;
  subtitle: string;
  /** Sarlavha ostidagi bo'lim tanlagichi (Darslar: Video / Ovozli) */
  tabs?: ReactNode;
  /** Sarlavha ostidagi qo'shimcha karta (Mashqlar: Rasmli muloqot) */
  extra?: ReactNode;
}) {
  const { t } = useLocale();
  const a = useAccent(accent);
  const { categories, professions, error, reload, videos } = useContent(kind);
  const [refreshing, setRefreshing] = useState(false);
  /** Tanlangan yo'nalish slug'i: null — barchasi */
  const [profession, setProfession] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const activeProfession = professions.some((p) => p.slug === profession) ? profession : null;
  const visible = categories?.filter((c) => !activeProfession || c.profession === activeProfession) ?? [];
  const featured = visible[0]?.videos[0];

  return (
    <Screen withTabBar refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <PageHeader title={title} subtitle={subtitle} />
      {tabs}
      {extra}

      {error && !categories ? (
        <EmptyState
          icon={sym('wifi.slash', 'wifi_off')}
          title={t('common.offlineTitle')}
          body={t('common.offline')}
          actionTitle={t('common.retry')}
          onAction={reload}
        />
      ) : !categories ? (
        <View style={{ gap: Spacing.three }}>
          <Skeleton height={220} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </View>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={kind === 'lesson' ? sym('play.rectangle.fill', 'smart_display') : sym('figure.and.child.holdinghands', 'family_restroom')}
          title={t('content.emptyTitle')}
          body={t('content.empty')}
          color={a.fg}
          background={a.soft}
        />
      ) : (
        <>
          {professions.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: Spacing.two }}>
              <OptionChip label={t('content.all')} selected={activeProfession === null} onPress={() => setProfession(null)} />
              {professions.map((p) => (
                <OptionChip key={p.id} label={p.title} selected={activeProfession === p.slug} onPress={() => setProfession(p.slug)} />
              ))}
            </ScrollView>
          )}
          {featured && (
            <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
              <ThemedText type="caption" style={{ color: a.fg }}>
                {t('content.featured')}
              </ThemedText>
              <VideoTile video={featured} accent={accent} onPress={() => router.push(`/video/${featured.id}`)} />
            </Animated.View>
          )}
          {visible.map((category, ci) => (
            <Animated.View key={category.id} entering={FadeInDown.delay(80 * (ci + 1)).duration(400)} style={{ gap: Spacing.two + 2 }}>
              <SectionHeader title={category.title} />
              {category.description ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: -4 }}>
                  {category.description} · {category.videos.length} {t('common.videos')}
                </ThemedText>
              ) : null}
              {category.videos.map((video, i) => (
                <VideoRow key={video.id} video={video} accent={accent} index={i} onPress={() => router.push(`/video/${video.id}`)} />
              ))}
            </Animated.View>
          ))}
        </>
      )}
    </Screen>
  );
}
