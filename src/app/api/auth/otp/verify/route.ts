import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizePhone,
  createPinSetupToken,
  setPinSetupCookie,
  createUserSession,
  setUserSessionCookie,
} from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body?.phone || ""));
    const code = String(body?.code || "").trim();
    const flow = body?.flow === "test";

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak." },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(code) && !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Kod 4 yoki 6 raqamdan iborat bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const now = new Date();
    const otp = await prisma.otpCode.findFirst({
      where: { phone, code },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Kod noto‘g‘ri." },
        { status: 401 }
      );
    }
    if (otp.expiresAt < now) {
      await prisma.otpCode.deleteMany({ where: { phone } });
      return NextResponse.json(
        { error: "Kod muddati tugadi. Yangi kod so‘rab yuboring." },
        { status: 400 }
      );
    }

    await prisma.otpCode.deleteMany({ where: { id: otp.id } });

    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, pinHash: null },
      });
    }

    if (flow) {
      const { token, expiresAt } = await createUserSession(user.id);
      await setUserSessionCookie(token, expiresAt);
      return NextResponse.json({
        ok: true,
        needsPin: false,
        user: { id: user.id, phone: user.phone },
      });
    }

    const token = await createPinSetupToken(user.id);
    await setPinSetupCookie(token);

    return NextResponse.json({
      ok: true,
      needsPin: true,
      user: { id: user.id, phone: user.phone },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server xatoligi.";
    return NextResponse.json(
      { error: "Server xatoligi.", details: message },
      { status: 500 }
    );
  }
}
