"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2, ChevronDown, Info, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { LevelBadge, nextScreeningDate, riskColors, useFormatDate } from "@/components/app/result-summary";
import { Button, Card, FadeIn, ProgressBar, SectionHeader } from "@/components/app/ui";
import { SHOW_CENTERS } from "@/lib/app/features";
import { ITEMS, SECTIONS } from "@/lib/screening-v3/items";
import { THRESHOLDS, type ScreeningV3Result } from "@/lib/screening-v3/score";

/** Bo'lim balli bo'yicha holat: chegaralar umumiy daraja bilan bir xil. */
function sectionTier(score: number) {
  if (score >= THRESHOLDS.high) return "high" as const;
  if (score >= THRESHOLDS.moderate) return "moderate" as const;
  return "low" as const;
}

const SECTION_LABEL = { low: "r3.secLow", moderate: "r3.secMid", high: "r3.secHigh" } as const;

type Step = { title: string; body: string; action?: { label: string; href: string } };

/** Darajaga qarab ota-ona uchun aniq 3 qadam. */
function useNextSteps(result: ScreeningV3Result, createdAt: string): { steps: Step[]; retest: string | null } {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const specialist = { label: t("r3.stepSpecialistAction"), href: "/centers" };
  const play = { label: t("r3.stepPlayAction"), href: "/exercises" };
  const skills: Step = { title: t("r3.stepSkills"), body: t("r3.stepSkillsBody"), action: { label: t("r3.stepSkillsAction"), href: "/skills" } };
  if (result.level === "low") {
    return {
      steps: [
        { title: t("r3.stepCalm"), body: t("r3.stepCalmBody") },
        { title: t("r3.stepSupport"), body: t("r3.stepSupportBody"), action: play },
        { title: t("r3.stepRetest").replace("{date}", formatDate(nextScreeningDate(createdAt, result.level))), body: t("r3.stepRetestBody") },
      ],
      retest: null,
    };
  }
  const high = result.level === "high";
  return {
    steps: [
      { title: t(high ? "r3.stepSpecialistHigh" : "r3.stepSpecialistMid"), body: t(high ? "r3.stepSpecialistHighBody" : "r3.stepSpecialistMidBody"), action: SHOW_CENTERS ? specialist : undefined },
      { title: t("r3.stepPlay"), body: t("r3.stepPlayBody"), action: play },
      skills,
    ],
    retest: t("r3.retestOn").replace("{date}", formatDate(nextScreeningDate(createdAt, result.level))),
  };
}

/**
 * Skrining v3 natijasining yuqori qismi: daraja (raqamsiz), shoshilinch ogohlantirishlar va keyingi 3 qadam.
 * Batafsil ma'lumot — ResultV3Details.
 */
export function ResultV3({ result, createdAt, age }: { result: ScreeningV3Result; createdAt: string; age: string }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const colors = riskColors(result.level);
  const { steps, retest } = useNextSteps(result, createdAt);

  return (
    <>
      <FadeIn>
        <Card className="items-center !gap-4 !py-8 text-center">
          <span className="t-small text-ink-3">
            {formatDate(createdAt)} · {age}
          </span>
          <LevelBadge tier={result.level} size={88} />
          <h2 className="t-subtitle" style={{ color: colors.fg }}>
            {t(`result.${result.level}`)}
          </h2>
          <p className="t-body max-w-[540px] px-2">{t(`r3.${result.level}Body`)}</p>
        </Card>
      </FadeIn>

      {result.urgent && (
        <Card flat className="!border-0 !bg-danger-soft">
          <div className="flex items-center gap-2 text-danger">
            <AlertOctagon className="h-5 w-5" />
            <h3 className="t-heading flex-1">{t("r3.urgentTitle")}</h3>
          </div>
          <p className="t-body">{t("r3.urgentBody")}</p>
          {SHOW_CENTERS ? (
            <div className="sm:max-w-[260px]">
              <Button title={t("result.stepSpecialist")} href="/centers" size="md" />
            </div>
          ) : null}
        </Card>
      )}

      {result.incomplete && (
        <p className="t-small flex items-start gap-2 rounded-[16px] bg-[var(--warning-soft)] p-3.5 text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
          {t("r3.incomplete").replace("{n}", String(result.unknownCount))}
        </p>
      )}

      <SectionHeader title={t("r3.stepsTitle")} />
      <FadeIn delay={80}>
        <Card className="!gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <span className="t-small-bold flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tint-soft text-tint">{i + 1}</span>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="t-heading text-[16px]">{step.title}</h3>
                <p className="t-small text-ink-2">{step.body}</p>
                {step.action ? (
                  <div className="mt-1 sm:max-w-[280px]">
                    <Button title={step.action.label} href={step.action.href} size="md" variant="secondary" />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {retest ? <p className="t-small text-ink-3">{retest}</p> : null}
        </Card>
      </FadeIn>
    </>
  );
}

/** Batafsil natija: bo'limlar (eng qiyinlari tepada), muhim ko'nikmalar va ball. Standart holatda yig'ilgan. */
export function ResultV3Details({ result }: { result: ScreeningV3Result }) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const textOf = (id: string) => ITEMS.find((i) => i.id === id)?.text[locale] ?? id;
  const sections = result.sections.filter((s) => s.answered > 0).sort((a, b) => b.score - a.score);

  return (
    <>
      <Card onClick={() => setOpen((v) => !v)} className="!flex-row items-center !gap-4">
        <ListChecks className="h-6 w-6 shrink-0 text-tint" />
        <div className="flex flex-1 flex-col">
          <h3 className="t-heading text-[16px]">{t("r3.details")}</h3>
          <p className="t-small text-ink-2">{t("r3.detailsHint")}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </Card>

      {open && (
        <>
          <FadeIn>
            <Card className="!gap-5">
              {(
                [
                  ["r3.domainSc", result.domains.sc],
                  ["r3.domainRrb", result.domains.rrb],
                ] as const
              ).map(([label, score]) =>
                score === null ? null : (
                  <div key={label} className="flex items-center gap-3 rounded-[16px] bg-muted/60 px-3.5 py-3">
                    <span className="t-small-bold flex-1 text-[14.5px]">{t(label)}</span>
                    <span className="t-small-bold" style={{ color: riskColors(sectionTier(score)).fg }}>
                      {t(SECTION_LABEL[sectionTier(score)])}
                    </span>
                  </div>
                ),
              )}
              {sections.map((s) => {
                const meta = SECTIONS.find((x) => x.id === s.id)!;
                const tier = sectionTier(s.score);
                const c = riskColors(tier);
                return (
                  <div key={s.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[22px]" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="t-heading flex-1 text-[15px]">{meta.title[locale]}</span>
                      <span className="t-small-bold text-[13px]" style={{ color: c.fg }}>
                        {t(SECTION_LABEL[tier])}
                      </span>
                    </div>
                    <ProgressBar value={Math.max(4, s.score)} color={c.fg} height={7} />
                  </div>
                );
              })}
            </Card>
          </FadeIn>

          <Card className="!gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-tint" />
              <h3 className="t-heading flex-1">{t("r3.critical")}</h3>
              <span className="t-small-bold tabular-nums text-ink-3">
                {result.critical.total - result.critical.failed.length}/{result.critical.total}
              </span>
            </div>
            {result.critical.failed.length === 0 ? (
              <p className="t-body flex items-center gap-2 text-[var(--success)]">
                <CheckCircle2 className="h-5 w-5" />
                {t("r3.criticalNone")}
              </p>
            ) : (
              <>
                <p className="t-small text-ink-2">{t("r3.criticalBody")}</p>
                {result.critical.failed.map((id) => (
                  <p key={id} className="t-body flex items-start gap-2">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--warning)]" />
                    {textOf(id)}
                  </p>
                ))}
              </>
            )}
          </Card>

          <Card className="!gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="t-heading flex-1">{t("r3.index")}</h3>
              <span className="t-number text-[22px]">{result.totalScore}</span>
            </div>
            <p className="t-small flex items-start gap-1.5 text-ink-3">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t("r3.indexHint")}
            </p>
          </Card>
        </>
      )}

      <p className="t-small text-center text-ink-3">
        {t("r3.provisional")}{" "}
        <Link href="/about-test" className="text-tint hover:underline">
          {t("about.link")}
        </Link>
      </p>
    </>
  );
}

/** Videolarni tavsiya qilish uchun v3 bo'limlarini eski A/B/C sohalariga moslash. */
export function v3WeakDomains(result: ScreeningV3Result): string[] {
  const map: Record<string, string> = { social: "A", joint: "A", play: "A", communication: "B", repetitive: "C", sameness: "C", sensory: "C" };
  return [...new Set(result.sections.filter((s) => s.score >= THRESHOLDS.moderate).map((s) => map[s.id]).filter(Boolean))];
}
