import { useSyncExternalStore } from 'react';

import { fetchActivity } from '@/lib/api';
import { createStore } from '@/lib/local-store';
import type { SkillsResult } from '@/shared/lib/screening-v3/score';
import { SKILLS_INTERVAL_DAYS } from '@/shared/lib/screening-v3/skills';

/** Oylik ko'nikmalar testi natijalari (bola bo'yicha). Serverga yuboriladi va yangi qurilmada tiklanadi. */
export type SkillsRecord = { id: string; serverId: string | null; createdAt: string; result: SkillsResult };

const store = createStore<Record<string, SkillsRecord[]>>('autizm_skills_v1', {}, (raw) => JSON.parse(raw) as Record<string, SkillsRecord[]>);
const EMPTY: SkillsRecord[] = [];

/** Eskisidan yangisiga */
export function useSkillsHistory(childKey: string) {
  return useSyncExternalStore(store.subscribe, store.get)[childKey] ?? EMPTY;
}

export function getSkillsHistory(childKey: string) {
  return store.get()[childKey] ?? EMPTY;
}

export function saveSkillsRecord(childKey: string, record: SkillsRecord) {
  const all = store.get();
  const list = (all[childKey] ?? []).filter((r) => r.id !== record.id);
  store.set({ ...all, [childKey]: [...list, record].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
}

/** Sinxronlash: server natijalari + serverga yetib bormagan mahalliy natijalar. */
export function replaceSkillsHistory(childKey: string, server: SkillsRecord[]) {
  const ids = new Set(server.map((r) => r.serverId));
  const localOnly = getSkillsHistory(childKey).filter((r) => !r.serverId || !ids.has(r.serverId));
  store.set({ ...store.get(), [childKey]: [...server, ...localOnly].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
}

/** Serverdagi ko'nikmalar testlarini qurilmaga tiklaydi (yangi qurilma yoki saytda topshirilgan testlar). */
export async function pullSkillsHistory(childId: string) {
  const data = await fetchActivity(childId);
  replaceSkillsHistory(
    childId,
    (data.skills ?? []).map((r) => ({ id: r.id, serverId: r.id, createdAt: r.createdAt, result: r.scoring as SkillsResult })),
  );
}

/** Keyingi ko'nikmalar testi qachon: oxirgisidan 4 hafta o'tib. Hali topshirilmagan bo'lsa — hozir. */
export function nextSkillsDue(history: SkillsRecord[], now = new Date()) {
  const last = history.at(-1);
  if (!last) return { due: true, date: now, first: true };
  const date = new Date(new Date(last.createdAt).getTime() + SKILLS_INTERVAL_DAYS * 86400000);
  return { due: date <= now, date, first: false };
}
