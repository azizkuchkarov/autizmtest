import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { extendLessonAccess } from "@/lib/lesson-access";
import { getPaymentAmount, getPaymentPeriodDays, isPaymentDevSkip } from "@/lib/payment-config";
import { getSessionUser } from "@/lib/user-auth";
import { logUserEvent } from "@/lib/user-event";

const CLICK_PAY_URL = "https://my.click.uz/services/pay";

const bodySchema = z.object({
  /** "app" — mobil ilova: Click'dan keyin autizm:// orqali ilovaga qaytadi */
  client: z.enum(["web", "app"]).default("web"),
});

/**
 * Darslar bo'limiga oylik kirish uchun Click to'lov sahifasi havolasi (karta yoki Click ilovasi).
 * To'lov akkauntga bog'lanadi; Click "complete" chaqirgach kirish muddati uzaytiriladi.
 */
export async function POST(req: Request) {
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ma'lumot noto'g'ri." }, { status: 400 });
  const { client } = parsed.data;

  try {
    const amount = getPaymentAmount();
    const days = getPaymentPeriodDays();

    // Lokal test: Click kalitlari yo'q — to'lov darhol o'tadi
    if (isPaymentDevSkip()) {
      const paid = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({
          data: { userId: user.id, phone: user.phone, amount, days, status: "paid", merchantTransId: newTransId(), paidAt: new Date() },
        });
        await extendLessonAccess(tx, user.id, days);
        return p;
      });
      void logUserEvent("payment_success", { paymentId: paid.id, phone: user.phone, amount, days, merchantTransId: paid.merchantTransId, source: "dev_skip" });
      return NextResponse.json({ ok: true, paid: true });
    }

    const merchantId = process.env.CLICK_MERCHANT_ID;
    const serviceId = process.env.CLICK_SERVICE_ID;
    if (!merchantId || !serviceId) {
      return NextResponse.json({ error: "To'lov vaqtincha ishlamayapti." }, { status: 503 });
    }

    // So'nggi 30 daqiqadagi kutilayotgan to'lov qayta ishlatiladi (bir necha marta bosilsa ham bitta to'lov)
    let payment = await prisma.payment.findFirst({
      where: { userId: user.id, status: "pending", amount, days, createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    });
    payment ??= await prisma.payment.create({
      data: { userId: user.id, phone: user.phone, amount, days, status: "pending", merchantTransId: newTransId() },
    });

    const returnUrl = `${publicBaseUrl(req)}/api/payment/return${client === "app" ? "?app=1" : ""}`;
    const params = new URLSearchParams({
      service_id: serviceId,
      merchant_id: merchantId,
      amount: amount.toFixed(2),
      transaction_param: payment.merchantTransId,
      return_url: returnUrl,
    });

    return NextResponse.json({ ok: true, paid: false, redirectUrl: `${CLICK_PAY_URL}?${params}`, amount, days });
  } catch (err) {
    console.error("[payment checkout]", err);
    return NextResponse.json({ error: "Xatolik." }, { status: 500 });
  }
}

function newTransId() {
  return `autizm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Click qaytgandan keyin yo'naltiriladigan sayt manzili. */
function publicBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
