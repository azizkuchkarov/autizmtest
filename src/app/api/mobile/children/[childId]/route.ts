import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { childSchema, requireUser, toPublicChild, validationError } from "@/lib/mobile-api";

type Ctx = { params: Promise<{ childId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;

  const parsed = childSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  // Faqat o'z bolasini tahrirlay oladi
  const updated = await prisma.child.updateMany({ where: { id: childId, userId: user.id }, data: parsed.data });
  if (updated.count === 0) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  return NextResponse.json({ child: toPublicChild(child) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId } = await params;

  const deleted = await prisma.child.deleteMany({ where: { id: childId, userId: user.id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
