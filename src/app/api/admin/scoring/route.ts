import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { defaultScoringConfig } from "@/lib/scoring";

export async function GET() {
  const row = await prisma.scoringConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json({ config: row?.config ?? defaultScoringConfig });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const config = body?.config ?? defaultScoringConfig;
  await prisma.scoringConfig.upsert({
    where: { id: "default" },
    create: { id: "default", config },
    update: { config },
  });
  return NextResponse.json({ ok: true });
}
