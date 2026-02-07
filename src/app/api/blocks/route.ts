import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BLOCKS } from "@/lib/questions";

export async function GET() {
  const dbCount = await prisma.block.count();
  if (dbCount === 0) {
    return NextResponse.json({
      items: BLOCKS.map((b, idx) => ({
        id: b.id,
        titleUz: b.title,
        subtitleUz: b.subtitle,
        titleRu: b.title,
        subtitleRu: b.subtitle,
        order: idx,
      })),
    });
  }
  const items = await prisma.block.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  return NextResponse.json({ items });
}
