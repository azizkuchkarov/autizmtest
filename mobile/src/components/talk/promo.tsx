import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useSoftBg, WORD_COLORS } from '@/components/talk/tile';
import { PressableScale, sym, useCardShadow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';

const SAMPLE = [
  { emoji: '💧', color: WORD_COLORS.noun },
  { emoji: '🤲', color: WORD_COLORS.verb },
  { emoji: '😊', color: WORD_COLORS.descriptor },
  { emoji: '👩', color: WORD_COLORS.pronoun },
];

/** Bosh sahifa va Mashqlar bo'limidagi "Rasmli muloqot" kartasi. */
export function TalkPromo() {
  const { t } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const softBg = useSoftBg();
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={t('talk.title')}
      onPress={() => router.push('/talk')}
      style={[styles.card, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.sample}>
        {SAMPLE.map((s) => (
          <View key={s.emoji} style={[styles.cell, { borderColor: s.color, backgroundColor: softBg(s.color) }]}>
            <ThemedText style={{ fontSize: 19, lineHeight: 23 }} allowFontScaling={false}>
              {s.emoji}
            </ThemedText>
          </View>
        ))}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading" style={{ fontSize: 16.5 }}>
          {t('talk.title')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {t('talk.homeBody')}
        </ThemedText>
      </View>
      <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  sample: { width: 78, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: 36, height: 36, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
