import { NextResponse } from "next/server";
import { parseLocale, toPublicVideo } from "@/lib/content";
import { prisma } from "@/lib/db";
import { getLessonAccess } from "@/lib/lesson-access";

/** Mashq uchun belgilangan videolar: birinchi belgilangani birinchi. ?locale=uz|ru */
export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const [videos, access] = await Promise.all([
    prisma.video.findMany({
      // Pleyer (/api/content/videos/[id]) bilan bir xil filtr: yopiq mavzu yoki yo'nalishdagi video ro'yxatda ham chiqmaydi
      where: { exerciseEnabled: true, active: true, status: "ready", category: { active: true, profession: { active: true } } },
      include: { category: { select: { kind: true } } },
      orderBy: [{ exerciseMarkedAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    getLessonAccess(),
  ]);
  // Pullik dars mavzusidagi video Darslar yopiq bo'lsa mashqlarda ham havolasiz qaytadi (pleyer ham shunday qiladi)
  return NextResponse.json(
    { videos: videos.map((v) => toPublicVideo(v, locale, access.locked && v.category.kind === "lesson")) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
