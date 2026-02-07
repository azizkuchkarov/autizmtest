import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const row = await prisma.aiPrompt.findUnique({ where: { id: "default" } });
  return NextResponse.json({ prompt: row?.prompt ?? "" });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const prompt = String(body?.prompt ?? "");
  await prisma.aiPrompt.upsert({
    where: { id: "default" },
    create: { id: "default", prompt },
    update: { prompt },
  });
  return NextResponse.json({ ok: true });
}
