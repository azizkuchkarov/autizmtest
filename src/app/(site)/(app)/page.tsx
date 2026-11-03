"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/app/avatar";
import { HomeLessonCard, HomeProgressCard, NextStepCard } from "@/components/app/home-cards";
import { useLocale, useProfile } from "@/components/app/providers";
import { TodayPlan, WeekSchedule } from "@/components/app/today-plan";
import { accent as accentOf, Button, Card, FadeIn, HeroCard, IconBadge, Pill, Screen } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import { listAssessments, useAssessmentsVersion, type StoredAssessment } from "@/lib/app/history";
import { useHydrated } from "@/lib/app/local-store";
import { useTip } from "@/lib/app/tips";

function greetingKey(): TranslationKey {
  const h = new Date().getHours();
  if (h < 12) return "home.morning";
  if (h < 18) return "home.afternoon";
  return "home.evening";
}

export default function HomePage() {
  const { t } = useLocale();
  const { child } = useProfile();
  const lessons = accentOf("lessons");
  const [items, setItems] = useState<StoredAssessment[]>([]);
  const last = items[0] ?? null;
  // Vaqt brauzerda hisoblanadi (server soati boshqa bo'lishi mumkin)
  const hydrated = useHydrated();
  const greeting: TranslationKey = hydrated ? greetingKey() : "home.afternoon";
  const tip = useTip();

  const assessmentsVersion = useAssessmentsVersion();
  useEffect(() => {
    listAssessments().then(setItems);
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

      {/* Test bo'lmasa — birinchi qadam test; bo'lsa — bugungi navbatdagi vazifa */}
      <FadeIn delay={80}>
        {last ? (
          <NextStepCard />
        ) : (
          <HeroCard className="flex flex-col gap-4 md:p-8">
            <span className="absolute -right-5 -top-8 h-40 w-40 rounded-full bg-white/[0.08]" />
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

      <FadeIn delay={140}>
        <WeekSchedule />
      </FadeIn>

      <FadeIn delay={160}>
        <HomeLessonCard />
      </FadeIn>

      {last ? (
        <FadeIn delay={200}>
          <HomeProgressCard items={items} />
        </FadeIn>
      ) : null}

      <FadeIn delay={240}>
        <Card className="!flex-row items-start !gap-4" flat>
          <IconBadge icon={Lightbulb} color={lessons.fg} background={lessons.soft} size={40} />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="t-caption" style={{ color: lessons.fg }}>
              {t("home.tipTitle")}
            </span>
            <p className="t-body min-h-6">{tip ? t(tip) : null}</p>
          </div>
        </Card>
      </FadeIn>

      <p className="t-small mt-4 px-4 text-center text-ink-3">{t("home.disclaimer")}</p>
    </Screen>
  );
}
