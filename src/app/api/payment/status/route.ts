import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const merchantTransId = searchParams.get("merchant_trans_id");
  const phone = searchParams.get("phone");

  if (!merchantTransId && !phone) {
    return NextResponse.json({ error: "merchant_trans_id yoki phone kerak." }, { status: 400 });
  }

  if (merchantTransId) {
    const p = await prisma.payment.findUnique({
      where: { merchantTransId },
    });
    return NextResponse.json({
      status: p?.status ?? "not_found",
      amount: p?.amount,
      paidAt: p?.paidAt,
    });
  }

  if (phone) {
    const cleaned = phone.replace(/\s+/g, "").trim();
    const p = await prisma.payment.findFirst({
      where: { phone: cleaned, status: "paid" },
      orderBy: { paidAt: "desc" },
    });
    return NextResponse.json({
      hasPaid: !!p,
      paidAt: p?.paidAt,
    });
  }

  return NextResponse.json({ error: "Params kerak." }, { status: 400 });
}
