"use client";

import { createLocalStore } from "@/lib/app/local-store";

/*
 * Serverga hali yetib bormagan mashg'ulot hodisalari navbati. Internet bo'lmasa ham hodisa yo'qolmaydi:
 * keyingi sinxronlashda yuboriladi. Bu modul store'larga bog'liq emas — aylana import bo'lmasligi uchun.
 */

export type SoundEvent = {
  kind: "sound";
  id: string;
  cardId: string | null;
  level: 1 | 2 | 3 | 4;
  result: "ok" | "help" | "miss";
  day: string;
  at: number;
  /** Eski qurilmadagi "oxirgi natija" — faqat o'zlashtirish foizi uchun, haftalik grafikka kirmaydi */
  snapshot?: boolean;
};
export type PlayEvent = { kind: "play"; id: string; activityId: string; rating: "great" | "ok" | "hard"; day: string; at: number };
export type AacEvent = { kind: "aac"; id: string; day: string; taps: number; sentences: number; sentenceWords: number; cards: Record<string, number> };
export type SyncEvent = SoundEvent | PlayEvent | AacEvent;

const store = createLocalStore<Record<string, SyncEvent[]>>("autizm_sync_outbox_v1", {}, (raw) => JSON.parse(raw) as Record<string, SyncEvent[]>);

/** Hozir serverga yuborilayotgan hodisalar — ularga AAC qo'shimchalari qo'shilmaydi. */
const inFlight = new Set<string>();
let onChange: ((childKey: string) => void) | null = null;

export function newEventId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Hisobga kirmagan holat ("default" bola) sinxronlanmaydi. */
const syncable = (childKey: string) => childKey !== "default";

export function getOutbox(childKey: string): SyncEvent[] {
  return store.get()[childKey] ?? [];
}

export function enqueue(childKey: string, event: SyncEvent) {
  if (!syncable(childKey)) return;
  const all = store.get();
  const list = all[childKey] ?? [];

  // Bir kundagi AAC bosishlari bitta hodisaga yig'iladi (yuborilayotganiga emas)
  if (event.kind === "aac") {
    const i = list.findIndex((e) => e.kind === "aac" && e.day === event.day && !inFlight.has(e.id));
    if (i >= 0) {
      const prev = list[i] as AacEvent;
      const cards = { ...prev.cards };
      for (const [id, n] of Object.entries(event.cards)) cards[id] = (cards[id] ?? 0) + n;
      const merged: AacEvent = {
        ...prev,
        taps: prev.taps + event.taps,
        sentences: prev.sentences + event.sentences,
        sentenceWords: prev.sentenceWords + event.sentenceWords,
        cards,
      };
      store.set({ ...all, [childKey]: list.map((e, j) => (j === i ? merged : e)) });
      onChange?.(childKey);
      return;
    }
  }

  store.set({ ...all, [childKey]: [...list, event] });
  onChange?.(childKey);
}

export function markInFlight(ids: string[], on: boolean) {
  ids.forEach((id) => (on ? inFlight.add(id) : inFlight.delete(id)));
}

export function removeFromOutbox(childKey: string, ids: string[]) {
  const drop = new Set(ids);
  const all = store.get();
  store.set({ ...all, [childKey]: (all[childKey] ?? []).filter((e) => !drop.has(e.id)) });
}

/** Sinxronlash moduli navbatga yangi hodisa tushganini shu orqali biladi. */
export function setOutboxListener(fn: (childKey: string) => void) {
  onChange = fn;
}
