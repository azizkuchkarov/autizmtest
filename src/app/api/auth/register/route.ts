import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  normalizePhone,
  isValidPin,
  hashPin,
  createUserSession,
  setUserSessionCookie,
} from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body?.phone || ""));
    const pin = String(body?.pin || "").trim();

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak." },
        { status: 400 }
      );
    }
    if (!isValidPin(pin)) {
      return NextResponse.json(
        { error: "Kod 4 yoki 6 raqamdan iborat bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu raqam allaqachon ro‘yxatdan o‘tgan. Kirish sahifasidan kiring." },
        { status: 409 }
      );
    }

    const pinHash = await hashPin(pin);
    const user = await prisma.user.create({
      data: { phone, pinHash },
    });

    const session = await createUserSession(user.id);
    await setUserSessionCookie(session.token, session.expiresAt);

    return NextResponse.json({
      ok: true,
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
