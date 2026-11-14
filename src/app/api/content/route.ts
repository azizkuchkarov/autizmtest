import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContentKind, parseLocale, toPublicCategory, toPublicProfession } from "@/lib/content";
import { getLessonAccess } from "@/lib/lesson-access";

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
      // Bo'sh yo'nalishlar ham qaytariladi: ilovada "Tez orada" bo'lib ko'rinadi
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.contentCategory.findMany({
      where: { kind, active: true, profession: { active: true, ...(profession ? { slug: profession } : {}) } },
      orderBy: [{ profession: { order: "asc" } }, { order: "asc" }],
      include: { profession: true, videos: { where: { active: true, status: "ready" }, orderBy: { order: "asc" } } },
    }),
  ]);

  // Darslar oylik to'lov bilan: kirish yo'q bo'lsa video havolalari berilmaydi (ro'yxat va nomlar ko'rinadi)
  const locked = kind === "lesson" && (await getLessonAccess()).locked;

  return NextResponse.json(
    {
      professions: professions.map((p) => toPublicProfession(p, locale)),
      categories: categories.map((c) => toPublicCategory(c, locale, locked)),
      locked,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
