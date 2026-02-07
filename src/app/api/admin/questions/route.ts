import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { QUESTIONS } from "@/lib/questions";

export async function GET() {
  const dbCount = await prisma.question.count();
  if (dbCount === 0) return NextResponse.json({ items: QUESTIONS });

  const items = await prisma.question.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const tx = items.map((q: any, idx: number) =>
    prisma.question.upsert({
      where: { id: String(q.id) },
      create: {
        id: String(q.id),
        block: String(q.block),
        text: String(q.text ?? ""),
        example: String(q.example ?? ""),
        explain: String(q.explain ?? ""),
        bands: Array.isArray(q.bands) ? q.bands.map(String) : [],
        direction: String(q.direction ?? "positive"),
        isCoreFlag: Boolean(q.isCoreFlag),
        isRedFlag: Boolean(q.isRedFlag),
        order: Number.isFinite(q.order) ? q.order : idx,
        active: q.active !== false,
      },
      update: {
        block: String(q.block),
        text: String(q.text ?? ""),
        example: String(q.example ?? ""),
        explain: String(q.explain ?? ""),
        bands: Array.isArray(q.bands) ? q.bands.map(String) : [],
        direction: String(q.direction ?? "positive"),
        isCoreFlag: Boolean(q.isCoreFlag),
        isRedFlag: Boolean(q.isRedFlag),
        order: Number.isFinite(q.order) ? q.order : idx,
        active: q.active !== false,
      },
    })
  );
  await prisma.$transaction(tx);
  return NextResponse.json({ ok: true });
}
