import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/user-auth";
import { sendSms } from "@/lib/eskiz";

const OTP_TTL_MINUTES = 5;
const RATE_LIMIT_MINUTES = 1;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body?.phone || ""));

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const now = new Date();
    const recent = await prisma.otpCode.findFirst({
      where: {
        phone,
        createdAt: { gte: new Date(now.getTime() - RATE_LIMIT_MINUTES * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      return NextResponse.json(
        { error: `Keyinroq urinib ko‘ring (${RATE_LIMIT_MINUTES} daqiqadan keyin).` },
        { status: 429 }
      );
    }

    const devCode = process.env.OTP_DEV_CODE?.trim();
    const useDevCode =
      process.env.NODE_ENV !== "production" &&
      devCode &&
      /^\d{4,6}$/.test(devCode);

    const code = useDevCode ? devCode : generateCode();
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.otpCode.create({
      data: { phone, code, expiresAt },
    });

    if (useDevCode) {
      return NextResponse.json({
        ok: true,
        message: "Test rejimida SMS yuborilmadi. Quyidagi kodni kiriting.",
        devCode: devCode,
      });
    }

    // Eskiz shabloni bilan mos: "autizmtest.uz saytiga ro'yxatdan o'tish uchun tasdiqlash kodi: 0000"
    const message = `autizmtest.uz saytiga ro'yxatdan o'tish uchun tasdiqlash kodi: ${code}`;
    try {
      await sendSms(phone, message);
    } catch (smsErr: unknown) {
      const smsMsg = smsErr instanceof Error ? smsErr.message : String(smsErr);
      if (
        smsMsg.includes("Для теста") ||
        smsMsg.includes("only one of these texts") ||
        smsMsg.includes("test from Eskiz")
      ) {
        return NextResponse.json(
          {
            error:
              "Eskiz test rejimida — ixtiyoriy matn yuborish faqat to‘liq faollashtirilgandan keyin ishlaydi. my.eskiz.uz da akkauntni faollashtiring yoki .env ga OTP_DEV_CODE=123456 qo‘shing va shu kod bilan tasdiqlang.",
          },
          { status: 400 }
        );
      }
      throw smsErr;
    }

    return NextResponse.json({
      ok: true,
      message: "SMS yuborildi. Kodni kiriting.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server xatoligi.";
    console.error("[OTP request]", message);
    return NextResponse.json(
      { error: "SMS yuborilmadi.", details: message },
      { status: 500 }
    );
  }
}
