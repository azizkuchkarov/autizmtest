import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, soundCardSchema, validationError } from "@/lib/content-admin";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = soundCardSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const set = await prisma.soundSet.findUnique({ where: { id: parsed.data.setId } });
  if (!set) return NextResponse.json({ error: "To'plam topilmadi." }, { status: 404 });

  const card = await prisma.soundCard.create({ data: parsed.data });
  return NextResponse.json({ card }, { status: 201 });
}
