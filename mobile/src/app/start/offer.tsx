import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, IconBadge, sym, type IconName } from '@/components/ui';
import { Radius, Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import { getPublicOffer } from '@/shared/content/public-offer';

const POINTS: { icon: IconName; accent: AccentName; title: TranslationKey; body: TranslationKey }[] = [
  { icon: sym('stethoscope', 'medical_services'), accent: 'test', title: 'offer.point1Title', body: 'offer.point1Body' },
  { icon: sym('lock.shield.fill', 'shield_lock'), accent: 'exercises', title: 'offer.point2Title', body: 'offer.point2Body' },
  { icon: sym('gift.fill', 'redeem'), accent: 'lessons', title: 'offer.point3Title', body: 'offer.point3Body' },
];

function Point({ icon, accent, title, body }: (typeof POINTS)[number]) {
  const { t } = useLocale();
  const a = useAccent(accent);
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' }}>
      <IconBadge name={icon} color={a.fg} background={a.soft} size={42} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading" style={{ fontSize: 15.5 }}>
          {t(title)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t(body)}
        </ThemedText>
      </View>
    </View>
  );
}

export default function OfferScreen() {
  const { t, locale } = useLocale();
  const { acceptOffer } = useProfile();
  const theme = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const doc = getPublicOffer(locale);

  const onContinue = () => {
    acceptOffer();
    router.replace('/');
  };

  return (
    <StartScaffold
      back={false}
      footer={
        <>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => {
              haptics.select();
              setAgreed((v) => !v);
            }}
            style={styles.agreeRow}>
            <View style={[styles.checkbox, { borderColor: agreed ? theme.tint : theme.border, backgroundColor: agreed ? theme.tint : theme.backgroundElement }]}>
              {agreed ? <SymbolView name={sym('checkmark', 'check')} size={14} tintColor="#FFFFFF" weight="bold" /> : null}
            </View>
            <ThemedText type="small" style={{ flex: 1 }}>
              {t('offer.agree')}
            </ThemedText>
          </Pressable>
          <Button title={t('offer.continue')} onPress={onContinue} disabled={!agreed} icon={sym('arrow.right', 'arrow_forward')} />
        </>
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
        <ThemedText type="title">{t('offer.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('offer.subtitle')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Card style={{ gap: Spacing.four, paddingVertical: Spacing.four }}>
          {POINTS.map((p) => (
            <Point key={p.title} {...p} />
          ))}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(400)}>
        <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
          <Pressable
            onPress={() => {
              haptics.tap();
              setExpanded((v) => !v);
            }}
            style={styles.expandRow}>
            <SymbolView name={sym('doc.text.fill', 'description')} size={18} tintColor={theme.tint} />
            <ThemedText type="heading" style={{ flex: 1, fontSize: 15.5 }}>
              {t('offer.readFull')}
            </ThemedText>
            <SymbolView name={sym(expanded ? 'chevron.up' : 'chevron.down', expanded ? 'expand_less' : 'expand_more')} size={14} tintColor={theme.textTertiary} />
          </Pressable>
          {expanded && (
            <Animated.View entering={FadeIn.duration(250)} style={[styles.fullText, { borderTopColor: theme.border }]}>
              <ThemedText type="heading">{doc.title}</ThemedText>
              <ThemedText type="small" themeColor="textTertiary">
                {doc.subtitle} · {doc.updated}
              </ThemedText>
              <ThemedText type="body">{doc.preamble}</ThemedText>
              {doc.sections.map((s) => (
                <View key={s.title} style={{ gap: 4 }}>
                  <ThemedText type="smallBold">{s.title}</ThemedText>
                  <ThemedText type="body" themeColor="textSecondary">
                    {s.body}
                  </ThemedText>
                </View>
              ))}
              <ThemedText type="small" themeColor="textTertiary">
                {doc.footerNote}
              </ThemedText>
            </Animated.View>
          )}
        </Card>
      </Animated.View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three + 2,
  },
  fullText: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three + 2,
    gap: Spacing.three,
    borderRadius: Radius.md,
  },
});
