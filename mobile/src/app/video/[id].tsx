import { useLocalSearchParams } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, Icon, Pill, Screen, Skeleton, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, fetchVideo, type Video } from '@/lib/api';
import { domainStyle } from '@/lib/domains';
import { useAccent } from '@/hooks/use-theme';
import type { TranslationKey } from '@/lib/i18n';
import { markVideoWatched } from '@/lib/video-log';

function Player({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // "Bugungi reja": video boshlanganda bugun ko'rilgan deb belgilanadi
  useEffect(() => {
    if (isPlaying) markVideoWatched(childKey);
  }, [isPlaying, childKey]);

  return (
    <View style={{ borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
      <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture />
    </View>
  );
}

const DOMAIN_TITLE: Record<string, TranslationKey> = { A: 'test.domainA', B: 'test.domainB', C: 'test.domainC' };

function DomainPill({ id }: { id: string }) {
  const { t } = useLocale();
  const a = useAccent(domainStyle(id).accent);
  return <Pill label={t(DOMAIN_TITLE[id] ?? 'test.domainA')} color={a.fg} background={a.soft} />;
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useLocale();
  const theme = useTheme();
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    fetchVideo(id, locale)
      .then((res) => setVideo(res.video))
      .catch(() => setError(true));
  }, [id, locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('wifi.slash', 'wifi_off')} title={t('common.offlineTitle')} body={t('common.offline')} actionTitle={t('common.retry')} onAction={load} />
      </View>
    );

  if (!video)
    return (
      <Screen>
        <Skeleton height={210} radius={Radius.lg} />
        <Skeleton height={28} width="70%" radius={8} />
        <Skeleton height={80} />
      </Screen>
    );

  const uri = absoluteUrl(video.videoUrl);
  const minutes = video.durationSec ? Math.max(1, Math.round(video.durationSec / 60)) : null;

  return (
    <Screen>
      {uri ? <Player uri={uri} /> : null}
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.three }}>
        <ThemedText type="title" style={{ fontSize: 25, lineHeight: 31 }}>
          {video.title}
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' }}>
          {minutes ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: Spacing.two }}>
              <Icon name={sym('clock', 'schedule')} size={14} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {minutes} {t('common.minutes')}
              </ThemedText>
            </View>
          ) : null}
          {video.domains.map((d) => (
            <DomainPill key={d} id={d} />
          ))}
        </View>
        {video.description ? (
          <Card>
            <ThemedText type="body">{video.description}</ThemedText>
          </Card>
        ) : null}
      </Animated.View>
    </Screen>
  );
}
