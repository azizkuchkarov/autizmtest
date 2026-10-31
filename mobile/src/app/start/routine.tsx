import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FieldLabel } from '@/components/child-form';
import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { TimePickerSheet } from '@/components/time-picker';
import { Button, PressableScale, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import { getReminderPermission, requestReminderPermission, syncReminders, type ReminderPermission } from '@/lib/reminders';

const PRACTICE_SLOTS: { time: string; emoji: string; label: TranslationKey }[] = [
  { time: '10:00', emoji: '🌅', label: 'routine.morning' },
  { time: '13:30', emoji: '☀️', label: 'routine.noon' },
  { time: '17:00', emoji: '🌇', label: 'routine.afternoon' },
  { time: '19:30', emoji: '🌙', label: 'routine.evening' },
];

const DIARY_SLOTS = ['07:30', '08:30', '09:30'];

function TimeChip({ selected, onPress, children, style }: { selected: boolean; onPress: () => void; children: ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <PressableScale
      haptic={false}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={[
        styles.chip,
        { backgroundColor: selected ? theme.tintSoft : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
        style,
      ]}>
      {children}
    </PressableScale>
  );
}

/** Bildirishnomaga ruxsat holati; sozlamalardan qaytganda yangilanadi. */
function usePermission() {
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  useEffect(() => {
    const check = () => getReminderPermission().then(setPermission, () => {});
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);
  return [permission, setPermission] as const;
}

/** Mashg'ulot vaqti: ota-ona kunning qaysi qismida shug'ullanishini tanlaydi — 15 daqiqa oldin eslatiladi. */
export default function RoutineScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { t } = useLocale();
  const theme = useTheme();
  const { child, updateChildFields } = useProfile();
  const [practice, setPractice] = useState(child?.practiceTime ?? '');
  const [diary, setDiary] = useState(child?.diaryTime ?? '08:30');
  const [reminders, setReminders] = useState(child?.remindersOn ?? true);
  const [picker, setPicker] = useState<'practice' | 'diary' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permission, setPermission] = usePermission();

  const customPractice = !!practice && !PRACTICE_SLOTS.some((s) => s.time === practice);
  const customDiary = !DIARY_SLOTS.includes(diary);

  const askPermission = async () => {
    setPermission(await requestReminderPermission().catch(() => 'denied' as const));
  };

  const toggleReminders = (on: boolean) => {
    setReminders(on);
    // Birinchi marta yoqilganda — darhol ruxsat so'raymiz
    if (on && permission === 'undetermined') askPermission();
  };

  const save = async () => {
    if (!practice) return;
    setSaving(true);
    setError('');
    try {
      if (reminders && permission === 'undetermined') await askPermission();
      const saved = await updateChildFields({ practiceTime: practice, diaryTime: diary, remindersOn: reminders });
      // Ruxsat hozir berilgan bo'lishi mumkin — vaqt o'zgarmagan bo'lsa ham qayta rejalashtiramiz
      syncReminders(saved, t).catch(() => {});
      haptics.success();
      if (edit) router.back();
      else router.replace('/start/done');
    } catch {
      haptics.warning();
      setError(t('common.offline'));
      setSaving(false);
    }
  };

  return (
    <StartScaffold
      back={!!edit}
      step={edit ? undefined : t('routine.step')}
      footer={
        <>
          {error ? (
            <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
              {error}
            </ThemedText>
          ) : null}
          <Button
            title={edit ? t('routine.save') : t('routine.next')}
            onPress={save}
            disabled={!practice}
            loading={saving}
            icon={edit ? sym('checkmark', 'check') : sym('arrow.right', 'arrow_forward')}
          />
        </>
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
        <ThemedText type="title">{t('routine.title')}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('routine.body')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.grid}>
        {PRACTICE_SLOTS.map((s) => (
          <TimeChip key={s.time} selected={practice === s.time} onPress={() => setPractice(s.time)} style={styles.half}>
            <ThemedText style={{ fontSize: 28, lineHeight: 34 }}>{s.emoji}</ThemedText>
            <ThemedText type="smallBold" style={{ fontSize: 14, color: practice === s.time ? theme.tint : theme.text }}>
              {t(s.label)}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary" style={{ fontVariant: ['tabular-nums'] }}>
              {s.time}
            </ThemedText>
          </TimeChip>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <PressableScale
          onPress={() => setPicker('practice')}
          accessibilityRole="button"
          accessibilityLabel={t('routine.practiceAt')}
          style={[
            styles.customRow,
            { backgroundColor: customPractice ? theme.tintSoft : theme.backgroundElement, borderColor: customPractice ? theme.tint : theme.border },
          ]}>
          <ThemedText type="smallBold" style={{ fontSize: 14.5, flex: 1 }}>
            {t('routine.custom')}
          </ThemedText>
          <View style={[styles.timeBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <SymbolView name={sym('clock', 'schedule')} size={15} tintColor={theme.textSecondary} />
            <ThemedText type="heading" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
              {customPractice ? practice : '--:--'}
            </ThemedText>
          </View>
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ gap: Spacing.two }}>
        <FieldLabel>{t('routine.diaryTitle')}</FieldLabel>
        <ThemedText type="small" themeColor="textTertiary" style={{ marginTop: -Spacing.one }}>
          {t('routine.diaryBody')}
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          {DIARY_SLOTS.map((time) => (
            <TimeChip key={time} selected={diary === time} onPress={() => setDiary(time)} style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ fontSize: 15, fontVariant: ['tabular-nums'], color: diary === time ? theme.tint : theme.text }}>
                {time}
              </ThemedText>
            </TimeChip>
          ))}
          <TimeChip selected={customDiary} onPress={() => setPicker('diary')} style={{ flex: 1 }}>
            {customDiary ? (
              <ThemedText type="smallBold" style={{ fontSize: 15, fontVariant: ['tabular-nums'], color: theme.tint }}>
                {diary}
              </ThemedText>
            ) : (
              <SymbolView name={sym('clock', 'schedule')} size={18} tintColor={theme.textSecondary} />
            )}
          </TimeChip>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={[styles.reminders, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.row}>
          <View style={[styles.bell, { backgroundColor: theme.tintSoft }]}>
            <SymbolView name={reminders ? sym('bell.fill', 'notifications') : sym('bell.slash.fill', 'notifications_off')} size={20} tintColor={theme.tint} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={{ fontSize: 15 }}>
              {t('routine.reminders')}
            </ThemedText>
            <ThemedText type="small" themeColor="textTertiary">
              {t('routine.remindersHint')}
            </ThemedText>
          </View>
          <Switch value={reminders} onValueChange={toggleReminders} trackColor={{ true: theme.tint }} accessibilityLabel={t('routine.reminders')} />
        </View>
        {reminders && permission ? (
          <View style={[styles.permission, { borderTopColor: theme.border }]}>
            {permission === 'granted' ? (
              <View style={styles.row}>
                <SymbolView name={sym('checkmark', 'check')} size={15} tintColor={theme.success} />
                <ThemedText type="smallBold" style={{ color: theme.success }}>
                  {t('routine.allowed')}
                </ThemedText>
              </View>
            ) : permission === 'denied' ? (
              <>
                <ThemedText type="small" style={{ color: theme.warning }}>
                  {t('routine.denied')}
                </ThemedText>
                <Pressable onPress={() => Linking.openSettings()} style={[styles.pill, { backgroundColor: theme.tintSoft }]}>
                  <ThemedText type="smallBold" style={{ color: theme.tint }}>
                    {t('routine.openSettings')}
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={askPermission} style={[styles.pill, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="smallBold" style={{ color: theme.tint }}>
                  {t('routine.allowBrowser')}
                </ThemedText>
              </Pressable>
            )}
            <ThemedText type="small" themeColor="textTertiary">
              {t('routine.browserNote')}
            </ThemedText>
          </View>
        ) : null}
      </Animated.View>

      <TimePickerSheet
        visible={picker === 'practice'}
        title={t('routine.practiceAt')}
        value={practice}
        fallback="17:00"
        onClose={() => setPicker(null)}
        onChange={setPractice}
      />
      <TimePickerSheet
        visible={picker === 'diary'}
        title={t('routine.diaryTitle')}
        value={diary}
        fallback="08:30"
        onClose={() => setPicker(null)}
        onChange={setDiary}
      />
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  half: {
    width: '47%',
    flexGrow: 1,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 52,
    paddingHorizontal: Spacing.two,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reminders: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 6,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
