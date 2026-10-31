import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { professionSchema, requireAdmin, validationError } from "@/lib/content-admin";

type Ctx = { params: Promise<{ professionId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { professionId } = await params;

  const parsed = professionSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const profession = await prisma.profession.update({ where: { id: professionId }, data: parsed.data }).catch(() => null);
  if (!profession) return NextResponse.json({ error: "Yo'nalish topilmadi." }, { status: 404 });
  return NextResponse.json({ profession });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { professionId } = await params;

  const topics = await prisma.contentCategory.count({ where: { professionId } });
  if (topics > 0) {
    return NextResponse.json({ error: `Bu yo'nalishda ${topics} ta mavzu bor — avval ularni o'chiring yoki ko'chiring.` }, { status: 409 });
  }
  const deleted = await prisma.profession.delete({ where: { id: professionId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Yo'nalish topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
