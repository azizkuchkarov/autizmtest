"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

import { ContinueCard, sectionLook } from "@/components/app/lesson-sections";
import { useLocale, useProfile } from "@/components/app/providers";
import { LevelBadge, riskColors } from "@/components/app/result-summary";
import { useTodayPlan } from "@/components/app/today-plan";
import { Button, HeroCard } from "@/components/app/ui";
import { useContent } from "@/hooks/use-content";
import type { TranslationKey } from "@/lib/app-i18n";
import type { StoredAssessment } from "@/lib/app/history";
import { useChildPlay } from "@/lib/app/play-store";
import { playProgress, screeningProgress, type Trend } from "@/lib/app/progress";
import { useSkillsHistory } from "@/lib/app/skills-store";
import { buildSections, syncVideoProgress, useVideoProgress } from "@/lib/app/video-progress";

const HEADLINE: Record<Trend, TranslationKey> = { better: "progress.scrHeadBetter", same: "progress.scrHeadSame", worse: "progress.scrHeadWorse" };

/** Bosh sahifaning markazi: ota-ona hozir nima qilishi kerakligi — bitta vazifa, bitta tugma. */
export function NextStepCard() {
  const { t } = useLocale();
  const items = useTodayPlan();
  const next = items.find((i) => !i.done);

  return (
    <HeroCard className="flex flex-col gap-4 md:p-8">
      <span className="absolute -right-5 -top-8 h-40 w-40 rounded-full bg-white/[0.08]" />
      {next ? (
        <>
          <span className="t-small-bold text-white/80">{t("today.nextCaption")}</span>
          <div className="flex items-center gap-4">
            <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-white/[0.18] text-[28px]">{next.emoji}</span>
            <div className="flex flex-1 flex-col gap-0.5">
              <h2 className="t-subtitle !text-[21px] !leading-[27px]">{t(next.title)}</h2>
              {next.hint ? <span className="t-small text-white/80">{next.hint}</span> : null}
            </div>
          </div>
          <div className="md:max-w-[280px]">
            <Button title={t("common.start")} variant="light" href={next.href} icon={ArrowRight} />
          </div>
        </>
      ) : (
        <>
          <h2 className="t-subtitle !text-[21px] !leading-[28px]">🎉 {t("today.allDone")}</h2>
          <span className="t-small text-white/80">{t("today.doneBody")}</span>
        </>
      )}
    </HeroCard>
  );
}

/** Navbatdagi video dars; hamma dars ko'rilgan bo'lsa ko'rsatilmaydi. */
export function HomeLessonCard() {
  const { t } = useLocale();
  const { categories, professions } = useContent("lesson");
  const progress = useVideoProgress();

  useEffect(() => {
    syncVideoProgress();
  }, []);

  const sections = categories ? buildSections(professions, categories, progress) : [];
  const current = sections.find((s) => s.next && (progress[s.next.id]?.pos ?? 0) > 0) ?? sections.find((s) => s.next);
  if (!current?.next) return null;
  const started = sections.some((s) => s.done > 0) || (progress[current.next.id]?.pos ?? 0) > 0;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="t-heading text-[18px]">{t("home.lessonCaption")}</h2>
      <ContinueCard video={current.next} accent={sectionLook(current.slug).accent} started={started} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[14px] bg-muted px-3 py-2.5">
      <span className="truncate text-[12px] text-ink-2">{label}</span>
      <span className="t-small-bold truncate text-[15px]">{value}</span>
    </span>
  );
}

/** Rivojlanish qisqacha: belgilar o'zgarishi va asosiy raqamlar; batafsili Rivojlanish sahifasida. */
export function HomeProgressCard({ items }: { items: StoredAssessment[] }) {
  const { t } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const skills = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const screening = useMemo(() => screeningProgress(items), [items]);
  const latest = screening.latest;
  if (!latest) return null;
  const daily = playProgress(play);
  const skill = skills.at(-1);

  return (
    <Link href="/progress" className="flex flex-col gap-4 rounded-[24px] border border-line bg-element p-5 shadow-card transition-transform active:scale-[0.99]">
      <span className="flex items-center gap-4">
        <LevelBadge tier={latest.tier} size={48} />
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="t-heading text-[16px]" style={{ color: riskColors(latest.tier).fg }}>
            {t(`result.${latest.tier}`)}
          </span>
          <span className="t-small text-ink-2">{screening.trend ? `${t(HEADLINE[screening.trend])} · ${t("home.vsPrev")}` : t("progress.scrFirstHead")}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
      </span>
      <span className="flex gap-2">
        <Tile label={t("home.skillsShort")} value={skill ? `${skill.result.total} / 100` : "—"} />
        <Tile label={t("home.statPractice")} value={`${daily.activeDays} ${t("home.daysUnit")}`} />
        <Tile label={t("home.statStreak")} value={`${daily.streak} ${t("home.daysUnit")}`} />
      </span>
    </Link>
  );
}
