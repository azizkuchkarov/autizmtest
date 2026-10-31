import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

import type { AacWordType } from '@/lib/api';
import { createStore } from '@/lib/local-store';
import { dayKey } from '@/shared/data/play-activities';
import type { Locale } from '@/shared/lib/locale';

/* -------------------------------- Sozlamalar -------------------------------- */

export type AacCardSize = 'sm' | 'md' | 'lg';

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

const DEFAULT_SETTINGS: AacSettings = { size: 'md', showLabels: true, speakOnTap: true, buildSentence: true, rate: 0.9, hidden: {} };

const settingsStore = createStore<AacSettings>('autizm_aac_settings_v1', DEFAULT_SETTINGS, (raw) => ({
  ...DEFAULT_SETTINGS,
  ...(JSON.parse(raw) as Partial<AacSettings>),
}));

export function useAacSettings() {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
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
/* Rivojlanish bo'limi uchun: bola kuniga nechta karta bosgani, qaysi so'zlarni ishlatgani va qanday gap tuzgani. */

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

const logStore = createStore<AacLog>('autizm_aac_log_v1', {}, (raw) => JSON.parse(raw) as AacLog);
const EMPTY_DAYS: Record<string, AacDayLog> = {};

export function useAacLog(childKey: string): Record<string, AacDayLog> {
  return useSyncExternalStore(logStore.subscribe, logStore.get)[childKey] ?? EMPTY_DAYS;
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
}

export function logAacSentence(childKey: string, words: number) {
  updateDay(childKey, (d) => ({ ...d, sentences: d.sentences + 1, sentenceWords: d.sentenceWords + words }));
}

/* ------------------------------ Qurilmadagi fayllar ------------------------------ */
/*
 * Ota-ona yozgan ovozlar va o'z kartalari (rasm, ovoz) faqat shu qurilmada saqlanadi:
 * fayllar hujjatlar papkasida, ro'yxat AsyncStorage da. iOS ilova papkasining yo'li yangilanishda
 * o'zgarishi mumkin, shuning uchun faqat fayl nomi saqlanadi, to'liq manzil o'qishda yig'iladi.
 */

/** Ota-ona qo'shgan karta: rasm va ovoz qurilmada saqlanadi. */
export type CustomAacCard = {
  id: string;
  childKey: string;
  categoryId: string;
  title: string;
  wordType: AacWordType;
  /** Fayl nomlari */
  image: string | null;
  audio: string | null;
  createdAt: number;
};

type Manifest = {
  /** `${childKey}|${locale}|${cardId}` → fayl nomi */
  recordings: Record<string, string>;
  custom: CustomAacCard[];
};

type LocalState = Manifest & { loaded: boolean };

const MANIFEST_KEY = 'autizm_aac_local_v1';
const dir = () => new Directory(Paths.document, 'aac');
const fileUri = (name: string) => new File(dir(), name).uri;

let local: LocalState = { recordings: {}, custom: [], loaded: false };
const listeners = new Set<() => void>();

function setLocal(next: Manifest) {
  local = { ...next, loaded: true };
  listeners.forEach((l) => l());
  AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify({ recordings: next.recordings, custom: next.custom })).catch(() => {});
}

AsyncStorage.getItem(MANIFEST_KEY)
  .then((raw) => {
    const parsed = raw ? (JSON.parse(raw) as Partial<Manifest>) : {};
    local = { recordings: parsed.recordings ?? {}, custom: parsed.custom ?? [], loaded: true };
  })
  .catch(() => {
    local = { ...local, loaded: true };
  })
  .finally(() => listeners.forEach((l) => l()));

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Vaqtinchalik faylni (yozuv yoki tanlangan rasm) doimiy papkaga nusxalaydi va yangi nomini qaytaradi. */
function storeFile(sourceUri: string, ext: string) {
  const d = dir();
  d.create({ idempotent: true, intermediates: true });
  const name = `${newId()}.${ext}`;
  new File(sourceUri).copySync(new File(d, name));
  return name;
}

function removeFile(name: string | null | undefined) {
  if (!name) return;
  try {
    const f = new File(dir(), name);
    if (f.exists) f.delete();
  } catch {
    // Fayl allaqachon yo'q — ro'yxatdan o'chirish yetarli
  }
}

const extOf = (uri: string, fallback: string) => /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(uri)?.[1]?.toLowerCase() ?? fallback;

const recordingKey = (childKey: string, locale: Locale, cardId: string) => `${childKey}|${locale}|${cardId}`;

export function saveRecording(childKey: string, locale: Locale, cardId: string, uri: string) {
  const key = recordingKey(childKey, locale, cardId);
  const name = storeFile(uri, extOf(uri, 'm4a'));
  removeFile(local.recordings[key]);
  setLocal({ ...local, recordings: { ...local.recordings, [key]: name } });
}

export function deleteRecording(childKey: string, locale: Locale, cardId: string) {
  const key = recordingKey(childKey, locale, cardId);
  removeFile(local.recordings[key]);
  const { [key]: _removed, ...rest } = local.recordings;
  setLocal({ ...local, recordings: rest });
}

export function saveCustomCard(card: Omit<CustomAacCard, 'id' | 'image' | 'audio' | 'createdAt'> & { imageUri: string | null; audioUri: string | null }) {
  const { imageUri, audioUri, ...rest } = card;
  const next: CustomAacCard = {
    ...rest,
    id: `custom-${newId()}`,
    image: imageUri ? storeFile(imageUri, extOf(imageUri, 'jpg')) : null,
    audio: audioUri ? storeFile(audioUri, extOf(audioUri, 'm4a')) : null,
    createdAt: Date.now(),
  };
  setLocal({ ...local, custom: [...local.custom, next] });
}

/** O'z kartasiga yangi ovoz yozish. */
export function setCustomCardAudio(id: string, uri: string) {
  const card = local.custom.find((c) => c.id === id);
  if (!card) return;
  const audio = storeFile(uri, extOf(uri, 'm4a'));
  removeFile(card.audio);
  setLocal({ ...local, custom: local.custom.map((c) => (c.id === id ? { ...c, audio } : c)) });
}

export function deleteCustomCard(id: string) {
  const card = local.custom.find((c) => c.id === id);
  if (!card) return;
  removeFile(card.image);
  removeFile(card.audio);
  setLocal({ ...local, custom: local.custom.filter((c) => c.id !== id) });
}

export type AacLocalData = {
  /** karta id → ota-ona yozgan ovoz (fayl manzili) */
  recordings: Record<string, string>;
  custom: (CustomAacCard & { imageUrl: string | null; audioUrl: string | null })[];
  loaded: boolean;
};

let cache: { source: LocalState; childKey: string; locale: Locale; data: AacLocalData } | null = null;

/** Shu bola va til uchun qurilmadagi yozuvlar va o'z kartalari. */
export function useAacLocalData(childKey: string, locale: Locale): AacLocalData {
  const state = useSyncExternalStore(subscribe, () => local);
  if (cache && cache.source === state && cache.childKey === childKey && cache.locale === locale) return cache.data;
  const prefix = recordingKey(childKey, locale, '');
  const data: AacLocalData = {
    recordings: Object.fromEntries(
      Object.entries(state.recordings)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, name]) => [k.slice(prefix.length), fileUri(name)]),
    ),
    custom: state.custom
      .filter((c) => c.childKey === childKey)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => ({ ...c, imageUrl: c.image ? fileUri(c.image) : null, audioUrl: c.audio ? fileUri(c.audio) : null })),
    loaded: state.loaded,
  };
  cache = { source: state, childKey, locale, data };
  return data;
}
