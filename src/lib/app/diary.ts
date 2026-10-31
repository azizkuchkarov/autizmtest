"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { fetchDiary, saveDiary, type DiaryEntry } from "@/lib/app/api";
import { dayKey, lastDays } from "@/lib/app/play-activities";

/* Kundalik serverda saqlanadi. Bosh sahifa, kundalik va Rivojlanish sahifalari bitta keshdan foydalanadi. */

type State = { childId: string | null; entries: DiaryEntry[] | null; error: boolean };

let state: State = { childId: null, entries: null, error: false };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/** Oxirgi 90 kunlik yozuvlarni yuklaydi (bir vaqtda faqat bitta so'rov). */
function load(childId: string) {
  if (inflight && state.childId === childId) return inflight;
  if (state.childId !== childId) set({ childId, entries: null, error: false });
  const from = lastDays(90).at(-1);
  inflight = fetchDiary(childId, from)
    .then(
      (res) => set({ entries: res.entries, error: false }),
      () => set({ error: true }),
    )
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function emptyDiary(date: string): DiaryEntry {
  return {
    date,
    bedTime: null,
    wakeTime: null,
    nightWakings: null,
    mood: null,
    breakfast: null,
    appetite: null,
    meltdowns: null,
    selfHarm: null,
    repetitive: null,
    eyeContact: null,
    requests: null,
    sick: null,
    constipation: null,
    medicine: null,
    note: null,
  };
}

/** Bolaning kundalik yozuvlari (eskisidan yangisiga). null — yuklanmoqda. */
export function useDiary(childId: string | null | undefined) {
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );

  useEffect(() => {
    if (childId) load(childId);
  }, [childId]);

  const save = useCallback(
    async (entry: DiaryEntry) => {
      if (!childId) return;
      const res = await saveDiary(childId, entry);
      const others = (state.entries ?? []).filter((e) => e.date !== res.entry.date);
      set({ entries: [...others, res.entry].sort((a, b) => a.date.localeCompare(b.date)) });
    },
    [childId],
  );

  const entries = snap.childId === childId ? snap.entries : null;
  const today = dayKey();
  return {
    entries,
    error: snap.childId === childId && snap.error,
    today: entries?.find((e) => e.date === today) ?? null,
    byDate: (date: string) => entries?.find((e) => e.date === date) ?? null,
    reload: () => (childId ? load(childId) : Promise.resolve()),
    save,
  };
}

/** Uyqu davomiyligi soatda: kecha uxlagan va ertalab uyg'ongan vaqtdan. */
export function sleepHours(bedTime: string | null, wakeTime: string | null): number | null {
  if (!bedTime || !wakeTime) return null;
  const [bh, bm] = bedTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let minutes = wh * 60 + wm - (bh * 60 + bm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
}
