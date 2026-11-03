import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, sym } from '@/components/ui';
import { Accents, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { absoluteUrl, type ExercisePlan, type Video } from '@/lib/api';
import { planProgress, useExercisePlans } from '@/lib/exercises';

const GREEN = Accents.exercises.fg;

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const theme = useTheme();
  const button = (delta: number, icon: ReturnType<typeof sym>, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => onChange(value + delta)}
      style={[styles.stepButton, { backgroundColor: theme.backgroundMuted, opacity: disabled ? 0.4 : 1 }]}>
      <SymbolView name={icon} size={15} weight="bold" tintColor={theme.text} />
    </Pressable>
  );
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ fontSize: 12.5 }}>
        {label}
      </ThemedText>
      <View style={styles.stepper}>
        {button(-1, sym('minus', 'remove'), value <= min)}
        <ThemedText type="heading" style={{ fontSize: 19, minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
          {value}
        </ThemedText>
        {button(1, sym('plus', 'add'), value >= max)}
      </View>
    </View>
  );
}

/** Video ostida: mutaxassis tavsiyasi va ota-ona o'z mashqlariga qo'shishi. */
export function ExerciseAddCard({ video }: { video: Video }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const { child } = useProfile();
  const { plans, add } = useExercisePlans(child?.id, locale);
  const [reps, setReps] = useState(video.exercise?.reps ?? 3);
  const [days, setDays] = useState(video.exercise?.days ?? 7);
  const [saving, setSaving] = useState(false);
  if (!video.exercise) return null;

  const plan = plans?.find((p) => p.videoId === video.id && !p.completedAt);
  if (plan) {
    const p = planProgress(plan);
    return (
      <Card style={{ gap: Spacing.three, backgroundColor: theme.successSoft, borderColor: 'transparent' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={24} tintColor={GREEN} />
          <View style={{ flex: 1 }}>
            <ThemedText type="heading" style={{ color: GREEN, fontSize: 16 }}>
              {t('ex.added')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('ex.todayCount').replace('{n}', String(p.today)).replace('{total}', String(plan.repsPerDay))} ·{' '}
              {t('ex.dayOf').replace('{n}', String(p.currentDay)).replace('{total}', String(plan.days))}
            </ThemedText>
          </View>
        </View>
        <Button title={t('ex.openExercises')} size="md" variant="secondary" onPress={() => router.navigate('/exercises')} />
      </Card>
    );
  }

  const onAdd = async () => {
    setSaving(true);
    try {
      await add(video.id, reps, days);
    } catch {
      Alert.alert(t('common.error'), t('common.offline'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ gap: Spacing.three }}>
      <View style={{ gap: 3 }}>
        <ThemedText type="caption" style={{ color: GREEN }}>
          {t('ex.chip')}
        </ThemedText>
        <ThemedText type="heading" style={{ fontSize: 17 }}>
          {t('ex.cardTitle')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('ex.advice').replace('{reps}', String(video.exercise.reps)).replace('{days}', String(video.exercise.days))}
        </ThemedText>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.three }}>
        <Stepper label={t('ex.perDay')} value={reps} min={1} max={10} onChange={setReps} />
        <Stepper label={t('ex.days')} value={days} min={1} max={60} onChange={setDays} />
      </View>
      <Button title={t('ex.add')} size="md" loading={saving} icon={sym('plus', 'add')} onPress={onAdd} />
    </Card>
  );
}

function Thumb({ video }: { video: Video }) {
  const uri = absoluteUrl(video.thumbnailUrl);
  return (
    <View style={styles.thumb}>
      <LinearGradient colors={Accents.exercises.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
      <View style={styles.thumbPlay}>
        <SymbolView name={sym('play.fill', 'play_arrow')} size={13} tintColor="#FFFFFF" />
      </View>
    </View>
  );
}

function PlanCard({ plan, onLog, onRemove }: { plan: ExercisePlan; onLog: (delta: 1 | -1) => Promise<void>; onRemove: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const p = planProgress(plan);
  const [busy, setBusy] = useState(false);
  const log = async (delta: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    try {
      await onLog(delta);
    } catch {
      Alert.alert(t('common.error'), t('common.offline'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: Spacing.three }}>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/video/${plan.videoId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Thumb video={plan.video} />
        <View style={{ flex: 1, gap: 3 }}>
          <ThemedText type="heading" numberOfLines={2} style={{ fontSize: 15.5, lineHeight: 20 }}>
            {plan.video.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('ex.dayOf').replace('{n}', String(p.currentDay)).replace('{total}', String(plan.days))}
          </ThemedText>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: plan.repsPerDay }, (_, i) => (
            <View key={i} style={[styles.rep, { backgroundColor: i < p.today ? GREEN : theme.backgroundMuted }]} />
          ))}
        </View>
        <ThemedText type="smallBold" style={{ fontSize: 13, color: p.doneToday ? GREEN : theme.textSecondary, fontVariant: ['tabular-nums'] }}>
          {t('ex.todayCount').replace('{n}', String(p.today)).replace('{total}', String(plan.repsPerDay))}
        </ThemedText>
      </View>

      {p.doneToday ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={18} tintColor={GREEN} />
          <ThemedText type="smallBold" style={{ flex: 1, color: GREEN }}>
            {t('ex.doneToday')}
          </ThemedText>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <View style={{ flex: 1 }}>
            <Button title={t('ex.done')} size="md" loading={busy} icon={sym('checkmark', 'check')} onPress={() => log(1)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('ex.watch')} size="md" variant="secondary" onPress={() => router.push(`/video/${plan.videoId}`)} />
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {p.today > 0 ? (
          <ThemedText type="smallBold" themeColor="textSecondary" onPress={() => log(-1)}>
            {t('ex.undo')}
          </ThemedText>
        ) : (
          <View />
        )}
        <ThemedText type="small" themeColor="textTertiary" onPress={onRemove}>
          {t('ex.remove')}
        </ThemedText>
      </View>
    </Card>
  );
}

/** Mashqlar bo'limi: bugun bajariladigan video mashqlar va yakunlanganlari. */
export function VideoExercises() {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const { child } = useProfile();
  const { plans, log, remove, add } = useExercisePlans(child?.id, locale);
  if (!plans) return null;

  const active = plans.filter((p) => !p.completedAt);
  const order = [...active].sort((a, b) => Number(planProgress(a).doneToday) - Number(planProgress(b).doneToday));
  const finished = plans.filter((p) => p.completedAt);

  const onRemove = (plan: ExercisePlan) =>
    Alert.alert(t('ex.remove'), t('ex.removeConfirm'), [
      { text: t('common.back'), style: 'cancel' },
      { text: t('ex.remove'), style: 'destructive', onPress: () => remove(plan.id).catch(() => {}) },
    ]);

  return (
    <View style={{ gap: Spacing.two + 2 }}>
      <ThemedText type="heading" style={{ fontSize: 18 }}>
        {t('ex.videoTitle')}
      </ThemedText>
      {active.length === 0 && finished.length === 0 ? (
        <Card style={{ gap: Spacing.three }}>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14.5, lineHeight: 21 }}>
            {t('ex.emptyBody')}
          </ThemedText>
          <Button title={t('ex.openLessons')} size="md" variant="secondary" onPress={() => router.navigate('/lessons')} />
        </Card>
      ) : null}
      {order.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onLog={(delta) => log(plan.id, delta)} onRemove={() => onRemove(plan)} />
      ))}
      {finished.length > 0 ? (
        <Card style={{ gap: Spacing.three }}>
          <ThemedText type="heading" style={{ fontSize: 16 }}>
            {t('ex.finishedTitle')}
          </ThemedText>
          {finished.map((plan) => (
            <View key={plan.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <SymbolView name={sym('checkmark.seal.fill', 'verified')} size={20} tintColor={GREEN} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {plan.video.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textTertiary">
                  {t('ex.finishedRow').replace('{days}', String(plan.days)).replace('{reps}', String(plan.repsPerDay))}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: theme.tint }} onPress={() => add(plan.videoId, plan.repsPerDay, plan.days).catch(() => {})}>
                {t('ex.again')}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 88,
    height: 62,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,19,48,0.45)',
  },
  rep: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
});
