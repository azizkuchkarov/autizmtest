import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { addExercisePlan, deleteExercisePlan, fetchExercisePlans, fetchExerciseVideos, logExercise, type ExercisePlan, type Video } from '@/lib/api';
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

/** Bitta mashq: necha marta bajarilishi kerak va nechtasi bajarildi (kunlik me'yordan ortig'i sanalmaydi). */
export function planTotals(plan: ExercisePlan) {
  const total = plan.repsPerDay * plan.days;
  const done = Object.values(plan.log).reduce((n, c) => n + Math.min(c, plan.repsPerDay), 0);
  return { total, done: Math.min(done, total) };
}

/** Video mashqlar bo'yicha umumiy: boshlanmaganlari mutaxassis tavsiyasi bilan sanaladi. */
export function exerciseTotals(videos: Video[], plans: ExercisePlan[]) {
  const known = new Set(videos.map((v) => v.id));
  const fromPlans = plans.map(planTotals);
  const planned = new Set(plans.map((p) => p.videoId));
  const waiting = videos.filter((v) => !planned.has(v.id)).reduce((n, v) => n + (v.exercise ? v.exercise.reps * v.exercise.days : 0), 0);
  return {
    videos: known.size + plans.filter((p) => !known.has(p.videoId)).length,
    total: waiting + fromPlans.reduce((n, p) => n + p.total, 0),
    done: fromPlans.reduce((n, p) => n + p.done, 0),
  };
}

/** Admin mashq uchun belgilagan videolar, belgilangan tartibda. null — yuklanmoqda. */
export function useExerciseVideos(locale: Locale) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setError(false);
    try {
      setVideos((await fetchExerciseVideos(locale)).videos);
    } catch {
      setError(true);
    }
  }, [locale]);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { videos, error, reload };
}
