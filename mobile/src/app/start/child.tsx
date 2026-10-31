import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { FieldLabel, isFutureMonth, MonthGrid, TextField } from '@/components/child-form';
import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, PressableScale, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import { GENDERS } from '@/lib/screening';

const YEARS_BACK = 12;

function YearChip({ year, selected, onPress }: { year: number; selected: boolean; onPress: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const age = new Date().getFullYear() - year;
  return (
    <PressableScale
      haptic={false}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[
        styles.year,
        { backgroundColor: selected ? theme.tint : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
      ]}>
      <ThemedText type="heading" style={{ color: selected ? '#FFFFFF' : theme.text, fontVariant: ['tabular-nums'] }}>
        {year}
      </ThemedText>
      <ThemedText type="small" style={{ color: selected ? 'rgba(255,255,255,0.8)' : theme.textTertiary, fontSize: 12 }}>
        {age < 1 ? t('child.ageUnder1') : t('child.age').replace('{n}', String(age))}
      </ThemedText>
    </PressableScale>
  );
}

function GenderCard({ gender, selected, onPress }: { gender: string; selected: boolean; onPress: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <PressableScale
      haptic={false}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[
        styles.gender,
        { backgroundColor: selected ? theme.tintSoft : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
      ]}>
      <Avatar id={gender === 'Qiz' ? 'girl-1' : 'boy-1'} size={72} animated={selected} />
      <ThemedText type="heading" style={{ color: selected ? theme.tint : theme.text }}>
        {t(`gender.${gender}` as TranslationKey)}
      </ThemedText>
    </PressableScale>
  );
}

export default function ChildScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { t } = useLocale();
  const { child } = useProfile();
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: YEARS_BACK + 1 }, (_, i) => now - i);
  }, []);
  const yearsRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [name, setName] = useState(edit && child ? child.name : '');
  const [birthYear, setBirthYear] = useState<number | null>(edit && child ? child.birthYear : null);
  const [birthMonth, setBirthMonth] = useState<number | null>(edit && child ? (child.birthMonth ?? null) : null);
  const [gender, setGender] = useState<string | null>(edit && child ? child.gender : null);

  const canContinue =
    name.trim().length > 0 && birthYear !== null && birthMonth !== null && !isFutureMonth(birthYear, birthMonth) && gender !== null;

  const onContinue = () => {
    if (!canContinue) return;
    router.push({
      pathname: '/start/avatar',
      params: { name: name.trim(), birthYear: String(birthYear), birthMonth: String(birthMonth), gender, ...(edit ? { edit: '1' } : {}) },
    });
  };

  return (
    <StartScaffold
      back={!!edit}
      step={t('child.step')}
      footer={<Button title={t('child.next')} onPress={onContinue} disabled={!canContinue} icon={sym('arrow.right', 'arrow_forward')} />}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
        <ThemedText type="title">{t('child.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('child.subtitle')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ gap: Spacing.two }}>
        <FieldLabel>{t('child.name')}</FieldLabel>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder={t('child.namePlaceholder')}
          autoCapitalize="words"
          autoCorrect={false}
          spellCheck={false}
          textContentType="givenName"
          returnKeyType="done"
          maxLength={40}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(400)} style={{ gap: Spacing.two }}>
        <FieldLabel>{t('child.birthYear')}</FieldLabel>
        <ScrollView
          ref={yearsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -24 }}
          contentContainerStyle={{ paddingHorizontal: 24, gap: Spacing.two }}>
          {years.map((y) => (
            <YearChip key={y} year={y} selected={birthYear === y} onPress={() => setBirthYear(y)} />
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).duration(400)} style={{ gap: Spacing.two }}>
        <FieldLabel>{t('child.birthMonth')}</FieldLabel>
        <MonthGrid birthYear={birthYear} value={birthMonth} onChange={setBirthMonth} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ gap: Spacing.two }}>
        <FieldLabel>{t('child.gender')}</FieldLabel>
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          {GENDERS.map((g) => (
            <GenderCard key={g} gender={g} selected={gender === g} onPress={() => setGender(g)} />
          ))}
        </View>
      </Animated.View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  year: {
    width: 84,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 2,
  },
  gender: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + 2,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
});
