import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, IconBadge, sym } from '@/components/ui';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { requestOtp, verifyOtp } from '@/lib/api';
import { haptics } from '@/lib/haptics';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** +998901234567 → "+998 90 123 45 67" */
function prettyPhone(phone: string) {
  const d = phone.replace(/\D/g, '').slice(3);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; devCode?: string }>();
  const phone = params.phone ?? '';
  const { t } = useLocale();
  const { signIn } = useProfile();
  const theme = useTheme();
  const accent = useAccent('exercises');
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [devCode, setDevCode] = useState(params.devCode ?? '');
  const shake = useSharedValue(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const submit = async (value: string) => {
    if (value.length < 4 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, value);
      await signIn(res.token, res.user.phone);
      haptics.success();
      // Keyingi kerakli qadamni (bola profili yoki asosiy qism) tablar tekshiruvi tanlaydi
      router.replace('/');
    } catch (e) {
      haptics.warning();
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setError(e instanceof Error && e.message !== 'Network error' ? e.message : t('common.offline'));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    const next = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setError('');
    setCode(next);
    if (next.length === CODE_LENGTH) submit(next);
  };

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    setError('');
    try {
      const res = await requestOtp(phone);
      if (res.devCode) setDevCode(res.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.offline'));
    }
  };

  return (
    <StartScaffold footer={<Button title={t('verify.confirm')} onPress={() => submit(code)} disabled={code.length < 4} loading={loading} />}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.three, marginTop: Spacing.four }}>
        <IconBadge name={sym('message.fill', 'sms')} color={accent.fg} background={accent.soft} size={64} />
        <ThemedText type="title">{t('verify.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('verify.subtitle').replace('{phone}', prettyPhone(phone))}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: Spacing.two }}>
        <Animated.View style={shakeStyle}>
        <Pressable onPress={() => input.current?.focus()} style={styles.boxes}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const char = code[i] ?? '';
            const active = i === code.length && !loading;
            return (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: error ? theme.danger : active ? theme.tint : char ? theme.textTertiary : theme.border,
                  },
                ]}>
                <ThemedText style={styles.digit}>{char}</ThemedText>
              </View>
            );
          })}
        </Pressable>
        {/* Ko'rinmas input: klaviatura va SMS'dan avtomatik to'ldirish uchun */}
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={CODE_LENGTH}
          caretHidden
          style={styles.hiddenInput}
        />
        </Animated.View>
      </Animated.View>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      {devCode ? (
        <ThemedText type="small" themeColor="textTertiary">
          {t('verify.devHint').replace('{code}', devCode)}
        </ThemedText>
      ) : null}

      <View style={styles.links}>
        {seconds > 0 ? (
          <ThemedText type="smallBold" themeColor="textTertiary" style={{ fontVariant: ['tabular-nums'] }}>
            {t('verify.resendIn').replace('{s}', String(seconds))}
          </ThemedText>
        ) : (
          <Pressable onPress={resend} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="tint">
              {t('verify.resend')}
            </ThemedText>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="tint">
            {t('verify.change')}
          </ThemedText>
        </Pressable>
      </View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  boxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 68,
    borderRadius: Radius.sm + 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    lineHeight: 32,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});
