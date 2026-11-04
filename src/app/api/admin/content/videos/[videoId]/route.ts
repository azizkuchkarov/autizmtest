import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, validationError, videoFieldsSchema } from "@/lib/content-admin";
import { incomingFile, removeOwnMedia } from "@/lib/video-files";

type Ctx = { params: Promise<{ videoId: string }> };

const patchSchema = videoFieldsSchema.partial().extend({ uploadId: videoFieldsSchema.shape.uploadId });

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { videoId } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const { uploadId, ...data } = parsed.data;

  // Yangi fayl: eski video tayyor yangisi siqilguncha ko'rinib turadi (worker sourceFile bo'yicha ishlaydi)
  const sourceFile = uploadId ? incomingFile(uploadId) : null;
  if (uploadId && !sourceFile) return NextResponse.json({ error: "Yuklangan fayl topilmadi. Qayta yuklang." }, { status: 400 });

  // Mashq belgisi qo'yilgan payt saqlanadi: Mashqlarda videolar shu tartibda chiqadi
  const before = await prisma.video.findUnique({ where: { id: videoId }, select: { exerciseEnabled: true } });
  const marked =
    data.exerciseEnabled === true && !before?.exerciseEnabled
      ? { exerciseMarkedAt: new Date() }
      : data.exerciseEnabled === false
        ? { exerciseMarkedAt: null }
        : {};

  const video = await prisma.video
    .update({ where: { id: videoId }, data: { ...data, ...marked, ...(sourceFile ? { sourceFile, processError: null } : {}) } })
    .catch(() => null);
  if (!video) return NextResponse.json({ error: "Video topilmadi." }, { status: 404 });
  return NextResponse.json({ video });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { videoId } = await params;

  const deleted = await prisma.video.delete({ where: { id: videoId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Video topilmadi." }, { status: 404 });
  // Server o'zi yaratgan fayllar ham o'chiriladi (eski qo'lda yuklanganlarga tegilmaydi)
  await Promise.all([removeOwnMedia(deleted.videoUrl), removeOwnMedia(deleted.thumbnailUrl), removeOwnMedia(deleted.sourceFile)]);
  return NextResponse.json({ ok: true });
}
