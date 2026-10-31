import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { isPlaceholderAiPayload } from "@/lib/ai-summary";
import { prisma } from "@/lib/db";
import { ownChild, requireUser, validationError } from "@/lib/mobile-api";

/*
 * Mashg'ulotlar tarixini sinxronlash: qurilma hodisalarni yuboradi (POST), yangi qurilma esa butun tarixni oladi (GET).
 * Hodisa id lari qurilmada yaratiladi — qayta yuborilsa ikki marta yozilmaydi.
 */

type Ctx = { params: Promise<{ childId: string }> };

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.string().min(8).max(64);
const at = z.number().int().positive();

const eventSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("sound"),
    id,
    cardId: z.string().max(64).nullable(),
    level: z.number().int().min(1).max(4),
    result: z.enum(["ok", "help", "miss"]),
    day,
    at,
    snapshot: z.boolean().optional(),
  }),
  z.object({ kind: z.literal("play"), id, activityId: z.string().min(1).max(64), rating: z.enum(["great", "ok", "hard"]), day, at }),
  z.object({
    kind: z.literal("aac"),
    id,
    day,
    taps: z.number().int().min(0).max(100000),
    sentences: z.number().int().min(0).max(100000),
    sentenceWords: z.number().int().min(0).max(1000000),
    cards: z.record(z.string().max(80), z.number().int().min(0).max(100000)),
  }),
]);

const bodySchema = z.object({
  events: z.array(eventSchema).max(2000),
  /** Bu qurilmada topshirilgan, lekin hali bolaga bog'lanmagan test natijalari (server id lari) */
  claimAssessments: z.array(z.string().uuid()).max(200).optional(),
});

export async function GET(_req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const [sound, play, aac, assessments, skills] = await Promise.all([
    prisma.soundAnswer.findMany({ where: { childId }, orderBy: { at: "asc" }, take: 10000 }),
    prisma.playSession.findMany({ where: { childId }, orderBy: { at: "asc" }, take: 5000 }),
    prisma.aacDay.findMany({ where: { childId }, orderBy: { day: "asc" } }),
    prisma.assessment.findMany({ where: { childId, testType: "screening" }, orderBy: { createdAt: "asc" } }),
    prisma.assessment.findMany({ where: { childId, testType: "skills" }, orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({
    sound: sound.map((s) => ({ id: s.id, cardId: s.cardId, level: s.level, result: s.result, day: s.day, at: s.at.getTime(), snapshot: s.snapshot })),
    play: play.map((p) => ({ id: p.id, activityId: p.activityId, rating: p.rating, day: p.day, at: p.at.getTime() })),
    aac: aac.map((a) => ({ day: a.day, taps: a.taps, sentences: a.sentences, sentenceWords: a.sentenceWords, cards: a.cards })),
    assessments: assessments.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      ageGroup: a.ageGroup,
      childGender: a.childGender,
      scoring: a.scoring,
      ai: a.aiSummaryStatus === "ready" && a.aiSummaryPayload && a.aiSummaryLocale && !isPlaceholderAiPayload(a.aiSummaryPayload) ? { locale: a.aiSummaryLocale, payload: a.aiSummaryPayload } : null,
    })),
    skills: skills.map((a) => ({ id: a.id, createdAt: a.createdAt.toISOString(), scoring: a.scoring })),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { events, claimAssessments } = parsed.data;

  const sound = events.flatMap((e) => (e.kind === "sound" ? [e] : []));
  const play = events.flatMap((e) => (e.kind === "play" ? [e] : []));
  const aac = events.flatMap((e) => (e.kind === "aac" ? [e] : []));

  if (sound.length)
    await prisma.soundAnswer.createMany({
      data: sound.map((e) => ({ id: e.id, childId, cardId: e.cardId, level: e.level, result: e.result, day: e.day, at: new Date(e.at), snapshot: e.snapshot ?? false })),
      skipDuplicates: true,
    });
  if (play.length)
    await prisma.playSession.createMany({
      data: play.map((e) => ({ id: e.id, childId, activityId: e.activityId, rating: e.rating, day: e.day, at: new Date(e.at) })),
      skipDuplicates: true,
    });

  // AAC — kunlik yig'indiga qo'shiladi; kvitansiya bir hodisani ikki marta qo'shishga yo'l qo'ymaydi
  for (const e of aac) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.syncReceipt.create({ data: { id: e.id, childId } });
        const current = await tx.aacDay.findUnique({ where: { childId_day: { childId, day: e.day } } });
        const cards = { ...((current?.cards as Record<string, number> | undefined) ?? {}) };
        for (const [cardId, n] of Object.entries(e.cards)) cards[cardId] = (cards[cardId] ?? 0) + n;
        await tx.aacDay.upsert({
          where: { childId_day: { childId, day: e.day } },
          create: { childId, day: e.day, taps: e.taps, sentences: e.sentences, sentenceWords: e.sentenceWords, cards },
          update: { taps: { increment: e.taps }, sentences: { increment: e.sentences }, sentenceWords: { increment: e.sentenceWords }, cards },
        });
      });
    } catch (err) {
      // Kvitansiya allaqachon bor — bu hodisa avval qabul qilingan
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }

  if (claimAssessments?.length) {
    await prisma.assessment.updateMany({ where: { id: { in: claimAssessments }, childId: null }, data: { childId } });
  }

  return NextResponse.json({ ok: true, accepted: events.map((e) => e.id) });
}
