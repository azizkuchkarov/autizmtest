import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

import { absoluteUrl } from '@/lib/api';
import type { Locale } from '@/shared/lib/locale';

/** Aytiladigan narsa: avval ota-ona yozuvi, keyin admin yuklagan fayl, oxiri qurilmaning sintez ovozi. */
export type Utterance = { text: string; recordingUrl?: string | null; audioUrl?: string | null };

/* ----------------------------- Sintez ovozlar ----------------------------- */

let voicesPromise: Promise<Speech.Voice[]> | null = null;

function loadVoices() {
  voicesPromise ??= Speech.getAvailableVoicesAsync().catch(() => {
    voicesPromise = null;
    return [];
  });
  return voicesPromise;
}

async function voiceFor(locale: Locale) {
  const voices = (await loadVoices()).filter((v) => v.language.toLowerCase().startsWith(locale));
  // Sifatli ovoz bo'lsa — o'shani
  return voices.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? voices[0] ?? null;
}

/** Qurilmada shu til uchun sintez ovoz bormi: null — hali tekshirilmoqda. O'zbek tili uchun odatda false. */
export function useTtsAvailable(locale: Locale): boolean | null {
  const [state, setState] = useState<{ locale: Locale; ok: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    voiceFor(locale).then((v) => !cancelled && setState({ locale, ok: !!v }));
    return () => {
      cancelled = true;
    };
  }, [locale]);
  return state?.locale === locale ? state.ok : null;
}

async function speakTts(text: string, locale: Locale, rate: number, my: number): Promise<boolean> {
  const voice = await voiceFor(locale);
  if (!voice || my !== token) return false;
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: voice.language,
      voice: voice.identifier,
      rate,
      onDone: () => resolve(true),
      onError: () => resolve(false),
      onStopped: () => resolve(false),
    });
  });
}

/* -------------------------------- Audio fayl -------------------------------- */

/** Bitta pleyer butun ekran uchun: gap qismlari ketma-ket shu orqali ijro etiladi. */
let player: AudioPlayer | null = null;
let pending: ((ok: boolean) => void) | null = null;
let token = 0;
let audioModeReady = false;

function ensurePlayer() {
  if (!audioModeReady) {
    audioModeReady = true;
    // Telefon "jim" rejimida bo'lsa ham bola ovozni eshitsin
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  player ??= createAudioPlayer(null);
  return player;
}

/** Faylni boshidan oxirigacha ijro etadi. Ochilmasa yoki to'xtatilsa false qaytaradi. */
export function playUrl(url: string): Promise<boolean> {
  const uri = absoluteUrl(url);
  if (!uri) return Promise.resolve(false);
  pending?.(false);
  const p = ensurePlayer();
  return new Promise((resolve) => {
    let started = false;
    const finish = (ok: boolean) => {
      if (pending !== finish) return;
      pending = null;
      clearTimeout(timer);
      sub.remove();
      resolve(ok);
    };
    pending = finish;
    // Fayl bir necha soniyada ochilmasa — keyingi manbaga o'tamiz
    const timer = setTimeout(() => !started && finish(false), 5000);
    const sub = p.addListener('playbackStatusUpdate', (s) => {
      if (s.error) finish(false);
      else if (s.playing) started = true;
      if (s.didJustFinish) finish(true);
    });
    p.replace({ uri });
    p.play();
  });
}

export function stopSpeech() {
  token++;
  pending?.(false);
  player?.pause();
  Speech.stop().catch(() => {});
}

/** Bitta so'z yoki gap qismini aytadi. Ovoz chiqmasa false qaytaradi. */
async function speakOne(u: Utterance, locale: Locale, rate: number, my: number) {
  for (const url of [u.recordingUrl, u.audioUrl]) {
    if (my !== token) return false;
    if (url && (await playUrl(url))) return true;
  }
  return speakTts(u.text, locale, rate, my);
}

/**
 * Kartalarni ketma-ket aytadi. Hech birida yozuv bo'lmasa, butun gapni bitta sintez jumla qilib aytadi —
 * shunda ohang tabiiyroq chiqadi. Yangi chaqiruv oldingisini to'xtatadi.
 */
export async function speak(parts: Utterance[], locale: Locale, rate: number): Promise<boolean> {
  stopSpeech();
  const my = token;
  if (parts.length === 0) return false;
  if (parts.length > 1 && parts.every((p) => !p.recordingUrl && !p.audioUrl)) {
    return speakTts(parts.map((p) => p.text).join(' '), locale, rate, my);
  }
  let any = false;
  for (const p of parts) {
    if (my !== token) return any;
    any = (await speakOne(p, locale, rate, my)) || any;
  }
  return any;
}
