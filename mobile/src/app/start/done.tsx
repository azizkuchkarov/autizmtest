import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Button, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';

const COLORS = ['#3B82F6', '#FACC15', '#EF4444', '#22C55E', '#8B5CF6', '#EC4899'];

/** Yuqoridan tushadigan konfetti bo'lagi. */
function Confetti({ index, width, height }: { index: number; width: number; height: number }) {
  const y = useSharedValue(-40);
  const rotate = useSharedValue(0);
  const x = ((index * 97) % 100) / 100;
  const delay = (index % 8) * 180;
  const duration = 2600 + (index % 5) * 400;

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(height + 40, { duration, easing: Easing.linear }), -1));
    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1400 }), -1));
  }, [y, rotate, delay, duration, height]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotate.value}deg` }],
  }));

  const size = 8 + (index % 3) * 4;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * width,
          width: size,
          height: size * (index % 2 ? 1 : 1.6),
          borderRadius: index % 3 === 0 ? size / 2 : 3,
          backgroundColor: COLORS[index % COLORS.length],
          opacity: 0.6,
        },
        style,
      ]}
    />
  );
}

export default function DoneScreen() {
  const { t } = useLocale();
  const { child } = useProfile();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      400,
      withRepeat(withSequence(withSpring(-14, { damping: 6 }), withSpring(0, { damping: 8 })), -1, false),
    );
  }, [bounce]);

  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 28 }).map((_, i) => (
          <Confetti key={i} index={i} width={width} height={height} />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + Spacing.five }]}>
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          <Animated.View style={[styles.ring, { backgroundColor: theme.backgroundElement }, bounceStyle]}>
            <Avatar id={child?.avatar} size={190} />
          </Animated.View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ alignItems: 'center', gap: Spacing.three }}>
          <ThemedText type="display" style={{ textAlign: 'center' }}>
            {t('done.title').replace('{name}', child?.name ?? '')} 🎉
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', fontSize: 16.5, lineHeight: 25 }}>
            {t('done.body')}
          </ThemedText>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
        <Button title={t('done.cta')} onPress={() => router.replace('/')} icon={sym('arrow.right', 'arrow_forward')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: Spacing.five,
  },
  ring: {
    padding: 10,
    borderRadius: 999,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  footer: {
    zIndex: 1,
    paddingHorizontal: 24,
  },
});
