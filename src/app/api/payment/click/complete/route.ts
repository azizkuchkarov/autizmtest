import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCompleteSign } from "@/lib/click";

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

    if (!clickTransId || !merchantTransId || action !== "1") {
      return new NextResponse(
        `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=0&error=-8&error_note=Invalid params`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
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
      return new NextResponse(
        `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=0&error=-1&error_note=Bad sign`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantTransId },
    });

    if (!payment) {
      return new NextResponse(
        `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=0&error=-5&error_note=Order not found`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    if (payment.status === "paid") {
      return new NextResponse(
        `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=${payment.merchantPrepareId || 0}&error=-4&error_note=Already confirmed`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const merchantConfirmId = payment.merchantPrepareId || merchantPrepareId;

    if (error === "0") {
      await prisma.payment.update({
        where: { merchantTransId },
        data: { status: "paid", paidAt: new Date() },
      });
    } else {
      await prisma.payment.update({
        where: { merchantTransId },
        data: { status: "failed" },
      });
      return new NextResponse(
        `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=${merchantConfirmId}&error=-9&error_note=Cancel`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    return new NextResponse(
      `click_trans_id=${clickTransId}&merchant_trans_id=${merchantTransId}&merchant_confirm_id=${merchantConfirmId}&error=0&error_note=Success`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } catch (err) {
    console.error("[Click complete]", err);
    return new NextResponse(
      `click_trans_id=0&merchant_trans_id=0&merchant_confirm_id=0&error=-9&error_note=Server error`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
