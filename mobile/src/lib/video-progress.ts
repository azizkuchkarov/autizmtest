import { useSyncExternalStore } from 'react';

import { fetchVideoProgress, saveVideoProgress, type ContentCategory, type Profession, type Video } from '@/lib/api';
import { createStore } from '@/lib/local-store';

/** pos — qayerda to'xtagani (soniya); done — oxirigacha ko'rilgan; dirty — serverga hali yuborilmagan. */
export type VideoState = { pos: number; done: boolean; dirty?: boolean };
type Progress = Record<string, VideoState>;

/** Video shu qismi ko'rilganda "Ko'rildi" belgisi qo'yiladi (oxirgi titrlarni ko'rmaslik mumkin). */
const DONE_RATIO = 0.9;

const store = createStore<Progress>('autizm_video_progress_v1', {}, (raw) => JSON.parse(raw) as Progress);

export function useVideoProgress() {
  return useSyncExternalStore(store.subscribe, store.get);
}

export function getVideoState(videoId: string): VideoState | undefined {
  return store.get()[videoId];
}

/** To'xtagan joyni yozadi. Video shu chaqiruvda ko'rilgan bo'lsa true qaytaradi. */
export function recordPosition(videoId: string, positionSec: number, durationSec: number | null) {
  const all = store.get();
  const prev = all[videoId];
  const pos = Math.floor(positionSec);
  const reached = !!durationSec && positionSec / durationSec >= DONE_RATIO;
  const done = !!prev?.done || reached;
  const nextPos = done ? 0 : pos;
  if (prev && prev.pos === nextPos && prev.done === done) return false;
  store.set({ ...all, [videoId]: { pos: nextPos, done, dirty: true } });
  return done && !prev?.done;
}

/** Serverga yuborilmagan yozuvlarni yuboradi. Internet yoki sessiya bo'lmasa keyingi safarga qoladi. */
export async function flushVideoProgress() {
  const pending = Object.entries(store.get()).filter(([, v]) => v.dirty);
  if (pending.length === 0) return;
  try {
    await saveVideoProgress(pending.slice(0, 200).map(([videoId, v]) => ({ videoId, positionSec: v.pos, completed: v.done })));
  } catch {
    return;
  }
  const all = { ...store.get() };
  for (const [id, sent] of pending.slice(0, 200)) {
    // Yuborish paytida o'zgarmagan yozuvlargina tozalanadi
    if (all[id]?.pos === sent.pos && all[id]?.done === sent.done) all[id] = { pos: sent.pos, done: sent.done };
  }
  store.set(all);
}

/** Boshqa qurilmada ko'rilganlarni ham oladi. */
export async function syncVideoProgress() {
  await flushVideoProgress();
  try {
    const { items } = await fetchVideoProgress();
    const all = { ...store.get() };
    for (const item of items) {
      const local = all[item.videoId];
      if (local?.dirty) all[item.videoId] = { ...local, done: local.done || item.completed };
      else all[item.videoId] = { pos: item.completed ? 0 : item.positionSec, done: item.completed };
    }
    store.set(all);
  } catch {
    // Internet yoki sessiya yo'q: qurilmadagi holat ko'rsatiladi
  }
}

export function clearVideoProgress() {
  store.set({});
}

/** Keyingi ko'riladigan video: avval chala qolgani, bo'lmasa birinchi ko'rilmagani. */
export function nextVideo(videos: Video[], progress: Progress): Video | null {
  return videos.find((v) => !progress[v.id]?.done && (progress[v.id]?.pos ?? 0) > 0) ?? videos.find((v) => !progress[v.id]?.done) ?? null;
}

export type VideoSection = {
  slug: string;
  title: string;
  categories: ContentCategory[];
  videos: Video[];
  done: number;
  totalSec: number;
  next: Video | null;
};

/** Har bir yo'nalish — bo'lim; videosi yo'qlari "Tez orada" bo'lib ko'rsatiladi. */
export function buildSections(professions: Profession[], categories: ContentCategory[], progress: Progress): VideoSection[] {
  return professions.map((p) => {
    const own = categories.filter((c) => c.profession === p.slug && c.videos.length > 0);
    const videos = own.flatMap((c) => c.videos);
    return {
      slug: p.slug,
      title: p.title,
      categories: own,
      videos,
      done: videos.filter((v) => progress[v.id]?.done).length,
      totalSec: videos.reduce((n, v) => n + (v.durationSec ?? 0), 0),
      next: nextVideo(videos, progress),
    };
  });
}
