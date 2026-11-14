import { NextResponse } from "next/server";
import { z } from "zod";
import { publicBaseUrl } from "@/lib/assessment-access";
import { prisma } from "@/lib/db";
import { getPaymentAmount, isPaymentDevSkip } from "@/lib/payment-config";
import { logUserEvent } from "@/lib/user-event";

const CLICK_PAY_URL = "https://my.click.uz/services/pay";

const bodySchema = z.object({
  assessmentId: z.string().min(1).max(64),
  /** "app" — mobil ilova: Click'dan keyin autizm:// orqali ilovaga qaytadi */
  client: z.enum(["web", "app"]).default("web"),
});

/**
 * Skrining natijasi uchun Click to'lov sahifasi havolasini yaratadi (karta yoki Click ilovasi).
 * To'lov natijaga darhol bog'lanadi; Click "complete" chaqirgach status "paid" bo'ladi.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ma'lumot noto'g'ri." }, { status: 400 });
  const { assessmentId, client } = parsed.data;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { payment: true },
    });
    if (!assessment) return NextResponse.json({ error: "Natija topilmadi." }, { status: 404 });
    if (!assessment.requiresPayment || assessment.payment?.status === "paid") {
      return NextResponse.json({ ok: true, paid: true });
    }

    const amount = getPaymentAmount();
    const phone = assessment.phone ?? "CARD";

    // Lokal test: Click kalitlari yo'q — to'lov darhol o'tadi
    if (isPaymentDevSkip()) {
      const paid = await prisma.payment.create({
        data: { phone, amount, status: "paid", merchantTransId: newTransId(), paidAt: new Date() },
      });
      await prisma.assessment.update({ where: { id: assessmentId }, data: { paymentId: paid.id } });
      void logUserEvent("payment_success", { paymentId: paid.id, phone, amount, merchantTransId: paid.merchantTransId, source: "dev_skip" });
      return NextResponse.json({ ok: true, paid: true });
    }

    const merchantId = process.env.CLICK_MERCHANT_ID;
    const serviceId = process.env.CLICK_SERVICE_ID;
    if (!merchantId || !serviceId) {
      return NextResponse.json({ error: "To'lov vaqtincha ishlamayapti." }, { status: 503 });
    }

    // Shu natija uchun kutilayotgan to'lov bo'lsa — o'shani qayta ishlatamiz (eski havola ham amal qiladi)
    let payment = assessment.payment;
    if (!payment || payment.status !== "pending" || payment.amount !== amount) {
      payment = await prisma.payment.create({
        data: { phone, amount, status: "pending", merchantTransId: newTransId() },
      });
      await prisma.assessment.update({ where: { id: assessmentId }, data: { paymentId: payment.id } });
    }

    const returnUrl = `${publicBaseUrl(req)}/api/payment/return?${new URLSearchParams({ a: assessmentId, ...(client === "app" && { app: "1" }) })}`;
    const params = new URLSearchParams({
      service_id: serviceId,
      merchant_id: merchantId,
      amount: amount.toFixed(2),
      transaction_param: payment.merchantTransId,
      return_url: returnUrl,
    });

    return NextResponse.json({ ok: true, paid: false, redirectUrl: `${CLICK_PAY_URL}?${params}`, amount });
  } catch (err) {
    console.error("[payment checkout]", err);
    return NextResponse.json({ error: "Xatolik." }, { status: 500 });
  }
}

function newTransId() {
  return `autizm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
