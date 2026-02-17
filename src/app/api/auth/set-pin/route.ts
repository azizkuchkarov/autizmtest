import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isValidPin,
  hashPin,
  createUserSession,
  setUserSessionCookie,
  getPinSetupUserId,
  consumePinSetupToken,
} from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = String(body?.pin || "").trim();
    const pinConfirm = String(body?.pinConfirm || "").trim();

    if (!isValidPin(pin)) {
      return NextResponse.json(
        { error: "PIN 4 yoki 6 raqamdan iborat bo'lishi kerak." },
        { status: 400 }
      );
    }
    if (pin !== pinConfirm) {
      return NextResponse.json(
        { error: "PINlar mos kelmadi." },
        { status: 400 }
      );
    }

    const userId = await getPinSetupUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Sessiya tugadi. Qaytadan OTP orqali tasdiqlang." },
        { status: 400 }
      );
    }

    const pinHash = await hashPin(pin);
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });

    await consumePinSetupToken();

    const session = await createUserSession(userId);
    await setUserSessionCookie(session.token, session.expiresAt);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true },
    });

    return NextResponse.json({
      ok: true,
      user: user ? { id: user.id, phone: user.phone } : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server xatoligi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
