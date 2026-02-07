import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body?.name ? String(body.name) : null;
    const phone = body?.phone ? String(body.phone) : null;
    const message = String(body?.message ?? "").trim();
    if (!message) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.feedback.create({ data: { name, phone, message } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
