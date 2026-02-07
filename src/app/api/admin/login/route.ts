import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { prisma } from "@/lib/db";
import { createSession, hashPassword, setSessionCookie, verifyPassword } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email va parol kerak." }, { status: 400 });
    }

    const adminCount = await prisma.admin.count();
    let admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin && adminCount === 0) {
      // bootstrap first admin
      const hashed = await hashPassword(password);
      admin = await prisma.admin.create({ data: { email, password: hashed } });
    }

    if (!admin) {
      return NextResponse.json({ error: "Admin topilmadi." }, { status: 401 });
    }

    const ok = await verifyPassword(password, admin.password);
    if (!ok) {
      return NextResponse.json({ error: "Parol noto‘g‘ri." }, { status: 401 });
    }

    const session = await createSession(admin.id);
    await setSessionCookie(session.token, session.expiresAt);

    return NextResponse.json({ ok: true, email: admin.email });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Server xatoligi.";
    return NextResponse.json({ error: "Server xatoligi.", details: message }, { status: 500 });
  }
}
