import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createInvoice } from "@/lib/click";
import { getPaymentAmount } from "@/lib/payment-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = String(body?.phone || "").replace(/\s+/g, "").trim();
    const devSkip = body?.dev_skip === true && process.env.NODE_ENV !== "production";

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak." },
        { status: 400 }
      );
    }

    const amount = getPaymentAmount();
    const merchantTransId = `autizm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    if (devSkip) {
      await prisma.payment.create({
        data: {
          phone,
          amount,
          status: "paid",
          merchantTransId,
          paidAt: new Date(),
        },
      });
    return NextResponse.json({
      ok: true,
      merchantTransId,
      amount,
      message: "Test rejimida to'lov o'tkazildi.",
    });
    }

    await prisma.payment.create({
      data: {
        phone,
        amount,
        status: "pending",
        merchantTransId,
      },
    });

    const result = await createInvoice({
      phone,
      amount,
      merchantTransId,
    });

    if (result.errorCode !== 0 && result.errorCode !== undefined) {
      await prisma.payment.updateMany({
        where: { merchantTransId },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: result.errorNote || "Click invoice yaratilmadi." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      merchantTransId,
      invoiceId: result.invoiceId,
      amount,
      message: "Telefoningizga Click orqali to'lov yuborildi. Click ilovasida to'lang.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server xatoligi";
    console.error("[payment create]", msg);
    return NextResponse.json({ error: "To'lov yaratilmadi.", details: msg }, { status: 500 });
  }
}
