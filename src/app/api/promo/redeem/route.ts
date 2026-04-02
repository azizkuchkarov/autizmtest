import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatFullPromoCode, generatePromoCodeSegment } from "@/lib/promo-code";
import { logUserEvent } from "@/lib/user-event";

const PLACEHOLDER_PHONE = "+998900000000";

function normalizePromoCode(raw: string): string | null {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (u.startsWith("DEMO-")) {
    const rest = u.slice(5).replace(/[^A-Z0-9]/g, "");
    if (rest.length !== 8) return null;
    return formatFullPromoCode(rest);
  }
  const alnum = u.replace(/[^A-Z0-9]/g, "");
  if (alnum.length !== 8) return null;
  return formatFullPromoCode(alnum);
}

/**
 * Foydalanuvchi promokodni kiritadi — assessment ga to'lovsiz (0 so'm) paid payment bog'lanadi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawCode = typeof body?.code === "string" ? body.code : "";
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";

    if (!rawCode?.trim() || !assessmentId) {
      return NextResponse.json({ error: "Kod va assessmentId kerak." }, { status: 400 });
    }

    const normalized = normalizePromoCode(rawCode);
    if (!normalized) {
      return NextResponse.json(
        { error: "Kod DEMO-XXXXXXXX ko‘rinishida bo‘lishi kerak (8 belgi)." },
        { status: 400 }
      );
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: normalized },
      include: { assessment: { include: { payment: true } } },
    });

    if (!promo || !promo.active) {
      return NextResponse.json({ error: "Promokod topilmadi yoki o‘chirilgan." }, { status: 404 });
    }

    if (promo.assessmentId !== assessmentId) {
      return NextResponse.json({ error: "Bu kod boshqa test uchun berilgan." }, { status: 400 });
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: "Promokod muddati tugagan." }, { status: 400 });
    }

    if (promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: "Promokod allaqachon ishlatilgan." }, { status: 400 });
    }

    if (promo.assessment.paymentId && promo.assessment.payment?.status === "paid") {
      return NextResponse.json(
        { error: "Bu test uchun allaqachon to‘lov yoki promokod qo‘llangan." },
        { status: 400 }
      );
    }

    const merchantTransId = `promo-${promo.id}-${Date.now()}-${generatePromoCodeSegment().slice(0, 4)}`;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          phone: PLACEHOLDER_PHONE,
          amount: 0,
          status: "paid",
          merchantTransId,
          paidAt: new Date(),
        },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { paymentId: payment.id },
      });

      await tx.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      });
    });

    void logUserEvent("promo_redeem", {
      assessmentId,
      promoCodeId: promo.id,
      codeSuffix: normalized.slice(-4),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server xatoligi.";
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return NextResponse.json({ error: "Qayta urinib ko‘ring." }, { status: 409 });
    }
    console.error("[promo/redeem]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
