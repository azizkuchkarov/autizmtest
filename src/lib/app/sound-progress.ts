"use client";

import { createLocalStore, useLocalStore } from "@/lib/app/local-store";
import { dayKey } from "@/lib/app/play-activities";
import { enqueue, newEventId, type SoundEvent } from "@/lib/app/sync-outbox";

/** Ovozli mashqdagi bitta javob: o'zi topdi / yordam bilan / hali emas. */
export type SoundResult = "ok" | "help" | "miss";

export type SoundLevel = 1 | 2 | 3 | 4;
export const SOUND_LEVELS: SoundLevel[] = [1, 2, 3, 4];

/** Darajadagi variantlar soni (1 va 4-darajada variant yo'q). */
export const LEVEL_OPTIONS: Record<SoundLevel, number> = { 1: 1, 2: 2, 3: 4, 4: 1 };

/** bola → ovoz → daraja → oxirgi natija. Faqat shu qurilmada saqlanadi. */
type Progress = Record<string, Record<string, Partial<Record<SoundLevel, SoundResult>>>>;

const progressStore = createLocalStore<Progress>("autizm_sound_progress_v1", {}, (raw) => JSON.parse(raw) as Progress);

export type SoundSettings = { volume: number; showLoud: boolean };

/** Sezgir bolalar uchun: ovoz past, keskin tovushlar yashirilgan. */
const DEFAULT_SETTINGS: SoundSettings = { volume: 0.5, showLoud: false };

const settingsStore = createLocalStore<SoundSettings>("autizm_sound_settings_v1", DEFAULT_SETTINGS, (raw) => ({
  ...DEFAULT_SETTINGS,
  ...(JSON.parse(raw) as Partial<SoundSettings>),
}));

export function useSoundProgress(childKey: string) {
  return useLocalStore(progressStore)[childKey] ?? {};
}

/** Har bir javob sanasi bilan — Progress bo'limidagi haftalik dinamika uchun. */
export type SoundLogEntry = { day: string; level: SoundLevel; result: SoundResult; cardId?: string | null };

const logStore = createLocalStore<Record<string, SoundLogEntry[]>>("autizm_sound_log_v1", {}, (raw) => JSON.parse(raw) as Record<string, SoundLogEntry[]>);

export function useSoundLog(childKey: string): SoundLogEntry[] {
  return useLocalStore(logStore)[childKey] ?? EMPTY_LOG;
}
const EMPTY_LOG: SoundLogEntry[] = [];

export function recordSoundResult(childKey: string, cardId: string, level: SoundLevel, result: SoundResult) {
  const all = progressStore.get();
  const child = all[childKey] ?? {};
  progressStore.set({ ...all, [childKey]: { ...child, [cardId]: { ...child[cardId], [level]: result } } });

  const day = dayKey();
  const log = logStore.get();
  // Juda katta bo'lib ketmasligi uchun oxirgi 3000 ta javob
  logStore.set({ ...log, [childKey]: [...(log[childKey] ?? []), { day, level, result, cardId }].slice(-3000) });
  enqueue(childKey, { kind: "sound", id: newEventId(), cardId, level, result, day, at: Date.now() });
}

/** Sinxronlash: eski qurilmadagi tarixni hodisalarga aylantirish uchun. */
export function getLocalSoundState(childKey: string) {
  return { log: logStore.get()[childKey] ?? [], progress: progressStore.get()[childKey] ?? {} };
}

/** Sinxronlash: server va navbatdagi hodisalardan tarixni qayta tiklaydi (yangisi oxirida). */
export function replaceSoundHistory(childKey: string, events: Omit<SoundEvent, "kind" | "id">[]) {
  const sorted = [...events].sort((a, b) => a.at - b.at);
  const map: Progress[string] = {};
  for (const e of sorted) if (e.cardId) map[e.cardId] = { ...map[e.cardId], [e.level]: e.result };
  const log = sorted.filter((e) => !e.snapshot).map((e) => ({ day: e.day, level: e.level, result: e.result, cardId: e.cardId }));
  progressStore.set({ ...progressStore.get(), [childKey]: map });
  logStore.set({ ...logStore.get(), [childKey]: log.slice(-3000) });
}

/** Darajada "o'zi topdi" deb belgilangan ovozlar ulushi, 0–100. */
export function levelMastery(progress: ReturnType<typeof useSoundProgress>, cardIds: string[], level: SoundLevel) {
  if (cardIds.length === 0) return 0;
  const ok = cardIds.filter((id) => progress[id]?.[level] === "ok").length;
  return Math.round((ok / cardIds.length) * 100);
}

export function useSoundSettings() {
  return useLocalStore(settingsStore);
}

export function updateSoundSettings(patch: Partial<SoundSettings>) {
  settingsStore.set({ ...settingsStore.get(), ...patch });
}
