import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, ProgressBar, PressableScale, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { useAacLog } from '@/lib/aac-store';
import { useDiary } from '@/lib/diary';
import type { TranslationKey } from '@/lib/i18n';
import { useChildPlay } from '@/lib/play-store';
import { nextSkillsDue, useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog } from '@/lib/sound-progress';
import { useVideoDays } from '@/lib/video-log';
import { dayKey } from '@/shared/data/play-activities';

type PlanItem = { id: string; emoji: string; title: TranslationKey; hint?: string; time?: string | null; open: () => void; done: boolean };

/** Bugun nima qilinishi kerak va nima bajarildi — qo'llanmadagi kun tartibi asosida. */
export function useTodayPlan(): PlanItem[] {
  const { t } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const today = dayKey();
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const skills = useSkillsHistory(childKey);
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
      open: () => router.navigate({ pathname: '/lessons', params: { tab: 'sounds' } }),
      done: soundLog.some((e) => e.day === today) || (aacLog[today]?.taps ?? 0) > 0,
    },
  ];
  // Oylik ko'nikmalar testi — faqat vaqti kelganda (birinchi marta va keyin har 4 haftada)
  if (child && (skillsDue.due || skillsDoneToday))
    plan.push({ id: 'skills', emoji: '📈', title: 'today.skills', hint: t('today.skillsHint'), open: () => router.push('/skills/run'), done: skillsDoneToday });
  return plan;
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
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
