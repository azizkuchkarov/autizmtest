import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActivityBadge,
  BarList,
  CalendarHeat,
  ChangeRow,
  ColumnChart,
  Legend,
  Meter,
  ShareBar,
  TrendBadge,
} from '@/components/progress/charts';
import { ScreeningDynamics } from '@/components/progress/screening-dynamics';
import { useFormatDate, useRiskColors } from '@/components/result-summary';
import { CardPicture } from '@/components/talk/tile';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, IconBadge, Pill, PressableScale, Skeleton, sym, useCardShadow, type IconName } from '@/components/ui';
import { Radius, Spacing, type AccentName } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme, useViz } from '@/hooks/use-theme';
import { useAacLocalData, useAacLog } from '@/lib/aac-store';
import { fetchAac, fetchSoundSets, type AacCard } from '@/lib/api';
import { listAssessments, type StoredAssessment } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';
import { useDiary } from '@/lib/diary';
import {
  aacProgress,
  activityTrend,
  diaryProgress,
  playProgress,
  scoreTrend,
  screeningProgress,
  skillsComparison,
  soundProgress,
  type ScreeningPoint,
  type Trend,
} from '@/lib/progress';
import { useChildPlay } from '@/lib/play-store';
import { domainTitles } from '@/lib/screening';
import { nextSkillsDue, useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog, useSoundProgress, useSoundSettings, type SoundLevel } from '@/lib/sound-progress';
import { WEEKDAYS } from '@/shared/data/play-activities';
import { SKILL_SECTIONS } from '@/shared/lib/screening-v3/skills';

const TREND_LABEL: Record<Trend, TranslationKey> = { better: 'progress.better', same: 'progress.same', worse: 'progress.worse' };
const LEVEL_TITLE: Record<SoundLevel, TranslationKey> = { 1: 'sounds.level1', 2: 'sounds.level2', 3: 'sounds.level3', 4: 'sounds.level4' };

type SectionId = 'diary' | 'screening' | 'skills' | 'sounds' | 'play' | 'talk';

/** Ishorali farq: +5 / −3 */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const shortDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

/* --------------------------------- Qismlar --------------------------------- */

function Section({
  icon,
  title,
  accent,
  onLayoutY,
  children,
}: {
  icon: IconName;
  title: string;
  accent: AccentName;
  onLayoutY: (y: number) => void;
  children: ReactNode;
}) {
  const a = useAccent(accent);
  return (
    <View style={{ gap: Spacing.two + 4 }} onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}>
      <View style={styles.row}>
        <IconBadge name={icon} color={a.fg} background={a.soft} size={36} />
        <ThemedText type="heading" style={{ fontSize: 19, flex: 1 }}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function CardTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View>
      <ThemedText type="smallBold" style={{ fontSize: 15 }}>
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textTertiary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

function Empty({ title, body, cta, onPress }: { title: string; body?: string; cta: string; onPress: () => void }) {
  return (
    <Card flat style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold" style={{ fontSize: 15 }}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText type="small" themeColor="textSecondary">
          {body}
        </ThemedText>
      ) : null}
      <View style={{ marginTop: Spacing.one }}>
        <Button title={cta} onPress={onPress} size="md" variant="ghost" />
      </View>
    </Card>
  );
}

function Kpi({
  icon,
  accent,
  label,
  value,
  badge,
  caption,
  onPress,
}: {
  icon: IconName;
  accent: AccentName;
  label: string;
  value: string;
  badge?: ReactNode;
  caption: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const a = useAccent(accent);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.kpi, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.row}>
        <IconBadge name={icon} color={a.fg} background={a.soft} size={28} />
        <ThemedText type="smallBold" themeColor="textSecondary" numberOfLines={2} style={{ flex: 1, fontSize: 13, lineHeight: 16 }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="number" style={{ fontSize: 30, lineHeight: 34 }}>
        {value}
      </ThemedText>
      {badge ?? <View style={{ height: 22 }} />}
      <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12, lineHeight: 16 }}>
        {caption}
      </ThemedText>
    </PressableScale>
  );
}

/** Oxirgi testning xavf darajasi — oldingi test bo'lmasa KPI da ko'rsatiladi. */
const MOOD_EMOJI: Record<number, string> = { 1: '😣', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };

type StripDay = { day: string; logged: boolean; mood: number | null; meltdowns: 0 | 1 | 2 | null };

/** 14 kunlik qator: har bir kun — katak, ostida sana. Yozilmagan kun — punktir. */
function DayStrip({ days, render, fill }: { days: StripDay[]; render?: (d: StripDay) => ReactNode; fill?: (d: StripDay) => string | null }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {days.map((d) => {
        const bg = fill?.(d) ?? null;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
            <View
              style={[
                styles.stripCell,
                { backgroundColor: bg ?? (d.logged ? theme.backgroundMuted : 'transparent') },
                !d.logged && { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border },
              ]}>
              {render?.(d)}
            </View>
            <ThemedText style={{ fontSize: 10, lineHeight: 12, color: theme.textTertiary, fontVariant: ['tabular-nums'] }}>
              {Number(d.day.slice(8))}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------- Ekran ---------------------------------- */

export function ProgressView() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const theme = useTheme();
  const viz = useViz();
  const insets = useSafeAreaInsets();
  const formatDate = useFormatDate();

  const [assessments, setAssessments] = useState<StoredAssessment[] | null>(null);
  const [soundCards, setSoundCards] = useState<{ id: string; loud: boolean }[] | null>(null);
  const [aacCards, setAacCards] = useState<Map<string, AacCard>>(new Map());

  const soundLog = useSoundLog(childKey);
  const soundMap = useSoundProgress(childKey);
  const { showLoud } = useSoundSettings();
  const play = useChildPlay(childKey);
  const aacLog = useAacLog(childKey);
  const aacLocal = useAacLocalData(childKey, locale);
  const diary = useDiary(child?.id);
  const skillsHistory = useSkillsHistory(childKey);

  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef<Partial<Record<SectionId, number>>>({});
  const jump = (id: SectionId) => scroll.current?.scrollTo({ y: Math.max(0, (offsets.current[id] ?? 0) - Spacing.three), animated: true });
  const at = (id: SectionId) => (y: number) => {
    offsets.current[id] = y;
  };

  // Test natijasidan qaytganda yoki yangi test topshirilganda ro'yxat yangilanadi
  useFocusEffect(
    useCallback(() => {
      listAssessments().then(setAssessments);
    }, []),
  );

  useEffect(() => {
    let cancelled = false;
    fetchSoundSets(locale).then(
      (res) => !cancelled && setSoundCards(res.sets.flatMap((s) => s.cards)),
      () => !cancelled && setSoundCards([]),
    );
    fetchAac(locale).then(
      (res) => !cancelled && setAacCards(new Map(res.categories.flatMap((c) => c.cards).map((c) => [c.id, c]))),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const padding = { paddingBottom: insets.bottom + Spacing.five };

  if (!assessments || !soundCards)
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, padding]}>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.half}>
              <Skeleton height={150} />
            </View>
          ))}
        </View>
        <Skeleton height={300} />
        <Skeleton height={240} />
      </ScrollView>
    );

  const screening = screeningProgress(assessments);
  const sounds = soundProgress(
    soundLog,
    soundMap,
    soundCards.filter((c) => showLoud || !c.loud).map((c) => c.id),
  );
  const daily = playProgress(play);
  const talk = aacProgress(aacLog);
  const notes = diaryProgress(diary.entries ?? []);
  const skillsLatest = skillsHistory.at(-1);
  const skillsRows = skillsLatest ? skillsComparison(skillsHistory.length > 1 ? skillsHistory[0] : undefined, skillsLatest, play, soundLog) : [];
  const skillsDue = nextSkillsDue(skillsHistory);
  /** Qiyin paytlar darajasi — bitta tusning tartibli shkalasi (yo'q → ko'p). */
  const meltColor = { 0: viz.miss, 1: viz.help, 2: viz.ok } as const;

  const latestAssessment = assessments.find((a) => (a.result as { version?: number }).version !== 3);
  const domainNames = latestAssessment ? domainTitles(latestAssessment.ageGroup, locale) : {};

  const tiers = { low: t('result.levelLow'), moderate: t('result.levelModerate'), high: t('result.levelHigh') };
  const outcome = [
    { key: 'ok', color: viz.ok, label: t('sounds.markIndependent') },
    { key: 'help', color: viz.help, label: t('sounds.markPrompted') },
    { key: 'miss', color: viz.miss, label: t('sounds.markNotYet') },
  ] as const;
  const weekdays = [...WEEKDAYS[locale].slice(1), WEEKDAYS[locale][0]];
  const customTitles = new Map(aacLocal.custom.map((c) => [c.id, { title: c.title, imageUrl: c.imageUrl }]));

  const talkStats = [
    [String(talk.taps), 'progress.taps', activityTrend(talk.taps, talk.tapsPrev), talk.taps - talk.tapsPrev],
    [String(talk.uniqueWords), 'progress.uniqueWords', null, 0],
    [String(talk.sentences), 'progress.sentences', activityTrend(talk.sentences, talk.sentencesPrev), talk.sentences - talk.sentencesPrev],
    [
      `${talk.avgLength} ${t('progress.wordsUnit')}`,
      'progress.avgLength',
      activityTrend(talk.avgLength, talk.avgLengthPrev),
      Math.round((talk.avgLength - talk.avgLengthPrev) * 10) / 10,
    ],
  ] as const;

  return (
    <ScrollView
      ref={scroll}
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, padding]}>
      <ThemedText type="body" themeColor="textSecondary">
        {child?.name ? t('progress.subtitle').replace('{name}', child.name) : t('progress.subtitleDefault')}
      </ThemedText>

      {/* ------------------------------ Skrining ------------------------------ */}
      <Section onLayoutY={at('screening')} icon={sym('stethoscope', 'stethoscope')} title={t('progress.screeningTitle')} accent="test">
        {!screening.latest ? (
          <Empty title={t('progress.noTests')} body={t('progress.noTestsBody')} cta={t('progress.takeTest')} onPress={() => router.push('/screening/run')} />
        ) : (
          <ScreeningDynamics
            screening={screening}
            tiers={tiers}
            domainName={(id) => domainNames[id] ?? id}
            shortDate={shortDate}
          />
        )}
      </Section>

      {/* --------------------------- Ko'nikmalar dinamikasi --------------------------- */}
      <Section onLayoutY={at('skills')} icon={sym('chart.line.uptrend.xyaxis', 'trending_up')} title={t('progress.monthly')} accent="exercises">
        {!skillsLatest ? (
          <Empty title={t('progress.noSkills')} body={t('progress.noSkillsBody')} cta={t('sk.start')} onPress={() => router.push('/skills/run')} />
        ) : (
          <Card style={{ gap: Spacing.three }}>
            <ThemedText type="small" themeColor="textTertiary">
              {skillsHistory.length > 1 ? t('progress.monthlyHint') : t('sk.first')}
            </ThemedText>
            <View style={[styles.retest, { backgroundColor: skillsDue.due ? theme.warningSoft : theme.backgroundMuted }]}>
              <SymbolView name={sym('calendar.badge.clock', 'event')} size={15} tintColor={skillsDue.due ? theme.warning : theme.textSecondary} />
              <ThemedText type="smallBold" style={{ fontSize: 12.5, color: skillsDue.due ? theme.warning : theme.textSecondary }}>
                {skillsDue.due ? t('sk.due') : t('sk.nextDate').replace('{date}', formatDate(skillsDue.date.toISOString()))}
              </ThemedText>
            </View>
            {skillsRows.map((r) => {
              if (r.cur === null) return null;
              const meta = SKILL_SECTIONS.find((x) => x.id === r.id)!;
              const from = r.prev ?? r.cur;
              return (
                <ChangeRow
                  key={r.id}
                  label={`${meta.emoji} ${meta.title[locale]}`}
                  from={from}
                  to={r.cur}
                  badge={
                    <View style={styles.row}>
                      {skillsHistory.length > 1 ? (
                        <ThemedText type="small" themeColor="textTertiary">
                          {t('sk.practiced').replace('{n}', String(r.practiced))}
                        </ThemedText>
                      ) : null}
                      {r.prev !== null ? <ActivityBadge trend={activityTrend(r.cur, r.prev)} value={signed(r.cur - r.prev)} label="" /> : null}
                    </View>
                  }
                />
              );
            })}
            {skillsDue.due ? <Button title={t('sk.start')} onPress={() => router.push('/skills/run')} size="md" /> : null}
            <Button title={t('sk.resultTitle')} onPress={() => router.push(`/skills/${skillsLatest.id}`)} size="md" variant="secondary" />
          </Card>
        )}
      </Section>

      {/* -------------------------- Umumiy ko'rinish -------------------------- */}
      <ThemedText type="heading" style={{ fontSize: 18 }}>
        {t('progress.overview')}
      </ThemedText>
      <View style={[styles.grid, { marginTop: -Spacing.two }]}>
        <View style={styles.half}>
          <Kpi
            onPress={() => jump('diary')}
            icon={sym('book.closed.fill', 'edit_note')}
            accent="test"
            label={t('progress.kpiDiary')}
            value={notes.avgSleep !== null ? `${notes.avgSleep} ${t('progress.hoursUnit')}` : '—'}
            badge={
              notes.avgSleep !== null && notes.avgSleepPrev !== null ? (
                <ActivityBadge
                  trend={activityTrend(notes.avgSleep, notes.avgSleepPrev)}
                  value={signed(Math.round((notes.avgSleep - notes.avgSleepPrev) * 10) / 10)}
                  label={t(TREND_LABEL[activityTrend(notes.avgSleep, notes.avgSleepPrev)])}
                />
              ) : undefined
            }
            caption={`${notes.loggedDays} ${t('progress.diaryDays')}`}
          />
        </View>
        <View style={styles.half}>
          <Kpi
            onPress={() => jump('sounds')}
            icon={sym('ear.fill', 'hearing')}
            accent="lessons"
            label={t('progress.kpiSounds')}
            value={sounds.independence !== null ? `${sounds.independence}%` : '—'}
            badge={
              sounds.independence !== null && sounds.independencePrev !== null ? (
                <ActivityBadge
                  trend={activityTrend(sounds.independence, sounds.independencePrev)}
                  value={signed(sounds.independence - sounds.independencePrev)}
                  label={t(TREND_LABEL[activityTrend(sounds.independence, sounds.independencePrev)])}
                />
              ) : undefined
            }
            caption={sounds.independence !== null ? t('progress.independent') : t('progress.noData')}
          />
        </View>
        <View style={styles.half}>
          <Kpi
            onPress={() => jump('play')}
            icon={sym('figure.and.child.holdinghands', 'family_restroom')}
            accent="exercises"
            label={t('progress.kpiPlay')}
            value={`${daily.activeDays}/30`}
            badge={
              daily.total > 0 ? (
                <ActivityBadge
                  trend={activityTrend(daily.activeDays, daily.activeDaysPrev)}
                  value={signed(daily.activeDays - daily.activeDaysPrev)}
                  label={t(TREND_LABEL[activityTrend(daily.activeDays, daily.activeDaysPrev)])}
                />
              ) : undefined
            }
            caption={t('progress.activeDays')}
          />
        </View>
        <View style={styles.half}>
          <Kpi
            onPress={() => jump('talk')}
            icon={sym('bubble.left.and.text.bubble.right.fill', 'forum')}
            accent="centers"
            label={t('progress.kpiTalk')}
            value={String(talk.taps)}
            badge={
              talk.everUsed ? (
                <ActivityBadge trend={activityTrend(talk.taps, talk.tapsPrev)} value={signed(talk.taps - talk.tapsPrev)} label={t(TREND_LABEL[activityTrend(talk.taps, talk.tapsPrev)])} />
              ) : undefined
            }
            caption={t('progress.tapsUnit')}
          />
        </View>
      </View>

      {/* -------------------------------- Kundalik -------------------------------- */}
      <Section onLayoutY={at('diary')} icon={sym('book.closed.fill', 'edit_note')} title={t('progress.diaryTitle')} accent="test">
        {notes.total === 0 ? (
          <Empty title={t('progress.noDiary')} body={t('progress.noDiaryBody')} cta={t('progress.startDiary')} onPress={() => router.push('/diary')} />
        ) : (
          <>
            <Card style={{ gap: Spacing.three }}>
              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                {(
                  [
                    [notes.avgSleep !== null ? `${notes.avgSleep}` : '—', `${t('progress.hoursUnit')} · ${t('progress.avgSleep')}`],
                    [String(notes.meltDays), t('progress.meltDays')],
                    [String(notes.loggedDays), t('progress.diaryDays')],
                  ] as const
                ).map(([v, label]) => (
                  <View key={label} style={[styles.stat, { backgroundColor: theme.backgroundMuted }]}>
                    <ThemedText type="number" style={{ fontSize: 24, lineHeight: 28 }}>
                      {v}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12, lineHeight: 15 }}>
                      {label}
                    </ThemedText>
                  </View>
                ))}
              </View>
              {notes.insight ? (
                <View style={[styles.insight, { backgroundColor: theme.warningSoft }]}>
                  <SymbolView name={sym('lightbulb.fill', 'lightbulb')} size={16} tintColor={theme.warning} style={{ marginTop: 2 }} />
                  <ThemedText type="small" style={{ flex: 1 }}>
                    {t('progress.insightSleep').replace('{h}', String(notes.insight.threshold)).replace('{x}', String(notes.insight.ratio))}
                  </ThemedText>
                </View>
              ) : notes.insightChecked ? (
                <View style={[styles.row, { alignItems: 'flex-start' }]}>
                  <SymbolView name={sym('info.circle', 'info')} size={14} tintColor={theme.textTertiary} style={{ marginTop: 3 }} />
                  <ThemedText type="small" themeColor="textTertiary" style={{ flex: 1 }}>
                    {t('progress.insightSleepNone')}
                  </ThemedText>
                </View>
              ) : null}
              {!diary.today ? <Button title={t('progress.fillToday')} onPress={() => router.push('/diary')} size="md" variant="ghost" /> : null}
            </Card>
            <Card style={{ gap: 12 }}>
              <CardTitle title={t('progress.sleepChart')} />
              <ColumnChart
                columns={notes.daily.map((d) => ({
                  key: d.day,
                  label: d.day.slice(8),
                  title: formatDate(d.day),
                  segments: [{ key: 'sleep', value: d.sleep ?? 0, color: viz.one, label: t('progress.hoursUnit') }],
                }))}
              />
            </Card>
            <Card style={{ gap: Spacing.three }}>
              <View style={{ gap: Spacing.two }}>
                <CardTitle title={t('progress.moodChart')} />
                <DayStrip
                  days={notes.daily}
                  render={(d) => (d.mood ? <ThemedText style={{ fontSize: 15, lineHeight: 19 }}>{MOOD_EMOJI[d.mood]}</ThemedText> : null)}
                />
              </View>
              <View style={{ gap: Spacing.two }}>
                <CardTitle title={t('progress.meltChart')} />
                <DayStrip days={notes.daily} fill={(d) => (d.meltdowns === null ? null : meltColor[d.meltdowns])} />
                <Legend items={([0, 1, 2] as const).map((l) => ({ color: meltColor[l], label: t(`diary.melt${l}` as TranslationKey) }))} />
              </View>
            </Card>
          </>
        )}
      </Section>

      {/* --------------------------- Ovozli mashqlar --------------------------- */}
      <Section onLayoutY={at('sounds')} icon={sym('ear.fill', 'hearing')} title={t('progress.kpiSounds')} accent="lessons">
        {sounds.total === 0 ? (
          <Empty title={t('progress.noSounds')} cta={t('progress.startSounds')} onPress={() => router.navigate({ pathname: '/lessons', params: { tab: 'sounds' } })} />
        ) : (
          <>
            <Card style={{ gap: Spacing.three }}>
              <CardTitle title={t('progress.levelsTitle')} hint={t('progress.levelsHint')} />
              {sounds.levels.map((l) => (
                <Meter key={l.level} value={l.mastery} label={`${t('sounds.levelN').replace('{n}', String(l.level))} · ${t(LEVEL_TITLE[l.level])}`} />
              ))}
            </Card>
            <Card style={{ gap: Spacing.two + 4 }}>
              <CardTitle title={t('progress.weeklyAnswers')} />
              <Legend items={outcome.map((o) => ({ color: o.color, label: o.label }))} />
              <ColumnChart
                height={200}
                columns={sounds.weeks.map((w) => ({
                  key: w.start.toISOString(),
                  label: shortDate(w.start),
                  title: formatDate(w.start.toISOString()),
                  segments: outcome.map((o) => ({ key: o.key, value: w[o.key], color: o.color, label: o.label })),
                }))}
              />
            </Card>
          </>
        )}
      </Section>

      {/* --------------------------- Bugungi 5 daqiqa --------------------------- */}
      <Section onLayoutY={at('play')} icon={sym('figure.and.child.holdinghands', 'family_restroom')} title={t('progress.kpiPlay')} accent="exercises">
        {daily.total === 0 ? (
          <Empty title={t('progress.noPlay')} cta={t('progress.startPlay')} onPress={() => router.push('/play')} />
        ) : (
          <>
            <Card style={{ gap: Spacing.three }}>
              <View style={[styles.row, { alignItems: 'stretch' }]}>
                {(
                  [
                    [daily.streak, 'progress.streak'],
                    [daily.sessions30, 'progress.sessions'],
                    [daily.total, 'progress.totalSessions'],
                  ] as const
                ).map(([v, label]) => (
                  <View key={label} style={[styles.stat, { backgroundColor: theme.backgroundMuted }]}>
                    <ThemedText type="number" style={{ fontSize: 24, lineHeight: 28 }}>
                      {v}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12, lineHeight: 15 }}>
                      {t(label)}
                    </ThemedText>
                  </View>
                ))}
              </View>
              <CardTitle title={t('progress.calendarTitle')} />
              <CalendarHeat weeks={daily.calendar} weekdays={weekdays} doneLabel={t('progress.done')} notDoneLabel={t('progress.notDone')} />
            </Card>
            <Card style={{ gap: Spacing.three }}>
              <CardTitle title={t('progress.ratingsTitle')} />
              {daily.sessions30 > 0 ? (
                <ShareBar
                  parts={[
                    { key: 'great', value: daily.ratings.great, color: viz.ok, label: t('play.rating.great') },
                    { key: 'ok', value: daily.ratings.ok, color: viz.help, label: t('play.rating.ok') },
                    { key: 'hard', value: daily.ratings.hard, color: viz.miss, label: t('play.rating.hard') },
                  ]}
                />
              ) : (
                <ThemedText type="small" themeColor="textTertiary">
                  {t('progress.noData')}
                </ThemedText>
              )}
              <CardTitle title={t('progress.skillsTitle')} />
              <BarList items={daily.skills.filter((s) => s.count > 0).map((s) => ({ key: s.skill, label: t(`play.skill.${s.skill}`), value: s.count }))} />
            </Card>
          </>
        )}
      </Section>

      {/* ---------------------------- Rasmli muloqot ---------------------------- */}
      <Section onLayoutY={at('talk')} icon={sym('bubble.left.and.text.bubble.right.fill', 'forum')} title={t('progress.kpiTalk')} accent="centers">
        {!talk.everUsed ? (
          <Empty title={t('progress.noTalk')} cta={t('progress.startTalk')} onPress={() => router.push('/talk')} />
        ) : (
          <>
            <View style={styles.grid}>
              {talkStats.map(([value, label, trend, delta]) => (
                <View key={label} style={styles.half}>
                  <Card flat style={{ gap: 6, padding: Spacing.three }}>
                    <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12.5 }}>
                      {t(label)}
                    </ThemedText>
                    <ThemedText type="number" style={{ fontSize: 24, lineHeight: 28 }}>
                      {value}
                    </ThemedText>
                    {trend ? (
                      <ActivityBadge trend={trend} value={signed(delta)} label="" />
                    ) : (
                      <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12, lineHeight: 22 }}>
                        {t('progress.period30')}
                      </ThemedText>
                    )}
                  </Card>
                </View>
              ))}
            </View>
            <Card style={{ gap: Spacing.two + 4 }}>
              <CardTitle title={t('progress.dailyTaps')} />
              <ColumnChart
                columns={talk.daily.map((d) => ({
                  key: d.day,
                  label: d.day.slice(8),
                  title: formatDate(d.day),
                  segments: [{ key: 'taps', value: d.taps, color: viz.one, label: t('progress.taps') }],
                }))}
              />
            </Card>
            <Card style={{ gap: Spacing.two + 4 }}>
              <CardTitle title={t('progress.topWords')} />
              {talk.top.length === 0 ? (
                <ThemedText type="small" themeColor="textTertiary">
                  {t('progress.noData')}
                </ThemedText>
              ) : (
                <View style={styles.words}>
                  {talk.top.map(({ id, count }) => {
                    const card = aacCards.get(id);
                    const custom = customTitles.get(id);
                    const title = card?.title ?? custom?.title ?? '—';
                    return (
                      <View key={id} style={[styles.word, { borderColor: theme.border, backgroundColor: theme.background }]}>
                        <View style={[styles.wordPic, { backgroundColor: theme.backgroundMuted }]}>
                          <CardPicture card={{ title, emoji: card?.emoji ?? null, imageUrl: card?.imageUrl ?? custom?.imageUrl ?? null }} size={20} radius={10} />
                        </View>
                        <ThemedText type="smallBold" style={{ fontSize: 13.5 }}>
                          {title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textTertiary" style={{ fontVariant: ['tabular-nums'] }}>
                          ×{count}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </>
        )}
      </Section>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <ThemedText type="small" themeColor="textTertiary">
          {t('progress.disclaimer')}
        </ThemedText>
        <ThemedText type="small" themeColor="textTertiary">
          {t('progress.localNote')}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.five,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 },
  half: { width: '50%', paddingHorizontal: 6 },
  kpi: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  retest: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  stat: { flex: 1, gap: 2, borderRadius: 16, padding: 12 },
  stripCell: { width: '100%', aspectRatio: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, borderRadius: 14, padding: 12 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
  },
  wordPic: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  footer: { gap: Spacing.one, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
});
