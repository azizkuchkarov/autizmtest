"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import type { AacWordType } from "@/lib/app/api";
import { createLocalStore, useLocalStore } from "@/lib/app/local-store";
import { dayKey } from "@/lib/app/play-activities";
import { enqueue, newEventId } from "@/lib/app/sync-outbox";
import type { Locale } from "@/lib/locale";

/* -------------------------------- Sozlamalar -------------------------------- */

export type AacCardSize = "sm" | "md" | "lg";

export type AacSettings = {
  size: AacCardSize;
  showLabels: boolean;
  /** Karta bosilganda darhol aytilsin */
  speakOnTap: boolean;
  /** Bosilgan kartalar yuqoridagi gap qatoriga yig'ilsin */
  buildSentence: boolean;
  /** Sintez ovoz tezligi */
  rate: number;
  /** Yashirilgan kartalar: bola → karta id lari */
  hidden: Record<string, string[]>;
};

const DEFAULT_SETTINGS: AacSettings = { size: "md", showLabels: true, speakOnTap: true, buildSentence: true, rate: 0.9, hidden: {} };

const settingsStore = createLocalStore<AacSettings>("autizm_aac_settings_v1", DEFAULT_SETTINGS, (raw) => ({
  ...DEFAULT_SETTINGS,
  ...(JSON.parse(raw) as Partial<AacSettings>),
}));

export function useAacSettings() {
  return useLocalStore(settingsStore);
}

export function updateAacSettings(patch: Partial<AacSettings>) {
  settingsStore.set({ ...settingsStore.get(), ...patch });
}

export function toggleHiddenCard(childKey: string, cardId: string) {
  const s = settingsStore.get();
  const list = s.hidden[childKey] ?? [];
  const next = list.includes(cardId) ? list.filter((id) => id !== cardId) : [...list, cardId];
  updateAacSettings({ hidden: { ...s.hidden, [childKey]: next } });
}

/* ------------------------------ Foydalanish jurnali ------------------------------ */
/* Progress bo'limi uchun: bola kuniga nechta karta bosgani, qaysi so'zlarni ishlatgani va qanday gap tuzgani. */

export type AacDayLog = {
  /** Bola bosgan kartalar soni */
  taps: number;
  /** "Aytish" bilan aytilgan gaplar soni */
  sentences: number;
  /** Aytilgan gaplardagi kartalar yig'indisi (o'rtacha gap uzunligi uchun) */
  sentenceWords: number;
  /** karta id → necha marta bosilgan */
  cards: Record<string, number>;
};

type AacLog = Record<string, Record<string, AacDayLog>>;

const logStore = createLocalStore<AacLog>("autizm_aac_log_v1", {}, (raw) => JSON.parse(raw) as AacLog);
const EMPTY_DAYS: Record<string, AacDayLog> = {};

export function useAacLog(childKey: string): Record<string, AacDayLog> {
  return useLocalStore(logStore)[childKey] ?? EMPTY_DAYS;
}

function updateDay(childKey: string, fn: (d: AacDayLog) => AacDayLog) {
  const all = logStore.get();
  const days = { ...(all[childKey] ?? {}) };
  const key = dayKey();
  days[key] = fn(days[key] ?? { taps: 0, sentences: 0, sentenceWords: 0, cards: {} });
  // Oxirgi 180 kun saqlanadi
  const keep = Object.keys(days).sort().slice(-180);
  logStore.set({ ...all, [childKey]: Object.fromEntries(keep.map((k) => [k, days[k]])) });
}

export function logAacTap(childKey: string, cardId: string) {
  updateDay(childKey, (d) => ({ ...d, taps: d.taps + 1, cards: { ...d.cards, [cardId]: (d.cards[cardId] ?? 0) + 1 } }));
  enqueue(childKey, { kind: "aac", id: newEventId(), day: dayKey(), taps: 1, sentences: 0, sentenceWords: 0, cards: { [cardId]: 1 } });
}

export function logAacSentence(childKey: string, words: number) {
  updateDay(childKey, (d) => ({ ...d, sentences: d.sentences + 1, sentenceWords: d.sentenceWords + words }));
  enqueue(childKey, { kind: "aac", id: newEventId(), day: dayKey(), taps: 0, sentences: 1, sentenceWords: words, cards: {} });
}

export function getLocalAacDays(childKey: string): Record<string, AacDayLog> {
  return logStore.get()[childKey] ?? {};
}

/** Sinxronlash: kunlik jurnalni server ma'lumoti bilan almashtiradi. */
export function replaceAacDays(childKey: string, days: Record<string, AacDayLog>) {
  const keep = Object.keys(days).sort().slice(-180);
  logStore.set({ ...logStore.get(), [childKey]: Object.fromEntries(keep.map((k) => [k, days[k]])) });
}

/* ------------------------------ IndexedDB ------------------------------ */
/* Ota-ona yozgan ovozlar va o'z kartalari (rasm, ovoz) faqat shu qurilmada saqlanadi. */

/** Ota-ona qo'shgan karta: rasm va ovoz qurilmada saqlanadi. */
export type CustomAacCard = {
  id: string;
  childKey: string;
  categoryId: string;
  title: string;
  wordType: AacWordType;
  image: Blob | null;
  audio: Blob | null;
  createdAt: number;
};

const DB_NAME = "autizm_aac";
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("recordings")) db.createObjectStore("recordings");
        if (!db.objectStoreNames.contains("custom")) db.createObjectStore("custom", { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function run<T>(store: "recordings" | "custom", mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = op(db.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** O'zgarishlarni hooklar sezishi uchun versiya hisoblagichi. */
let version = 0;
const listeners = new Set<() => void>();
function bump() {
  version++;
  listeners.forEach((l) => l());
}
function useVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0,
  );
}

const recordingKey = (childKey: string, locale: Locale, cardId: string) => `${childKey}|${locale}|${cardId}`;

export async function saveRecording(childKey: string, locale: Locale, cardId: string, blob: Blob) {
  await run("recordings", "readwrite", (s) => s.put(blob, recordingKey(childKey, locale, cardId)));
  bump();
}

export async function deleteRecording(childKey: string, locale: Locale, cardId: string) {
  await run("recordings", "readwrite", (s) => s.delete(recordingKey(childKey, locale, cardId)));
  bump();
}

export async function saveCustomCard(card: CustomAacCard) {
  await run("custom", "readwrite", (s) => s.put(card));
  bump();
}

/** O'z kartasiga yangi ovoz yozish. */
export async function setCustomCardAudio(id: string, audio: Blob) {
  const card = await run("custom", "readonly", (s) => s.get(id) as IDBRequest<CustomAacCard | undefined>);
  if (!card) return;
  await run("custom", "readwrite", (s) => s.put({ ...card, audio }));
  bump();
}

export async function deleteCustomCard(id: string) {
  await run("custom", "readwrite", (s) => s.delete(id));
  bump();
}

async function loadRecordings(childKey: string, locale: Locale) {
  const prefix = recordingKey(childKey, locale, "");
  const [keys, values] = await Promise.all([
    run("recordings", "readonly", (s) => s.getAllKeys()),
    run("recordings", "readonly", (s) => s.getAll() as IDBRequest<Blob[]>),
  ]);
  const out: Record<string, Blob> = {};
  keys.forEach((k, i) => {
    if (typeof k === "string" && k.startsWith(prefix)) out[k.slice(prefix.length)] = values[i];
  });
  return out;
}

async function loadCustomCards(childKey: string) {
  const all = await run("custom", "readonly", (s) => s.getAll() as IDBRequest<CustomAacCard[]>);
  return all.filter((c) => c.childKey === childKey).sort((a, b) => a.createdAt - b.createdAt);
}

export type AacLocalData = {
  /** karta id → ota-ona yozgan ovoz (object URL) */
  recordings: Record<string, string>;
  custom: (CustomAacCard & { imageUrl: string | null; audioUrl: string | null })[];
  loaded: boolean;
};

const EMPTY: AacLocalData = { recordings: {}, custom: [], loaded: false };

/** Qurilmadagi yozuvlar va o'z kartalarini yuklaydi; object URL lar almashganda eskilari bo'shatiladi. */
export function useAacLocalData(childKey: string, locale: Locale): AacLocalData {
  const v = useVersion();
  const [data, setData] = useState<AacLocalData>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const url = (b: Blob | null) => {
      if (!b) return null;
      const u = URL.createObjectURL(b);
      urls.push(u);
      return u;
    };
    Promise.all([loadRecordings(childKey, locale), loadCustomCards(childKey)])
      .then(([rec, custom]) => {
        if (cancelled) return;
        setData({
          recordings: Object.fromEntries(Object.entries(rec).map(([id, b]) => [id, url(b)!])),
          custom: custom.map((c) => ({ ...c, imageUrl: url(c.image), audioUrl: url(c.audio) })),
          loaded: true,
        });
      })
      // IndexedDB yopiq bo'lsa (private rejim) — faqat server kartalari ishlaydi
      .catch(() => !cancelled && setData({ ...EMPTY, loaded: true }));
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [childKey, locale, v]);

  return data;
}
