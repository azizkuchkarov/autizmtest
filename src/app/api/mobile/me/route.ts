import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, toPublicChild } from "@/lib/mobile-api";
import { clearUserSessionCookie } from "@/lib/user-auth";

/** Mobil ilova: joriy foydalanuvchi va uning bolalari. */
export async function GET() {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const children = await prisma.child.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({
    user: { id: user.id, phone: user.phone, guideSeen: !!user.guideSeenAt },
    children: children.map(toPublicChild),
  });
}

/** Ota-ona qo'llanmani ko'rib chiqdi: { guideSeen: true } */
export async function PATCH(req: Request) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const body = (await req.json().catch(() => null)) as { guideSeen?: unknown } | null;
  if (typeof body?.guideSeen !== "boolean") return NextResponse.json({ error: "guideSeen kerak." }, { status: 400 });

  await prisma.user.update({ where: { id: user.id }, data: { guideSeenAt: body.guideSeen ? new Date() : null } });
  return NextResponse.json({ ok: true });
}

/** Mobil ilova va web: akkauntni butunlay o'chirish (App Store talabi). Bolalar va sessiyalar ham o'chadi. */
export async function DELETE() {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  await prisma.$transaction([
    prisma.pinSetupToken.deleteMany({ where: { userId: user.id } }),
    prisma.otpCode.deleteMany({ where: { phone: user.phone } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  // Web: sessiya cookie'sini ham tozalaymiz (mobil ilovada cookie yo'q — zararsiz)
  await clearUserSessionCookie();
  return NextResponse.json({ ok: true });
}
