import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCompleteSign } from "@/lib/click";
import { logUserEvent } from "@/lib/user-event";

async function parseBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await req.json();
    return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, String(v)]));
  }
  const text = await req.text();
  const params: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

export async function POST(req: Request) {
  try {
    const p = await parseBody(req);
    const clickTransId = p.click_trans_id;
    const serviceId = p.service_id;
    const merchantTransId = p.merchant_trans_id;
    const merchantPrepareId = parseInt(p.merchant_prepare_id || "0", 10);
    const amount = p.amount;
    const action = p.action;
    const error = p.error;
    const signTime = p.sign_time;
    const signString = p.sign_string;

    function jsonResponse(
      click_trans_id: string,
      merchant_trans_id: string,
      merchant_confirm_id: number,
      error: number,
      error_note: string
    ) {
      return NextResponse.json(
        { click_trans_id, merchant_trans_id, merchant_confirm_id, error, error_note },
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (!clickTransId || !merchantTransId || action !== "1") {
      return jsonResponse(String(clickTransId), String(merchantTransId), 0, -8, "Invalid params");
    }

    const signOk = verifyCompleteSign({
      click_trans_id: clickTransId,
      service_id: serviceId,
      merchant_trans_id: merchantTransId,
      merchant_prepare_id: merchantPrepareId,
      amount,
      action,
      sign_time: signTime,
      sign_string: signString,
    });

    if (!signOk) {
      return jsonResponse(clickTransId, merchantTransId, 0, -1, "Bad sign");
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantTransId },
    });

    if (!payment) {
      return jsonResponse(clickTransId, merchantTransId, 0, -5, "Order not found");
    }

    if (payment.status === "paid") {
      return jsonResponse(
        clickTransId,
        merchantTransId,
        payment.merchantPrepareId || 0,
        -4,
        "Already confirmed"
      );
    }

    const merchantConfirmId = payment.merchantPrepareId || merchantPrepareId;

    if (error === "0") {
      await prisma.payment.update({
        where: { merchantTransId },
        data: { status: "paid", paidAt: new Date() },
      });
      void logUserEvent("payment_success", {
        paymentId: payment.id,
        phone: payment.phone,
        amount: payment.amount,
        merchantTransId: payment.merchantTransId,
        source: "click_complete",
      });
    } else {
      await prisma.payment.update({
        where: { merchantTransId },
        data: { status: "failed" },
      });
      return jsonResponse(clickTransId, merchantTransId, merchantConfirmId, -9, "Cancel");
    }

    return jsonResponse(clickTransId, merchantTransId, merchantConfirmId, 0, "Success");
  } catch (err) {
    console.error("[Click complete]", err);
    return NextResponse.json(
      { click_trans_id: "0", merchant_trans_id: "0", merchant_confirm_id: 0, error: -9, error_note: "Server error" },
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
