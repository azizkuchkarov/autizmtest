import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import type { IconName } from '@/components/ui';

/** Suzib yuruvchi pazl bo'lagi. */
function Floating({ color, size, style, delay }: { color: string; size: number; style: object; delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1600 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600 + delay, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [y, delay]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: '12deg' }] }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size * 0.3, backgroundColor: color }, style, animated]} />;
}

/** Onboarding va bo'sh holatlar uchun gradient doira ichidagi katta ikonka kompozitsiyasi. */
export function Illustration({ icon, colors, size = 220 }: { icon: IconName; colors: readonly [string, string, ...string[]]; size?: number }) {
  return (
    <View style={{ width: size + 60, height: size + 40, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.halo, { width: size + 40, height: size + 40, borderRadius: (size + 40) / 2, backgroundColor: colors[0] }]} />
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
        <SymbolView name={icon} size={size * 0.42} tintColor="#FFFFFF" />
      </LinearGradient>
      <Floating color="#3B82F6" size={30} style={{ top: 10, left: 18 }} delay={0} />
      <Floating color="#FACC15" size={22} style={{ top: 30, right: 14 }} delay={300} />
      <Floating color="#EF4444" size={18} style={{ bottom: 24, left: 8 }} delay={600} />
      <Floating color="#22C55E" size={26} style={{ bottom: 6, right: 30 }} delay={900} />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    opacity: 0.12,
  },
});
