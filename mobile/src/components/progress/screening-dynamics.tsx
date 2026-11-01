import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ScoreLineChart, TrendBadge } from '@/components/progress/charts';
import { LevelBadge, useFormatDate, useRiskColors } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Pill, PressableScale, ProgressBar, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { formatAge } from '@/lib/age';
import type { TranslationKey } from '@/lib/i18n';
import { scoreTrend, type ScreeningPoint, type screeningProgress, type Trend } from '@/lib/progress';
import type { RiskTier } from '@/lib/screening';
import { SECTIONS } from '@/shared/lib/screening-v3/items';

const TREND_LABEL: Record<Trend, TranslationKey> = { better: 'progress.better', same: 'progress.same', worse: 'progress.worse' };
const SECTION_LABEL: Record<RiskTier, TranslationKey> = { low: 'r3.secLow', moderate: 'r3.secMid', high: 'r3.secHigh' };
const SUMMARY: Record<Trend, TranslationKey> = { better: 'progress.scrBetter', same: 'progress.scrSame', worse: 'progress.scrWorse' };

type Screening = ReturnType<typeof screeningProgress>;
type Tiers = Record<RiskTier, string>;

function Title({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="heading" style={{ fontSize: 16 }}>
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

function TierChip({ tier, label }: { tier: RiskTier; label: string }) {
  const colors = useRiskColors(tier);
  return <Pill label={label} color={colors.fg} background={colors.bg} />;
}

/** Asosiy xulosa: hozirgi daraja va birinchi testga nisbatan nima o'zgardi. */
function StatusCard({ screening, tiers }: { screening: Screening; tiers: Tiers }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const latest = screening.latest!;
  const first = screening.first!;
  const colors = useRiskColors(latest.tier);
  const trend = screening.totalDelta !== null ? scoreTrend(screening.totalDelta) : null;
  const tone = trend === 'better' ? theme.successSoft : trend === 'worse' ? theme.warningSoft : theme.backgroundMuted;
  const toneFg = trend === 'better' ? theme.success : trend === 'worse' ? theme.warning : theme.textSecondary;
  const icon =
    trend === 'better'
      ? sym('checkmark.circle.fill', 'check_circle')
      : trend === 'worse'
        ? sym('exclamationmark.circle.fill', 'error')
        : trend === 'same'
          ? sym('equal.circle.fill', 'drag_handle')
          : sym('flag.fill', 'flag');
  const age = latest.ageMonths !== null ? ` · ${formatAge(latest.ageMonths, locale)}` : '';

  return (
    <Card style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <LevelBadge tier={latest.tier} size={60} />
        <View style={{ flex: 1, gap: 1 }}>
          <ThemedText type="small" themeColor="textTertiary">
            {t('progress.scrNow')}
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: colors.fg, fontSize: 21, lineHeight: 27 }}>
            {t(`result.${latest.tier}`)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(latest.date.toISOString())}
            {age}
          </ThemedText>
        </View>
      </View>

      {first.tier !== latest.tier ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' }}>
          <TierChip tier={first.tier} label={tiers[first.tier]} />
          <SymbolView name={sym('arrow.right', 'arrow_forward')} size={14} tintColor={theme.textTertiary} />
          <TierChip tier={latest.tier} label={tiers[latest.tier]} />
        </View>
      ) : null}

      <View style={[styles.banner, { backgroundColor: tone }]}>
        <SymbolView name={icon} size={18} tintColor={toneFg} style={{ marginTop: 1 }} />
        <ThemedText type="small" style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }}>
          {t(trend ? SUMMARY[trend] : 'progress.scrFirst')}
        </ThemedText>
      </View>
    </Card>
  );
}

/** Keyingi test: sana va qancha vaqt qolgani. */
function NextTestCard({ screening }: { screening: Screening }) {
  const { t } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const due = screening.retestDue;
  return (
    <Card style={{ gap: Spacing.two + 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <SymbolView name={sym('calendar.badge.clock', 'event')} size={20} tintColor={due ? theme.warning : theme.tint} />
        <ThemedText type="heading" style={{ flex: 1, fontSize: 16 }}>
          {t('progress.scrNextTitle')}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: due ? theme.warning : theme.textSecondary }}>
          {due ? t('progress.scrToday') : t('progress.scrDaysLeft').replace('{n}', String(screening.daysLeft))}
        </ThemedText>
      </View>
      <ProgressBar value={Math.max(3, screening.retestProgress)} color={due ? theme.warning : theme.tint} height={7} />
      <ThemedText type="small" themeColor="textSecondary">
        {due ? t('progress.retestDue') : formatDate(screening.nextTest!.toISOString())}
      </ThemedText>
      {due ? <Button title={t('progress.takeTest')} onPress={() => router.push('/screening/run')} size="md" /> : null}
    </Card>
  );
}

/** Bo'limlar holati: eng qiyinlari tepada; oldingi test bo'lsa — o'zgarish belgisi bilan. */
function SectionsCard({ screening, domainName }: { screening: Screening; domainName: (id: string) => string }) {
  const { t, locale } = useLocale();
  return (
    <Card style={{ gap: Spacing.three + 2 }}>
      <Title title={t('progress.scrSections')} hint={t('progress.scrSectionsHint')} />
      {screening.domains.map((d) => {
        const meta = SECTIONS.find((x) => x.id === d.id);
        return <SectionRow key={d.id} emoji={meta?.emoji} title={meta?.title[locale] ?? domainName(d.id)} domain={d} compared={screening.compared} />;
      })}
    </Card>
  );
}

function SectionRow({ emoji, title, domain, compared }: { emoji?: string; title: string; domain: Screening['domains'][number]; compared: boolean }) {
  const { t } = useLocale();
  const colors = useRiskColors(domain.tier);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        {emoji ? <ThemedText style={{ fontSize: 18, lineHeight: 24 }}>{emoji}</ThemedText> : null}
        <ThemedText type="smallBold" style={{ flex: 1, fontSize: 14.5 }}>
          {title}
        </ThemedText>
        <ThemedText type="smallBold" style={{ fontSize: 13, color: colors.fg }}>
          {t(SECTION_LABEL[domain.tier])}
        </ThemedText>
      </View>
      <ProgressBar value={Math.max(3, domain.to)} color={colors.fg} height={7} />
      {compared ? (
        <View style={{ alignSelf: 'flex-start' }}>
          <TrendBadge trend={domain.trend} label={t(TREND_LABEL[domain.trend])} />
        </View>
      ) : null}
    </View>
  );
}

/** Testlar tarixi: vertikal chiziq, har bir test — daraja va sana. */
function HistoryCard({ screening, tiers }: { screening: Screening; tiers: Tiers }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const list: ScreeningPoint[] = [...screening.points].reverse();
  return (
    <Card style={{ gap: Spacing.three }}>
      <Title title={t('progress.scrHistory')} />
      <View>
        {list.map((p, i) => {
          const prev = list[i + 1];
          const isLast = i === list.length - 1;
          const trend = prev ? scoreTrend(p.score - prev.score) : null;
          return (
            <PressableScale key={p.id} onPress={() => router.push(`/result/${p.id}`)} scaleTo={0.99} style={{ flexDirection: 'row', gap: Spacing.three }}>
              <View style={{ alignItems: 'center' }}>
                <LevelBadge tier={p.tier} size={34} />
                {!isLast && <View style={{ width: 2, flex: 1, marginVertical: 3, backgroundColor: theme.border }} />}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: isLast ? 0 : Spacing.three + 2, paddingTop: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <ThemedText type="smallBold" style={{ flex: 1, fontSize: 14.5 }}>
                    {tiers[p.tier]}
                  </ThemedText>
                  {trend ? <TrendBadge trend={trend} label={t(TREND_LABEL[trend])} /> : null}
                  <SymbolView name={sym('chevron.right', 'chevron_right')} size={12} tintColor={theme.textTertiary} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDate(p.date.toISOString())}
                  {p.ageMonths !== null ? ` · ${formatAge(p.ageMonths, locale)}` : ''}
                </ThemedText>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </Card>
  );
}

/** Rivojlanish sahifasidagi "Skrining testi dinamikasi" bo'limi (web: components/app/progress/screening-dynamics.tsx). */
export function ScreeningDynamics({
  screening,
  tiers,
  domainName,
  shortDate,
}: {
  screening: Screening;
  tiers: Tiers;
  domainName: (id: string) => string;
  shortDate: (d: Date) => string;
}) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  return (
    <>
      <StatusCard screening={screening} tiers={tiers} />
      <NextTestCard screening={screening} />
      {screening.points.length > 1 ? (
        <Card style={{ gap: Spacing.three }}>
          <Title title={t('progress.scrChartTitle')} hint={t('progress.scrChartHint')} />
          <ScoreLineChart
            zones={tiers}
            points={screening.points.map((p) => ({ id: p.id, label: shortDate(p.date), date: formatDate(p.date.toISOString()), time: p.date.getTime(), score: p.score }))}
          />
        </Card>
      ) : null}
      <SectionsCard screening={screening} domainName={domainName} />
      <HistoryCard screening={screening} tiers={tiers} />
      <ThemedText type="small" themeColor="textTertiary">
        {t('progress.retestHint')}
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
});
