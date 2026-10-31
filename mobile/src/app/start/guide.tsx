import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, sym, useCardShadow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import type { TranslationKey } from '@/lib/i18n';

/** Qo'llanma sahifasidagi "qachon" belgisi. */
function When({ children }: { children: string }) {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <View style={[styles.when, { backgroundColor: theme.tintSoft }]}>
      <SymbolView name={sym('calendar', 'calendar_month')} size={20} tintColor={theme.tint} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <ThemedText type="caption" style={{ color: theme.tint }}>
          {t('guide.when')}
        </ThemedText>
        <ThemedText type="smallBold" style={{ fontSize: 15 }}>
          {children}
        </ThemedText>
      </View>
    </View>
  );
}

/** Kun tartibi qatori: vaqt — nima qilinadi. */
function TimelineRow({ time, emoji, text, last }: { time: string; emoji: string; text: string; last?: boolean }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.dot, shadow, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</ThemedText>
        </View>
        {!last && <View style={{ width: 2, flex: 1, backgroundColor: theme.border }} />}
      </View>
      <View style={{ flex: 1, paddingTop: 4, paddingBottom: Spacing.three }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SymbolView name={sym('clock', 'schedule')} size={13} tintColor={theme.tint} />
          <ThemedText type="smallBold" style={{ color: theme.tint, fontVariant: ['tabular-nums'] }}>
            {time}
          </ThemedText>
        </View>
        <ThemedText type="body" style={{ fontSize: 15.5 }}>
          {text}
        </ThemedText>
      </View>
    </View>
  );
}

type Slide = { emoji: string; title: TranslationKey; body: TranslationKey; extra?: ReactNode };

/** Ota-onalar uchun qo'llanma: ilovadan qanday va qachon foydalanish — oddiy tilda, 7 ta qisqa sahifa. */
export default function GuideScreen() {
  const { again } = useLocalSearchParams<{ again?: string }>();
  const { t } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const { child, markGuideSeen } = useProfile();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const practice = child?.practiceTime ?? '17:00';
  const diary = child?.diaryTime ?? '08:30';

  const slides: Slide[] = [
    { emoji: '👋', title: 'guide.s1Title', body: 'guide.s1Body' },
    { emoji: '📝', title: 'guide.s2Title', body: 'guide.s2Body', extra: <When>{t('guide.s2When')}</When> },
    { emoji: '🎬', title: 'guide.s3Title', body: 'guide.s3Body', extra: <When>{t('guide.s3When')}</When> },
    {
      emoji: '☀️',
      title: 'guide.s4Title',
      body: 'guide.s4Body',
      extra: (
        <View style={{ paddingTop: Spacing.one }}>
          <TimelineRow time={diary} emoji="📔" text={t('guide.s4Diary')} />
          <TimelineRow time={practice} emoji="🧸" text={t('guide.s4Practice')} />
          <TimelineRow time={t('guide.s4Anytime')} emoji="🎧" text={t('guide.s4Free')} last />
        </View>
      ),
    },
    {
      emoji: '📈',
      title: 'guide.s5Title',
      body: 'guide.s5Body',
      extra: (
        <View style={{ gap: Spacing.two }}>
          <When>{t('guide.s5Week')}</When>
          <When>{t('guide.s5Month')}</When>
        </View>
      ),
    },
    {
      emoji: '🩺',
      title: 'guide.s6Title',
      body: 'guide.s6Body',
      extra: (
        <View style={{ gap: Spacing.two }}>
          {(['guide.s6a', 'guide.s6b', 'guide.s6c', 'guide.s6d'] as const).map((k) => (
            <View key={k} style={[styles.alert, { backgroundColor: theme.dangerSoft }]}>
              <View style={[styles.bullet, { backgroundColor: theme.danger }]} />
              <ThemedText type="body" style={{ fontSize: 15, flex: 1 }}>
                {t(k)}
              </ThemedText>
            </View>
          ))}
        </View>
      ),
    },
    { emoji: '🎉', title: 'guide.s7Title', body: 'guide.s7Body' },
  ];

  const last = index === slides.length - 1;
  const slide = slides[index];

  const finish = async () => {
    setFinishing(true);
    await markGuideSeen();
    if (again && router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <StartScaffold
      back={!!again}
      step={`${index + 1} / ${slides.length}`}
      footer={
        <>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.progressDot, { width: i === index ? 22 : 6, backgroundColor: i <= index ? theme.tint : theme.border }]} />
            ))}
          </View>
          <Button
            title={last ? t('guide.start') : t('guide.next')}
            icon={last ? sym('sparkles', 'auto_awesome') : sym('arrow.right', 'arrow_forward')}
            loading={finishing}
            onPress={() => (last ? finish() : setIndex(index + 1))}
          />
          {!last && (
            <Pressable onPress={finish} hitSlop={6} style={{ alignSelf: 'center', paddingVertical: Spacing.one }}>
              <ThemedText type="smallBold" themeColor="textTertiary">
                {t('guide.skip')}
              </ThemedText>
            </Pressable>
          )}
        </>
      }>
      <Animated.View key={index} entering={FadeInRight.duration(250)} style={{ gap: 20, paddingBottom: Spacing.three }}>
        <View style={[styles.hero, shadow, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={{ fontSize: 56, lineHeight: 66 }}>{slide.emoji}</ThemedText>
        </View>
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="title">{t(slide.title)}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={{ fontSize: 16.5, lineHeight: 25 }}>
            {t(slide.body)}
          </ThemedText>
        </View>
        {slide.extra}
      </Animated.View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  when: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  hero: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.one,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
});
