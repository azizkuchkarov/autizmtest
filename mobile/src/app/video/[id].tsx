import { router, useLocalSearchParams } from 'expo-router';
import { useEventListener } from 'expo';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { sectionLook } from '@/components/lesson-sections';
import { Button, Card, EmptyState, Icon, Pill, Screen, SectionHeader, Skeleton, sym } from '@/components/ui';
import { VideoRow } from '@/components/video-cards';
import { ExerciseAddCard } from '@/components/video-exercises';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, fetchVideo, type Video } from '@/lib/api';
import { domainStyle } from '@/lib/domains';
import { useAccent } from '@/hooks/use-theme';
import type { TranslationKey } from '@/lib/i18n';
import { markVideoWatched } from '@/lib/video-log';
import { buildSections, flushVideoProgress, getVideoState, recordPosition, useVideoProgress } from '@/lib/video-progress';
import { useContent } from '@/hooks/use-content';

/** Pleyer: to'xtagan joydan davom etadi va oxirigacha ko'rilganda belgi qo'yadi. */
function Player({ uri, videoId, durationSec }: { uri: string; videoId: string; durationSec: number | null }) {
  const startAt = getVideoState(videoId)?.pos ?? 0;
  const player = useVideoPlayer(uri, (p) => {
    p.timeUpdateEventInterval = 3;
  });
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const resumed = useRef(false);

  const save = useCallback(
    (position: number) => {
      const duration = player.duration > 0 ? player.duration : durationSec;
      if (recordPosition(videoId, position, duration)) {
        // "Bugungi reja": video oxirigacha ko'rilganda bajarildi
        markVideoWatched(childKey);
        flushVideoProgress();
      }
    },
    [player, durationSec, videoId, childKey],
  );

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay' && !resumed.current) {
      resumed.current = true;
      if (startAt > 0) player.currentTime = startAt;
    }
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (resumed.current && currentTime > 0) save(currentTime);
  });
  useEventListener(player, 'playToEnd', () => {
    const duration = player.duration > 0 ? player.duration : durationSec;
    if (duration) save(duration);
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (!isPlaying) flushVideoProgress();
  });
  useEffect(() => () => void flushVideoProgress(), []);

  return (
    <View style={{ borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000' }}>
      <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} nativeControls fullscreenOptions={{ enable: true }} />
    </View>
  );
}

/** Dars ko'rilgach: tasdiq va keyingi darsga bitta bosish. */
function DoneCard({ next, sectionSlug }: { next: Video | null; sectionSlug: string | null }) {
  const { t } = useLocale();
  const green = useAccent('exercises');
  return (
    <Animated.View entering={FadeInDown.duration(350)}>
      <Card style={{ backgroundColor: green.soft, borderColor: 'transparent' }}>
        <View style={{ gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={24} tintColor={green.fg} />
            <ThemedText type="heading" style={{ flex: 1, color: green.fg, fontSize: 17 }}>
              {t('video.doneTitle')}
            </ThemedText>
          </View>
          {next ? (
            <Button title={`${t('video.next')}: ${next.title}`} size="md" onPress={() => router.replace(`/video/${next.id}`)} />
          ) : sectionSlug ? (
            <Button title={t('video.backToSection')} size="md" variant="secondary" onPress={() => router.replace(`/section/${sectionSlug}`)} />
          ) : null}
        </View>
      </Card>
    </Animated.View>
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
  const progress = useVideoProgress();
  const { categories, professions } = useContent('lesson');

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
  const done = !!progress[video.id]?.done;
  // Keyingi dars — shu bo'limdagi tartib bo'yicha
  const section = categories ? buildSections(professions, categories, progress).find((sec) => sec.videos.some((v) => v.id === video.id)) : undefined;
  const list = section?.videos ?? [];
  const next = list.slice(list.findIndex((v) => v.id === video.id) + 1).find((v) => !progress[v.id]?.done) ?? null;
  const upNext = list.slice(list.findIndex((v) => v.id === video.id) + 1).filter((v) => !progress[v.id]?.done && (!done || v.id !== next?.id)).slice(0, 3);
  const look = sectionLook(section?.slug ?? '');
  const minutes = video.durationSec ? Math.max(1, Math.round(video.durationSec / 60)) : null;

  return (
    <Screen>
      {uri ? <Player key={video.id} uri={uri} videoId={video.id} durationSec={video.durationSec} /> : null}
      {done ? <DoneCard next={next} sectionSlug={section?.slug ?? null} /> : null}
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
      <ExerciseAddCard video={video} />
      {upNext.length > 0 ? (
        <View style={{ gap: Spacing.two + 2 }}>
          <SectionHeader title={t('video.upNext')} />
          {upNext.map((v) => (
            <VideoRow key={v.id} video={v} accent={look.accent} onPress={() => router.replace(`/video/${v.id}`)} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
