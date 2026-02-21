import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [
    totalTests,
    totalPdf,
    last7,
    paymentsAgg,
    recentPayments,
    adminLogins,
  ] = await Promise.all([
    prisma.userEvent.count({ where: { type: "test_open" } }),
    prisma.userEvent.count({ where: { type: "pdf_download" } }),
    prisma.userEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { type: true },
    }),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: "paid" },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: {
        id: true,
        phone: true,
        amount: true,
        status: true,
        merchantTransId: true,
        createdAt: true,
        paidAt: true,
      },
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
    payments: {
      totalCount: paymentsAgg._count.id,
      totalAmount: paymentsAgg._sum.amount ?? 0,
      recent: recentPayments,
    },
    adminLogins: adminLogins.map((e) => ({
      email: (e.metadata as Record<string, unknown>)?.email ?? "—",
      createdAt: e.createdAt,
    })),
  });
}
