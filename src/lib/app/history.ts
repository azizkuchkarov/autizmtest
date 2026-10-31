/* Test natijalari brauzerda saqlanadi (mobil ilovadagi AsyncStorage o'rniga localStorage) va akkauntga sinxronlanadi. */
import { useSyncExternalStore } from "react";

import type { AiSummaryPayload } from "@/lib/app/api";
import type { AgeGroupId, ScreeningResult } from "@/lib/app/screening";

const STORAGE_KEY = "autizm_assessments_v1";

/** Ro'yxat o'zgarganda (masalan, boshqa qurilmadagi test sinxronlanganda) sahifalar qayta o'qishi uchun. */
let version = 0;
const listeners = new Set<() => void>();
function changed() {
  version++;
  listeners.forEach((l) => l());
}

export function useAssessmentsVersion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0,
  );
}

export type StoredAssessment = {
  id: string;
  /** Serverdagi assessment ID (AI xulosa uchun). Internet bo'lmasa null. */
  serverId: string | null;
  createdAt: string;
  ageGroup: AgeGroupId;
  childGender: string;
  result: ScreeningResult;
  ai?: { locale: string; payload: AiSummaryPayload };
};

function read(): StoredAssessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAssessment[]) : [];
  } catch {
    return [];
  }
}

export async function listAssessments(): Promise<StoredAssessment[]> {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAssessment(id: string): Promise<StoredAssessment | null> {
  return read().find((a) => a.id === id) ?? null;
}

export async function saveAssessment(item: StoredAssessment): Promise<void> {
  const next = [item, ...read().filter((a) => a.id !== item.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  changed();
}

export async function clearAssessments(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  changed();
}

export function newLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
