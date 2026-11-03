import { NextResponse } from "next/server";
import { z } from "zod";
import { parseLocale } from "@/lib/content";
import { prisma } from "@/lib/db";
import { PLAN_INCLUDE, refreshCompletion, toPublicPlan } from "@/lib/exercise-plans";
import { ownChild, requireUser, validationError } from "@/lib/mobile-api";

type Ctx = { params: Promise<{ childId: string; planId: string }> };

const schema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** 1 — "Bajardim", -1 — "Bekor qilish" */
  delta: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId, planId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { day, delta } = parsed.data;

  const plan = await prisma.exercisePlan.findFirst({ where: { id: planId, childId } });
  if (!plan) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const current = await prisma.exerciseDayLog.findUnique({ where: { planId_day: { planId, day } } });
  const count = Math.max(0, Math.min(plan.repsPerDay, (current?.count ?? 0) + delta));
  await prisma.exerciseDayLog.upsert({ where: { planId_day: { planId, day } }, create: { planId, day, count }, update: { count } });
  await refreshCompletion(planId);

  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const full = await prisma.exercisePlan.findUniqueOrThrow({ where: { id: planId }, include: PLAN_INCLUDE });
  return NextResponse.json({ plan: toPublicPlan(full, locale) });
}
