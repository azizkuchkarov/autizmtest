import { NextResponse } from "next/server";
import { z } from "zod";
import { parseLocale } from "@/lib/content";
import { prisma } from "@/lib/db";
import { PLAN_INCLUDE, toPublicPlan } from "@/lib/exercise-plans";
import { ownChild, requireUser, validationError } from "@/lib/mobile-api";

type Ctx = { params: Promise<{ childId: string }> };

const addSchema = z.object({
  videoId: z.string().uuid(),
  repsPerDay: z.number().int().min(1).max(10),
  days: z.number().int().min(1).max(60),
});

/** Bolaning video mashqlari. ?locale=uz|ru */
export async function GET(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const plans = await prisma.exercisePlan.findMany({ where: { childId }, include: PLAN_INCLUDE, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ plans: plans.map((p) => toPublicPlan(p, locale)) });
}

/** Mashqni qo'shadi; oldin bajarilgan bo'lsa, boshidan boshlanadi. */
export async function POST(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const parsed = addSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { videoId, repsPerDay, days } = parsed.data;

  const video = await prisma.video.findFirst({ where: { id: videoId, active: true, status: "ready", exerciseEnabled: true } });
  if (!video) return NextResponse.json({ error: "Bu video mashq uchun emas." }, { status: 400 });

  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const existing = await prisma.exercisePlan.findUnique({ where: { childId_videoId: { childId, videoId } } });
  if (existing) await prisma.exercisePlan.delete({ where: { id: existing.id } });
  const plan = await prisma.exercisePlan.create({ data: { childId, videoId, repsPerDay, days }, include: PLAN_INCLUDE });
  return NextResponse.json({ plan: toPublicPlan(plan, locale) }, { status: 201 });
}
