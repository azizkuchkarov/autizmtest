import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { mix } from '@/components/talk/tile';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, OptionChip, PressableScale, ProgressBar, sym, useCardShadow } from '@/components/ui';
import { Accents, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import { nextTodayPlay, recordPlay, useChildPlay } from '@/lib/play-store';
import {
  childAge,
  dayKey,
  PLAY_ACTIVITIES,
  PLAY_RULES,
  PLAY_SECONDS,
  PLAY_SKILLS,
  playSummary,
  SKILL_COLORS,
  WEEKDAYS,
  type PlayActivity,
  type PlayRating,
  type PlaySkill,
} from '@/shared/data/play-activities';

const GREEN = Accents.exercises.fg;

function usePlay() {
  const { child } = useProfile();
  const childKey = child?.id ?? 'default';
  const data = useChildPlay(childKey);
  const age = childAge(child?.birthYear);
  return { childKey, age, summary: playSummary(data, age) };
}

function useSoft() {
  const theme = useTheme();
  return (color: string) => mix(color, theme.backgroundElement, 0.14);
}

function SkillChip({ skill }: { skill: PlaySkill }) {
  const { t } = useLocale();
  const soft = useSoft();
  const color = SKILL_COLORS[skill];
  return (
    <View style={[styles.chip, { backgroundColor: soft(color) }]}>
      <ThemedText type="smallBold" style={{ color, fontSize: 12.5, lineHeight: 16 }}>
        {t(`play.skill.${skill}` as TranslationKey)}
      </ThemedText>
    </View>
  );
}

function Emoji({ activity, size }: { activity: PlayActivity; size: number }) {
  const soft = useSoft();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: soft(SKILL_COLORS[activity.skill]), alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText allowFontScaling={false} style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>
        {activity.emoji}
      </ThemedText>
    </View>
  );
}

function Minutes() {
  const { t } = useLocale();
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <SymbolView name={sym('clock', 'schedule')} size={13} tintColor={theme.textTertiary} />
      <ThemedText type="small" themeColor="textTertiary">
        {t('play.minutes')}
      </ThemedText>
    </View>
  );
}

/** Oxirgi 7 kun: bajarilgan kunlar yashil. */
export function WeekDots({ week }: { week: { day: string; done: boolean }[] }) {
  const { locale } = useLocale();
  const todayKey = dayKey();
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {week.map(({ day, done }) => {
        const [y, m, d] = day.split('-').map(Number);
        const today = day === todayKey;
        return (
          <View key={day} style={{ alignItems: 'center', gap: 4 }}>
            <View
              style={[
                styles.dot,
                { borderColor: done || today ? GREEN : theme.border },
                done && { backgroundColor: GREEN },
              ]}>
              {done ? <SymbolView name={sym('checkmark', 'check')} size={12} weight="bold" tintColor="#FFFFFF" /> : null}
            </View>
            <ThemedText type="small" themeColor={today ? 'text' : 'textTertiary'} style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '600' }}>
              {WEEKDAYS[locale][new Date(y, m - 1, d).getDay()]}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function Streak({ n }: { n: number }) {
  const { t } = useLocale();
  const theme = useTheme();
  if (n < 2) return null;
  return (
    <View style={[styles.chip, { backgroundColor: theme.warningSoft, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
      <SymbolView name={sym('flame.fill', 'local_fire_department')} size={12} tintColor={theme.warning} />
      <ThemedText type="smallBold" style={{ color: theme.warning, fontSize: 12.5, lineHeight: 16 }}>
        {t('play.streak').replace('{n}', String(n))}
      </ThemedText>
    </View>
  );
}

/* ------------------------------ Bugungi o'yin ------------------------------ */

/** Bosh sahifa va Mashqlar bo'limidagi kunlik o'yin kartasi. */
export function TodayPlayCard({ showAll = true }: { showAll?: boolean }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const { childKey, summary } = usePlay();
  const a = summary.today;
  const text = a[locale];
  const done = summary.doneToday.length > 0;
  const open = () => router.push({ pathname: '/play/[id]', params: { id: a.id } });

  return (
    <Card style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <ThemedText type="caption" style={{ color: GREEN }}>
          {t('play.title')}
        </ThemedText>
        <Streak n={summary.streak} />
      </View>
      <Pressable accessibilityRole="button" onPress={open} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Emoji activity={a} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="heading">{text.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {text.goal}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SkillChip skill={a.skill} />
            <Minutes />
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <WeekDots week={summary.week} />
        {done ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <SymbolView name={sym('checkmark', 'check')} size={13} weight="bold" tintColor={theme.success} />
            <ThemedText type="smallBold" themeColor="success">
              {t('play.doneToday')}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title={t('play.start')} icon={sym('play.fill', 'play_arrow')} size="md" onPress={open} />
        </View>
        {!done ? (
          <View style={{ flex: showAll ? 0.8 : 1 }}>
            <Button title={t('play.another')} icon={sym('arrow.triangle.2.circlepath', 'refresh')} size="md" variant="secondary" onPress={() => nextTodayPlay(childKey)} />
          </View>
        ) : showAll ? (
          <View style={{ flex: 1 }}>
            <Button title={t('play.all')} size="md" variant="secondary" onPress={() => router.push('/play')} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/* ------------------------------ Ro'yxat ------------------------------ */

export function PlayList() {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const { summary, age } = usePlay();
  const [skill, setSkill] = useState<PlaySkill | null>(null);

  // Bolaning yoshiga moslari oldinda
  const list = PLAY_ACTIVITIES.filter((a) => !skill || a.skill === skill).sort(
    (x, y) => Number(x.minAge > age + 0.5) - Number(y.minAge > age + 0.5),
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <ThemedText type="body" themeColor="textSecondary">
        {t('play.subtitle')}
      </ThemedText>

      <TodayPlayCard showAll={false} />

      <RulesCard />

      <ThemedText type="heading" style={{ marginTop: Spacing.two }}>
        {t('play.all')}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        <OptionChip label={t('play.allSkills')} selected={!skill} onPress={() => setSkill(null)} />
        {PLAY_SKILLS.map((s) => (
          <OptionChip key={s} label={t(`play.skill.${s}` as TranslationKey)} selected={skill === s} onPress={() => setSkill(s)} />
        ))}
      </ScrollView>

      {list.map((a, i) => {
        const count = summary.counts[a.id] ?? 0;
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(350)}>
            <PressableScale
              onPress={() => router.push({ pathname: '/play/[id]', params: { id: a.id } })}
              style={[styles.row, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Emoji activity={a} size={56} />
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText type="heading" style={{ fontSize: 16 }}>
                  {a[locale].title}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <SkillChip skill={a.skill} />
                  <ThemedText type="small" themeColor="textTertiary">
                    {t('play.ageFrom').replace('{n}', String(a.minAge).replace('.', ','))}
                  </ThemedText>
                  {count > 0 ? (
                    <ThemedText type="smallBold" themeColor="success">
                      ✓ {t('play.times').replace('{n}', String(count))}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />
            </PressableScale>
          </Animated.View>
        );
      })}

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
        {t('play.note')}
      </ThemedText>
    </View>
  );
}

function RulesCard() {
  const { t, locale } = useLocale();
  const a = useAccent('exercises');
  return (
    <View style={[styles.rules, { backgroundColor: a.soft }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <SymbolView name={sym('checkmark.shield.fill', 'verified_user')} size={16} tintColor={GREEN} />
        <ThemedText type="smallBold" style={{ color: GREEN }}>
          {t('play.rules')}
        </ThemedText>
      </View>
      {PLAY_RULES[locale].map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <ThemedText type="smallBold" style={{ color: GREEN, width: 14 }}>
            {i + 1}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
            {r}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------ Mashq ------------------------------ */

const RATINGS: { id: PlayRating; emoji: string; label: TranslationKey }[] = [
  { id: 'great', emoji: '😊', label: 'play.rating.great' },
  { id: 'ok', emoji: '🙂', label: 'play.rating.ok' },
  { id: 'hard', emoji: '😣', label: 'play.rating.hard' },
];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** 5 daqiqalik taymer: boshlash, pauza, tugatish; vaqt tugasa yoki "Tugatdik" bosilsa — baholash. */
function PlayTimer({ activity }: { activity: PlayActivity }) {
  const { t } = useLocale();
  const theme = useTheme();
  const { childKey } = usePlay();
  const [stage, setStage] = useState<'idle' | 'running' | 'paused' | 'rate' | 'saved'>('idle');
  const [left, setLeft] = useState(PLAY_SECONDS);
  const [rating, setRating] = useState<PlayRating | null>(null);
  const endsAt = useRef(0);

  useEffect(() => {
    if (stage !== 'running') return;
    const id = setInterval(() => {
      const rest = Math.max(0, (endsAt.current - Date.now()) / 1000);
      setLeft(rest);
      if (rest <= 0) {
        haptics.success();
        setStage('rate');
      }
    }, 250);
    return () => clearInterval(id);
  }, [stage]);

  const run = () => {
    endsAt.current = Date.now() + left * 1000;
    setStage('running');
  };

  const rate = (r: PlayRating) => {
    haptics.success();
    recordPlay(childKey, activity.id, r);
    setRating(r);
    setStage('saved');
  };

  return (
    <Card style={{ borderColor: mix(GREEN, theme.backgroundElement, 0.3) }}>
      {stage === 'idle' ? (
        <Button title={t('play.timerStart')} icon={sym('play.fill', 'play_arrow')} onPress={run} />
      ) : stage === 'running' || stage === 'paused' ? (
        <Animated.View entering={FadeIn} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <ThemedText type="number" style={{ fontSize: 40, lineHeight: 46 }}>
              {mmss(left)}
            </ThemedText>
            <View style={{ flex: 1 }}>
              <ProgressBar value={((PLAY_SECONDS - left) / PLAY_SECONDS) * 100} color={GREEN} height={10} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              {stage === 'running' ? (
                <Button title={t('play.timerPause')} icon={sym('pause.fill', 'pause')} size="md" variant="secondary" onPress={() => setStage('paused')} />
              ) : (
                <Button title={t('play.timerResume')} icon={sym('play.fill', 'play_arrow')} size="md" variant="secondary" onPress={run} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Button title={t('play.finish')} icon={sym('checkmark', 'check')} size="md" onPress={() => setStage('rate')} />
            </View>
          </View>
        </Animated.View>
      ) : stage === 'rate' ? (
        <Animated.View entering={FadeInDown.duration(250)} style={{ gap: 12 }}>
          {left <= 0 ? (
            <ThemedText type="smallBold" style={{ color: GREEN }}>
              {t('play.timeUp')}
            </ThemedText>
          ) : null}
          <ThemedText type="heading">{t('play.howWasIt')}</ThemedText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {RATINGS.map((r) => (
              <PressableScale
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={t(r.label)}
                onPress={() => rate(r.id)}
                style={[styles.rating, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <ThemedText allowFontScaling={false} style={{ fontSize: 30, lineHeight: 36 }}>
                  {r.emoji}
                </ThemedText>
                <ThemedText type="smallBold" style={{ fontSize: 13, textAlign: 'center' }}>
                  {t(r.label)}
                </ThemedText>
              </PressableScale>
            ))}
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={ZoomIn.duration(250)} style={{ alignItems: 'center', gap: 8, paddingVertical: 4 }}>
          <ThemedText allowFontScaling={false} style={{ fontSize: 44, lineHeight: 52 }}>
            🎉
          </ThemedText>
          <ThemedText type="heading" style={{ textAlign: 'center' }}>
            {t('play.saved')}
          </ThemedText>
          {rating === 'hard' ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {t('play.hardHint')}
            </ThemedText>
          ) : null}
          <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
            <Button title={t('play.all')} size="md" variant="secondary" onPress={() => router.replace('/play')} />
          </View>
        </Animated.View>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <ThemedText type="heading" style={{ fontSize: 16 }}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function TipCard({ icon, color, title, body, tone }: { icon: Parameters<typeof SymbolView>[0]['name']; color: string; title: string; body: string; tone?: 'backgroundMuted' }) {
  return (
    <Card flat tone={tone}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <SymbolView name={icon} size={16} tintColor={color} />
        <ThemedText type="smallBold" style={{ color }}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {body}
      </ThemedText>
    </Card>
  );
}

export function PlayDetail({ activity }: { activity: PlayActivity }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const text = activity[locale];

  return (
    <View style={{ gap: 20 }}>
      <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Emoji activity={activity} size={84} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SkillChip skill={activity.skill} />
            <Minutes />
          </View>
          <ThemedText type="title" style={{ fontSize: 26, lineHeight: 32 }}>
            {text.title}
          </ThemedText>
        </View>
      </Animated.View>

      <ThemedText type="body" themeColor="textSecondary">
        {text.goal}
      </ThemedText>

      <PlayTimer key={activity.id} activity={activity} />

      <Section title={t('play.materials')}>
        {text.materials.map((m) => (
          <View key={m} style={{ flexDirection: 'row', gap: 8 }}>
            <ThemedText type="body" style={{ color: GREEN }}>
              •
            </ThemedText>
            <ThemedText type="body" style={{ flex: 1 }}>
              {m}
            </ThemedText>
          </View>
        ))}
      </Section>

      <Section title={t('play.steps')}>
        {text.steps.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
            <View style={styles.stepNo}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                {i + 1}
              </ThemedText>
            </View>
            <ThemedText type="body" style={{ flex: 1, paddingTop: 2 }}>
              {s}
            </ThemedText>
          </View>
        ))}
      </Section>

      <TipCard icon={sym('lightbulb.fill', 'lightbulb')} color={theme.tint} title={t('play.tip')} body={text.tip} tone="backgroundMuted" />
      <TipCard icon={sym('arrow.down.right', 'trending_down')} color={theme.warning} title={t('play.easier')} body={text.easier} />
      <TipCard icon={sym('arrow.up.right', 'trending_up')} color={theme.success} title={t('play.harder')} body={text.harder} />

      <RulesCard />
      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
        {t('play.note')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  rules: { borderRadius: Radius.lg, padding: 18, gap: 8 },
  rating: { flex: 1, alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: Radius.md, paddingVertical: 12, paddingHorizontal: 4 },
  stepNo: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
});
