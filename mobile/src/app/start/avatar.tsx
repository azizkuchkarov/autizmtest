import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Avatar, avatarsFor } from '@/components/avatar';
import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, PressableScale, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

export default function AvatarScreen() {
  const params = useLocalSearchParams<{ name?: string; birthYear?: string; birthMonth?: string; gender?: string; edit?: string }>();
  const { t } = useLocale();
  const { child, saveChild } = useProfile();
  const theme = useTheme();

  // Faqat avatarni almashtirish uchun profildan ochilganda parametrlar bo'lmaydi
  const name = params.name ?? child?.name ?? '';
  const birthYear = Number(params.birthYear ?? child?.birthYear ?? 0);
  const birthMonth = Number(params.birthMonth ?? child?.birthMonth ?? 0) || null;
  const gender = params.gender ?? child?.gender ?? "O'g'il";
  const options = avatarsFor(gender);
  const initial = child?.gender === gender && child.avatar ? child.avatar : options[0].id;

  const [selected, setSelected] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!params.edit || !params.name;

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveChild({ name, birthYear, birthMonth, gender, avatar: selected });
      haptics.success();
      if (isEdit && child) router.dismissAll();
      else router.replace('/start/routine');
    } catch (e) {
      haptics.warning();
      setError(e instanceof Error && e.message !== 'Network error' ? e.message : t('common.offline'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StartScaffold
      step={isEdit && child ? undefined : t('avatar.step')}
      footer={
        <>
          {error ? (
            <ThemedText type="small" themeColor="danger" style={{ textAlign: 'center' }}>
              {error}
            </ThemedText>
          ) : null}
          <Button title={t('avatar.save')} onPress={onSave} loading={saving} icon={sym('checkmark', 'check')} />
        </>
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
        <ThemedText type="title">{t('avatar.title').replace('{name}', name)}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('avatar.subtitle')}
        </ThemedText>
      </Animated.View>

      <View style={styles.preview}>
        <Animated.View key={selected} entering={ZoomIn.duration(350)} style={[styles.previewRing, { backgroundColor: theme.backgroundElement }]}>
          <Avatar id={selected} size={168} />
        </Animated.View>
        <ThemedText type="subtitle">{name}</ThemedText>
      </View>

      <View style={styles.grid}>
        {options.map((a, i) => {
          const isSelected = a.id === selected;
          return (
            <Animated.View key={a.id} entering={FadeInDown.delay(80 * i).duration(350)} style={styles.cell}>
              <PressableScale
                haptic={false}
                onPress={() => {
                  haptics.select();
                  setSelected(a.id);
                }}
                style={[styles.option, { borderColor: isSelected ? theme.tint : 'transparent' }]}>
                <Avatar id={a.id} size={68} animated={isSelected} />
                {isSelected ? (
                  <View style={[styles.check, { backgroundColor: theme.tint, borderColor: theme.background }]}>
                    <SymbolView name={sym('checkmark', 'check')} size={11} tintColor="#FFFFFF" weight="bold" />
                  </View>
                ) : null}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    gap: Spacing.three,
    marginVertical: Spacing.two,
  },
  previewRing: {
    padding: 8,
    borderRadius: 999,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
  },
  option: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
  },
  check: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
