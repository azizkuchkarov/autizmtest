import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aacCategorySchema, requireAdmin, validationError } from "@/lib/content-admin";

type Ctx = { params: Promise<{ categoryId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { categoryId } = await params;

  const parsed = aacCategorySchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const category = await prisma.aacCategory.update({ where: { id: categoryId }, data: parsed.data }).catch(() => null);
  if (!category) return NextResponse.json({ error: "Bo'lim topilmadi." }, { status: 404 });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { categoryId } = await params;

  const deleted = await prisma.aacCategory.delete({ where: { id: categoryId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Bo'lim topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
