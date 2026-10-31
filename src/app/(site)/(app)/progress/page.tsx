"use client";

import { ProgressView } from "@/components/app/progress/progress-view";
import { Screen } from "@/components/app/ui";

/** Rivojlanish: skrining dinamikasi va barcha mashg'ulotlar natijasi bir joyda. */
export default function ProgressPage() {
  return (
    <Screen wide>
      <ProgressView />
    </Screen>
  );
}
