import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IntroArt } from '@/components/intro-art';
import { LanguagePill } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { BrandMark, Button, sym, Wordmark } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import type { TranslationKey } from '@/lib/i18n';

const SLIDES: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'intro.s1Title', body: 'intro.s1Body' },
  { title: 'intro.s2Title', body: 'intro.s2Body' },
  { title: 'intro.s3Title', body: 'intro.s3Body' },
  { title: 'intro.s4Title', body: 'intro.s4Body' },
];

export default function IntroScreen() {
  const { t } = useLocale();
  const { markIntroSeen } = useProfile();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const [page, setPage] = useState(0);
  const isLast = page === SLIDES.length - 1;

  const goTo = (p: number) => {
    pager.current?.scrollTo({ x: p * width, animated: true });
    setPage(p);
  };

  const finish = () => {
    markIntroSeen();
    router.replace('/');
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <BrandMark size={30} />
          <Wordmark size={19} />
        </View>
        <LanguagePill />
      </View>

      <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <IntroArt variant={i as 0 | 1 | 2 | 3} />
            {page === i && (
              <Animated.View entering={FadeInDown.duration(500)} style={styles.text}>
                <ThemedText type="display" style={{ textAlign: 'center', fontSize: 31, lineHeight: 38 }}>
                  {t(s.title)}
                </ThemedText>
                <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 16.5, lineHeight: 25 }}>
                  {t(s.body)}
                </ThemedText>
              </Animated.View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
              <View style={[styles.dot, { backgroundColor: i === page ? theme.tint : theme.border, width: i === page ? 26 : 8 }]} />
            </Pressable>
          ))}
        </View>
        {isLast ? (
          <Button title={t('intro.begin')} onPress={finish} icon={sym('arrow.right', 'arrow_forward')} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Pressable onPress={finish} hitSlop={10} style={{ paddingHorizontal: Spacing.two }}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('onboarding.skip')}
              </ThemedText>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button title={t('common.next')} onPress={() => goTo(page + 1)} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: Spacing.two,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: Spacing.four,
  },
  text: {
    gap: Spacing.three,
    alignItems: 'center',
    maxWidth: 520,
  },
  footer: {
    paddingHorizontal: 24,
    gap: Spacing.three,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
