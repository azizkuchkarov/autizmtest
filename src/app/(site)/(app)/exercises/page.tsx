"use client";

import { useLocale } from "@/components/app/providers";
import { TodayPlayCard } from "@/components/app/play";
import { TalkPromo } from "@/components/app/talk/promo";
import { PageHeader, Screen } from "@/components/app/ui";

export default function ExercisesPage() {
  const { t } = useLocale();
  return (
    <Screen>
      <PageHeader title={t("exercises.title")} subtitle={t("exercises.subtitle")} />
      <TodayPlayCard />
      <TalkPromo />
    </Screen>
  );
}
