"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { assessmentTier, nextScreeningDate, ResultRow, useFormatDate } from "@/components/app/result-summary";
import { BackHeader } from "@/components/app/app-shell";
import { Button, Card, FadeIn, HeroCard, Screen, SectionHeader } from "@/components/app/ui";
import { listAssessments, useAssessmentsVersion, type StoredAssessment } from "@/lib/app/history";
import { bandForMonths, itemsFor, SECTIONS } from "@/lib/screening-v3/items";
import { ageInMonths } from "@/lib/screening-v3/score";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="t-number text-white">{value}</span>
      <span className="t-small text-white/75">{label}</span>
    </div>
  );
}

export default function TestPage() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  // Savollar soni bolaning yoshiga qarab (oy noma'lum bo'lsa — taxminiy)
  const months = child ? ageInMonths(child.birthYear, child.birthMonth) : 42;
  const band = bandForMonths(months) ?? "toddler";
  const questionCount = itemsFor(band, Math.max(16, months)).length;
  const minutes = Math.max(5, Math.round(questionCount * 0.35));
  const formatDate = useFormatDate();
  const [history, setHistory] = useState<StoredAssessment[]>([]);
  const lastScreening = history[0];

  const assessmentsVersion = useAssessmentsVersion();
  useEffect(() => {
    listAssessments().then(setHistory);
  }, [assessmentsVersion]);

  return (
    <Screen>
      <BackHeader title={t("test.title")} />

      <FadeIn>
        <HeroCard className="flex flex-col gap-4 md:p-8">
          <h2 className="t-subtitle">{t("test.heroTitle")}</h2>
          <p className="t-body text-white/85">{t("test.heroBody")}</p>
          <div className="flex rounded-2xl bg-white/[0.12] py-3">
            <Stat value={String(questionCount)} label={t("test.statQuestions")} />
            <Stat value={`~${minutes}`} label={t("test.statMinutes")} />
            <Stat value="7" label={t("test.statDomains")} />
          </div>
          {lastScreening ? (
            <p className="t-small text-white/80">
              {t("test.lastNext")
                .replace("{last}", formatDate(lastScreening.createdAt))
                .replace("{next}", formatDate(nextScreeningDate(lastScreening.createdAt, assessmentTier(lastScreening))))}
            </p>
          ) : null}
          <div className="md:max-w-[280px]">
            <Button title={t("common.start")} variant="light" href="/screening" icon={Play} />
          </div>
        </HeroCard>
      </FadeIn>

      <SectionHeader title={t("test.domainsTitle")} />
      <FadeIn delay={100}>
        <Card className="!gap-4">
          {SECTIONS.filter((x) => x.id !== "history").map((x) => (
            <div key={x.id} className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-muted text-[22px]" aria-hidden>
                {x.emoji}
              </span>
              <div className="flex-1">
                <h3 className="t-heading text-[15.5px]">{x.title[locale]}</h3>
                <p className="t-small line-clamp-2 text-ink-2">{x.intro[locale]}</p>
              </div>
            </div>
          ))}
        </Card>
      </FadeIn>

      <Card flat className="!gap-2 border-tint/30 bg-tint-soft">
        <h3 className="t-heading text-[16px]">{t("test.howOftenTitle")}</h3>
        <p className="t-small text-ink-2">{t("test.howOften")}</p>
        <div className="sm:max-w-[260px]">
          <Button title={t("test.skillsLink")} href="/skills" size="md" variant="secondary" />
        </div>
      </Card>

      <Link href="/about-test" className="t-small-bold text-center text-tint hover:underline">
        {t("about.link")} →
      </Link>

      {history.length > 0 && (
        <>
          <SectionHeader title={t("test.history")} />
          <div className="grid gap-3 md:grid-cols-2">
            {history.map((item) => (
              <ResultRow key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
