"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { fetchLessonAccess, type LessonAccess } from "@/lib/app/api";

/*
 * Darslar bo'limiga oylik kirish holati: bitta umumiy nusxa, barcha ekranlar bir xil ko'radi.
 * To'lovdan keyin refreshLessonAccess() — hamma joy yangilanadi.
 */

let current: LessonAccess | null = null;
let inflight: Promise<LessonAccess | null> | null = null;
const listeners = new Set<() => void>();

function set(next: LessonAccess | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function refreshLessonAccess(): Promise<LessonAccess | null> {
  inflight ??= fetchLessonAccess()
    .then((a) => {
      set(a);
      return a;
    })
    .catch(() => current)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** null — hali yuklanmagan. */
/** refreshOnMount=false — faqat kuzatadi (masalan, kontent ro'yxati kirish ochilganda qayta yuklanishi uchun). */
export function useLessonAccess(refreshOnMount = true) {
  const access = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
  useEffect(() => {
    // Har safar ekran ochilganda yangilanadi: kirish/chiqish yoki boshqa qurilmada to'lov
    if (refreshOnMount || !current) void refreshLessonAccess();
  }, [refreshOnMount]);
  const refresh = useCallback(() => refreshLessonAccess(), []);
  return { access, refresh };
}
