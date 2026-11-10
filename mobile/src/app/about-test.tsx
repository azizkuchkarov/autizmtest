import { SymbolView } from 'expo-symbols';
import { Linking, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, PressableScale, Screen, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { ABOUT_TEST, type Source } from '@/shared/content/about-test';

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

/** Bosilganda manba brauzerda ochiladi. */
function SourceRow({ source }: { source: Source }) {
  const theme = useTheme();
  return (
    <PressableScale onPress={() => Linking.openURL(source.url).catch(() => {})} accessibilityRole="link">
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 }}>
        <SymbolView name={sym('link', 'link')} size={15} tintColor={theme.tint} style={{ marginTop: 3 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="small" style={{ fontSize: 14, lineHeight: 20 }}>
            {source.text}
          </ThemedText>
          <ThemedText type="small" themeColor="tint" numberOfLines={1} style={{ fontSize: 12.5 }}>
            {source.url.replace(/^https:\/\/(www\.)?/, '')}
          </ThemedText>
        </View>
      </View>
    </PressableScale>
  );
}

/** Ilovadagi tibbiy ma'lumot manbalari (havolali), skrining tuzilishi va cheklovlari. */
export default function AboutTestScreen() {
  const { locale } = useLocale();
  const doc = ABOUT_TEST[locale];
  return (
    <Screen>
      <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30 }}>
        📚 {doc.sourcesTitle}
      </ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {doc.sourcesIntro}
      </ThemedText>
      {doc.sourceGroups.map((group) => (
        <Card key={group.title} style={{ gap: Spacing.two }}>
          <ThemedText type="heading" style={{ fontSize: 16.5 }}>
            {group.title}
          </ThemedText>
          {group.note ? (
            <ThemedText type="small" themeColor="textSecondary">
              {group.note}
            </ThemedText>
          ) : null}
          {group.sources.map((source) => (
            <SourceRow key={source.url} source={source} />
          ))}
        </Card>
      ))}

      <ThemedText type="body" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
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
    </Screen>
  );
}
