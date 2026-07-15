import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [totalTests, totalPdf, last7, adminLogins] = await Promise.all([
    prisma.userEvent.count({ where: { type: "test_open" } }),
    prisma.userEvent.count({ where: { type: "pdf_download" } }),
    prisma.userEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { type: true },
    }),
    prisma.userEvent.findMany({
      where: { type: "admin_login" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, metadata: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    totalTests,
    totalPdf,
    last7,
    adminLogins: adminLogins.map((e) => ({
      email: (e.metadata as Record<string, unknown>)?.email ?? "—",
      createdAt: e.createdAt,
    })),
  });
}
