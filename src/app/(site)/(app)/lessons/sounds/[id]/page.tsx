"use client";

import { WifiOff } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { LevelPicker, SoundGame, useVisibleCards } from "@/components/app/sounds";
import { EmptyState, Screen, Skeleton } from "@/components/app/ui";
import { fetchSoundSet, type SoundSet } from "@/lib/app/api";
import { LEVEL_OPTIONS, type SoundLevel } from "@/lib/app/sound-progress";

function parseLevel(v: string | null): SoundLevel | null {
  const n = Number(v);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

/** Ovoz to'plami: darajani tanlash (?level yo'q) yoki mashq (?level=1..4). */
function SoundSetScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [set, setSet] = useState<SoundSet | null>(null);
  const [error, setError] = useState(false);
  const cards = useVisibleCards(set);
  const requested = parseLevel(useSearchParams().get("level"));
  const level = requested && cards.length >= LEVEL_OPTIONS[requested] ? requested : null;

  useEffect(() => {
    let cancelled = false;
    fetchSoundSet(id, locale).then(
      (res) => !cancelled && setSet(res.set),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  const load = useCallback(() => {
    setError(false);
    fetchSoundSet(id, locale).then(
      (res) => setSet(res.set),
      () => setError(true),
    );
  }, [id, locale]);

  if (error)
    return (
      <Screen>
        <BackHeader />
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={load} />
      </Screen>
    );

  if (!set)
    return (
      <Screen>
        <BackHeader />
        <Skeleton height={80} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={120} />
        ))}
      </Screen>
    );

  return (
    <Screen className="md:max-w-[760px]">
      <BackHeader title={level ? set.title : undefined} />
      {level ? (
        <SoundGame key={level} cards={cards} level={level} onExit={() => router.back()} />
      ) : (
        <LevelPicker set={set} onPick={(l) => router.push(`/lessons/sounds/${id}?level=${l}`, { scroll: false })} />
      )}
    </Screen>
  );
}

export default function SoundSetPage() {
  return (
    <Suspense>
      <SoundSetScreen />
    </Suspense>
  );
}
