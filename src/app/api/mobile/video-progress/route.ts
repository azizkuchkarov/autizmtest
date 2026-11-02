import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/mobile-api";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        videoId: z.string().min(1).max(64),
        positionSec: z.number().int().min(0).max(86400),
        completed: z.boolean(),
      }),
    )
    .max(200),
});

/** Ota-onaning video ko'rish holati: telefon almashsa ham "Ko'rildi" belgilari saqlanadi. */
export async function GET() {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const rows = await prisma.videoWatch.findMany({ where: { userId: user.id } });
  return NextResponse.json({
    items: rows.map((r) => ({ videoId: r.videoId, positionSec: r.positionSec, completed: r.completedAt !== null })),
  });
}

export async function POST(req: Request) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Noto'g'ri ma'lumot." }, { status: 400 });

  // O'chirilgan videolar uchun kelgan yozuvlar e'tiborsiz qoldiriladi
  const ids = parsed.data.items.map((i) => i.videoId);
  const existing = await prisma.video.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const known = new Set(existing.map((v) => v.id));
  const now = new Date();

  await prisma.$transaction(
    parsed.data.items
      .filter((i) => known.has(i.videoId))
      .map((i) =>
        prisma.videoWatch.upsert({
          where: { userId_videoId: { userId: user.id, videoId: i.videoId } },
          create: { userId: user.id, videoId: i.videoId, positionSec: i.positionSec, completedAt: i.completed ? now : null },
          // "Ko'rildi" belgisi qayta ko'rilganda ham yo'qolmaydi
          update: { positionSec: i.positionSec, ...(i.completed ? { completedAt: now } : {}) },
        }),
      ),
  );
  return NextResponse.json({ ok: true });
}
