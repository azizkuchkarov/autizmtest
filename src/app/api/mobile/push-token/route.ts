import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, validationError } from "@/lib/mobile-api";

/*
 * Mobil ilovaning push tokeni. Ilova kirganda va til o'zgarganda PUT, chiqishdan oldin DELETE yuboradi.
 * Bitta qurilmaga boshqa akkaunt bilan kirilsa, token yangi foydalanuvchiga o'tadi.
 */

/** Firebase (FCM) registratsiya tokeni */
const tokenSchema = z.string().trim().min(20).max(4096).regex(/^\S+$/, "Push token noto'g'ri.");

const putSchema = z.object({
  token: tokenSchema,
  platform: z.enum(["ios", "android"]),
  locale: z.enum(["uz", "ru"]),
});

export async function PUT(req: Request) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const { token, platform, locale } = parsed.data;
  await prisma.pushToken.upsert({
    where: { token },
    create: { token, userId: user.id, platform, locale },
    update: { userId: user.id, platform, locale },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { user, denied } = await requireUser();
  if (denied) return denied;

  const parsed = z.object({ token: tokenSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  await prisma.pushToken.deleteMany({ where: { token: parsed.data.token, userId: user.id } });
  return NextResponse.json({ ok: true });
}
