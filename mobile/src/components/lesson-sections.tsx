import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { EmptyState, PageHeader, PressableScale, ProgressBar, Screen, SectionHeader, Skeleton, sym, useCardShadow } from '@/components/ui';
import { Accents, Radius, Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useContent } from '@/hooks/use-content';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, type Video } from '@/lib/api';
import { buildSections, syncVideoProgress, useVideoProgress, type VideoSection } from '@/lib/video-progress';

/** Har bir bo'limning o'z rangi va belgisi: ota-ona bo'limni ko'rinishidan taniydi. */
const SECTION_LOOK: Record<string, { accent: AccentName; icon: ReturnType<typeof sym> }> = {
  autism: { accent: 'test', icon: sym('puzzlepiece.fill', 'extension') },
  speech: { accent: 'lessons', icon: sym('bubble.left.and.bubble.right.fill', 'forum') },
  sensory: { accent: 'exercises', icon: sym('hand.raised.fill', 'back_hand') },
  psychology: { accent: 'centers', icon: sym('heart.fill', 'favorite') },
};
const DEFAULT_LOOK = { accent: 'test' as AccentName, icon: sym('play.rectangle.fill', 'smart_display') };

export function sectionLook(slug: string) {
  return SECTION_LOOK[slug] ?? DEFAULT_LOOK;
}

function minutesOf(sec: number) {
  return Math.max(1, Math.round(sec / 60));
}

/** Eng muhim harakat: to'xtagan yoki navbatdagi dars. */
export function ContinueCard({ video, accent, started }: { video: Video; accent: AccentName; started: boolean }) {
  const { t } = useLocale();
  const uri = absoluteUrl(video.thumbnailUrl);
  return (
    <PressableScale onPress={() => router.push(`/video/${video.id}`)}>
      <LinearGradient colors={Accents[accent].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.continue}>
        <View style={styles.continueThumb}>
          {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
          <View style={styles.continuePlay}>
            <SymbolView name={sym('play.fill', 'play_arrow')} size={18} tintColor={Accents[accent].fg} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <ThemedText type="smallBold" style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12.5 }}>
            {started ? t('lessons.continue') : t('lessons.startFirst')}
          </ThemedText>
          <ThemedText type="heading" numberOfLines={2} style={{ color: '#FFFFFF', fontSize: 16.5, lineHeight: 21 }}>
            {video.title}
          </ThemedText>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

function SectionCard({ section, index }: { section: VideoSection; index: number }) {
  const { t } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const look = sectionLook(section.slug);
  const a = Accents[look.accent];
  const total = section.videos.length;
  return (
    <Animated.View entering={FadeInDown.delay(60 * index).duration(380)}>
      <PressableScale
        onPress={() => router.push(`/section/${section.slug}`)}
        style={[styles.section, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.sectionTop}>
          <LinearGradient colors={a.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sectionIcon}>
            <SymbolView name={look.icon} size={26} tintColor="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="heading" style={{ fontSize: 19 }}>
              {section.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('lessons.sectionMeta').replace('{n}', String(total)).replace('{m}', String(minutesOf(section.totalSec)))}
            </ThemedText>
          </View>
          <SymbolView name={sym('chevron.right', 'chevron_right')} size={15} tintColor={theme.textTertiary} />
        </View>
        <View style={{ gap: 7 }}>
          <ProgressBar value={(section.done / total) * 100} color={section.done === total ? Accents.exercises.fg : a.fg} height={7} />
          <ThemedText type="smallBold" style={{ fontSize: 12.5, color: section.done > 0 ? (section.done === total ? Accents.exercises.fg : a.fg) : theme.textTertiary }}>
            {t('lessons.watchedOf').replace('{done}', String(section.done)).replace('{total}', String(total))}
          </ThemedText>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** Darslar: avval "Davom ettirish", keyin yo'nalishlar bo'yicha bo'limlar. */
export function LessonSections({ tabs }: { tabs?: ReactNode }) {
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

  const sections = categories ? buildSections(professions, categories, progress) : [];
  const current = sections.find((s) => s.next && (progress[s.next.id]?.pos ?? 0) > 0) ?? sections.find((s) => s.next);
  const anyStarted = sections.some((s) => s.done > 0) || !!(current?.next && progress[current.next.id]?.pos);

  return (
    <Screen withTabBar refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <PageHeader title={t('lessons.title')} subtitle={t('lessons.subtitle')} />
      {tabs}
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
          <Skeleton height={108} />
          <Skeleton height={124} />
          <Skeleton height={124} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={sym('play.rectangle.fill', 'smart_display')}
          title={t('content.emptyTitle')}
          body={t('content.empty')}
          color={Accents.lessons.fg}
          background={Accents.lessons.soft}
        />
      ) : (
        <>
          {current?.next ? <ContinueCard video={current.next} accent={sectionLook(current.slug).accent} started={anyStarted} /> : null}
          <SectionHeader title={t('lessons.choose')} />
          {sections.map((section, i) => (
            <SectionCard key={section.slug} section={section} index={i} />
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  continue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: 14,
    borderRadius: Radius.lg,
  },
  continueThumb: {
    width: 104,
    height: 72,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  continuePlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  section: {
    gap: 14,
    padding: 18,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
