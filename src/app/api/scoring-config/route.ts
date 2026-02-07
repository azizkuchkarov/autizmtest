import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { defaultScoringConfig } from "@/lib/scoring";

export async function GET() {
  const row = await prisma.scoringConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json({ config: row?.config ?? defaultScoringConfig });
}
