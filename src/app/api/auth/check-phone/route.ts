import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/user-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(String(body?.phone || ""));

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, pinHash: true },
    });

    return NextResponse.json({
      exists: !!user,
      hasPin: !!user?.pinHash,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server xatoligi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
