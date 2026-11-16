import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUserSession, normalizePhone, OTP_MAX_ATTEMPTS, setUserSessionCookie } from "@/lib/user-auth";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";

const PER_IP_LIMIT = 60;
const PER_IP_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const phone = normalizePhone(String(body?.phone || ""));
    const code = String(body?.code || "").trim();
    // "mobile" — token javobda qaytadi; boshqa har qanday qiymat (veb: "test") — sessiya cookie'si o'rnatiladi
    const mobile = body?.flow === "mobile";

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

    const ip = await clientIp();
    if (ip && !hit(`otp-verify:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS)) return tooManyRequests();

    // Avval urinish bazada "band qilinadi" (attempts + 1), keyin kod solishtiriladi. Postgres qatorni qulflab shartni qayta
    // tekshiradi — bir vaqtda yuborilgan yuzlab so'rov ham bitta kod uchun 5 tadan ortiq taxmin qila olmaydi.
    const live = await prisma.otpCode.updateManyAndReturn({
      where: { phone, expiresAt: { gt: new Date() }, attempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
      select: { id: true, code: true },
    });

    if (live.length === 0) {
      const exhausted = await prisma.otpCode.count({ where: { phone, expiresAt: { gt: new Date() } } });
      return exhausted > 0
        ? NextResponse.json({ error: "Urinishlar soni tugadi. Yangi kod so‘rang." }, { status: 429 })
        : NextResponse.json({ error: "Kod muddati tugadi. Yangi kod so‘rab yuboring." }, { status: 400 });
    }

    // Faqat shu so'rovda urinishi band qilingan kodlar bilan solishtiriladi
    const match = live.find((o) => o.code === code);
    if (!match) {
      return NextResponse.json({ error: "Kod noto‘g‘ri." }, { status: 401 });
    }

    // Kod bir marta ishlatiladi: parallel so'rovlardan faqat bittasi uni o'chira oladi
    const consumed = await prisma.otpCode.deleteMany({ where: { id: match.id } });
    if (consumed.count === 0) {
      return NextResponse.json({ error: "Kod noto‘g‘ri." }, { status: 401 });
    }
    await prisma.otpCode.deleteMany({ where: { phone } });

    const user = await prisma.user.upsert({ where: { phone }, create: { phone }, update: {} });

    // Mobil ilova: sessiya tokeni cookie o'rniga javobda qaytariladi
    if (mobile) {
      const { token, expiresAt } = await createUserSession(user.id);
      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        user: { id: user.id, phone: user.phone },
      });
    }

    const { token, expiresAt } = await createUserSession(user.id);
    await setUserSessionCookie(token, expiresAt);
    return NextResponse.json({
      ok: true,
      needsPin: false,
      user: { id: user.id, phone: user.phone },
    });
  } catch (err: unknown) {
    console.error("[OTP verify]", err);
    return NextResponse.json({ error: "Server xatoligi." }, { status: 500 });
  }
}
