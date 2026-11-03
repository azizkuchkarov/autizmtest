import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Pill, PressableScale, sym, useCardShadow } from '@/components/ui';
import { Accents, Radius, Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, type Video } from '@/lib/api';
import { useVideoProgress, type VideoState } from '@/lib/video-progress';

function useDuration(sec: number | null) {
  const { t } = useLocale();
  if (!sec) return null;
  return `${Math.max(1, Math.round(sec / 60))} ${t('common.minutes')}`;
}

/** Muqova: rasm bo'lsa rasm, bo'lmasa bo'lim gradienti va ikonka. */
function Thumbnail({ video, accent, iconSize, state }: { video: Video; accent: AccentName; iconSize: number; state?: VideoState }) {
  const uri = absoluteUrl(video.thumbnailUrl);
  const done = !!state?.done;
  const part = !done && state?.pos && video.durationSec ? Math.min(100, (state.pos / video.durationSec) * 100) : 0;
  return (
    <>
      <LinearGradient colors={Accents[accent].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
      {done ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,19,48,0.42)' }]} /> : null}
      <View
        style={[
          styles.play,
          { width: iconSize, height: iconSize, borderRadius: iconSize / 2 },
          done && { backgroundColor: Accents.exercises.fg, borderColor: '#FFFFFF' },
        ]}>
        <SymbolView name={done ? sym('checkmark', 'check') : sym('play.fill', 'play_arrow')} size={iconSize * (done ? 0.5 : 0.42)} tintColor="#FFFFFF" />
      </View>
      {part > 0 ? (
        <View style={styles.partTrack}>
          <View style={{ width: `${part}%`, height: '100%', backgroundColor: '#FFFFFF' }} />
        </View>
      ) : null}
    </>
  );
}

/** Ko'rilgan, chala qolgan yoki yangi video holati: bitta qator. */
function VideoStatus({ video, state, accent }: { video: Video; state?: VideoState; accent: AccentName }) {
  const { t } = useLocale();
  const theme = useTheme();
  const duration = useDuration(video.durationSec);
  if (state?.done)
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={13} tintColor={Accents.exercises.fg} />
        <ThemedText type="smallBold" style={{ color: Accents.exercises.fg, fontSize: 12.5 }}>
          {t('video.watched')}
        </ThemedText>
      </View>
    );
  if (state?.pos && video.durationSec)
    return (
      <ThemedText type="smallBold" style={{ color: Accents[accent].fg, fontSize: 12.5 }}>
        {t('video.minutesLeft').replace('{n}', String(Math.max(1, Math.round((video.durationSec - state.pos) / 60))))}
      </ThemedText>
    );
  if (!duration) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <SymbolView name={sym('clock', 'schedule')} size={12} tintColor={theme.textTertiary} />
      <ThemedText type="small" themeColor="textTertiary">
        {duration}
      </ThemedText>
    </View>
  );
}

/** Gorizontal karuseldagi katta kartochka. */
export function VideoTile({ video, accent, onPress, width }: { video: Video; accent: AccentName; onPress: () => void; width?: number }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const duration = useDuration(video.durationSec);
  const state = useVideoProgress()[video.id];
  return (
    <PressableScale onPress={onPress} style={[styles.tile, shadow, { width, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.tileThumb}>
        <Thumbnail video={video} accent={accent} iconSize={44} state={state} />
        {duration ? (
          <View style={styles.durationBadge}>
            <ThemedText type="smallBold" style={{ color: '#fff', fontSize: 11.5 }}>
              {duration}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={{ padding: Spacing.three, gap: 2 }}>
        <ThemedText type="heading" numberOfLines={2} style={{ fontSize: 15.5 }}>
          {video.title}
        </ThemedText>
        {video.description ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {video.description}
          </ThemedText>
        ) : null}
      </View>
    </PressableScale>
  );
}

/** Ro'yxat qatori ko'rinishidagi kartochka. */
export function VideoRow({ video, accent, onPress, index }: { video: Video; accent: AccentName; onPress: () => void; index?: number }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const { t } = useLocale();
  const state = useVideoProgress()[video.id];
  return (
    <PressableScale onPress={onPress} style={[styles.row, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.rowThumb}>
        <Thumbnail video={video} accent={accent} iconSize={30} state={state} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText type="smallBold" numberOfLines={2} style={{ fontSize: 14.5, lineHeight: 19 }}>
          {index !== undefined ? `${index + 1}. ` : ''}
          {video.title}
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' }}>
          <VideoStatus video={video} state={state} accent={accent} />
          {video.exercise ? <Pill label={t('ex.chip')} color={Accents.exercises.fg} background={Accents.exercises.soft} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tileThumb: {
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  play: {
    backgroundColor: 'rgba(14,19,48,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  durationBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(14,19,48,0.7)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  partTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(14,19,48,0.45)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowThumb: {
    width: 96,
    height: 64,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
