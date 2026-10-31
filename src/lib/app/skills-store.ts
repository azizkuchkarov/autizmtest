"use client";

import { createLocalStore, useLocalStore } from "@/lib/app/local-store";
import { SKILLS_INTERVAL_DAYS } from "@/lib/screening-v3/skills";
import type { SkillsResult } from "@/lib/screening-v3/score";

/** Oylik ko'nikmalar testi natijalari (bola bo'yicha). Serverga yuboriladi va yangi qurilmada tiklanadi. */
export type SkillsRecord = { id: string; serverId: string | null; createdAt: string; result: SkillsResult };

const store = createLocalStore<Record<string, SkillsRecord[]>>("autizm_skills_v1", {}, (raw) => JSON.parse(raw) as Record<string, SkillsRecord[]>);
const EMPTY: SkillsRecord[] = [];

/** Eskisidan yangisiga */
export function useSkillsHistory(childKey: string) {
  return useLocalStore(store)[childKey] ?? EMPTY;
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

/** Keyingi ko'nikmalar testi qachon: oxirgisidan 4 hafta o'tib. Hali topshirilmagan bo'lsa — hozir. */
export function nextSkillsDue(history: SkillsRecord[], now = new Date()) {
  const last = history.at(-1);
  if (!last) return { due: true, date: now, first: true };
  const date = new Date(new Date(last.createdAt).getTime() + SKILLS_INTERVAL_DAYS * 86400000);
  return { due: date <= now, date, first: false };
}
