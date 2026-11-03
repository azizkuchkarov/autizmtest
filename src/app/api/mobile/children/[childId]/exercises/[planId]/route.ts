import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ownChild, requireUser } from "@/lib/mobile-api";

type Ctx = { params: Promise<{ childId: string; planId: string }> };

/** Mashqni ro'yxatdan olib tashlaydi (bajarilgan kunlar ham o'chadi). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, denied } = await requireUser();
  if (denied) return denied;
  const { childId, planId } = await params;
  if (!(await ownChild(user.id, childId))) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });

  const res = await prisma.exercisePlan.deleteMany({ where: { id: planId, childId } });
  if (res.count === 0) return NextResponse.json({ error: "Topilmadi." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
