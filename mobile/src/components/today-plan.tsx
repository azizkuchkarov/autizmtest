import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Card, ProgressBar, PressableScale, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { useAacLog } from '@/lib/aac-store';
import { useDiary } from '@/lib/diary';
import { planProgress, useExercisePlans } from '@/lib/exercises';
import type { TranslationKey } from '@/lib/i18n';
import { useChildPlay } from '@/lib/play-store';
import { nextSkillsDue, useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog } from '@/lib/sound-progress';
import { useVideoDays } from '@/lib/video-log';
import { currentWeek, dayKey, WEEKDAYS } from '@/shared/data/play-activities';

const WEEK_GRADIENT = ['#1E1B4B', '#312E81', '#4338CA'] as const;
const WEEK_MINT = '#5EEAD4';

type PlanItem = { id: string; emoji: string; title: TranslationKey; hint?: string; time?: string | null; open: () => void; done: boolean };

/** Bugun nima qilinishi kerak va nima bajarildi — qo'llanmadagi kun tartibi asosida. */
export function useTodayPlan(): PlanItem[] {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const today = dayKey();
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const skills = useSkillsHistory(childKey);
  const { plans } = useExercisePlans(child?.id, locale);
  const skillsDue = nextSkillsDue(skills);
  const skillsDoneToday = skills.some((r) => dayKey(new Date(r.createdAt)) === today);

  const plan: PlanItem[] = [
    { id: 'diary', emoji: '📔', title: 'today.diary', hint: t('today.diaryHint'), time: child?.diaryTime, open: () => router.push('/diary'), done: !!diary.today },
    {
      id: 'play',
      emoji: '🧸',
      title: 'today.play',
      time: child?.practiceTime,
      open: () => router.navigate('/exercises'),
      done: !!play?.entries.some((e) => e.day === today),
    },
    { id: 'video', emoji: '🎬', title: 'today.video', hint: t('today.videoHint'), open: () => router.navigate('/lessons'), done: videoDays.includes(today) },
    {
      id: 'practice',
      emoji: '🎧',
      title: 'today.practice',
      hint: t('today.practiceHint'),
      open: () => router.navigate('/exercises'),
      done: soundLog.some((e) => e.day === today) || (aacLog[today]?.taps ?? 0) > 0,
    },
  ];
  // Video mashqlar — ota-ona qo'shgan bo'lsa
  const activePlans = (plans ?? []).filter((p) => !p.completedAt);
  if (activePlans.length > 0) {
    const left = activePlans.filter((p) => !planProgress(p).doneToday).length;
    plan.push({
      id: 'exercises',
      emoji: '🎯',
      title: 'today.videoExercises',
      hint: left > 0 ? t('today.videoExercisesHint').replace('{n}', String(left)) : undefined,
      open: () => router.navigate('/exercises'),
      done: left === 0,
    });
  }
  // Oylik ko'nikmalar testi — faqat vaqti kelganda (birinchi marta va keyin har 4 haftada)
  if (child && (skillsDue.due || skillsDoneToday))
    plan.push({ id: 'skills', emoji: '📈', title: 'today.skills', hint: t('today.skillsHint'), open: () => router.push('/skills/run'), done: skillsDoneToday });
  return plan;
}

/** Hafta bo'yicha: har kuni nechta asosiy vazifa bajarilgani (Dushanbadan boshlanadi). */
export function WeekSchedule() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const { plans } = useExercisePlans(child?.id, locale);
  const today = dayKey();
  const days = currentWeek().map((day) => {
    const [y, m, dd] = day.split('-').map(Number);
    // Video mashq shu kuni faol bo'lsagina vazifa sifatida hisoblanadi
    const dayPlans = (plans ?? []).filter((p) => p.createdAt.slice(0, 10) <= day && (!p.completedAt || p.completedAt.slice(0, 10) >= day));
    const tasks = [
      !!diary.byDate(day),
      !!play?.entries.some((e) => e.day === day),
      videoDays.includes(day),
      soundLog.some((e) => e.day === day) || (aacLog[day]?.taps ?? 0) > 0,
      ...(dayPlans.length > 0 ? [dayPlans.every((p) => (p.log[day] ?? 0) >= p.repsPerDay)] : []),
    ];
    const count = tasks.filter(Boolean).length;
    return { day, count, total: tasks.length, label: WEEKDAYS[locale][new Date(y, m - 1, dd).getDay()], isToday: day === today, future: day > today };
  });
  const active = days.filter((d) => d.count > 0).length;
  const totalTasks = days.reduce((n, d) => n + d.total, 0);
  const doneTasks = days.reduce((n, d) => n + d.count, 0);
  const message = active === 0 ? 'today.weekMsg0' : active === 7 ? 'today.weekMsg3' : active >= 3 ? 'today.weekMsg2' : 'today.weekMsg1';

  return (
    <LinearGradient colors={WEEK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.week}>
      <View style={styles.weekGlow} />
      <View style={styles.row}>
        <View style={{ flex: 1, gap: 3 }}>
          <ThemedText type="smallBold" style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13 }}>
            {t('today.week')}
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }}>
            {t('today.weekDays').replace('{n}', String(active))}
          </ThemedText>
          <ThemedText type="small" style={{ color: WEEK_MINT, fontWeight: '600' }}>
            {t(message)}
          </ThemedText>
        </View>
        <WeekRing value={doneTasks / totalTasks} />
      </View>

      <View style={styles.weekBars}>
        {days.map((d) => (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 7 }}>
            <View
              style={[
                styles.weekBar,
                {
                  backgroundColor: d.isToday ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                  borderColor: d.isToday ? 'rgba(255,255,255,0.75)' : 'transparent',
                  opacity: d.future ? 0.6 : 1,
                },
              ]}>
              {Array.from({ length: d.total }, (_, i) => d.total - 1 - i).map((slot) => (
                <View key={slot} style={[styles.weekSlot, { backgroundColor: slot < d.count ? WEEK_MINT : 'rgba(255,255,255,0.1)' }]} />
              ))}
            </View>
            <ThemedText
              type="small"
              style={{ fontSize: 12, color: d.isToday ? '#FFFFFF' : 'rgba(255,255,255,0.6)', fontWeight: d.isToday ? '700' : '500' }}>
              {d.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12.5 }}>
        {t('today.weekTasks').replace('{n}', String(doneTasks)).replace('{total}', String(totalTasks))}
      </ThemedText>
    </LinearGradient>
  );
}

/** Hafta natijasi halqada: bajarilgan vazifalar ulushi. */
function WeekRing({ value }: { value: number }) {
  const size = 68;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={WEEK_MINT}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 15, fontVariant: ['tabular-nums'] }}>
        {Math.round(value * 100)}%
      </ThemedText>
    </View>
  );
}

export function TodayPlan() {
  const { t } = useLocale();
  const theme = useTheme();
  const items = useTodayPlan();
  const done = items.filter((i) => i.done).length;
  const all = done === items.length;

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.row}>
        <ThemedText type="heading" style={{ fontSize: 18, flex: 1 }}>
          {t('today.title')}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
          {t('today.progress').replace('{n}', String(done)).replace('{total}', String(items.length))}
        </ThemedText>
      </View>
      <ProgressBar value={(done / items.length) * 100} color={all ? theme.success : theme.tint} height={6} />
      {all ? (
        <ThemedText type="smallBold" style={{ color: theme.success }}>
          🎉 {t('today.allDone')}
        </ThemedText>
      ) : null}
      <View style={{ marginHorizontal: -Spacing.one }}>
        {items.map((item) => (
          <PressableScale key={item.id} onPress={item.open} scaleTo={0.98} accessibilityRole="button" style={styles.item}>
            <View
              style={[
                styles.check,
                item.done ? { backgroundColor: theme.success, borderColor: theme.success } : { borderColor: theme.border },
              ]}>
              {item.done ? <SymbolView name={sym('checkmark', 'check')} size={14} weight="bold" tintColor="#FFFFFF" /> : null}
            </View>
            <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{item.emoji}</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText
                type="smallBold"
                style={[{ fontSize: 15 }, item.done && { color: theme.textTertiary, textDecorationLine: 'line-through' }]}>
                {t(item.title)}
              </ThemedText>
              {item.hint && !item.done ? (
                <ThemedText type="small" themeColor="textTertiary">
                  {item.hint}
                </ThemedText>
              ) : null}
            </View>
            {item.time ? (
              <View style={[styles.time, { backgroundColor: theme.backgroundMuted }]}>
                <SymbolView name={sym('clock', 'schedule')} size={12} tintColor={theme.textSecondary} />
                <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
                  {item.time}
                </ThemedText>
              </View>
            ) : null}
            <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />
          </PressableScale>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: {
    gap: Spacing.three + 2,
    padding: 20,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  weekGlow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(129,140,248,0.22)',
  },
  weekBars: {
    flexDirection: 'row',
    gap: 6,
  },
  weekBar: {
    width: '100%',
    maxWidth: 40,
    gap: 3,
    padding: 4,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  weekSlot: {
    height: 11,
    borderRadius: 5,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
