import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BLOCKS } from "@/lib/questions";

export async function GET() {
  const dbCount = await prisma.block.count();
  if (dbCount === 0) {
    const items = BLOCKS.map((b, idx) => ({
      id: b.id,
      titleUz: b.title,
      subtitleUz: b.subtitle,
      titleRu: b.title,
      subtitleRu: b.subtitle,
      order: idx,
      active: true,
    }));
    return NextResponse.json({ items });
  }
  const items = await prisma.block.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body?.items) ? body.items : [];

  const tx = items.map((b: any, idx: number) =>
    prisma.block.upsert({
      where: { id: String(b.id) },
      create: {
        id: String(b.id),
        titleUz: String(b.titleUz ?? ""),
        subtitleUz: String(b.subtitleUz ?? ""),
        titleRu: String(b.titleRu ?? b.titleUz ?? ""),
        subtitleRu: String(b.subtitleRu ?? b.subtitleUz ?? ""),
        order: Number.isFinite(b.order) ? b.order : idx,
        active: b.active !== false,
      },
      update: {
        titleUz: String(b.titleUz ?? ""),
        subtitleUz: String(b.subtitleUz ?? ""),
        titleRu: String(b.titleRu ?? b.titleUz ?? ""),
        subtitleRu: String(b.subtitleRu ?? b.subtitleUz ?? ""),
        order: Number.isFinite(b.order) ? b.order : idx,
        active: b.active !== false,
      },
    })
  );
  await prisma.$transaction(tx);
  return NextResponse.json({ ok: true });
}
