import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { QUESTIONS } from "@/lib/questions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ageBand = searchParams.get("ageBand");

  const dbCount = await prisma.question.count();
  let items: any[] = [];
  if (dbCount === 0) {
    items = QUESTIONS;
  } else {
    items = await prisma.question.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
  }

  if (ageBand) {
    items = items.filter((q) => Array.isArray(q.bands) && q.bands.includes(ageBand));
  }

  return NextResponse.json({ items });
}
