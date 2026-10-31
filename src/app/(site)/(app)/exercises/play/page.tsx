"use client";

import { BackHeader } from "@/components/app/app-shell";
import { PlayList } from "@/components/app/play";
import { Screen } from "@/components/app/ui";

/** Bugungi 5 daqiqa: kunlik o'yin va barcha o'yinlar ro'yxati. */
export default function PlayPage() {
  return (
    <Screen className="md:max-w-[860px]">
      <BackHeader />
      <PlayList />
    </Screen>
  );
}
