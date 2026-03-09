import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";
    const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";

    if (!assessmentId || !paymentId) {
      return NextResponse.json({ error: "assessmentId va paymentId kerak." }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status !== "paid") {
      return NextResponse.json({ error: "To'lov topilmadi yoki paid emas." }, { status: 400 });
    }

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { paymentId },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

