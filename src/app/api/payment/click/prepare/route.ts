import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isOurService, parseClickBody, sameAmount, verifyPrepareSign } from "@/lib/click";

/*
 * Click SHOP-API: Prepare (action=0). Xato kodlari: -1 imzo, -2 summa, -4 allaqachon to'langan, -5 buyurtma topilmadi,
 * -8 so'rov xato, -9 bekor qilingan.
 */
export async function POST(req: Request) {
  try {
    const p = await parseClickBody(req);
    const clickTransId = p.click_trans_id;
    const merchantTransId = p.merchant_trans_id;
    const action = p.action;
    const error = p.error;

    const reply = (merchant_prepare_id: number, code: number, note: string) =>
      NextResponse.json({
        click_trans_id: String(clickTransId),
        merchant_trans_id: String(merchantTransId),
        merchant_prepare_id,
        error: code,
        error_note: note,
      });

    if (!clickTransId || !merchantTransId || action !== "0") {
      return reply(0, -8, "Invalid params");
    }

    const signOk = verifyPrepareSign({
      click_trans_id: clickTransId,
      service_id: p.service_id,
      merchant_trans_id: merchantTransId,
      amount: p.amount,
      action,
      sign_time: p.sign_time,
      sign_string: p.sign_string,
    });
    if (!signOk) return reply(0, -1, "Bad sign");
    if (!isOurService(p.service_id)) return reply(0, -8, "Wrong service");

    if (error !== "0" && error !== "") {
      return reply(0, -9, "Cancel");
    }

    const payment = await prisma.payment.findUnique({ where: { merchantTransId } });
    if (!payment) return reply(0, -5, "Order not found");
    if (payment.status === "paid") return reply(0, -4, "Already paid");
    if (!sameAmount(p.amount, payment.amount)) return reply(0, -2, "Amount mismatch");

    // Click shu tranzaksiya uchun Prepare'ni qayta yuborsa — o'sha merchant_prepare_id qaytariladi
    if (payment.clickTransId === clickTransId && payment.merchantPrepareId) {
      return reply(payment.merchantPrepareId, 0, "Success");
    }

    // Yangi urinish (yoki bekor qilingandan keyin qayta to'lash). Eski "failed" buyurtmalar qayta ochiladi.
    // Shart bilan yoziladi: shu orada boshqa tranzaksiya buyurtmani to'lab qo'ygan bo'lsa, u qayta "kutilmoqda"ga tushmaydi.
    const merchantPrepareId = Date.now() % 100000000;
    const updated = await prisma.payment.updateMany({
      where: { merchantTransId, status: { not: "paid" } },
      data: { clickTransId, merchantPrepareId, status: "pending" },
    });
    if (updated.count === 0) return reply(0, -4, "Already paid");

    return reply(merchantPrepareId, 0, "Success");
  } catch (err) {
    console.error("[Click prepare]", err);
    return NextResponse.json({ click_trans_id: "0", merchant_trans_id: "0", merchant_prepare_id: 0, error: -9, error_note: "Server error" });
  }
}
