import { useSyncExternalStore } from 'react';

import { createStore } from '@/lib/local-store';
import { addPlayEntry, shiftToday, type ChildPlay, type PlayRating } from '@/shared/data/play-activities';

/** bola → "Bugungi 5 daqiqa" natijalari. Faqat shu qurilmada saqlanadi. */
type PlayStore = Record<string, ChildPlay>;

const store = createStore<PlayStore>('autizm_play_v1', {}, (raw) => JSON.parse(raw) as PlayStore);

export function useChildPlay(childKey: string): ChildPlay | undefined {
  return useSyncExternalStore(store.subscribe, store.get)[childKey];
}

export function recordPlay(childKey: string, id: string, rating: PlayRating) {
  const all = store.get();
  store.set({ ...all, [childKey]: addPlayEntry(all[childKey], id, rating) });
}

/** "Boshqasi": bugungi o'yinni navbatdagisiga almashtiradi. */
export function nextTodayPlay(childKey: string) {
  const all = store.get();
  store.set({ ...all, [childKey]: shiftToday(all[childKey]) });
}
