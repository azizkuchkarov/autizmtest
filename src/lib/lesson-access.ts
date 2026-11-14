import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPaymentAmount, getPaymentPeriodDays, paymentsVisible } from "@/lib/payment-config";
import { getSessionUser } from "@/lib/user-auth";

export type LessonAccess = {
  /** To'lov UI shu mijozga ko'rinadimi (PAYMENTS_UI va ilova versiyasi) */
  visible: boolean;
  /** Darslar yopiq: to'lov ko'rinadi va foydalanuvchining oylik kirishi yo'q */
  locked: boolean;
  /** Kirish shu vaqtgacha (ISO), to'lanmagan bo'lsa null */
  paidUntil: string | null;
  amount: number | null;
  days: number;
};

/** Joriy so'rov egasining Darslar bo'limiga kirish holati. */
export async function getLessonAccess(): Promise<LessonAccess> {
  const [visible, user] = await Promise.all([paymentsVisible(), getSessionUser().catch(() => null)]);
  const paidUntil = user
    ? (await prisma.user.findUnique({ where: { id: user.id }, select: { lessonsPaidUntil: true } }))?.lessonsPaidUntil ?? null
    : null;
  const active = !!paidUntil && paidUntil > new Date();
  return {
    visible,
    locked: visible && !active,
    paidUntil: active ? paidUntil!.toISOString() : null,
    amount: visible ? getPaymentAmount() : null,
    days: getPaymentPeriodDays(),
  };
}

/**
 * To'lov tasdiqlanganda kirish muddatini uzaytiradi: hozirgi muddat tugamagan bo'lsa — uning ustiga qo'shiladi.
 * Tranzaksiya ichida chaqiriladi.
 */
export async function extendLessonAccess(tx: Prisma.TransactionClient, userId: string, days: number): Promise<Date> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { lessonsPaidUntil: true } });
  const now = new Date();
  const from = user?.lessonsPaidUntil && user.lessonsPaidUntil > now ? user.lessonsPaidUntil : now;
  const until = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  await tx.user.update({ where: { id: userId }, data: { lessonsPaidUntil: until } });
  return until;
}
