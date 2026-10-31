import { useSyncExternalStore } from 'react';

import { createStore } from '@/lib/local-store';
import { dayKey } from '@/shared/data/play-activities';

/** bola → video ko'rilgan kunlar ("Bugungi reja" uchun). Faqat shu qurilmada saqlanadi. */
const store = createStore<Record<string, string[]>>('autizm_video_log_v1', {}, (raw) => JSON.parse(raw) as Record<string, string[]>);
const EMPTY: string[] = [];

export function useVideoDays(childKey: string) {
  return useSyncExternalStore(store.subscribe, store.get)[childKey] ?? EMPTY;
}

export function markVideoWatched(childKey: string) {
  const all = store.get();
  const days = all[childKey] ?? [];
  const today = dayKey();
  if (days.includes(today)) return;
  store.set({ ...all, [childKey]: [...days, today].slice(-120) });
}
