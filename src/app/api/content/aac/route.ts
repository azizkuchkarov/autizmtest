import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLocale, toPublicAacCategory } from "@/lib/content";

/** Rasmli muloqot: faol bo'limlar va kartalar. ?locale=uz|ru */
export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));

  const categories = await prisma.aacCategory.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: { cards: { where: { active: true }, orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ categories: categories.map((c) => toPublicAacCategory(c, locale)) });
}
