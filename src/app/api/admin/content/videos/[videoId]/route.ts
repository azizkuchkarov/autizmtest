import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, validationError, videoSchema } from "@/lib/content-admin";

type Ctx = { params: Promise<{ videoId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { videoId } = await params;

  const parsed = videoSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const video = await prisma.video.update({ where: { id: videoId }, data: parsed.data }).catch(() => null);
  if (!video) return NextResponse.json({ error: "Video topilmadi." }, { status: 404 });
  return NextResponse.json({ video });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { videoId } = await params;

  const deleted = await prisma.video.delete({ where: { id: videoId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Video topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
