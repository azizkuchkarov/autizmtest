import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContentKind, parseLocale, toPublicCategory, toPublicProfession } from "@/lib/content";

/** Faol mavzular va videolar. ?kind=lesson|exercise&locale=uz|ru&profession=<slug> (ixtiyoriy) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  const locale = parseLocale(searchParams.get("locale"));
  const profession = searchParams.get("profession");

  if (!isContentKind(kind)) {
    return NextResponse.json({ error: "kind=lesson yoki kind=exercise bo'lishi kerak." }, { status: 400 });
  }

  const [professions, categories] = await Promise.all([
    prisma.profession.findMany({
      where: { active: true, categories: { some: { kind, active: true, videos: { some: { active: true } } } } },
      orderBy: { order: "asc" },
    }),
    prisma.contentCategory.findMany({
      where: { kind, active: true, profession: { active: true, ...(profession ? { slug: profession } : {}) } },
      orderBy: [{ profession: { order: "asc" } }, { order: "asc" }],
      include: { profession: true, videos: { where: { active: true }, orderBy: { order: "asc" } } },
    }),
  ]);

  return NextResponse.json({
    professions: professions.map((p) => toPublicProfession(p, locale)),
    categories: categories.map((c) => toPublicCategory(c, locale)),
  });
}
