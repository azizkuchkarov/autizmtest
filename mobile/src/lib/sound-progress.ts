import { useSyncExternalStore } from 'react';

import { createStore } from '@/lib/local-store';
import { dayKey } from '@/shared/data/play-activities';

/** Ovozli mashqdagi bitta javob: o'zi topdi / yordam bilan / hali emas. */
export type SoundResult = 'ok' | 'help' | 'miss';

export type SoundLevel = 1 | 2 | 3 | 4;
export const SOUND_LEVELS: SoundLevel[] = [1, 2, 3, 4];

/** Darajadagi variantlar soni (1 va 4-darajada variant yo'q). */
export const LEVEL_OPTIONS: Record<SoundLevel, number> = { 1: 1, 2: 2, 3: 4, 4: 1 };

/** bola → ovoz → daraja → oxirgi natija. Faqat shu qurilmada saqlanadi. */
type Progress = Record<string, Record<string, Partial<Record<SoundLevel, SoundResult>>>>;

export type SoundSettings = { volume: number; showLoud: boolean };

/** Sezgir bolalar uchun: ovoz past, keskin tovushlar yashirilgan. */
const DEFAULT_SETTINGS: SoundSettings = { volume: 0.5, showLoud: false };

const progressStore = createStore<Progress>('autizm_sound_progress_v1', {}, (raw) => JSON.parse(raw) as Progress);

const settingsStore = createStore<SoundSettings>('autizm_sound_settings_v1', DEFAULT_SETTINGS, (raw) => ({
  ...DEFAULT_SETTINGS,
  ...(JSON.parse(raw) as Partial<SoundSettings>),
}));

export function useSoundProgress(childKey: string) {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get)[childKey] ?? {};
}

/** Har bir javob sanasi bilan — Rivojlanish bo'limidagi haftalik dinamika uchun. */
export type SoundLogEntry = { day: string; level: SoundLevel; result: SoundResult };

const logStore = createStore<Record<string, SoundLogEntry[]>>('autizm_sound_log_v1', {}, (raw) => JSON.parse(raw) as Record<string, SoundLogEntry[]>);
const EMPTY_LOG: SoundLogEntry[] = [];

export function useSoundLog(childKey: string): SoundLogEntry[] {
  return useSyncExternalStore(logStore.subscribe, logStore.get)[childKey] ?? EMPTY_LOG;
}

export function recordSoundResult(childKey: string, cardId: string, level: SoundLevel, result: SoundResult) {
  const all = progressStore.get();
  const child = all[childKey] ?? {};
  progressStore.set({ ...all, [childKey]: { ...child, [cardId]: { ...child[cardId], [level]: result } } });

  const log = logStore.get();
  // Juda katta bo'lib ketmasligi uchun oxirgi 3000 ta javob
  logStore.set({ ...log, [childKey]: [...(log[childKey] ?? []), { day: dayKey(), level, result }].slice(-3000) });
}

/** Darajada "o'zi topdi" deb belgilangan ovozlar ulushi, 0–100. */
export function levelMastery(progress: ReturnType<typeof useSoundProgress>, cardIds: string[], level: SoundLevel) {
  if (cardIds.length === 0) return 0;
  const ok = cardIds.filter((id) => progress[id]?.[level] === 'ok').length;
  return Math.round((ok / cardIds.length) * 100);
}

export function useSoundSettings() {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
}

export function updateSoundSettings(patch: Partial<SoundSettings>) {
  settingsStore.set({ ...settingsStore.get(), ...patch });
}

