import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/admin-auth";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";
import { logUserEvent } from "@/lib/user-event";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Noma'lum email uchun ham bcrypt solishtiriladi — javob vaqti qaysi email borligini oshkor qilmasin.
 * Birinchi kerak bo'lganda bir marta hisoblanadi.
 */
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(randomUUID(), 10));

/*
 * Admin bazada bo'lmasa, avval birinchi kirgan odam avtomatik admin bo'lib qolardi — endi admin faqat
 * scripts/create-admin.mjs bilan yaratiladi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email va parol kerak." }, { status: 400 });
    }

    // Cheklov IP va (IP + email) bo'yicha. Faqat email bo'yicha bo'lsa, email ochiq bo'lgani uchun istalgan odam adminni bloklab qo'yardi.
    const ip = await clientIp();
    if (ip && (!hit(`admin-login:${ip}`, 20, WINDOW_MS) || !hit(`admin-login:${ip}:${email}`, 8, WINDOW_MS))) {
      return tooManyRequests();
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    const ok = await verifyPassword(password, admin?.password ?? (await getDummyHash()));
    if (!admin || !ok) {
      return NextResponse.json({ error: "Email yoki parol noto‘g‘ri." }, { status: 401 });
    }

    const session = await createSession(admin.id);
    await setSessionCookie(session.token, session.expiresAt);
    await logUserEvent("admin_login", { email: admin.email, adminId: admin.id, ip });

    return NextResponse.json({ ok: true, email: admin.email });
  } catch (err) {
    console.error("[admin login]", err);
    return NextResponse.json({ error: "Server xatoligi." }, { status: 500 });
  }
}
