import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PressableScale, sym, useCardShadow } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, type AacWordType } from '@/lib/api';
import type { AacCardSize } from '@/lib/aac-store';

/** Ilovadagi karta: server kartasi yoki ota-ona qo'shgan karta, yozilgan ovozi bilan. */
export type BoardCard = {
  id: string;
  categoryId: string;
  title: string;
  speak: string;
  emoji: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  recordingUrl: string | null;
  wordType: AacWordType;
  core: boolean;
  custom: boolean;
};

/** Fitzgerald kaliti (AAC dagi xalqaro standart): so'z turiga qarab karta rangi. */
export const WORD_COLORS: Record<AacWordType, string> = {
  pronoun: '#EAB308',
  verb: '#16A34A',
  descriptor: '#2563EB',
  noun: '#EA580C',
  social: '#DB2777',
  question: '#7C3AED',
  negation: '#DC2626',
  misc: '#64748B',
};

export const WORD_TYPES = Object.keys(WORD_COLORS) as AacWordType[];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** Ikki rangni aralashtiradi (CSS dagi color-mix kabi): `amount` — birinchi rang ulushi. */
export function mix(color: string, base: string, amount: number) {
  const a = hex(color);
  const b = hex(base);
  return `#${a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
}

/** Rang foni — yorug' va qorong'i mavzuda ham o'qiladigan yumshoq tus. */
export function useSoftBg() {
  const theme = useTheme();
  return (color: string) => mix(color, theme.backgroundElement, 0.14);
}

const EMOJI_SIZE: Record<AacCardSize, number> = { sm: 34, md: 46, lg: 64 };
const LABEL_SIZE: Record<AacCardSize, number> = { sm: 11.5, md: 14.5, lg: 17 };

export function CardPicture({ card, size, radius = 12 }: { card: Pick<BoardCard, 'emoji' | 'imageUrl' | 'title'>; size: number; radius?: number }) {
  const [broken, setBroken] = useState(false);
  const uri = absoluteUrl(card.imageUrl);
  if (uri && !broken)
    return <Image source={{ uri }} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} contentFit="cover" transition={120} onError={() => setBroken(true)} />;
  return (
    <ThemedText style={{ fontSize: size, lineHeight: size * 1.2, textAlign: 'center' }} allowFontScaling={false}>
      {card.emoji || card.title.slice(0, 1).toUpperCase()}
    </ThemedText>
  );
}

/** Muloqot kartasi: katta rasm, pastda so'z, chetida so'z turi rangi. */
export function AacTile({
  card,
  size,
  showLabel,
  active,
  hidden,
  editing,
  onPress,
  style,
}: {
  card: BoardCard;
  size: AacCardSize;
  showLabel: boolean;
  active?: boolean;
  hidden?: boolean;
  editing?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const softBg = useSoftBg();
  const color = WORD_COLORS[card.wordType];
  const pulse = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  useEffect(() => {
    if (active) pulse.value = withSequence(withTiming(1.06, { duration: 150 }), withTiming(1, { duration: 200 }));
  }, [active, pulse]);

  return (
    <Animated.View style={[style, pulseStyle, hidden && { opacity: 0.4 }]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={card.title}
        onPress={onPress}
        scaleTo={0.94}
        style={[
          styles.tile,
          shadow,
          { borderColor: active ? color : mix(color, theme.backgroundElement, 0.55), backgroundColor: softBg(color) },
        ]}>
        <View style={styles.picture}>
          <CardPicture card={card} size={EMOJI_SIZE[size]} />
        </View>
        {showLabel && (
          <ThemedText
            // Bitta uzun so'z harf-harf bo'linmasin — sig'magunicha kichrayadi
            numberOfLines={card.title.includes(' ') ? 2 : 1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{ fontSize: LABEL_SIZE[size], lineHeight: LABEL_SIZE[size] * 1.2, fontWeight: '700', textAlign: 'center', width: '100%' }}>
            {card.title}
          </ThemedText>
        )}
        {editing && (card.recordingUrl || hidden) ? (
          <View style={styles.badges}>
            {card.recordingUrl ? (
              <View style={[styles.badge, { backgroundColor: '#16A34A' }]}>
                <SymbolView name={sym('mic.fill', 'mic')} size={13} tintColor="#FFFFFF" />
              </View>
            ) : null}
            {hidden ? (
              <View style={[styles.badge, { backgroundColor: theme.textTertiary }]}>
                <SymbolView name={sym('eye.slash.fill', 'visibility_off')} size={13} tintColor="#FFFFFF" />
              </View>
            ) : null}
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 3,
    padding: 6,
  },
  picture: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  badges: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
