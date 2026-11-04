import { NextResponse } from "next/server";
import { parseLocale, toPublicVideo } from "@/lib/content";
import { prisma } from "@/lib/db";

/** Mashq uchun belgilangan videolar: birinchi belgilangani birinchi. ?locale=uz|ru */
export async function GET(req: Request) {
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));
  const videos = await prisma.video.findMany({
    where: { exerciseEnabled: true, active: true, status: "ready" },
    orderBy: [{ exerciseMarkedAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
  });
  return NextResponse.json({ videos: videos.map((v) => toPublicVideo(v, locale)) });
}
