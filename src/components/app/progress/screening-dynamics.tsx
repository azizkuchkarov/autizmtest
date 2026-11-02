"use client";

import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, CircleAlert, Equal, Flag } from "lucide-react";
import Link from "next/link";

import { ScoreLineChart, TrendBadge } from "@/components/app/progress/charts";
import { useLocale } from "@/components/app/providers";
import { LevelBadge, riskColors, useFormatDate } from "@/components/app/result-summary";
import { Button, Card, ProgressBar } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import { formatAge } from "@/lib/app/age";
import { pointTrend, type screeningProgress, type Trend } from "@/lib/app/progress";
import type { RiskTier } from "@/lib/app/screening";
import { SECTIONS } from "@/lib/screening-v3/items";

const TREND_LABEL: Record<Trend, TranslationKey> = { better: "progress.better", same: "progress.same", worse: "progress.worse" };
const SECTION_LABEL: Record<RiskTier, TranslationKey> = { low: "r3.secLow", moderate: "r3.secMid", high: "r3.secHigh" };
const SUMMARY: Record<Trend, TranslationKey> = { better: "progress.scrBetter", same: "progress.scrSame", worse: "progress.scrWorse" };
const HEADLINE: Record<Trend, TranslationKey> = { better: "progress.scrHeadBetter", same: "progress.scrHeadSame", worse: "progress.scrHeadWorse" };
const GROUP_LABEL: Record<Trend, TranslationKey> = { better: "progress.scrGroupBetter", same: "progress.scrGroupSame", worse: "progress.scrGroupWorse" };
const SIGNS_KEY = { low: "result.signsLow", moderate: "result.signsModerate", high: "result.signsHigh" } as const;

type Screening = ReturnType<typeof screeningProgress>;
type Tiers = Record<RiskTier, string>;

function Title({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="t-heading text-[16px]">{title}</h3>
      {hint ? <p className="t-small text-ink-3">{hint}</p> : null}
    </div>
  );
}

/** Oldin yoki Hozir ustuni: daraja va sana. */
function ComparePart({ heading, point }: { heading: string; point: NonNullable<Screening["latest"]> }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <span className="text-[12.5px] font-bold text-ink-3">{heading}</span>
      <LevelBadge tier={point.tier} size={44} />
      <span className="t-small-bold text-[14px]" style={{ color: riskColors(point.tier).fg }}>
        {t(SIGNS_KEY[point.tier])}
      </span>
      <span className="text-[12px] text-ink-3">{formatDate(point.date.toISOString())}</span>
    </div>
  );
}

/** Asosiy javob: oldingi testga nisbatan belgilar kamaydimi, ko'paydimi yoki o'zgarmadimi. */
function StatusCard({ screening }: { screening: Screening }) {
  const { t, locale } = useLocale();
  const formatDate = useFormatDate();
  const latest = screening.latest!;
  const previous = screening.previous;
  const trend = screening.trend;

  if (!previous || !trend)
    return (
      <Card className="!gap-4">
        <div className="flex items-center gap-4">
          <LevelBadge tier={latest.tier} size={60} />
          <div className="flex flex-1 flex-col gap-px">
            <span className="t-small text-ink-3">{t("progress.scrFirstHead")}</span>
            <span className="t-subtitle" style={{ color: riskColors(latest.tier).fg }}>
              {t(`result.${latest.tier}`)}
            </span>
            <span className="t-small text-ink-2">
              {formatDate(latest.date.toISOString())}
              {latest.ageMonths !== null ? ` · ${formatAge(latest.ageMonths, locale)}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-[14px] bg-muted px-3 py-[11px]">
          <Flag className="mt-0.5 h-4 w-4 shrink-0 text-ink-2" />
          <p className="t-small flex-1 text-[14.5px] leading-[21px]">{screening.retestDue ? t("progress.retestDue") : t("progress.scrFirstNext").replace("{date}", formatDate(screening.nextTest!.toISOString()))}</p>
        </div>
      </Card>
    );

  const tone = trend === "better" ? "var(--success-soft)" : trend === "worse" ? "var(--warning-soft)" : "var(--muted)";
  const toneFg = trend === "better" ? "var(--success)" : trend === "worse" ? "var(--warning)" : "var(--text-secondary)";
  const Icon = trend === "better" ? CheckCircle2 : trend === "worse" ? CircleAlert : Equal;

  return (
    <Card className="!gap-[18px]">
      <div className="flex items-center gap-4 rounded-[18px] p-4" style={{ background: tone }}>
        <Icon className="h-[30px] w-[30px] shrink-0" style={{ color: toneFg }} />
        <div className="flex flex-1 flex-col gap-px">
          <span className="t-subtitle !text-[20px] !leading-[26px]" style={{ color: toneFg }}>
            {t(HEADLINE[trend])}
          </span>
          <span className="t-small text-ink-2">{t("progress.scrVsPrev")}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ComparePart heading={t("progress.scrBefore")} point={previous} />
        <ArrowRight className="h-[18px] w-[18px] shrink-0 text-ink-3" />
        <ComparePart heading={t("progress.scrNowShort")} point={latest} />
      </div>
      <p className="t-body text-[15px] leading-[22px]">{t(SUMMARY[trend])}</p>
      <p className="t-small text-ink-3">{t("progress.scrNote")}</p>
    </Card>
  );
}

/** Keyingi test: sana va qancha vaqt qolgani. */
function NextTestCard({ screening }: { screening: Screening }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const due = screening.retestDue;
  const color = due ? "var(--warning)" : "var(--tint)";
  return (
    <Card className="!gap-2.5">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5" style={{ color }} />
        <h3 className="t-heading flex-1 text-[16px]">{t("progress.scrNextTitle")}</h3>
        <span className="t-small-bold" style={{ color: due ? "var(--warning)" : "var(--text-secondary)" }}>
          {due ? t("progress.scrToday") : t("progress.scrDaysLeft").replace("{n}", String(screening.daysLeft))}
        </span>
      </div>
      <ProgressBar value={Math.max(3, screening.retestProgress)} color={color} height={7} />
      <p className="t-small text-ink-2">{due ? t("progress.retestDue") : formatDate(screening.nextTest!.toISOString())}</p>
      {due ? (
        <div className="md:max-w-[280px]">
          <Button title={t("progress.takeTest")} href="/screening" size="md" />
        </div>
      ) : null}
    </Card>
  );
}

/** Bo'limlar: oldingi test bo'lsa nima o'zgargani bo'yicha guruhlanadi, bo'lmasa eng qiyini tepada. */
function SectionsCard({ screening, domainName }: { screening: Screening; domainName: (id: string) => string }) {
  const { t, locale } = useLocale();
  const row = (d: Screening["domains"][number]) => {
    const meta = SECTIONS.find((x) => x.id === d.id);
    const colors = riskColors(d.tier);
    return (
      <div key={d.id} className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {meta?.emoji ? (
            <span className="text-[18px]" aria-hidden>
              {meta.emoji}
            </span>
          ) : null}
          <span className="t-small-bold flex-1 text-[14.5px]">{meta?.title[locale] ?? domainName(d.id)}</span>
          <span className="t-small-bold text-[13px]" style={{ color: colors.fg }}>
            {t(SECTION_LABEL[d.tier])}
          </span>
        </div>
        <ProgressBar value={Math.max(3, d.to)} color={colors.fg} height={7} />
      </div>
    );
  };
  const groups = (["worse", "better", "same"] as const)
    .map((trend) => ({ trend, list: screening.domains.filter((d) => d.trend === trend) }))
    .filter((g) => g.list.length > 0);
  return (
    <Card className="!gap-[18px]">
      <Title title={t("progress.scrSections")} hint={t("progress.scrSectionsHint")} />
      {screening.compared
        ? groups.map((g) => (
            <div key={g.trend} className="flex flex-col gap-4">
              <span className="self-start">
                <TrendBadge trend={g.trend} label={t(GROUP_LABEL[g.trend])} />
              </span>
              {g.list.map(row)}
            </div>
          ))
        : screening.domains.map(row)}
    </Card>
  );
}

/** Testlar tarixi: vertikal chiziq, har bir test — daraja va sana. */
function HistoryCard({ screening }: { screening: Screening }) {
  const { t, locale } = useLocale();
  const formatDate = useFormatDate();
  const list = [...screening.points].reverse();
  return (
    <Card className="!gap-4">
      <Title title={t("progress.scrHistory")} />
      <div className="flex flex-col">
        {list.map((p, i) => {
          const prev = list[i + 1];
          const isLast = i === list.length - 1;
          const trend = prev ? pointTrend(prev, p) : null;
          return (
            <Link key={p.id} href={`/result/${p.id}`} className="group flex gap-4">
              <div className="flex flex-col items-center">
                <LevelBadge tier={p.tier} size={34} />
                {!isLast && <span className="my-[3px] w-0.5 flex-1 bg-line" />}
              </div>
              <div className={`flex flex-1 flex-col gap-0.5 pt-px ${isLast ? "" : "pb-[18px]"}`}>
                <div className="flex items-center gap-2">
                  <span className="t-small-bold flex-1 text-[14.5px] group-hover:underline">{t(SIGNS_KEY[p.tier])}</span>
                  {trend ? <TrendBadge trend={trend} label={t(TREND_LABEL[trend])} /> : null}
                  <ChevronRight className="h-3.5 w-3.5 text-ink-3" />
                </div>
                <span className="t-small text-ink-2">
                  {formatDate(p.date.toISOString())}
                  {p.ageMonths !== null ? ` · ${formatAge(p.ageMonths, locale)}` : ""}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

/** Rivojlanish sahifasidagi "Skrining testi dinamikasi" bo'limi. */
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
        <Card className="!gap-4">
          <Title title={t("progress.scrChartTitle")} hint={t("progress.scrChartHint")} />
          <ScoreLineChart
            zones={tiers}
            points={screening.points.map((p) => ({ id: p.id, label: shortDate(p.date), date: formatDate(p.date.toISOString()), time: p.date.getTime(), score: p.score, level: tiers[p.tier] }))}
          />
        </Card>
      ) : null}
      <NextTestCard screening={screening} />
      <HistoryCard screening={screening} />
      <p className="t-small text-ink-3">{t("progress.retestHint")}</p>
    </>
  );
}
