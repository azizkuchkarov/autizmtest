"use client";

import { Puzzle } from "lucide-react";
import { useParams } from "next/navigation";

import { BackHeader } from "@/components/app/app-shell";
import { PlayDetail } from "@/components/app/play";
import { useLocale } from "@/components/app/providers";
import { EmptyState, Screen } from "@/components/app/ui";
import { PLAY_ACTIVITIES } from "@/lib/app/play-activities";

/** Bitta o'yin: qadamlar, maslahatlar va 5 daqiqalik taymer. */
export default function PlayActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const activity = PLAY_ACTIVITIES.find((a) => a.id === id);

  return (
    <Screen className="md:max-w-[760px]">
      <BackHeader />
      {activity ? <PlayDetail activity={activity} /> : <EmptyState icon={Puzzle} title={t("play.notFound")} actionTitle={t("play.all")} onAction={() => history.back()} />}
    </Screen>
  );
}
