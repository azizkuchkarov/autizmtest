import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, validationError, videoSchema } from "@/lib/content-admin";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = videoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const category = await prisma.contentCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return NextResponse.json({ error: "Kategoriya topilmadi." }, { status: 404 });

  const video = await prisma.video.create({ data: parsed.data });
  return NextResponse.json({ video }, { status: 201 });
}
