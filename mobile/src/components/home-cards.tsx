import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ContinueCard, sectionLook } from '@/components/lesson-sections';
import { LevelBadge, useRiskColors } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { useTodayPlan } from '@/components/today-plan';
import { Button, Card, GradientCard, sym } from '@/components/ui';
import { HeroGradient, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useContent } from '@/hooks/use-content';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { StoredAssessment } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';
import { useChildPlay } from '@/lib/play-store';
import { playProgress, screeningProgress, type Trend } from '@/lib/progress';
import { useSkillsHistory } from '@/lib/skills-store';
import { buildSections, syncVideoProgress, useVideoProgress } from '@/lib/video-progress';

const HEADLINE: Record<Trend, TranslationKey> = { better: 'progress.scrHeadBetter', same: 'progress.scrHeadSame', worse: 'progress.scrHeadWorse' };

/** Bosh sahifaning markazi: ota-ona hozir nima qilishi kerakligi — bitta vazifa, bitta tugma. */
export function NextStepCard() {
  const { t } = useLocale();
  const dark = useIsDark();
  const items = useTodayPlan();
  const next = items.find((i) => !i.done);

  return (
    <GradientCard colors={dark ? HeroGradient.dark : HeroGradient.light} style={{ gap: Spacing.three }}>
      <View style={styles.deco} />
      {next ? (
        <>
          <ThemedText type="smallBold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('today.nextCaption')}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <View style={styles.emoji}>
              <ThemedText style={{ fontSize: 28, lineHeight: 34 }}>{next.emoji}</ThemedText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontSize: 21, lineHeight: 27 }}>
                {t(next.title)}
              </ThemedText>
              {next.hint ? (
                <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {next.hint}
                </ThemedText>
              ) : null}
            </View>
          </View>
          <Button title={t('common.start')} variant="light" onPress={next.open} icon={sym('arrow.right', 'arrow_forward')} />
        </>
      ) : (
        <>
          <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontSize: 21, lineHeight: 28 }}>
            🎉 {t('today.allDone')}
          </ThemedText>
          <ThemedText type="small" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('today.doneBody')}
          </ThemedText>
        </>
      )}
    </GradientCard>
  );
}

/** Navbatdagi video dars; hamma dars ko'rilgan bo'lsa ko'rsatilmaydi. */
export function HomeLessonCard() {
  const { t } = useLocale();
  const { categories, professions } = useContent('lesson');
  const progress = useVideoProgress();

  useEffect(() => {
    syncVideoProgress();
  }, []);

  const sections = categories ? buildSections(professions, categories, progress) : [];
  const current = sections.find((s) => s.next && (progress[s.next.id]?.pos ?? 0) > 0) ?? sections.find((s) => s.next);
  if (!current?.next) return null;
  const started = sections.some((s) => s.done > 0) || (progress[current.next.id]?.pos ?? 0) > 0;

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="heading" style={{ fontSize: 18 }}>
        {t('home.lessonCaption')}
      </ThemedText>
      <ContinueCard video={current.next} accent={sectionLook(current.slug).accent} started={started} />
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundMuted }]}>
      <ThemedText type="small" numberOfLines={1} themeColor="textSecondary" style={{ fontSize: 12 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={1} style={{ fontSize: 15 }}>
        {value}
      </ThemedText>
    </View>
  );
}

/** Rivojlanish qisqacha: belgilar o'zgarishi va asosiy raqamlar; batafsili Rivojlanish sahifasida. */
export function HomeProgressCard({ items }: { items: StoredAssessment[] }) {
  const { t } = useLocale();
  const theme = useTheme();
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const skills = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const screening = useMemo(() => screeningProgress(items), [items]);
  const colors = useRiskColors(screening.latest?.tier ?? 'low');
  const latest = screening.latest;
  if (!latest) return null;
  const daily = playProgress(play);
  const skill = skills.at(-1);

  return (
    <Card onPress={() => router.push('/progress')} style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <LevelBadge tier={latest.tier} size={48} />
        <View style={{ flex: 1, gap: 1 }}>
          <ThemedText type="heading" style={{ fontSize: 16, color: colors.fg }}>
            {t(`result.${latest.tier}`)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {screening.trend ? `${t(HEADLINE[screening.trend])} · ${t('home.vsPrev')}` : t('progress.scrFirstHead')}
          </ThemedText>
        </View>
        <SymbolView name={sym('chevron.right', 'chevron_right')} size={15} tintColor={theme.textTertiary} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Tile label={t('home.skillsShort')} value={skill ? `${skill.result.total} / 100` : '—'} />
        <Tile label={t('home.statPractice')} value={`${daily.activeDays} ${t('home.daysUnit')}`} />
        <Tile label={t('home.statStreak')} value={`${daily.streak} ${t('home.daysUnit')}`} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  deco: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tile: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
});
