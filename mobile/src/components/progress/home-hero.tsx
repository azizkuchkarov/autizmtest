import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { assessmentTier } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, GradientCard, Pill, PressableScale, sym } from '@/components/ui';
import { HeroGradient, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useIsDark } from '@/hooks/use-theme';
import { useAacLog } from '@/lib/aac-store';
import type { StoredAssessment } from '@/lib/history';
import { useChildPlay } from '@/lib/play-store';
import { activityTrend, playProgress } from '@/lib/progress';
import { useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog } from '@/lib/sound-progress';
import { currentWeek, dayKey, WEEKDAYS } from '@/shared/data/play-activities';

const LEVEL_DOT = { low: '🟢', moderate: '🟠', high: '🔴' } as const;
const LEVEL_KEY = { low: 'result.levelLow', moderate: 'result.levelModerate', high: 'result.levelHigh' } as const;

/** Oq chiziqli kichik grafik: ko'nikmalar testi balli (0–100) vaqt bo'yicha. */
function Sparkline({ values }: { values: number[] }) {
  const [width, setWidth] = useState(0);
  const h = 64;
  const x = (i: number) => (values.length === 1 ? width / 2 : 6 + (i / (values.length - 1)) * (width - 12));
  const y = (v: number) => h - 6 - (v / 100) * (h - 12);
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');
  return (
    <View style={{ height: h }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={h}>
          <Path d={`${path}L${x(values.length - 1)},${h}L${x(0)},${h}Z`} fill="rgba(255,255,255,0.14)" />
          <Path d={path} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {values.map((v, i) => (
            <Circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4.5 : 3} fill="#FFFFFF" />
          ))}
        </Svg>
      )}
    </View>
  );
}

/** Oxirgi 7 kun: har kuni nechta turdagi mashg'ulot bajarilgan (5 daqiqa, ovozli mashq, muloqot). */
function WeekBars({ days }: { days: { label: string; value: number; today: boolean }[] }) {
  const max = Math.max(3, ...days.map((d) => d.value));
  return (
    <View style={styles.week}>
      {days.map((d, i) => (
        <View key={i} style={styles.weekCol}>
          <View style={styles.weekTrack}>
            <View
              style={{
                width: '70%',
                maxWidth: 22,
                height: `${Math.max(8, (d.value / max) * 100)}%`,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: d.value ? '#FFFFFF' : 'rgba(255,255,255,0.22)',
              }}
            />
          </View>
          <ThemedText style={{ fontSize: 10.5, fontWeight: '600', color: d.today ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}>{d.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
        {label}
      </ThemedText>
      <ThemedText numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
        {value}
      </ThemedText>
    </View>
  );
}

/**
 * Bosh sahifa: test topshirilgandan keyin "Skrining testi" o'rniga rivojlanish ko'rinadi —
 * ko'nikmalar testi balli va dinamikasi (yoki oxirgi 7 kun faolligi) hamda asosiy ko'rsatkichlar. Web bilan bir xil.
 */
export function HomeProgressHero({ last }: { last: StoredAssessment }) {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const dark = useIsDark();
  const childKey = child?.id ?? 'default';
  const skills = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);

  const daily = playProgress(play);
  const latest = skills.at(-1);
  const prev = skills.length > 1 ? skills.at(-2) : undefined;
  const delta = latest && prev ? latest.result.total - prev.result.total : null;
  const trend = latest && prev ? activityTrend(latest.result.total, prev.result.total) : null;
  const tier = assessmentTier(last);

  const today = dayKey();
  const week = currentWeek()
    .map((day) => {
      const [y, m, dd] = day.split('-').map(Number);
      const d = new Date(y, m - 1, dd);
      const value = (play?.entries.some((e) => e.day === day) ? 1 : 0) + (soundLog.some((e) => e.day === day) ? 1 : 0) + ((aacLog[day]?.taps ?? 0) > 0 ? 1 : 0);
      return { label: WEEKDAYS[locale][d.getDay()], value, today: day === today };
    });

  const arrow = trend === 'better' ? '↗' : trend === 'worse' ? '↘' : '–';

  return (
    <GradientCard colors={dark ? HeroGradient.dark : HeroGradient.light} style={{ gap: Spacing.three }}>
      <View style={[styles.deco, { top: -30, right: -20, width: 160, height: 160 }]} />
      <Pill label={t('home.progressBadge')} color="#FFFFFF" background="rgba(255,255,255,0.18)" />

      <View style={{ gap: 4 }}>
        <ThemedText style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' }}>
          {latest ? t('home.skillsScore') : t('home.progressTitle')}
        </ThemedText>
        {latest ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, flexWrap: 'wrap' }}>
            <ThemedText style={{ fontSize: 52, lineHeight: 56, fontWeight: '800', color: '#FFFFFF' }}>{latest.result.total}</ThemedText>
            <ThemedText style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)', paddingBottom: 8 }}>/ 100</ThemedText>
            {delta !== null && (
              <View style={styles.delta}>
                <ThemedText style={{ fontSize: 13, fontWeight: '700', color: '#312E81' }}>
                  {arrow} {delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : '0'}
                </ThemedText>
              </View>
            )}
          </View>
        ) : (
          <ThemedText style={{ fontSize: 15, lineHeight: 21, fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>{t('home.noSkillsYet')}</ThemedText>
        )}
        {delta !== null ? <ThemedText style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>{t('home.vsPrev')}</ThemedText> : null}
        {latest ? <ThemedText style={{ fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.65)' }}>{t('home.skillsHint')}</ThemedText> : null}
      </View>

      <View style={{ gap: 6 }}>
        <ThemedText style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>{skills.length >= 2 ? t('home.trend') : t('home.week')}</ThemedText>
        {skills.length >= 2 ? <Sparkline values={skills.slice(-8).map((r) => r.result.total)} /> : <WeekBars days={week} />}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Stat label={t('home.statScreening')} value={`${LEVEL_DOT[tier]} ${t(LEVEL_KEY[tier])}`} />
        <Stat label={t('home.statPractice')} value={`${daily.activeDays} ${t('home.daysUnit')}`} />
        <Stat label={t('home.statStreak')} value={`${daily.streak} ${t('home.daysUnit')}`} />
      </View>

      <Button title={t('home.details')} variant="light" onPress={() => router.push('/progress')} icon={sym('arrow.right', 'arrow_forward')} />
      {!latest ? (
        <PressableScale onPress={() => router.push('/skills/run')} style={styles.outline}>
          <ThemedText style={{ fontSize: 15.5, fontWeight: '700', color: '#FFFFFF' }}>{t('home.takeSkills')}</ThemedText>
        </PressableScale>
      ) : null}
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  deco: { position: 'absolute', borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  delta: { marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, backgroundColor: '#FFFFFF' },
  week: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, height: 64 },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekTrack: { height: 46, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  stat: { flex: 1, minWidth: 0, gap: 2, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  outline: { height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
});
