import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ScoreLineChart, TrendBadge } from '@/components/progress/charts';
import { LevelBadge, useFormatDate, useRiskColors } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, PressableScale, ProgressBar, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { formatAge } from '@/lib/age';
import type { TranslationKey } from '@/lib/i18n';
import { pointTrend, type ScreeningPoint, type screeningProgress, type Trend } from '@/lib/progress';
import type { RiskTier } from '@/lib/screening';
import { SECTIONS } from '@/shared/lib/screening-v3/items';

const TREND_LABEL: Record<Trend, TranslationKey> = { better: 'progress.better', same: 'progress.same', worse: 'progress.worse' };
const SECTION_LABEL: Record<RiskTier, TranslationKey> = { low: 'r3.secLow', moderate: 'r3.secMid', high: 'r3.secHigh' };
const SUMMARY: Record<Trend, TranslationKey> = { better: 'progress.scrBetter', same: 'progress.scrSame', worse: 'progress.scrWorse' };
const HEADLINE: Record<Trend, TranslationKey> = { better: 'progress.scrHeadBetter', same: 'progress.scrHeadSame', worse: 'progress.scrHeadWorse' };
const GROUP_LABEL: Record<Trend, TranslationKey> = { better: 'progress.scrGroupBetter', same: 'progress.scrGroupSame', worse: 'progress.scrGroupWorse' };
const SIGNS_KEY = { low: 'result.signsLow', moderate: 'result.signsModerate', high: 'result.signsHigh' } as const;

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

/** Oldin yoki Hozir ustuni: daraja va sana. */
function ComparePart({ heading, point }: { heading: string; point: ScreeningPoint }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const colors = useRiskColors(point.tier);
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 5 }}>
      <ThemedText type="smallBold" themeColor="textTertiary" style={{ fontSize: 12.5 }}>
        {heading}
      </ThemedText>
      <LevelBadge tier={point.tier} size={44} />
      <ThemedText type="smallBold" style={{ color: colors.fg, fontSize: 14, textAlign: 'center' }}>
        {t(SIGNS_KEY[point.tier])}
      </ThemedText>
      <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 12, textAlign: 'center' }}>
        {formatDate(point.date.toISOString())}
      </ThemedText>
    </View>
  );
}

/** Asosiy javob: oldingi testga nisbatan belgilar kamaydimi, ko'paydimi yoki o'zgarmadimi. */
function StatusCard({ screening }: { screening: Screening }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const latest = screening.latest!;
  const previous = screening.previous;
  const trend = screening.trend;
  const colors = useRiskColors(latest.tier);

  if (!previous || !trend) {
    const age = latest.ageMonths !== null ? ` · ${formatAge(latest.ageMonths, locale)}` : '';
    return (
      <Card style={{ gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <LevelBadge tier={latest.tier} size={60} />
          <View style={{ flex: 1, gap: 1 }}>
            <ThemedText type="small" themeColor="textTertiary">
              {t('progress.scrFirstHead')}
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
        <View style={[styles.banner, { backgroundColor: theme.backgroundMuted }]}>
          <SymbolView name={sym('flag.fill', 'flag')} size={16} tintColor={theme.textSecondary} style={{ marginTop: 2 }} />
          <ThemedText type="small" style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }}>
            {screening.retestDue ? t('progress.retestDue') : t('progress.scrFirstNext').replace('{date}', formatDate(screening.nextTest!.toISOString()))}
          </ThemedText>
        </View>
      </Card>
    );
  }

  const tone = trend === 'better' ? theme.successSoft : trend === 'worse' ? theme.warningSoft : theme.backgroundMuted;
  const toneFg = trend === 'better' ? theme.success : trend === 'worse' ? theme.warning : theme.textSecondary;
  const icon =
    trend === 'better'
      ? sym('checkmark.circle.fill', 'check_circle')
      : trend === 'worse'
        ? sym('exclamationmark.circle.fill', 'error')
        : sym('equal.circle.fill', 'drag_handle');

  return (
    <Card style={{ gap: Spacing.three + 2 }}>
      <View style={[styles.answer, { backgroundColor: tone }]}>
        <SymbolView name={icon} size={30} tintColor={toneFg} />
        <View style={{ flex: 1, gap: 1 }}>
          <ThemedText type="subtitle" style={{ color: toneFg, fontSize: 20, lineHeight: 26 }}>
            {t(HEADLINE[trend])}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('progress.scrVsPrev')}
          </ThemedText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
        <ComparePart heading={t('progress.scrBefore')} point={previous} />
        <SymbolView name={sym('arrow.right', 'arrow_forward')} size={18} tintColor={theme.textTertiary} />
        <ComparePart heading={t('progress.scrNowShort')} point={latest} />
      </View>
      <ThemedText type="body" style={{ fontSize: 15, lineHeight: 22 }}>
        {t(SUMMARY[trend])}
      </ThemedText>
      <ThemedText type="small" themeColor="textTertiary">
        {t('progress.scrNote')}
      </ThemedText>
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

/** Bo'limlar: oldingi test bo'lsa nima o'zgargani bo'yicha guruhlanadi, bo'lmasa eng qiyini tepada. */
function SectionsCard({ screening, domainName }: { screening: Screening; domainName: (id: string) => string }) {
  const { t, locale } = useLocale();
  const row = (d: Screening['domains'][number]) => {
    const meta = SECTIONS.find((x) => x.id === d.id);
    return <SectionRow key={d.id} emoji={meta?.emoji} title={meta?.title[locale] ?? domainName(d.id)} domain={d} />;
  };
  const groups = (['worse', 'better', 'same'] as const)
    .map((trend) => ({ trend, list: screening.domains.filter((d) => d.trend === trend) }))
    .filter((g) => g.list.length > 0);
  return (
    <Card style={{ gap: Spacing.three + 2 }}>
      <Title title={t('progress.scrSections')} hint={t('progress.scrSectionsHint')} />
      {screening.compared
        ? groups.map((g) => (
            <View key={g.trend} style={{ gap: Spacing.three }}>
              <View style={{ alignSelf: 'flex-start' }}>
                <TrendBadge trend={g.trend} label={t(GROUP_LABEL[g.trend])} />
              </View>
              {g.list.map(row)}
            </View>
          ))
        : screening.domains.map(row)}
    </Card>
  );
}

function SectionRow({ emoji, title, domain }: { emoji?: string; title: string; domain: Screening['domains'][number] }) {
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
    </View>
  );
}

/** Testlar tarixi: vertikal chiziq, har bir test — daraja va sana. */
function HistoryCard({ screening }: { screening: Screening }) {
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
          const trend = prev ? pointTrend(prev, p) : null;
          return (
            <PressableScale key={p.id} onPress={() => router.push(`/result/${p.id}`)} scaleTo={0.99} style={{ flexDirection: 'row', gap: Spacing.three }}>
              <View style={{ alignItems: 'center' }}>
                <LevelBadge tier={p.tier} size={34} />
                {!isLast && <View style={{ width: 2, flex: 1, marginVertical: 3, backgroundColor: theme.border }} />}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: isLast ? 0 : Spacing.three + 2, paddingTop: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <ThemedText type="smallBold" style={{ flex: 1, fontSize: 14.5 }}>
                    {t(SIGNS_KEY[p.tier])}
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
      <StatusCard screening={screening} />
      <SectionsCard screening={screening} domainName={domainName} />
      {screening.points.length > 1 ? (
        <Card style={{ gap: Spacing.three }}>
          <Title title={t('progress.scrChartTitle')} hint={t('progress.scrChartHint')} />
          <ScoreLineChart
            zones={tiers}
            points={screening.points.map((p) => ({ id: p.id, label: shortDate(p.date), date: formatDate(p.date.toISOString()), time: p.date.getTime(), score: p.score, level: tiers[p.tier] }))}
          />
        </Card>
      ) : null}
      <NextTestCard screening={screening} />
      <HistoryCard screening={screening} />
      <ThemedText type="small" themeColor="textTertiary">
        {t('progress.retestHint')}
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 18,
    padding: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
});
