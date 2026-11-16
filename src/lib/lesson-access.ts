import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClientInfo, getPaymentAmount, getPaymentPeriodDays, paymentsVisibleFor, purchaseAllowedFor } from "@/lib/payment-config";
import { getSessionUser } from "@/lib/user-auth";

export type LessonAccess = {
  /** To'lov UI shu mijozga ko'rinadimi (PAYMENTS_UI va ilova versiyasi) */
  visible: boolean;
  /** Darslar yopiq: to'lov ko'rinadi va foydalanuvchining oylik kirishi yo'q */
  locked: boolean;
  /** Shu mijozda sotib olish tugmasi ko'rsatiladimi (ilovada odatda yo'q — faqat qulf) */
  purchasable: boolean;
  /** Kirish shu vaqtgacha (ISO), to'lanmagan bo'lsa null */
  paidUntil: string | null;
  amount: number | null;
  days: number;
};

/** Joriy so'rov egasining Darslar bo'limiga kirish holati. */
export async function getLessonAccess(): Promise<LessonAccess> {
  const [client, user] = await Promise.all([getClientInfo(), getSessionUser().catch(() => null)]);
  const visible = paymentsVisibleFor(client);
  const purchasable = visible && purchaseAllowedFor(client);
  const paidUntil = user
    ? (await prisma.user.findUnique({ where: { id: user.id }, select: { lessonsPaidUntil: true } }))?.lessonsPaidUntil ?? null
    : null;
  const active = !!paidUntil && paidUntil > new Date();
  return {
    visible,
    locked: visible && !active,
    purchasable,
    paidUntil: active ? paidUntil!.toISOString() : null,
    // Narx faqat sotib olish mumkin bo'lgan joyda beriladi
    amount: purchasable ? getPaymentAmount() : null,
    days: getPaymentPeriodDays(),
  };
}

/**
 * To'lov tasdiqlanganda kirish muddatini uzaytiradi: hozirgi muddat tugamagan bo'lsa — uning ustiga qo'shiladi.
 * Tranzaksiya ichida chaqiriladi.
 */
export async function extendLessonAccess(tx: Prisma.TransactionClient, userId: string, days: number): Promise<Date> {
  // Ikki to'lov bir vaqtda tasdiqlansa, biri ikkinchisining muddatini ustidan yozib yubormasligi uchun foydalanuvchi qatori qulflanadi
  await tx.$queryRaw`SELECT 1 FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  const user = await tx.user.findUnique({ where: { id: userId }, select: { lessonsPaidUntil: true } });
  const now = new Date();
  const from = user?.lessonsPaidUntil && user.lessonsPaidUntil > now ? user.lessonsPaidUntil : now;
  const until = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
  await tx.user.update({ where: { id: userId }, data: { lessonsPaidUntil: until } });
  return until;
}
