import type { ExerciseDayLog, ExercisePlan, Prisma, Video } from "@prisma/client";
import { toPublicVideo } from "@/lib/content";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/locale";

/** Video mavzusining turi ham olinadi: pullik "lesson" mavzusidagi video darslar yopiq bo'lsa, mashqda ham yopiq */
export const PLAN_INCLUDE = { video: { include: { category: { select: { kind: true } } } }, log: true } as const;

type FullPlan = ExercisePlan & { video: Video & { category: { kind: string } }; log: ExerciseDayLog[] };

/** lessonsLocked — getLessonAccess().locked: /api/content/videos/[id] (pleyer) bilan bir xil qoida */
export function toPublicPlan(p: FullPlan, locale: Locale, lessonsLocked = false) {
  return {
    id: p.id,
    videoId: p.videoId,
    repsPerDay: p.repsPerDay,
    days: p.days,
    createdAt: p.createdAt.toISOString(),
    completedAt: p.completedAt?.toISOString() ?? null,
    video: toPublicVideo(p.video, locale, lessonsLocked && p.video.category.kind === "lesson"),
    log: Object.fromEntries(p.log.map((l) => [l.day, l.count])),
  };
}

/** Faqat to'liq bajarilgan kunlar sanaladi; yetarli bo'lsa mashq yakunlanadi. Tranzaksiya ichida tx beriladi. */
export async function refreshCompletion(planId: string, db: Prisma.TransactionClient = prisma) {
  const plan = await db.exercisePlan.findUniqueOrThrow({ where: { id: planId }, include: { log: true } });
  const doneDays = plan.log.filter((l) => l.count >= plan.repsPerDay).length;
  const finished = doneDays >= plan.days;
  if (finished === !!plan.completedAt) return;
  await db.exercisePlan.update({ where: { id: planId }, data: { completedAt: finished ? new Date() : null } });
}
