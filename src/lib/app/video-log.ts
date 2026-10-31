"use client";

import { createLocalStore, useLocalStore } from "@/lib/app/local-store";
import { dayKey } from "@/lib/app/play-activities";

/** bola → video ko'rilgan kunlar ("Bugungi reja" uchun). Faqat shu qurilmada saqlanadi. */
const store = createLocalStore<Record<string, string[]>>("autizm_video_log_v1", {}, (raw) => JSON.parse(raw) as Record<string, string[]>);
const EMPTY: string[] = [];

export function useVideoDays(childKey: string) {
  return useLocalStore(store)[childKey] ?? EMPTY;
}

export function markVideoWatched(childKey: string) {
  const all = store.get();
  const days = all[childKey] ?? [];
  const today = dayKey();
  if (days.includes(today)) return;
  store.set({ ...all, [childKey]: [...days, today].slice(-120) });
}
