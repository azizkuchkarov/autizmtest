import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [totalTests, totalPdf, last7] = await Promise.all([
    prisma.userEvent.count({ where: { type: "test_open" } }),
    prisma.userEvent.count({ where: { type: "pdf_download" } }),
    prisma.userEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { type: true },
    }),
  ]);

  return NextResponse.json({
    totalTests,
    totalPdf,
    last7,
  });
}
