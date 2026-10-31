import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { sym } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

/** Til almashtirgich (UZ / RU) — kirish ekranlarining yuqori o'ng burchagida. */
export function LanguagePill() {
  const { locale, setLocale } = useLocale();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        setLocale(locale === 'uz' ? 'ru' : 'uz');
      }}
      hitSlop={8}
      style={[styles.lang, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <SymbolView name={sym('globe', 'language')} size={14} tintColor={theme.textSecondary} />
      <ThemedText type="smallBold" themeColor="textSecondary">
        {locale === 'uz' ? "O'zbek" : 'Русский'}
      </ThemedText>
    </Pressable>
  );
}

/** Kirish oqimi ekranlari uchun umumiy karkas: orqaga tugma, qadam, kontent va pastki tugma. */
export function StartScaffold({
  children,
  footer,
  step,
  back = true,
  scroll = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  step?: string;
  back?: boolean;
  scroll?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const content = <View style={styles.inner}>{children}</View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.two }]}>
        {back && router.canGoBack() ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={[styles.back, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SymbolView name={sym('chevron.left', 'chevron_left')} size={18} tintColor={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
        {step ? (
          <ThemedText type="smallBold" themeColor="textTertiary">
            {step}
          </ThemedText>
        ) : null}
        <LanguagePill />
      </View>

      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: Spacing.two,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
