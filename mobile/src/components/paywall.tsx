import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, IconBadge, sym } from '@/components/ui';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { ApiError, redeemPromo, startCheckout } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';

const PROMO_ERRORS: Record<string, TranslationKey> = {
  invalid_format: 'pay.promoInvalid',
  not_found: 'pay.promoNotFound',
  expired: 'pay.promoExpired',
  used: 'pay.promoUsed',
};

const formatSum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Qulflangan skrining natijasi: Click orqali to'lov (ilova ichidagi brauzerda) yoki promokod. */
export function Paywall({
  assessmentId,
  amount,
  checking,
  notConfirmed,
  onUnlocked,
  onReturned,
}: {
  assessmentId: string;
  amount: number | null;
  checking?: boolean;
  notConfirmed?: boolean;
  /** Promokod yoki darhol o'tgan to'lov — natijani ochish */
  onUnlocked: () => void;
  /** Click sahifasi yopildi — to'lov holatini tekshirish */
  onReturned: () => void;
}) {
  const { t } = useLocale();
  const theme = useTheme();
  const tint = useAccent('test');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const pay = async () => {
    setError('');
    setPaying(true);
    try {
      const res = await startCheckout(assessmentId);
      if (res.paid) return onUnlocked();
      if (!res.redirectUrl) throw new Error('no url');
      // Click to'lovdan keyin autizm://result/... ga qaytaradi — sessiya o'zi yopiladi
      await WebBrowser.openAuthSessionAsync(res.redirectUrl, 'autizm://');
      onReturned();
    } catch {
      setError(t('pay.error'));
    } finally {
      setPaying(false);
    }
  };

  const redeem = async () => {
    setError('');
    setRedeeming(true);
    try {
      await redeemPromo(assessmentId, code);
      haptics.success();
      onUnlocked();
    } catch (e) {
      const key = e instanceof ApiError ? PROMO_ERRORS[e.message] : undefined;
      setError(t(key ?? 'pay.error'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(450)}>
      <Card style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three }}>
        <IconBadge name={sym('lock.fill', 'lock')} color={tint.fg} background={tint.soft} size={64} />
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
          {t('pay.title')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
          {t('pay.body')}
        </ThemedText>

        {amount != null && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two }}>
            <ThemedText type="small" themeColor="textTertiary">
              {t('pay.price')}
            </ThemedText>
            <ThemedText type="subtitle">
              {formatSum(amount)} {t('pay.currency')}
            </ThemedText>
          </View>
        )}

        {checking ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('pay.checking')}
          </ThemedText>
        ) : notConfirmed ? (
          <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
            <ThemedText type="small" style={{ color: theme.warning, textAlign: 'center' }}>
              {t('pay.notYet')}
            </ThemedText>
            <Button title={t('pay.recheck')} variant="secondary" size="md" onPress={onReturned} />
          </View>
        ) : null}

        <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
          <Button title={t('pay.button')} icon={sym('creditcard.fill', 'credit_card')} onPress={pay} loading={paying} disabled={checking} />
          <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            {t('pay.methods')}
          </ThemedText>
        </View>

        {promoOpen ? (
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
            <TextInput
              value={code}
              onChangeText={(v) => {
                setError('');
                setCode(v.toUpperCase());
              }}
              placeholder="DEMO-XXXXXXXX"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel={t('pay.promoToggle')}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            />
            <View style={{ width: 120 }}>
              <Button title={t('pay.promoApply')} size="md" variant="ghost" onPress={redeem} loading={redeeming} disabled={!code.trim()} />
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setPromoOpen(true)} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              {t('pay.promoToggle')}
            </ThemedText>
          </Pressable>
        )}

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
            {error}
          </ThemedText>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    height: 44,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
});
