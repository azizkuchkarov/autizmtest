"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ContentList } from "@/components/app/content-list";
import { useLocale } from "@/components/app/providers";
import { SoundSetList } from "@/components/app/sounds";
import { PageHeader, Screen, Segmented } from "@/components/app/ui";

type Tab = "video" | "sounds";

/** Darslar ikki ko'rinishda: video darslar va ovozli darslar (?tab=sounds). */
function Lessons() {
  const { t } = useLocale();
  const router = useRouter();
  const tab: Tab = useSearchParams().get("tab") === "sounds" ? "sounds" : "video";

  const tabs = (
    <Segmented<Tab>
      options={[
        { value: "video", label: t("lessons.tabVideo") },
        { value: "sounds", label: t("lessons.tabSounds") },
      ]}
      value={tab}
      onChange={(v) => router.replace(v === "sounds" ? "/lessons?tab=sounds" : "/lessons", { scroll: false })}
    />
  );

  if (tab === "video") return <ContentList kind="lesson" accent="lessons" title={t("lessons.title")} subtitle={t("lessons.subtitle")} extra={tabs} />;

  return (
    <Screen>
      <PageHeader title={t("lessons.title")} subtitle={t("sounds.intro")} />
      {tabs}
      <SoundSetList />
    </Screen>
  );
}

export default function LessonsPage() {
  return (
    <Suspense>
      <Lessons />
    </Suspense>
  );
}
