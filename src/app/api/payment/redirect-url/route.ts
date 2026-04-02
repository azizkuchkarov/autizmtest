import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentAmount } from "@/lib/payment-config";

const CLICK_PAY_URL = "https://my.click.uz/services/pay";

/**
 * Click sahifasiga yo'naltirish uchun: karta yoki telefon orqali to'lash.
 * Prepare/Complete allaqachon ishlaydi — return_url orqali qaytganida polling tekshiradi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";
    const phone = rawPhone.replace(/\s+/g, "").trim();
    const returnBase = String(body?.return_url || body?.returnUrl || "").trim() || undefined;
    const assessmentId =
      typeof body?.assessment_id === "string" ? body.assessment_id.trim() : "";

    const merchantId = process.env.CLICK_MERCHANT_ID;
    const serviceId = process.env.CLICK_SERVICE_ID;
    if (!merchantId || !serviceId) {
      return NextResponse.json(
        { error: "CLICK_MERCHANT_ID va CLICK_SERVICE_ID .env da kerak." },
        { status: 500 }
      );
    }

    const amount = getPaymentAmount();
    const merchantTransId = `autizm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await prisma.payment.create({
      data: {
        phone: phone || "CARD",
        amount,
        status: "pending",
        merchantTransId,
      },
    });

    const returnUrl = returnBase
      ? `${returnBase.replace(/\/$/, "")}/payment?mt=${encodeURIComponent(merchantTransId)}${
          assessmentId ? `&assessment_id=${encodeURIComponent(assessmentId)}` : ""
        }`
      : undefined;

    const params = new URLSearchParams({
      service_id: serviceId,
      merchant_id: merchantId,
      amount: (amount / 1).toFixed(2),
      transaction_param: merchantTransId,
    });
    if (returnUrl) params.set("return_url", returnUrl);

    const redirectUrl = `${CLICK_PAY_URL}?${params.toString()}`;

    return NextResponse.json({
      ok: true,
      merchantTransId,
      redirectUrl,
      amount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server xatoligi";
    console.error("[payment redirect-url]", msg);
    return NextResponse.json({ error: "Xatolik.", details: msg }, { status: 500 });
  }
}
