import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState, type ComponentRef } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, IconBadge, sym } from '@/components/ui';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { requestOtp, type OtpChannel } from '@/lib/api';
import { haptics } from '@/lib/haptics';

/** 901234567 → "90 123 45 67" */
function formatPhoneDigits(digits: string) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

export default function PhoneScreen() {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const accent = useAccent('test');
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [digits, setDigits] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState<OtpChannel | null>(null);
  const [error, setError] = useState('');

  const valid = digits.length === 9;

  const onSubmit = async (channel: OtpChannel) => {
    if (!valid || loading) return;
    setLoading(channel);
    setError('');
    const phone = `+998${digits}`;
    try {
      const res = await requestOtp(phone, channel, locale);
      haptics.success();
      const link = res.link ?? '';
      // Raqam bot bilan hali bog'lanmagan: kodni olish uchun botni ochamiz
      if (channel === 'telegram' && !res.sent && link) Linking.openURL(link).catch(() => {});
      router.push({
        pathname: '/start/verify',
        params: { phone, devCode: res.devCode ?? '', channel, link, sent: res.sent === false ? '0' : '1' },
      });
    } catch (e) {
      haptics.warning();
      setError(e instanceof Error && e.message !== 'Network error' ? e.message : t('common.offline'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <StartScaffold
      back={false}
      footer={
        <View style={{ gap: Spacing.two }}>
          <Button
            title={t('phone.sendTelegram')}
            onPress={() => onSubmit('telegram')}
            disabled={!valid || loading === 'sms'}
            loading={loading === 'telegram'}
            icon={sym('paperplane.fill', 'send')}
          />
          <Button
            title={t('phone.sendSms')}
            variant="secondary"
            onPress={() => onSubmit('sms')}
            disabled={!valid || loading === 'telegram'}
            loading={loading === 'sms'}
            icon={sym('message.fill', 'sms')}
          />
        </View>
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.three, marginTop: Spacing.four }}>
        <IconBadge name={sym('iphone.gen3', 'smartphone')} color={accent.fg} background={accent.soft} size={64} />
        <ThemedText type="title">{t('phone.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('phone.subtitle')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Pressable
          onPress={() => input.current?.focus()}
          style={[
            styles.field,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: error ? theme.danger : focused ? theme.tint : theme.border,
            },
          ]}>
          <View style={[styles.prefix, { borderRightColor: theme.border }]}>
            <ThemedText style={{ fontSize: 20 }}>🇺🇿</ThemedText>
            <ThemedText type="heading" style={{ fontSize: 19 }}>
              +998
            </ThemedText>
          </View>
          <TextInput
            ref={input}
            value={formatPhoneDigits(digits)}
            onChangeText={(v) => {
              setError('');
              setDigits(v.replace(/\D/g, '').slice(0, 9));
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => onSubmit('telegram')}
            placeholder="90 123 45 67"
            placeholderTextColor={theme.textTertiary}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel-national"
            autoFocus
            maxLength={12}
            style={[styles.input, { color: theme.text }]}
          />
          {valid ? <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={22} tintColor={theme.success} /> : null}
        </Pressable>
        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <SymbolView name={sym('lock.fill', 'lock')} size={12} tintColor={theme.textTertiary} />
            <ThemedText type="small" themeColor="textTertiary" style={{ flex: 1 }}>
              {t('phone.privacy')}
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingRight: Spacing.three,
    height: 64,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    height: '60%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.three,
    fontSize: 21,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
});
