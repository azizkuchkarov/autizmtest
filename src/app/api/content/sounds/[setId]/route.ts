import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLocale, toPublicSoundSet } from "@/lib/content";

export async function GET(req: Request, { params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));

  const set = await prisma.soundSet.findFirst({
    where: { id: setId, active: true },
    include: { cards: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  if (!set || set.cards.length === 0) {
    return NextResponse.json({ error: "Ovozlar topilmadi." }, { status: 404 });
  }
  return NextResponse.json({ set: toPublicSoundSet(set, locale) });
}
