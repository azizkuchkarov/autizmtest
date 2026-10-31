import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { sym, type IconName } from '@/components/ui';
import { Accents, HeroGradient } from '@/constants/theme';

const SIZE = 300;

/** Yurakcha: sekin kattalashib-kichrayadi. */
function Heart({ size, style, delay = 0, color = '#F43F5E' }: { size: number; style: object; delay?: number; color?: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1.18, { duration: 700 }), withTiming(1, { duration: 700 })), -1),
    );
  }, [scale, delay]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute' }, style, animated]}>
      <SymbolView name={sym('heart.fill', 'favorite')} size={size} tintColor={color} />
    </Animated.View>
  );
}

/** Suzib yuruvchi pazl bo'lagi. */
function Piece({ color, size, style, delay }: { color: string; size: number; style: object; delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [y, delay]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { rotate: '14deg' }] }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size * 0.3, backgroundColor: color }, style, animated]} />;
}

function Pieces() {
  return (
    <>
      <Piece color="#3B82F6" size={26} style={{ top: 18, left: 26 }} delay={0} />
      <Piece color="#FACC15" size={20} style={{ top: 40, right: 22 }} delay={400} />
      <Piece color="#EF4444" size={16} style={{ bottom: 50, left: 12 }} delay={800} />
      <Piece color="#22C55E" size={22} style={{ bottom: 24, right: 36 }} delay={1200} />
    </>
  );
}

function Blob({ colors }: { colors: readonly [string, string, ...string[]] }) {
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blob} />
    </View>
  );
}

/** Katta ikonka + yonida avatar. */
function IconWithAvatar({ icon, colors, avatar }: { icon: IconName; colors: readonly [string, string, ...string[]]; avatar: string }) {
  return (
    <>
      <Animated.View entering={ZoomIn.duration(500)}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
          <SymbolView name={icon} size={76} tintColor="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
      <Animated.View entering={ZoomIn.delay(250).duration(500)} style={styles.cornerAvatar}>
        <View style={styles.avatarRing}>
          <Avatar id={avatar} size={96} />
        </View>
      </Animated.View>
    </>
  );
}

/** Tanishtiruv slaydlari uchun illyustratsiyalar. */
export function IntroArt({ variant }: { variant: 0 | 1 | 2 | 3 }) {
  return (
    <View style={styles.stage}>
      {variant === 0 && (
        <>
          <Blob colors={['#EEF0FF', '#FCE7F3']} />
          <Animated.View entering={ZoomIn.delay(150).duration(500)} style={[styles.abs, { left: 18, top: 92 }]}>
            <View style={styles.avatarRing}>
              <Avatar id="boy-1" size={92} />
            </View>
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(300).duration(500)} style={[styles.abs, { right: 18, top: 92 }]}>
            <View style={styles.avatarRing}>
              <Avatar id="girl-4" size={92} />
            </View>
          </Animated.View>
          <Animated.View entering={ZoomIn.duration(500)} style={styles.abs}>
            <View style={[styles.avatarRing, { padding: 6 }]}>
              <Avatar id="girl-1" size={132} />
            </View>
          </Animated.View>
          <Heart size={30} style={{ top: 30, left: SIZE / 2 - 15 }} />
          <Heart size={18} style={{ bottom: 44, left: 64 }} delay={300} color="#FB7185" />
          <Heart size={22} style={{ bottom: 36, right: 58 }} delay={600} color="#A78BFA" />
        </>
      )}
      {variant === 1 && (
        <>
          <Blob colors={['#EEF0FF', '#E0E7FF']} />
          <IconWithAvatar icon={sym('checklist.checked', 'fact_check')} colors={HeroGradient.light} avatar="boy-2" />
          <Pieces />
        </>
      )}
      {variant === 2 && (
        <>
          <Blob colors={['#FFF7E6', '#E3F8EA']} />
          <IconWithAvatar icon={sym('play.fill', 'play_arrow')} colors={Accents.lessons.gradient} avatar="girl-3" />
          <Pieces />
        </>
      )}
      {variant === 3 && (
        <>
          <Blob colors={['#FFE8EE', '#EEF0FF']} />
          {(['boy-4', 'girl-2', 'boy-3', 'girl-1'] as const).map((id, i) => {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const r = 98;
            return (
              <View key={id} style={[styles.abs, { transform: [{ translateX: Math.cos(angle) * r }, { translateY: Math.sin(angle) * r }] }]}>
                <Animated.View entering={ZoomIn.delay(120 * i).duration(450)} style={styles.avatarRing}>
                  <Avatar id={id} size={78} />
                </Animated.View>
              </View>
            );
          })}
          <Animated.View entering={FadeIn.delay(500)} style={styles.abs}>
            <LinearGradient colors={Accents.centers.gradient} style={styles.heartCircle}>
              <SymbolView name={sym('heart.fill', 'favorite')} size={40} tintColor="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abs: {
    position: 'absolute',
  },
  blob: {
    width: SIZE - 20,
    height: SIZE - 20,
    borderRadius: (SIZE - 20) / 2,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  iconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerAvatar: {
    position: 'absolute',
    right: 24,
    bottom: 34,
  },
  heartCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
