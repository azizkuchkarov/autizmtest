import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/content-admin";
import { prisma } from "@/lib/db";
import { clickConfigured, envPaymentSettings, getPaymentSettingsWithSource } from "@/lib/payment-config";

/** To'lov bo'limi: amaldagi sozlamalar, statistika, so'nggi to'lovlar va faol obunachilar. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [{ settings, fromDb }, row, payments, active, activeCount, paid30] = await Promise.all([
    getPaymentSettingsWithSource(),
    prisma.appSetting.findUnique({ where: { key: "payments" }, select: { updatedAt: true, updatedBy: true } }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { phone: true } } },
    }),
    prisma.user.findMany({
      where: { lessonsPaidUntil: { gt: now } },
      orderBy: { lessonsPaidUntil: "asc" },
      take: 200,
      select: { id: true, phone: true, lessonsPaidUntil: true },
    }),
    prisma.user.count({ where: { lessonsPaidUntil: { gt: now } } }),
    prisma.payment.aggregate({
      where: { status: "paid", paidAt: { gte: monthAgo }, amount: { gt: 0 } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return NextResponse.json(
    {
      settings,
      source: fromDb ? "admin" : "env",
      updatedAt: row?.updatedAt?.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
      envDefaults: envPaymentSettings(),
      clickConfigured: clickConfigured(),
      stats: { activeSubscribers: activeCount, paidLast30Days: paid30._count, revenueLast30Days: paid30._sum.amount ?? 0 },
      payments: payments.map((p) => ({
        id: p.id,
        phone: p.user?.phone ?? p.phone,
        amount: p.amount,
        days: p.days,
        status: p.status,
        // Kim yaratgani: admin qo'lda bergan, lokal test yoki Click
        source: p.merchantTransId.startsWith("admin-") ? "admin" : "click",
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      active: active.map((u) => ({ id: u.id, phone: u.phone, paidUntil: u.lessonsPaidUntil!.toISOString() })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
