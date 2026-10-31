"use client";

import { ArrowRight, Building2, ChartNoAxesCombined, HandHeart, Lightbulb, MonitorPlay, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/app/avatar";
import { useLocale, useProfile } from "@/components/app/providers";
import { assessmentTier, LevelBadge, riskColors, useFormatDate } from "@/components/app/result-summary";
import { TodayPlayCard } from "@/components/app/play";
import { HomeProgressHero } from "@/components/app/progress/home-hero";
import { TalkPromo } from "@/components/app/talk/promo";
import { TodayPlan } from "@/components/app/today-plan";
import { accent as accentOf, Button, Card, FadeIn, HeroCard, IconBadge, Pill, Screen, type AccentName } from "@/components/app/ui";
import { VideoCarousel } from "@/components/app/video-cards";
import type { TranslationKey } from "@/lib/app-i18n";
import { listAssessments, useAssessmentsVersion, type StoredAssessment } from "@/lib/app/history";
import { SHOW_CENTERS } from "@/lib/app/features";
import { useHydrated } from "@/lib/app/local-store";

const TIPS: TranslationKey[] = ["home.tip1", "home.tip2", "home.tip3", "home.tip4", "home.tip5"];

function greetingKey(): TranslationKey {
  const h = new Date().getHours();
  if (h < 12) return "home.morning";
  if (h < 18) return "home.afternoon";
  return "home.evening";
}

function QuickAction({ icon, label, hint, accent, href }: { icon: LucideIcon; label: string; hint?: string; accent: AccentName; href: string }) {
  const a = accentOf(accent);
  return (
    <Link href={href} className="group flex flex-1 flex-col items-center gap-2 transition-transform active:scale-[0.97]">
      <span className="transition-transform group-hover:-translate-y-0.5">
        <IconBadge icon={icon} color={a.fg} background={a.soft} size={56} />
      </span>
      <span className="flex flex-col items-center">
        <span className="t-small truncate text-center">{label}</span>
        {hint ? <span className="truncate text-center text-[11.5px] text-ink-3">{hint}</span> : null}
      </span>
    </Link>
  );
}

function StatusCard({ last }: { last: StoredAssessment | null }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const tier = last ? assessmentTier(last) : "low";
  const colors = riskColors(tier);

  return (
    <Card>
      <span className="t-caption text-ink-3">{t("home.statusTitle")}</span>
      {last ? (
        <div className="mt-1 flex items-center gap-4">
          <Link href={`/result/${last.id}`}>
            <LevelBadge tier={tier} size={64} />
          </Link>
          <div className="flex flex-1 flex-col gap-1">
            <Pill label={t(`result.${tier}`)} color={colors.fg} background={colors.bg} />
            <span className="t-small text-ink-2">
              {t("home.statusLast")}: {formatDate(last.createdAt)}
            </span>
            <Link href="/screening" className="t-small-bold text-tint hover:underline">
              {t("home.statusRetake")} →
            </Link>
          </div>
        </div>
      ) : (
        <p className="t-body text-ink-2">{t("home.statusEmpty")}</p>
      )}
    </Card>
  );
}

export default function HomePage() {
  const { t } = useLocale();
  const { child } = useProfile();
  const lessons = accentOf("lessons");
  const [last, setLast] = useState<StoredAssessment | null>(null);
  // Vaqt brauzerda hisoblanadi (server soati boshqa bo'lishi mumkin)
  const hydrated = useHydrated();
  const greeting: TranslationKey = hydrated ? greetingKey() : "home.afternoon";
  const tip = useMemo(() => TIPS[new Date().getDate() % TIPS.length], []);

  const assessmentsVersion = useAssessmentsVersion();
  useEffect(() => {
    listAssessments().then((items) => setLast(items[0] ?? null));
  }, [assessmentsVersion]);

  const subtitle = child?.name ? t("home.forChild").replace("{name}", child.name) : t("home.forChildDefault");

  return (
    <Screen className="md:pt-6">
      <FadeIn className="mb-1 flex items-center gap-4">
        <div className="flex-1">
          <h1 className="t-title">{t(greeting)} 👋</h1>
          <p className="t-body text-ink-2">{subtitle}</p>
        </div>
        <Link href="/profile" className="md:hidden">
          <Avatar id={child?.avatar} size={52} />
        </Link>
      </FadeIn>

      {/* Test topshirilgandan keyin — skrining taklifi o'rniga rivojlanish (testni "Test" tabidan qayta topshirish mumkin) */}
      <FadeIn delay={80}>
        {last ? (
          <HomeProgressHero last={last} />
        ) : (
          <HeroCard className="flex flex-col gap-4 md:p-8">
            <span className="absolute -right-5 -top-8 h-40 w-40 rounded-full bg-white/[0.08]" />
            <span className="absolute right-10 top-[60px] h-[18px] w-[18px] rounded-full bg-[rgb(250_204_21/0.9)]" />
            <span className="absolute right-[76px] top-6 h-3 w-3 rounded-full bg-[rgb(34_197_94/0.9)]" />
            <Pill label={t("home.heroBadge")} color="#FFFFFF" background="rgba(255,255,255,0.18)" />
            <h2 className="t-subtitle max-w-[88%] !text-[23px] !leading-[30px] md:!text-[28px] md:!leading-[36px]">{t("home.heroTitle")}</h2>
            <p className="t-small text-white/80">{t("home.heroMeta")}</p>
            <div className="md:max-w-[280px]">
              <Button title={t("home.heroCta")} variant="light" href="/screening" icon={ArrowRight} />
            </div>
          </HeroCard>
        )}
      </FadeIn>

      <FadeIn delay={120}>
        <TodayPlan />
      </FadeIn>

      <FadeIn delay={160} className="flex justify-between gap-2">
        <QuickAction icon={MonitorPlay} label={t("home.quickLessons")} hint={t("home.quickLessonsHint")} accent="lessons" href="/lessons" />
        <QuickAction icon={HandHeart} label={t("home.quickExercises")} hint={t("home.quickExercisesHint")} accent="exercises" href="/exercises" />
        {SHOW_CENTERS ? <QuickAction icon={Building2} label={t("home.quickCenters")} accent="centers" href="/centers" /> : null}
        <QuickAction icon={ChartNoAxesCombined} label={t("tabs.progress")} accent="test" href="/progress" />
      </FadeIn>

      <FadeIn delay={180}>
        <TodayPlayCard />
      </FadeIn>

      <FadeIn delay={200}>
        <TalkPromo />
      </FadeIn>

      <div className={`grid gap-4 ${last ? "" : "md:grid-cols-2"}`}>
        {last ? null : (
          <FadeIn delay={240}>
            <StatusCard last={last} />
          </FadeIn>
        )}
        <FadeIn delay={300}>
          <Card className="!flex-row items-start !gap-4 h-full" flat>
            <IconBadge icon={Lightbulb} color={lessons.fg} background={lessons.soft} size={40} />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="t-caption" style={{ color: lessons.fg }}>
                {t("home.tipTitle")}
              </span>
              <p className="t-body">{t(tip)}</p>
            </div>
          </Card>
        </FadeIn>
      </div>

      <VideoCarousel kind="lesson" title={t("home.lessonsSection")} accent="lessons" seeAllHref="/lessons" />
      <VideoCarousel kind="exercise" title={t("home.exercisesSection")} accent="exercises" seeAllHref="/exercises" />

      <p className="t-small mt-4 px-4 text-center text-ink-3">{t("home.disclaimer")}</p>
    </Screen>
  );
}
