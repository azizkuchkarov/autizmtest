import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActivityBadge } from '@/components/progress/charts';
import { useFormatDate } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, ProgressBar, Screen, SectionHeader, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme, useViz } from '@/hooks/use-theme';
import { useChildPlay } from '@/lib/play-store';
import { activityTrend, skillsComparison } from '@/lib/progress';
import { nextSkillsDue, useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog } from '@/lib/sound-progress';
import { SKILL_SECTIONS } from '@/shared/lib/screening-v3/skills';

const TREND = { better: 'progress.better', same: 'progress.same', worse: 'progress.worse' } as const;
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

/** Ko'nikmalar testi natijasi: har bo'lim balli, oldingi testga nisbatan o'zgarish va shu davrdagi mashqlar. */
export default function SkillsResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useLocale();
  const theme = useTheme();
  const viz = useViz();
  const formatDate = useFormatDate();
  const childKey = useProfile().child?.id ?? 'default';
  const history = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const soundLog = useSoundLog(childKey);

  const index = history.findIndex((r) => r.id === id || r.serverId === id);
  const record = history[index];
  if (!record) return <EmptyState icon={sym('exclamationmark.triangle', 'error')} title={t('common.error')} />;

  const prev = index > 0 ? history[index - 1] : undefined;
  const rows = skillsComparison(prev, record, play, soundLog);
  const next = nextSkillsDue(history.slice(0, index + 1));
  const scored = rows.filter((r) => r.cur !== null);
  const focus = [...scored].sort((a, b) => (a.cur ?? 0) - (b.cur ?? 0)).slice(0, 2);
  const totalTrend = prev ? activityTrend(record.result.total, prev.result.total) : null;

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five }}>
          <ThemedText type="small" themeColor="textTertiary">
            {formatDate(record.createdAt)}
          </ThemedText>
          <ThemedText style={{ fontFamily: 'Manrope_800ExtraBold', fontSize: 52, lineHeight: 58, color: theme.tint, fontVariant: ['tabular-nums'] }}>
            {record.result.total}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            / 100
          </ThemedText>
          {prev && totalTrend ? (
            <View style={{ alignSelf: 'center' }}>
              <ActivityBadge trend={totalTrend} value={signed(record.result.total - prev.result.total)} label={t(TREND[totalTrend])} />
            </View>
          ) : (
            <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.one }}>
              {t('sk.first')}
            </ThemedText>
          )}
        </Card>
      </Animated.View>

      <SectionHeader title={prev ? t('sk.vsPrev').replace('{date}', formatDate(prev.createdAt)) : t('r3.sections')} />
      <Animated.View entering={FadeInDown.delay(80).duration(450)}>
        <Card style={{ gap: Spacing.four }}>
          {rows.map((r) => {
            if (r.cur === null) return null;
            const meta = SKILL_SECTIONS.find((s) => s.id === r.id)!;
            return (
              <View key={r.id} style={{ gap: Spacing.two }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two }}>
                  <ThemedText style={{ fontSize: 20, lineHeight: 26 }}>{meta.emoji}</ThemedText>
                  <ThemedText type="heading" style={{ flex: 1, fontSize: 15 }}>
                    {meta.title[locale]}
                  </ThemedText>
                  {r.prev !== null ? (
                    <ThemedText type="small" themeColor="textTertiary" style={{ fontVariant: ['tabular-nums'] }}>
                      {r.prev} →
                    </ThemedText>
                  ) : null}
                  <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>
                    {r.cur}
                  </ThemedText>
                  {r.delta !== null ? <ActivityBadge trend={activityTrend(r.cur, r.prev ?? r.cur)} value={signed(r.delta)} label="" /> : null}
                </View>
                <ProgressBar value={Math.max(3, r.cur)} color={viz.one} height={7} />
                {prev ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <SymbolView name={sym('dumbbell', 'fitness_center')} size={13} tintColor={theme.textTertiary} />
                    <ThemedText type="small" themeColor="textTertiary">
                      {t('sk.practiced').replace('{n}', String(r.practiced))}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      </Animated.View>

      {focus.length > 0 && (
        <Card tone="backgroundMuted" flat style={{ gap: Spacing.two, borderWidth: 0 }}>
          <ThemedText type="heading" style={{ fontSize: 16 }}>
            🎯 {t('sk.focus')}
          </ThemedText>
          <ThemedText type="body">{focus.map((f) => SKILL_SECTIONS.find((s) => s.id === f.id)!.title[locale]).join(', ')}</ThemedText>
          <Button title={t('sk.toExercises')} size="md" variant="ghost" onPress={() => router.navigate('/exercises')} />
        </Card>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <SymbolView name={sym('calendar.badge.clock', 'event_upcoming')} size={15} tintColor={theme.textTertiary} />
        <ThemedText type="small" themeColor="textTertiary">
          {t('sk.nextDate').replace('{date}', formatDate(next.date.toISOString()))}
        </ThemedText>
      </View>
    </Screen>
  );
}
