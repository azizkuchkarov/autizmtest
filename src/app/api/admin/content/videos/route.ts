import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, validationError, videoSchema } from "@/lib/content-admin";
import { incomingFile } from "@/lib/video-files";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = videoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { uploadId, ...data } = parsed.data;

  const category = await prisma.contentCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) return NextResponse.json({ error: "Kategoriya topilmadi." }, { status: 404 });

  // Fayl yuklangan bo'lsa — server siqib bo'lguncha video "tayyorlanmoqda" holatida, foydalanuvchilarga ko'rinmaydi
  const sourceFile = uploadId ? incomingFile(uploadId) : null;
  if (uploadId && !sourceFile) return NextResponse.json({ error: "Yuklangan fayl topilmadi. Qayta yuklang." }, { status: 400 });
  if (!sourceFile && !data.videoUrl) return NextResponse.json({ error: "Video faylni yuklang." }, { status: 400 });

  const video = await prisma.video.create({
    data: { ...data, ...(data.exerciseEnabled ? { exerciseMarkedAt: new Date() } : {}), ...(sourceFile ? { sourceFile, status: "processing", videoUrl: "" } : { status: "ready" }) },
  });
  return NextResponse.json({ video }, { status: 201 });
}
