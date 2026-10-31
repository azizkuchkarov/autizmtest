"use client";

import { ContentList } from "@/components/app/content-list";
import { useLocale } from "@/components/app/providers";
import { TodayPlayCard } from "@/components/app/play";
import { TalkPromo } from "@/components/app/talk/promo";

export default function ExercisesPage() {
  const { t } = useLocale();
  return <ContentList kind="exercise" accent="exercises" title={t("exercises.title")} subtitle={t("exercises.subtitle")} extra={
        <>
          <TodayPlayCard />
          <TalkPromo />
        </>
      } />;
}
