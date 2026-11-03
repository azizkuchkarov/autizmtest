import type { ExerciseDayLog, ExercisePlan, Video } from "@prisma/client";
import { toPublicVideo } from "@/lib/content";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/locale";

export const PLAN_INCLUDE = { video: true, log: true } as const;

type FullPlan = ExercisePlan & { video: Video; log: ExerciseDayLog[] };

export function toPublicPlan(p: FullPlan, locale: Locale) {
  return {
    id: p.id,
    videoId: p.videoId,
    repsPerDay: p.repsPerDay,
    days: p.days,
    createdAt: p.createdAt.toISOString(),
    completedAt: p.completedAt?.toISOString() ?? null,
    video: toPublicVideo(p.video, locale),
    log: Object.fromEntries(p.log.map((l) => [l.day, l.count])),
  };
}

/** Faqat to'liq bajarilgan kunlar sanaladi; yetarli bo'lsa mashq yakunlanadi. */
export async function refreshCompletion(planId: string) {
  const plan = await prisma.exercisePlan.findUniqueOrThrow({ where: { id: planId }, include: { log: true } });
  const doneDays = plan.log.filter((l) => l.count >= plan.repsPerDay).length;
  const finished = doneDays >= plan.days;
  if (finished === !!plan.completedAt) return;
  await prisma.exercisePlan.update({ where: { id: planId }, data: { completedAt: finished ? new Date() : null } });
}
