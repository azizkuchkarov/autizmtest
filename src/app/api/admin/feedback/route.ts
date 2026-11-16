import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/content-admin";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}
