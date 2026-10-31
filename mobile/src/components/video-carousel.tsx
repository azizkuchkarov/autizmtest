import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { SectionHeader, Skeleton } from '@/components/ui';
import { VideoTile } from '@/components/video-cards';
import { Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import type { ContentKind } from '@/lib/api';
import { useContent } from '@/hooks/use-content';

/** Bosh sahifadagi gorizontal video karusel. Videolar bo'lmasa yoki ulanib bo'lmasa ko'rsatilmaydi. */
export function VideoCarousel({ kind, title, accent, seeAllHref }: { kind: ContentKind; title: string; accent: AccentName; seeAllHref: '/lessons' | '/exercises' }) {
  const { t } = useLocale();
  const { categories, error, videos } = useContent(kind);

  if (error || (categories && videos.length === 0)) return null;

  return (
    <View style={{ gap: Spacing.three }}>
      <SectionHeader title={title} action={t('common.seeAll')} onAction={() => router.navigate(seeAllHref)} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: Spacing.three, paddingBottom: Spacing.three }}>
        {!categories
          ? [0, 1].map((i) => (
              <View key={i} style={{ width: 240, gap: Spacing.two }}>
                <Skeleton height={150} />
                <Skeleton height={16} width="80%" radius={8} />
              </View>
            ))
          : videos.slice(0, 8).map((v) => <VideoTile key={v.id} video={v} accent={accent} width={240} onPress={() => router.push(`/video/${v.id}`)} />)}
      </ScrollView>
    </View>
  );
}
