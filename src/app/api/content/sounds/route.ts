import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLocale, toPublicSoundSet } from "@/lib/content";

/** Faol ovoz to'plamlari va ularning ovozlari. ?locale=uz|ru */
export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));

  const sets = await prisma.soundSet.findMany({
    where: { active: true, cards: { some: { active: true } } },
    orderBy: { order: "asc" },
    include: { cards: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ sets: sets.map((s) => toPublicSoundSet(s, locale)) });
}
