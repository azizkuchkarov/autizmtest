import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, IconBadge, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { refreshLessonAccess, waitForLessonAccess } from '@/hooks/use-lesson-access';
import { startCheckout, type LessonAccess } from '@/lib/api';
import { haptics } from '@/lib/haptics';

const formatSum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Darslar yopiq: oylik kirish uchun Click orqali to'lov (ilova ichidagi brauzerda). */
export function LessonsPaywall({ access, compact }: { access: LessonAccess; compact?: boolean }) {
  const { t } = useLocale();
  const theme = useTheme();
  const tint = useAccent('lessons');
  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    setNotConfirmed(false);
    setChecking(true);
    const a = await waitForLessonAccess();
    setChecking(false);
    if (a?.locked) setNotConfirmed(true);
    else haptics.success();
  };

  const pay = async () => {
    setError('');
    setPaying(true);
    try {
      const res = await startCheckout();
      if (res.paid) {
        await refreshLessonAccess();
        haptics.success();
        return;
      }
      if (!res.redirectUrl) throw new Error('no url');
      // Click to'lovdan keyin autizm://lessons ga qaytaradi — sessiya o'zi yopiladi
      await WebBrowser.openAuthSessionAsync(res.redirectUrl, 'autizm://');
      setPaying(false);
      await check();
    } catch {
      setError(t('pay.error'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(450)}>
      <Card style={{ alignItems: 'center', paddingVertical: compact ? Spacing.four : Spacing.five, gap: Spacing.three }}>
        <IconBadge name={sym('lock.fill', 'lock')} color={tint.fg} background={tint.soft} size={compact ? 52 : 64} />
        <ThemedText type={compact ? 'heading' : 'subtitle'} style={{ textAlign: 'center' }}>
          {t('pay.title')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
          {t('pay.body')}
        </ThemedText>

        {access.amount != null && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two }}>
            <ThemedText type="subtitle">
              {formatSum(access.amount)} {t('pay.currency')}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              / {t('pay.perDays').replace('{n}', String(access.days))}
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
            <Button title={t('pay.recheck')} variant="secondary" size="md" onPress={check} />
          </View>
        ) : null}

        <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
          <Button title={t('pay.button')} icon={sym('creditcard.fill', 'credit_card')} onPress={pay} loading={paying} disabled={checking} />
          <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            {t('pay.methods')}
          </ThemedText>
        </View>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
            {error}
          </ThemedText>
        ) : null}
      </Card>
    </Animated.View>
  );
}
