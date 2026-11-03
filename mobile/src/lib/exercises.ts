import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { addExercisePlan, deleteExercisePlan, fetchExercisePlans, logExercise, type ExercisePlan } from '@/lib/api';
import type { Locale } from '@/shared/lib/locale';
import { dayKey } from '@/shared/data/play-activities';

/** Bola uchun video mashqlar: bir nechta ekran bir xil ro'yxatni ko'radi. */
let state: { childId: string | null; plans: ExercisePlan[] | null } = { childId: null, plans: null };
const listeners = new Set<() => void>();
function set(next: Partial<typeof state>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function replace(plan: ExercisePlan) {
  const others = (state.plans ?? []).filter((p) => p.id !== plan.id && p.videoId !== plan.videoId);
  set({ plans: [...others, plan] });
}

export function planProgress(plan: ExercisePlan, day = dayKey()) {
  const today = plan.log[day] ?? 0;
  const doneDays = Object.values(plan.log).filter((n) => n >= plan.repsPerDay).length;
  return {
    today,
    doneDays,
    /** Bugungi soni to'lgan */
    doneToday: today >= plan.repsPerDay,
    finished: !!plan.completedAt,
    /** Hozir nechanchi kun */
    currentDay: Math.min(plan.days, doneDays + (today >= plan.repsPerDay ? 0 : 1)),
  };
}

export function useExercisePlans(childId: string | null | undefined, locale: Locale) {
  const snap = useSyncExternalStore(subscribe, () => state);

  const reload = useCallback(async () => {
    if (!childId) return;
    const { plans } = await fetchExercisePlans(childId, locale);
    set({ childId, plans });
  }, [childId, locale]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const plans = snap.childId === childId ? snap.plans : null;

  const add = useCallback(
    async (videoId: string, repsPerDay: number, days: number) => {
      if (!childId) return;
      const { plan } = await addExercisePlan(childId, { videoId, repsPerDay, days }, locale);
      replace(plan);
    },
    [childId, locale],
  );

  const log = useCallback(
    async (planId: string, delta: 1 | -1) => {
      if (!childId) return;
      const { plan } = await logExercise(childId, planId, dayKey(), delta, locale);
      replace(plan);
    },
    [childId, locale],
  );

  const remove = useCallback(
    async (planId: string) => {
      if (!childId) return;
      await deleteExercisePlan(childId, planId);
      set({ plans: (state.plans ?? []).filter((p) => p.id !== planId) });
    },
    [childId],
  );

  return { plans, reload, add, log, remove };
}
