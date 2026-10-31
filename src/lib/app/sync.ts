"use client";

import { useEffect } from "react";

import { getLocalAacDays, replaceAacDays, type AacDayLog } from "@/lib/app/aac-store";
import { fetchActivity, pushActivity } from "@/lib/app/api";
import { listAssessments, saveAssessment } from "@/lib/app/history";
import { dayKey } from "@/lib/app/play-activities";
import { getLocalPlayEntries, replacePlayEntries } from "@/lib/app/play-store";
import type { ScreeningResult } from "@/lib/app/screening";
import { replaceSkillsHistory } from "@/lib/app/skills-store";
import type { SkillsResult } from "@/lib/screening-v3/score";
import { getLocalSoundState, replaceSoundHistory } from "@/lib/app/sound-progress";
import { enqueue, getOutbox, markInFlight, newEventId, removeFromOutbox, setOutboxListener, type SoundEvent } from "@/lib/app/sync-outbox";

/*
 * Mashg'ulotlar tarixi akkauntda saqlanadi: telefon almashsa yoki boshqa qurilmadan kirilsa ham yo'qolmaydi.
 *  1) Birinchi marta — shu qurilmadagi eski tarix serverga yuklanadi.
 *  2) Navbatdagi hodisalar yuboriladi.
 *  3) Serverdagi to'liq tarix olinadi va qurilmadagi ma'lumotlar u bilan almashtiriladi (yuborilmaganlar ham qo'shiladi).
 */

const IMPORTED_KEY = "autizm_sync_imported_v1";
const BATCH = 500;
/** Ilova qayta faollashganda serverdan tortish orasidagi eng kam vaqt */
const PULL_INTERVAL_MS = 60_000;

function importedSet(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(IMPORTED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markImported(childId: string) {
  try {
    localStorage.setItem(IMPORTED_KEY, JSON.stringify([...importedSet(), childId]));
  } catch {}
}

/** Kun o'rtasi + tartib raqami — eski yozuvlarning vaqti noma'lum, tartib saqlanadi. */
const legacyAt = (day: string, i: number) => new Date(`${day}T12:00:00`).getTime() + i;

/** Shu qurilmadagi eski tarixni (sinxronlashdan oldingi) hodisalar sifatida navbatga qo'yadi — bir marta. */
function importLegacy(childId: string) {
  if (importedSet().has(childId)) return;
  const { log, progress } = getLocalSoundState(childId);
  log.forEach((e, i) =>
    enqueue(childId, { kind: "sound", id: newEventId(), cardId: e.cardId ?? null, level: e.level, result: e.result, day: e.day, at: legacyAt(e.day, i) }),
  );
  // Har bir ovozning oxirgi natijasi — o'zlashtirish foizi yo'qolmasligi uchun (haftalik grafikka kirmaydi)
  Object.entries(progress).forEach(([cardId, levels]) =>
    Object.entries(levels).forEach(([level, result]) => {
      if (!result) return;
      enqueue(childId, { kind: "sound", id: newEventId(), cardId, level: Number(level) as SoundEvent["level"], result, day: dayKey(), at: 1, snapshot: true });
    }),
  );
  getLocalPlayEntries(childId).forEach((e, i) =>
    enqueue(childId, { kind: "play", id: newEventId(), activityId: e.id, rating: e.rating, day: e.day, at: legacyAt(e.day, i) }),
  );
  Object.entries(getLocalAacDays(childId)).forEach(([day, d]) =>
    enqueue(childId, { kind: "aac", id: newEventId(), day, taps: d.taps, sentences: d.sentences, sentenceWords: d.sentenceWords, cards: d.cards }),
  );
  markImported(childId);
}

async function flush(childId: string, claimAssessments: string[] = []) {
  const pending = getOutbox(childId);
  if (pending.length === 0 && claimAssessments.length === 0) return;
  // Birinchi so'rov hodisa bo'lmasa ham yuboriladi — testlarni bog'lash uchun
  for (let i = 0; i === 0 || i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const ids = batch.map((e) => e.id);
    markInFlight(ids, true);
    try {
      await pushActivity(childId, { events: batch, ...(i === 0 && claimAssessments.length ? { claimAssessments } : {}) });
      removeFromOutbox(childId, ids);
    } finally {
      markInFlight(ids, false);
    }
  }
}

/** Server tarixi + hali yuborilmagan hodisalar → qurilmadagi store'lar. */
async function pull(childId: string) {
  const data = await fetchActivity(childId);
  const outbox = getOutbox(childId);

  replaceSoundHistory(childId, [...data.sound, ...outbox.flatMap((e) => (e.kind === "sound" ? [e] : []))]);

  const seen = new Set(data.play.map((p) => p.id));
  const play = [...data.play, ...outbox.flatMap((e) => (e.kind === "play" && !seen.has(e.id) ? [e] : []))].sort((a, b) => a.at - b.at);
  replacePlayEntries(
    childId,
    play.map((p) => ({ day: p.day, id: p.activityId, rating: p.rating })),
  );

  const days: Record<string, AacDayLog> = {};
  for (const d of data.aac) days[d.day] = { taps: d.taps, sentences: d.sentences, sentenceWords: d.sentenceWords, cards: { ...d.cards } };
  for (const e of outbox) {
    if (e.kind !== "aac") continue;
    const d = (days[e.day] ??= { taps: 0, sentences: 0, sentenceWords: 0, cards: {} });
    d.taps += e.taps;
    d.sentences += e.sentences;
    d.sentenceWords += e.sentenceWords;
    for (const [id, n] of Object.entries(e.cards)) d.cards[id] = (d.cards[id] ?? 0) + n;
  }
  replaceAacDays(childId, days);

  replaceSkillsHistory(
    childId,
    (data.skills ?? []).map((r) => ({ id: r.id, serverId: r.id, createdAt: r.createdAt, result: r.scoring as SkillsResult })),
  );

  // Boshqa qurilmada topshirilgan testlar shu qurilma tarixiga qo'shiladi
  const local = await listAssessments();
  const known = new Set(local.flatMap((a) => [a.id, a.serverId ?? ""]));
  for (const a of data.assessments) {
    if (known.has(a.id)) continue;
    await saveAssessment({
      id: a.id,
      serverId: a.id,
      createdAt: a.createdAt,
      ageGroup: a.ageGroup as Parameters<typeof saveAssessment>[0]["ageGroup"],
      childGender: a.childGender ?? "",
      result: a.scoring as ScreeningResult,
      ...(a.ai ? { ai: a.ai } : {}),
    });
  }
}

let running: Promise<void> | null = null;
let lastPull = 0;

/** To'liq sinxronlash. Internet bo'lmasa jim o'tadi — hodisalar navbatda qoladi. */
export function syncChild(childId: string, force = false): Promise<void> {
  if (running) return running;
  if (!force && Date.now() - lastPull < PULL_INTERVAL_MS) return flush(childId).catch(() => {});
  running = (async () => {
    try {
      importLegacy(childId);
      // Bu qurilmada topshirilgan, hali bolaga bog'lanmagan testlar akkauntga bog'lanadi
      const claim = (await listAssessments()).flatMap((a) => (a.serverId ? [a.serverId] : []));
      await flush(childId, claim);
      await pull(childId);
      lastPull = Date.now();
    } catch {
      // Tarmoq xatosi — keyingi safar qayta urinamiz
    } finally {
      running = null;
    }
  })();
  return running;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Ilova ichida: bola profili bor bo'lsa — ochilganda, qayta faollashganda va internet qaytganda sinxronlaydi. */
export function useActivitySync(childId: string | null | undefined) {
  useEffect(() => {
    if (!childId) return;
    syncChild(childId, true);

    // Yangi hodisa — 3 soniyadan keyin yuboriladi (bir nechta bosish bitta so'rovga yig'iladi)
    setOutboxListener((key) => {
      if (key !== childId) return;
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(() => flush(childId).catch(() => {}), 3000);
    });

    const onOnline = () => syncChild(childId, true);
    const onVisible = () => document.visibilityState === "visible" && syncChild(childId);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      setOutboxListener(() => {});
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [childId]);
}
