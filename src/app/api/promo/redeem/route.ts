import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatFullPromoCode, generatePromoCodeSegment } from "@/lib/promo-code";
import { logUserEvent } from "@/lib/user-event";

const PLACEHOLDER_PHONE = "+998900000000";

function normalizePromoCode(raw: string): string | null {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "");
  const rest = (u.startsWith("DEMO-") ? u.slice(5) : u).replace(/[^A-Z0-9]/g, "");
  return rest.length === 8 ? formatFullPromoCode(rest) : null;
}

/** Promokod kiritilsa natijaga 0 so'mlik "paid" to'lov bog'lanadi va natija ochiladi. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const rawCode = typeof body?.code === "string" ? body.code : "";
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";
    if (!rawCode.trim() || !assessmentId) {
      return NextResponse.json({ error: "Kod va assessmentId kerak." }, { status: 400 });
    }

    const normalized = normalizePromoCode(rawCode);
    if (!normalized) return NextResponse.json({ error: "invalid_format" }, { status: 400 });

    const promo = await prisma.promoCode.findUnique({
      where: { code: normalized },
      include: { assessment: { include: { payment: true } } },
    });
    if (!promo || !promo.active || promo.assessmentId !== assessmentId) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) return NextResponse.json({ error: "expired" }, { status: 400 });
    if (promo.usedCount >= promo.maxUses) return NextResponse.json({ error: "used" }, { status: 400 });
    if (promo.assessment.payment?.status === "paid") return NextResponse.json({ ok: true });

    const merchantTransId = `promo-${promo.id}-${Date.now()}-${generatePromoCodeSegment().slice(0, 4)}`;
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: { phone: PLACEHOLDER_PHONE, amount: 0, status: "paid", merchantTransId, paidAt: new Date() },
      });
      await tx.assessment.update({ where: { id: assessmentId }, data: { paymentId: payment.id } });
      await tx.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
    });

    void logUserEvent("promo_redeem", { assessmentId, promoCodeId: promo.id, codeSuffix: normalized.slice(-4) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[promo/redeem]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
