"use client";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { Screen } from "@/components/app/ui";
import { VideoExercisesList } from "@/components/app/video-exercises";

export default function VideoExercisesPage() {
  const { t } = useLocale();
  return (
    <Screen>
      <BackHeader title={t("ex.videoTitle")} />
      <VideoExercisesList />
    </Screen>
  );
}
