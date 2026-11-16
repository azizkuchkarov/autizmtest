import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionAdmin } from "@/lib/admin-auth";
import { requireAdmin, validationError } from "@/lib/content-admin";
import { prisma } from "@/lib/db";
import { extendLessonAccess } from "@/lib/lesson-access";
import { normalizePhone } from "@/lib/user-auth";
import { logUserEvent } from "@/lib/user-event";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("grant"), phone: z.string().min(5).max(20), days: z.number().int().min(1).max(3650) }),
  z.object({ action: z.literal("revoke"), phone: z.string().min(5).max(20) }),
]);

/**
 * Foydalanuvchiga Darslarga qo'lda kirish berish yoki olib qo'yish (masalan, App Store tekshiruvchisi yoki bepul kirish).
 * Berilgan kirish to'lovlar ro'yxatida 0 so'mlik "admin" yozuvi bo'lib ko'rinadi.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const admin = await getSessionAdmin();

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const body = parsed.data;

  // "90 123 45 67", "998901234567", "+998 90 123 45 67" — hammasi +998901234567 ga keltiriladi
  const digits = normalizePhone(body.phone).replace(/\D/g, "");
  const phone = digits.length === 9 ? `+998${digits}` : `+${digits}`;
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phone: true } });
  if (!user) return NextResponse.json({ error: "Bu raqam bilan foydalanuvchi topilmadi." }, { status: 404 });

  if (body.action === "revoke") {
    await prisma.user.update({ where: { id: user.id }, data: { lessonsPaidUntil: null } });
    void logUserEvent("lesson_access_revoked", { phone: user.phone, by: admin?.email ?? null });
    return NextResponse.json({ ok: true, paidUntil: null });
  }

  const paidUntil = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        userId: user.id,
        phone: user.phone,
        amount: 0,
        days: body.days,
        status: "paid",
        merchantTransId: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        paidAt: new Date(),
      },
    });
    return extendLessonAccess(tx, user.id, body.days);
  });
  void logUserEvent("lesson_access_granted", { phone: user.phone, days: body.days, paidUntil: paidUntil.toISOString(), by: admin?.email ?? null });
  return NextResponse.json({ ok: true, paidUntil: paidUntil.toISOString() });
}
