import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/admin-auth";
import { requireAdmin, validationError } from "@/lib/content-admin";
import { prisma } from "@/lib/db";
import { invalidatePaymentSettings, PAYMENT_SETTINGS_KEY, paymentSettingsSchema } from "@/lib/payment-config";
import { logUserEvent } from "@/lib/user-event";

/** To'lov sozlamalarini saqlash: bazaga yoziladi va .env dan ustun turadi; restart kerak emas. */
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const admin = await getSessionAdmin();

  const parsed = paymentSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const settings = parsed.data;

  await prisma.appSetting.upsert({
    where: { key: PAYMENT_SETTINGS_KEY },
    create: { key: PAYMENT_SETTINGS_KEY, value: settings, updatedBy: admin?.email ?? null },
    update: { value: settings, updatedBy: admin?.email ?? null },
  });
  invalidatePaymentSettings();
  void logUserEvent("payment_settings_changed", { by: admin?.email ?? null, ...settings });

  return NextResponse.json({ ok: true, settings });
}

/** Admin sozlamalarini o'chirish: yana .env qiymatlari ishlatiladi. */
export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const admin = await getSessionAdmin();

  await prisma.appSetting.deleteMany({ where: { key: PAYMENT_SETTINGS_KEY } });
  invalidatePaymentSettings();
  void logUserEvent("payment_settings_changed", { by: admin?.email ?? null, reset: true });
  return NextResponse.json({ ok: true });
}
