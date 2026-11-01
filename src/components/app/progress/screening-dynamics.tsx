"use client";

import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, CircleAlert, Equal, Flag } from "lucide-react";
import Link from "next/link";

import { ScoreLineChart, TrendBadge } from "@/components/app/progress/charts";
import { useLocale } from "@/components/app/providers";
import { LevelBadge, riskColors, useFormatDate } from "@/components/app/result-summary";
import { Button, Card, Pill, ProgressBar } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import { formatAge } from "@/lib/app/age";
import { scoreTrend, type screeningProgress, type Trend } from "@/lib/app/progress";
import type { RiskTier } from "@/lib/app/screening";
import { SECTIONS } from "@/lib/screening-v3/items";

const TREND_LABEL: Record<Trend, TranslationKey> = { better: "progress.better", same: "progress.same", worse: "progress.worse" };
const SECTION_LABEL: Record<RiskTier, TranslationKey> = { low: "r3.secLow", moderate: "r3.secMid", high: "r3.secHigh" };
const SUMMARY: Record<Trend, TranslationKey> = { better: "progress.scrBetter", same: "progress.scrSame", worse: "progress.scrWorse" };

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

/** Asosiy xulosa: hozirgi daraja va birinchi testga nisbatan nima o'zgardi. */
function StatusCard({ screening, tiers }: { screening: Screening; tiers: Tiers }) {
  const { t, locale } = useLocale();
  const formatDate = useFormatDate();
  const latest = screening.latest!;
  const first = screening.first!;
  const colors = riskColors(latest.tier);
  const trend = screening.totalDelta !== null ? scoreTrend(screening.totalDelta) : null;
  const tone = trend === "better" ? "var(--success-soft)" : trend === "worse" ? "var(--warning-soft)" : "var(--muted)";
  const toneFg = trend === "better" ? "var(--success)" : trend === "worse" ? "var(--warning)" : "var(--text-secondary)";
  const Icon = trend === "better" ? CheckCircle2 : trend === "worse" ? CircleAlert : trend === "same" ? Equal : Flag;
  const firstColors = riskColors(first.tier);

  return (
    <Card className="!gap-4">
      <div className="flex items-center gap-4">
        <LevelBadge tier={latest.tier} size={60} />
        <div className="flex flex-1 flex-col gap-px">
          <span className="t-small text-ink-3">{t("progress.scrNow")}</span>
          <span className="t-subtitle" style={{ color: colors.fg }}>
            {t(`result.${latest.tier}`)}
          </span>
          <span className="t-small text-ink-2">
            {formatDate(latest.date.toISOString())}
            {latest.ageMonths !== null ? ` · ${formatAge(latest.ageMonths, locale)}` : ""}
          </span>
        </div>
      </div>

      {first.tier !== latest.tier ? (
        <div className="flex flex-wrap items-center gap-2">
          <Pill label={tiers[first.tier]} color={firstColors.fg} background={firstColors.bg} />
          <ArrowRight className="h-3.5 w-3.5 text-ink-3" />
          <Pill label={tiers[latest.tier]} color={colors.fg} background={colors.bg} />
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-[14px] px-3 py-[11px]" style={{ background: tone }}>
        <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: toneFg }} />
        <p className="t-small flex-1 text-[14.5px] leading-[21px]">{t(trend ? SUMMARY[trend] : "progress.scrFirst")}</p>
      </div>
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

/** Bo'limlar holati: eng qiyinlari tepada; oldingi test bo'lsa — o'zgarish belgisi bilan. */
function SectionsCard({ screening, domainName }: { screening: Screening; domainName: (id: string) => string }) {
  const { t, locale } = useLocale();
  return (
    <Card className="!gap-[18px]">
      <Title title={t("progress.scrSections")} hint={t("progress.scrSectionsHint")} />
      {screening.domains.map((d) => {
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
            {screening.compared ? (
              <span className="self-start">
                <TrendBadge trend={d.trend} label={t(TREND_LABEL[d.trend])} />
              </span>
            ) : null}
          </div>
        );
      })}
    </Card>
  );
}

/** Testlar tarixi: vertikal chiziq, har bir test — daraja va sana. */
function HistoryCard({ screening, tiers }: { screening: Screening; tiers: Tiers }) {
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
          const trend = prev ? scoreTrend(p.score - prev.score) : null;
          return (
            <Link key={p.id} href={`/result/${p.id}`} className="group flex gap-4">
              <div className="flex flex-col items-center">
                <LevelBadge tier={p.tier} size={34} />
                {!isLast && <span className="my-[3px] w-0.5 flex-1 bg-line" />}
              </div>
              <div className={`flex flex-1 flex-col gap-0.5 pt-px ${isLast ? "" : "pb-[18px]"}`}>
                <div className="flex items-center gap-2">
                  <span className="t-small-bold flex-1 text-[14.5px] group-hover:underline">{tiers[p.tier]}</span>
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
      <StatusCard screening={screening} tiers={tiers} />
      <NextTestCard screening={screening} />
      {screening.points.length > 1 ? (
        <Card className="!gap-4">
          <Title title={t("progress.scrChartTitle")} hint={t("progress.scrChartHint")} />
          <ScoreLineChart
            zones={tiers}
            points={screening.points.map((p) => ({ id: p.id, label: shortDate(p.date), date: formatDate(p.date.toISOString()), time: p.date.getTime(), score: p.score }))}
          />
        </Card>
      ) : null}
      <SectionsCard screening={screening} domainName={domainName} />
      <HistoryCard screening={screening} tiers={tiers} />
      <p className="t-small text-ink-3">{t("progress.retestHint")}</p>
    </>
  );
}
