import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { ABOUT_TEST } from '@/shared/content/about-test';

function Bullet({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 8, backgroundColor: theme.tint }} />
      <ThemedText type="small" style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }}>
        {text}
      </ThemedText>
    </View>
  );
}

/** Skrining qanday tuzilgani, manbalari va cheklovlari. */
export default function AboutTestScreen() {
  const { locale } = useLocale();
  const doc = ABOUT_TEST[locale];
  return (
    <Screen>
      <ThemedText type="body" themeColor="textSecondary">
        {doc.intro}
      </ThemedText>
      {doc.sections.map((s) => (
        <Card key={s.title} style={{ gap: Spacing.two + 2 }}>
          <ThemedText type="heading" style={{ fontSize: 16.5 }}>
            {s.title}
          </ThemedText>
          {s.items.map((item) => (
            <Bullet key={item} text={item} />
          ))}
        </Card>
      ))}
      <Card flat style={{ gap: Spacing.two }}>
        <ThemedText type="heading" style={{ fontSize: 16.5 }}>
          {doc.sourcesTitle}
        </ThemedText>
        {doc.sources.map((source) => (
          <ThemedText key={source} type="small" themeColor="textSecondary">
            {source}
          </ThemedText>
        ))}
      </Card>
    </Screen>
  );
}
