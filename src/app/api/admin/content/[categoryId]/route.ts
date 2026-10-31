import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { categorySchema, requireAdmin, validationError } from "@/lib/content-admin";

type Ctx = { params: Promise<{ categoryId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { categoryId } = await params;

  const parsed = categorySchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  if (parsed.data.professionId && !(await prisma.profession.findUnique({ where: { id: parsed.data.professionId } }))) {
    return NextResponse.json({ error: "Yo'nalish topilmadi." }, { status: 404 });
  }

  const category = await prisma.contentCategory.update({ where: { id: categoryId }, data: parsed.data }).catch(() => null);
  if (!category) return NextResponse.json({ error: "Kategoriya topilmadi." }, { status: 404 });
  return NextResponse.json({ category });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { categoryId } = await params;

  const deleted = await prisma.contentCategory.delete({ where: { id: categoryId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Kategoriya topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
