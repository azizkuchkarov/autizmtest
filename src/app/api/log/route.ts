import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = String(body?.type ?? "");
    const metadata = body?.metadata ?? null;
    if (!type) return NextResponse.json({ ok: false }, { status: 400 });
    await prisma.userEvent.create({ data: { type, metadata } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
