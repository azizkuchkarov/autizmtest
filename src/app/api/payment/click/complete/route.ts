import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOurService, parseClickBody, sameAmount, verifyCompleteSign } from "@/lib/click";
import { extendLessonAccess } from "@/lib/lesson-access";
import { logUserEvent } from "@/lib/user-event";

/*
 * Click SHOP-API: Complete (action=1).
 * Qoida: imzosi to'g'ri muvaffaqiyatli Complete holat sabab rad etilmaydi — aks holda Click haqiqiy to'lovni qaytarib yuboradi.
 * Bekor qilish (error ≠ 0) buyurtmani faqat shu Click tranzaksiyasiga tegishli bo'lsa "kutilmoqda" holatiga qaytaradi:
 * tashlab ketilgan eski urinishning kechikkan bekor xabari yangi to'lovni buzmaydi, foydalanuvchi esa qayta to'lay oladi.
 */
export async function POST(req: Request) {
  try {
    const p = await parseClickBody(req);
    const clickTransId = p.click_trans_id;
    const merchantTransId = p.merchant_trans_id;
    const merchantPrepareId = parseInt(p.merchant_prepare_id || "0", 10);
    const action = p.action;
    const error = p.error;

    const reply = (merchant_confirm_id: number, code: number, note: string) =>
      NextResponse.json({
        click_trans_id: String(clickTransId),
        merchant_trans_id: String(merchantTransId),
        merchant_confirm_id,
        error: code,
        error_note: note,
      });

    if (!clickTransId || !merchantTransId || action !== "1") {
      return reply(0, -8, "Invalid params");
    }

    const signOk = verifyCompleteSign({
      click_trans_id: clickTransId,
      service_id: p.service_id,
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: merchantPrepareId,
      amount: p.amount,
      action,
      sign_time: p.sign_time,
      sign_string: p.sign_string,
    });
    if (!signOk) return reply(0, -1, "Bad sign");
    if (!isOurService(p.service_id)) return reply(0, -8, "Wrong service");

    const payment = await prisma.payment.findUnique({ where: { merchantTransId } });
    if (!payment) return reply(0, -5, "Order not found");
    if (payment.status === "paid") return reply(payment.merchantPrepareId || 0, -4, "Already paid");
    if (!payment.merchantPrepareId) return reply(0, -6, "Transaction does not exist");
    if (!sameAmount(p.amount, payment.amount)) return reply(0, -2, "Amount mismatch");

    const merchantConfirmId = merchantPrepareId || payment.merchantPrepareId;

    if (error !== "0") {
      await prisma.payment.updateMany({
        where: { merchantTransId, clickTransId, status: { not: "paid" } },
        data: { status: "pending", clickTransId: null },
      });
      return reply(merchantConfirmId, -9, "Cancel");
    }

    // Faqat birinchi tasdiq kirish muddatini uzaytiradi (Click qayta yuborsa ikki marta qo'shilmaydi)
    const paidUntil = await prisma.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { merchantTransId, status: { not: "paid" } },
        // Qaysi Click tranzaksiyasi to'laganini saqlaymiz (hisob-kitobni solishtirish uchun)
        data: { status: "paid", paidAt: new Date(), clickTransId },
      });
      if (res.count === 0 || !payment.userId) return null;
      return extendLessonAccess(tx, payment.userId, payment.days);
    });
    void logUserEvent("payment_success", {
      paymentId: payment.id,
      phone: payment.phone,
      amount: payment.amount,
      days: payment.days,
      paidUntil: paidUntil?.toISOString() ?? null,
      merchantTransId: payment.merchantTransId,
      source: "click_complete",
    });

    return reply(merchantConfirmId, 0, "Success");
  } catch (err) {
    console.error("[Click complete]", err);
    return NextResponse.json({ click_trans_id: "0", merchant_trans_id: "0", merchant_confirm_id: 0, error: -9, error_note: "Server error" });
  }
}
