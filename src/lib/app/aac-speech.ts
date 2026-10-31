"use client";

import { useSyncExternalStore } from "react";

import type { Locale } from "@/lib/locale";

/** Aytiladigan narsa: avval ota-ona yozuvi, keyin admin yuklagan fayl, oxiri qurilmaning sintez ovozi. */
export type Utterance = { text: string; recordingUrl?: string | null; audioUrl?: string | null };

const LANG: Record<Locale, string> = { uz: "uz", ru: "ru" };

/* ----------------------------- Sintez ovozlar ----------------------------- */

function voicesFor(locale: Locale) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(LANG[locale]));
}

function subscribeVoices(cb: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", cb);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", cb);
}

/**
 * Qurilmada shu til uchun sintez ovoz bormi: null — ovozlar hali yuklanmoqda (Chrome ularni kechroq beradi).
 * O'zbek tili uchun odatda false.
 */
export function useTtsAvailable(locale: Locale): boolean | null {
  const state = useSyncExternalStore(
    subscribeVoices,
    () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return "no";
      if (window.speechSynthesis.getVoices().length === 0) return "loading";
      return voicesFor(locale).length > 0 ? "yes" : "no";
    },
    () => "loading",
  );
  return state === "loading" ? null : state === "yes";
}

function speakTts(text: string, locale: Locale, rate: number): Promise<boolean> {
  const voice = voicesFor(locale)[0];
  if (!voice) return Promise.resolve(false);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

/* -------------------------------- Audio fayl -------------------------------- */

/** Bitta audio element: iOS da birinchi bosishda "ochiladi" va keyingi gap qismlari ham ijro etiladi. */
let audio: HTMLAudioElement | null = null;
let token = 0;

function playUrl(url: string): Promise<boolean> {
  audio ??= new Audio();
  const el = audio;
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      el.onended = el.onerror = null;
      resolve(ok);
    };
    el.onended = () => done(true);
    el.onerror = () => done(false);
    el.src = url;
    el.currentTime = 0;
    el.play().catch(() => done(false));
  });
}

export function stopSpeech() {
  token++;
  audio?.pause();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Bitta so'z yoki gap qismini aytadi. Ovoz chiqmasa false qaytaradi. */
async function speakOne(u: Utterance, locale: Locale, rate: number) {
  for (const url of [u.recordingUrl, u.audioUrl]) {
    if (url && (await playUrl(url))) return true;
  }
  return speakTts(u.text, locale, rate);
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
    return speakTts(parts.map((p) => p.text).join(" "), locale, rate);
  }
  let any = false;
  for (const p of parts) {
    if (my !== token) return any;
    any = (await speakOne(p, locale, rate)) || any;
  }
  return any;
}
