import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TimePickerSheet } from '@/components/time-picker';
import { Button, Card, EmptyState, PressableScale, Segmented, Skeleton, sym, type IconName } from '@/components/ui';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import type { DiaryEntry } from '@/lib/api';
import { emptyDiary, sleepHours, useDiary } from '@/lib/diary';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import { dayKey, lastDays } from '@/shared/data/play-activities';

type Option<T> = { value: T; label: TranslationKey; emoji?: string };

/** Bitta tanlov guruhi; tanlangan variantni qayta bosish tanlovni bekor qiladi. */
function Choice<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label?: TranslationKey;
  options: Option<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 14 }}>
          {t(label)}
        </ThemedText>
      ) : null}
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <PressableScale
              key={String(o.value)}
              haptic={false}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptics.select();
                onChange(on ? null : o.value);
              }}
              style={[styles.option, { backgroundColor: on ? theme.tintSoft : theme.backgroundElement, borderColor: on ? theme.tint : theme.border }]}>
              {o.emoji ? <ThemedText>{o.emoji}</ThemedText> : null}
              <ThemedText type="smallBold" style={{ fontSize: 14.5, color: on ? theme.tint : theme.text }}>
                {t(o.label)}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function Section({ emoji, title, children }: { emoji: string; title: TranslationKey; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <Card style={{ gap: Spacing.three }}>
      <ThemedText type="heading" style={{ fontSize: 17 }}>
        {emoji} {t(title)}
      </ThemedText>
      {children}
    </Card>
  );
}

function TimeField({ icon, label, value, onPress }: { icon: IconName; label: TranslationKey; value: string | null; onPress: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      style={[styles.timeField, { backgroundColor: theme.background, borderColor: value ? theme.tint : theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <SymbolView name={icon} size={15} tintColor={theme.textSecondary} />
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 13 }} numberOfLines={1}>
          {t(label)}
        </ThemedText>
      </View>
      <ThemedText type="heading" style={{ fontSize: 20, fontVariant: ['tabular-nums'], color: value ? theme.text : theme.textTertiary }}>
        {value ?? '--:--'}
      </ThemedText>
    </PressableScale>
  );
}

const MOODS: Option<number>[] = [
  { value: 1, label: 'diary.mood1', emoji: '😣' },
  { value: 2, label: 'diary.mood2', emoji: '🙁' },
  { value: 3, label: 'diary.mood3', emoji: '😐' },
  { value: 4, label: 'diary.mood4', emoji: '🙂' },
  { value: 5, label: 'diary.mood5', emoji: '😄' },
];

const HEALTH = [
  ['sick', 'diary.sick', '🤒'],
  ['constipation', 'diary.constipation', '😣'],
  ['medicine', 'diary.medicine', '💊'],
] as const;

/** Bir kunlik forma: mavjud yozuv bo'lsa u bilan to'ldiriladi. */
function DiaryForm({ date, initial, onSave }: { date: string; initial: DiaryEntry; onSave: (e: DiaryEntry) => Promise<void> }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [d, setD] = useState<DiaryEntry>(initial);
  const [picker, setPicker] = useState<'bedTime' | 'wakeTime' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const set =
    <K extends keyof DiaryEntry>(key: K) =>
    (value: DiaryEntry[K]) =>
      setD((prev) => ({ ...prev, [key]: value }));
  const hours = sleepHours(d.bedTime, d.wakeTime);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      await onSave({ ...d, date, note: d.note?.trim() || null });
      haptics.success();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch {
      haptics.warning();
      setError(true);
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Section emoji="😴" title="diary.sleep">
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TimeField icon={sym('moon.fill', 'bedtime')} label="diary.bedTime" value={d.bedTime} onPress={() => setPicker('bedTime')} />
            <TimeField icon={sym('sun.max.fill', 'wb_sunny')} label="diary.wakeTime" value={d.wakeTime} onPress={() => setPicker('wakeTime')} />
          </View>
          {hours !== null ? (
            <ThemedText type="smallBold" style={{ color: theme.tint, marginTop: -Spacing.one }}>
              {t('diary.sleepHours').replace('{h}', String(hours))}
            </ThemedText>
          ) : null}
          <Choice
            label="diary.nightWakings"
            value={d.nightWakings}
            onChange={set('nightWakings')}
            options={[
              { value: 0, label: 'diary.wake0' },
              { value: 1, label: 'diary.wake1' },
              { value: 2, label: 'diary.wake2' },
            ]}
          />
        </Section>

        <Section emoji="🙂" title="diary.mood">
          <View style={{ flexDirection: 'row', gap: 6 }} accessibilityRole="radiogroup">
            {MOODS.map((m) => {
              const on = d.mood === m.value;
              return (
                <PressableScale
                  key={m.value}
                  haptic={false}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={t(m.label)}
                  onPress={() => {
                    haptics.select();
                    set('mood')(on ? null : m.value);
                  }}
                  style={[styles.mood, { backgroundColor: on ? theme.tintSoft : theme.backgroundElement, borderColor: on ? theme.tint : theme.border }]}>
                  <ThemedText style={{ fontSize: 28, lineHeight: 34 }}>{m.emoji}</ThemedText>
                  <ThemedText
                    numberOfLines={2}
                    style={{ fontSize: 10.5, lineHeight: 13, textAlign: 'center', fontFamily: FontFamily.semibold, color: on ? theme.tint : theme.textTertiary }}>
                    {t(m.label)}
                  </ThemedText>
                </PressableScale>
              );
            })}
          </View>
        </Section>

        <Section emoji="🍽️" title="diary.food">
          <Choice
            label="diary.breakfast"
            value={d.breakfast}
            onChange={set('breakfast')}
            options={[
              { value: 'full', label: 'diary.full' },
              { value: 'little', label: 'diary.little' },
              { value: 'none', label: 'diary.none' },
            ]}
          />
          <Choice
            label="diary.appetite"
            value={d.appetite}
            onChange={set('appetite')}
            options={[
              { value: 'good', label: 'diary.good' },
              { value: 'normal', label: 'diary.normal' },
              { value: 'poor', label: 'diary.poor' },
            ]}
          />
        </Section>

        <Section emoji="🧩" title="diary.behavior">
          <Choice
            label="diary.meltdowns"
            value={d.meltdowns}
            onChange={set('meltdowns')}
            options={[
              { value: 0, label: 'diary.melt0' },
              { value: 1, label: 'diary.melt1' },
              { value: 2, label: 'diary.melt2' },
            ]}
          />
          <Choice
            label="diary.repetitive"
            value={d.repetitive}
            onChange={set('repetitive')}
            options={[
              { value: 'low', label: 'diary.low' },
              { value: 'mid', label: 'diary.mid' },
              { value: 'high', label: 'diary.high' },
            ]}
          />
          <Choice
            label="diary.selfHarm"
            value={d.selfHarm}
            onChange={set('selfHarm')}
            options={[
              { value: false, label: 'diary.no' },
              { value: true, label: 'diary.yes' },
            ]}
          />
        </Section>

        <Section emoji="💬" title="diary.communication">
          <Choice
            label="diary.eyeContact"
            value={d.eyeContact}
            onChange={set('eyeContact')}
            options={[
              { value: 'good', label: 'diary.eyeGood' },
              { value: 'some', label: 'diary.eyeSome' },
              { value: 'none', label: 'diary.eyeNone' },
            ]}
          />
          <Choice
            label="diary.requests"
            value={d.requests}
            onChange={set('requests')}
            options={[
              { value: 'words', label: 'diary.reqWords' },
              { value: 'gestures', label: 'diary.reqGestures' },
              { value: 'none', label: 'diary.reqNone' },
            ]}
          />
        </Section>

        <Section emoji="🩺" title="diary.health">
          <View style={styles.wrap}>
            {HEALTH.map(([key, label, emoji]) => {
              const on = d[key] === true;
              return (
                <PressableScale
                  key={key}
                  haptic={false}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    haptics.select();
                    set(key)(!on);
                  }}
                  style={[styles.option, { backgroundColor: on ? theme.warningSoft : theme.backgroundElement, borderColor: on ? theme.warning : theme.border }]}>
                  <ThemedText>{emoji}</ThemedText>
                  <ThemedText type="smallBold" style={{ fontSize: 14.5 }}>
                    {t(label)}
                  </ThemedText>
                  {on ? <SymbolView name={sym('checkmark', 'check')} size={14} tintColor={theme.warning} /> : null}
                </PressableScale>
              );
            })}
          </View>
        </Section>

        <Section emoji="✏️" title="diary.note">
          <TextInput
            value={d.note ?? ''}
            onChangeText={set('note')}
            placeholder={t('diary.notePlaceholder')}
            placeholderTextColor={theme.textTertiary}
            multiline
            maxLength={2000}
            style={[styles.note, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
          />
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {error ? (
          <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
            {t('common.offline')}
          </ThemedText>
        ) : null}
        <Button title={t('diary.save')} icon={sym('checkmark', 'check')} onPress={save} loading={saving} />
        {initial.updatedAt ? (
          <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            {t('diary.updated').replace(
              '{time}',
              new Date(initial.updatedAt).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' }),
            )}
          </ThemedText>
        ) : null}
      </View>

      <TimePickerSheet
        visible={picker !== null}
        title={picker === 'wakeTime' ? t('diary.wakeTime') : t('diary.bedTime')}
        value={picker ? d[picker] : null}
        fallback={picker === 'wakeTime' ? '07:00' : '21:00'}
        onClose={() => setPicker(null)}
        onChange={(time) => picker && set(picker)(time)}
        onClear={() => picker && set(picker)(null)}
      />
    </>
  );
}

/** Ertalabki kundalik: bolaning uyqusi, ovqati, kayfiyati va xulqi — kuniga 1 daqiqa. */
export default function DiaryScreen() {
  const { t } = useLocale();
  const theme = useTheme();
  const { child } = useProfile();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = dayKey();
  const yesterday = lastDays(2)[1];
  const [date, setDate] = useState(params.date === yesterday ? yesterday : today);
  const diary = useDiary(child?.id);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <View style={styles.top}>
        <ThemedText type="body" themeColor="textSecondary">
          {child?.name ? `${child.name} — ${t('diary.subtitle')}` : t('diary.subtitle')}
        </ThemedText>
        <Segmented
          options={[
            { value: today, label: t('diary.today') },
            { value: yesterday, label: t('diary.yesterday') },
          ]}
          value={date}
          onChange={setDate}
        />
      </View>
      {diary.error && !diary.entries ? (
        <EmptyState
          icon={sym('wifi.slash', 'wifi_off')}
          title={t('common.offlineTitle')}
          body={t('common.offline')}
          actionTitle={t('common.retry')}
          onAction={diary.reload}
        />
      ) : !diary.entries ? (
        <View style={styles.content}>
          <Skeleton height={180} />
          <Skeleton height={120} />
          <Skeleton height={180} />
        </View>
      ) : (
        <DiaryForm key={date} date={date} initial={diary.byDate(date) ?? emptyDiary(date)} onSave={diary.save} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: 12,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mood: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  timeField: {
    flex: 1,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
  },
  note: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 15.5,
    fontFamily: FontFamily.regular,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
