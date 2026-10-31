import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseLocale, toPublicVideo } from "@/lib/content";

export async function GET(req: Request, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const locale = parseLocale(new URL(req.url).searchParams.get("locale"));

  const video = await prisma.video.findFirst({
    where: { id: videoId, active: true, status: "ready", category: { active: true, profession: { active: true } } },
  });
  if (!video) {
    return NextResponse.json({ error: "Video topilmadi." }, { status: 404 });
  }
  return NextResponse.json({ video: toPublicVideo(video, locale) });
}
