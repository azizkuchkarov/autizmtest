import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, soundCardSchema, validationError } from "@/lib/content-admin";

type Ctx = { params: Promise<{ cardId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { cardId } = await params;

  const parsed = soundCardSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const card = await prisma.soundCard.update({ where: { id: cardId }, data: parsed.data }).catch(() => null);
  if (!card) return NextResponse.json({ error: "Ovoz topilmadi." }, { status: 404 });
  return NextResponse.json({ card });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { cardId } = await params;

  const deleted = await prisma.soundCard.delete({ where: { id: cardId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "Ovoz topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
