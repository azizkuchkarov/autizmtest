import { router } from 'expo-router';
import type { StyleProp, TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useLocale } from '@/contexts/locale';

/** Tibbiy ma'lumot yonidagi "📚 Manbalar" havolasi (App Store 1.4.1): manbalar sahifasini ochadi. */
export function SourcesLink({ style }: { style?: StyleProp<TextStyle> }) {
  const { t } = useLocale();
  return (
    <ThemedText
      type="smallBold"
      themeColor="tint"
      accessibilityRole="link"
      suppressHighlighting
      onPress={() => router.push('/about-test')}
      style={[{ fontSize: 13.5, paddingVertical: 2 }, style]}>
      📚 {t('sources.link')}
    </ThemedText>
  );
}
