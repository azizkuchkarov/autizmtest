import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPrepareSign } from "@/lib/click";

// Click bu URL ga POST so'rov yuboradi (form-urlencoded yoki JSON)
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
    const amount = parseFloat(p.amount || "0");
    const action = p.action;
    const error = p.error;
    const signTime = p.sign_time;
    const signString = p.sign_string;

    function jsonResponse(
      click_trans_id: string,
      merchant_trans_id: string,
      merchant_prepare_id: number,
      error: number,
      error_note: string
    ) {
      return NextResponse.json(
        { click_trans_id, merchant_trans_id, merchant_prepare_id, error, error_note },
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (!clickTransId || !merchantTransId || action !== "0") {
      return jsonResponse(String(clickTransId), String(merchantTransId), 0, -8, "Invalid params");
    }

    const signOk = verifyPrepareSign({
      click_trans_id: clickTransId,
      service_id: serviceId,
      merchant_trans_id: merchantTransId,
      amount: p.amount,
      action,
      sign_time: signTime,
      sign_string: signString,
    });

    if (!signOk) {
      return jsonResponse(clickTransId, merchantTransId, 0, -1, "Bad sign");
    }

    if (error !== "0" && error !== "") {
      return jsonResponse(clickTransId, merchantTransId, 0, -9, "Cancel");
    }

    const payment = await prisma.payment.findUnique({
      where: { merchantTransId },
    });

    if (!payment) {
      return jsonResponse(clickTransId, merchantTransId, 0, -5, "Order not found");
    }
    if (payment.status !== "pending") {
      return jsonResponse(clickTransId, merchantTransId, 0, -4, "Already processed");
    }
    if (payment.amount !== amount) {
      return jsonResponse(clickTransId, merchantTransId, 0, -5, "Amount mismatch");
    }

    const merchantPrepareId = Date.now() % 100000000;

    await prisma.payment.update({
      where: { merchantTransId },
      data: {
        clickTransId,
        merchantPrepareId,
      },
    });

    return jsonResponse(clickTransId, merchantTransId, merchantPrepareId, 0, "Success");
  } catch (err) {
    console.error("[Click prepare]", err);
    return NextResponse.json(
      { click_trans_id: "0", merchant_trans_id: "0", merchant_prepare_id: 0, error: -9, error_note: "Server error" },
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
