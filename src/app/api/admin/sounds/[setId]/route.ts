import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, soundSetSchema, validationError } from "@/lib/content-admin";

type Ctx = { params: Promise<{ setId: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { setId } = await params;

  const parsed = soundSetSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const set = await prisma.soundSet.update({ where: { id: setId }, data: parsed.data }).catch(() => null);
  if (!set) return NextResponse.json({ error: "To'plam topilmadi." }, { status: 404 });
  return NextResponse.json({ set });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { setId } = await params;

  const deleted = await prisma.soundSet.delete({ where: { id: setId } }).catch(() => null);
  if (!deleted) return NextResponse.json({ error: "To'plam topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
