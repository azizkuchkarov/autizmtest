"use client";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { SoundSetList } from "@/components/app/sounds";
import { Screen } from "@/components/app/ui";

/** Barcha ovozli mashqlar to'plami (Mashqlar bo'limidan ochiladi). */
export default function SoundSetsPage() {
  const { t } = useLocale();
  return (
    <Screen>
      <BackHeader title={t("exercises.soundsTitle")} />
      <SoundSetList />
    </Screen>
  );
}
