"use client";

import { addPlayEntry, dayKey, shiftToday, type ChildPlay, type PlayEntry, type PlayRating } from "@/lib/app/play-activities";
import { enqueue, newEventId } from "@/lib/app/sync-outbox";
import { createLocalStore, useLocalStore } from "@/lib/app/local-store";

/** bola → "Bugungi 5 daqiqa" natijalari. Qurilmada saqlanadi va akkauntga sinxronlanadi. */
type PlayStore = Record<string, ChildPlay>;

const store = createLocalStore<PlayStore>("autizm_play_v1", {}, (raw) => JSON.parse(raw) as PlayStore);

export function useChildPlay(childKey: string): ChildPlay | undefined {
  return useLocalStore(store)[childKey];
}

export function recordPlay(childKey: string, id: string, rating: PlayRating) {
  const all = store.get();
  store.set({ ...all, [childKey]: addPlayEntry(all[childKey], id, rating) });
  enqueue(childKey, { kind: "play", id: newEventId(), activityId: id, rating, day: dayKey(), at: Date.now() });
}

export function getLocalPlayEntries(childKey: string): PlayEntry[] {
  return store.get()[childKey]?.entries ?? [];
}

/** Sinxronlash: mashg'ulotlar ro'yxatini server ma'lumoti bilan almashtiradi ("Boshqasi" holati saqlanadi). */
export function replacePlayEntries(childKey: string, entries: PlayEntry[]) {
  const all = store.get();
  store.set({ ...all, [childKey]: { ...all[childKey], entries: entries.slice(-500) } });
}

/** "Boshqasi": bugungi o'yinni navbatdagisiga almashtiradi. */
export function nextTodayPlay(childKey: string) {
  const all = store.get();
  store.set({ ...all, [childKey]: shiftToday(all[childKey]) });
}
