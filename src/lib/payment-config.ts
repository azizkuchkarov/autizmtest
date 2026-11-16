/**
 * To'lov sozlamalari. Skrining testlari bepul; to'lov faqat Darslar bo'limidagi video darslar uchun.
 *
 * Asosiy joy — admin panel (/admin/payments): sozlamalar bazada (AppSetting "payments") saqlanadi va bir necha
 * soniyada kuchga kiradi, restart kerak emas. Admin hali saqlamagan bo'lsa, quyidagi .env qiymatlari ishlatiladi:
 *   PAYMENTS_UI=show | hide        — to'lov yoqilganmi (default: hide). hide bo'lsa Darslar bepul ochiladi,
 *                                    Click endpointlari esa ishlashda davom etadi (faqat UI yashiriladi).
 *   PAYMENTS_MIN_VERSION=1.1.0     — mobil ilova shu versiyadan past bo'lsa to'lov ko'rinmaydi (ixtiyoriy)
 *   PAYMENTS_HIDE_VERSIONS=1.2.0   — vergul bilan: shu versiyalarda to'lov yashiriladi, masalan App Store review'dagi build (ixtiyoriy)
 *   PAYMENT_AMOUNT=99000           — Darslar bo'limiga oylik kirish narxi, so'm
 *   PAYMENT_PERIOD_DAYS=30         — bitta to'lov necha kunlik kirish beradi
 *   PAYMENTS_IN_APP=hide | show    — ilova ichida Click tugmasi (default: hide). hide bo'lsa ilovada darslar qulf bilan
 *                                    ko'rinadi, lekin sotib olish tugmasi yo'q (App Store / Google Play qoidalari);
 *                                    saytda to'langan kirish ilovada ham ishlaydi (akkaunt bitta).
 * Click kalitlari (CLICK_*) faqat .env da qoladi.
 */

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const APP_VERSION_HEADER = "x-app-version";
export const APP_PLATFORM_HEADER = "x-app-platform";

export const PAYMENT_SETTINGS_KEY = "payments";

export const paymentSettingsSchema = z.object({
  /** To'lov yoqilgan (PAYMENTS_UI=show) */
  enabled: z.boolean(),
  /** Ilova ichida Click tugmasi (PAYMENTS_IN_APP=show) */
  inApp: z.boolean(),
  /** Oylik narx, so'm */
  amount: z.number().int().min(100).max(100_000_000),
  /** Bitta to'lov necha kunlik kirish beradi */
  periodDays: z.number().int().min(1).max(3650),
  /** Shu versiyadan past ilovalarda to'lov ko'rinmaydi */
  minVersion: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+){0,3}$/)
    .nullable(),
  /** Shu versiyalarda to'lov yashiriladi */
  hideVersions: z.array(z.string().trim().regex(/^\d+(\.\d+){0,3}$/)).max(50),
});

export type PaymentSettings = z.infer<typeof paymentSettingsSchema>;

function envList(v: string | undefined) {
  return (v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function envInt(v: string | undefined, fallback: number) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** .env dagi qiymatlar — admin panelda hali saqlanmagan bo'lsa ishlatiladi. */
export function envPaymentSettings(): PaymentSettings {
  const env = process.env;
  return {
    enabled: (env.PAYMENTS_UI ?? "hide").trim().toLowerCase() === "show",
    inApp: (env.PAYMENTS_IN_APP ?? "hide").trim().toLowerCase() === "show",
    amount: envInt(env.PAYMENT_AMOUNT, 1_000),
    periodDays: envInt(env.PAYMENT_PERIOD_DAYS, 30),
    minVersion: env.PAYMENTS_MIN_VERSION?.trim() || null,
    hideVersions: envList(env.PAYMENTS_HIDE_VERSIONS),
  };
}

const CACHE_MS = 5_000;
let cache: { at: number; value: PaymentSettings; fromDb: boolean } | null = null;

/** Amaldagi sozlamalar: bazadagi (admin) yoki .env. Bir necha soniya keshlanadi. */
export async function getPaymentSettingsWithSource(): Promise<{ settings: PaymentSettings; fromDb: boolean }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return { settings: cache.value, fromDb: cache.fromDb };
  const fallback = envPaymentSettings();
  let value = fallback;
  let fromDb = false;
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: PAYMENT_SETTINGS_KEY } });
    const parsed = row ? paymentSettingsSchema.partial().safeParse(row.value) : null;
    if (parsed?.success) {
      value = { ...fallback, ...parsed.data };
      fromDb = true;
    }
  } catch (e) {
    // Baza vaqtincha ishlamasa — .env bilan davom etamiz
    console.error("[payment settings]", e);
  }
  cache = { at: Date.now(), value, fromDb };
  return { settings: value, fromDb };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  return (await getPaymentSettingsWithSource()).settings;
}

/** Admin saqlagandan keyin shu jarayonda darhol kuchga kiradi (boshqa jarayonlarda — kesh muddati o'tgach). */
export function invalidatePaymentSettings() {
  cache = null;
}

/** Click kalitlari .env da bormi (admin panelda holatni ko'rsatish uchun; qiymatlar oshkor qilinmaydi). */
export function clickConfigured(): boolean {
  const e = process.env;
  return !!(e.CLICK_MERCHANT_ID && e.CLICK_SERVICE_ID && e.CLICK_SECRET_KEY && e.CLICK_MERCHANT_USER_ID);
}

/** "1.2.10" > "1.2.9": raqamli qismlar bo'yicha solishtiradi. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

export type ClientInfo = { platform: "web" | "ios" | "android" | "app"; version: string | null };

/**
 * So'rov kim tomonidan yuborilganini aniqlaydi.
 * Yangi ilovalar X-App-Platform/X-App-Version yuboradi. Eski buildlar (1.0.0 va undan oldingi) yubormaydi,
 * lekin Bearer token bilan keladi (veb esa cookie ishlatadi) — ular "app" (versiyasi noma'lum) deb olinadi.
 *
 * MA'LUM CHEKLOV (ataylab qabul qilingan): bu sarlavhalarni mijozning o'zi yuboradi va server ularni tekshira olmaydi.
 * paymentsVisibleFor() false bo'lgan mijozda Darslar ochiq (locked=false), shuning uchun istalgan odam o'zini eski build
 * deb ko'rsatib (masalan, `X-App-Platform: ios` versiyasiz yoki istalgan Bearer token bilan) dars videolarining havolalarini
 * olishi mumkin. Bu o'rnatilgan eski ilovalar va App Store tekshiruvidagi build ishlashi uchun qilingan; eski buildlar
 * ishlatilmay qolgach, PAYMENTS_UI=show da barcha mijozlar uchun qulf qo'yishni ko'rib chiqing.
 */
export async function getClientInfo(): Promise<ClientInfo> {
  const h = await headers();
  const p = h.get(APP_PLATFORM_HEADER)?.toLowerCase();
  const version = h.get(APP_VERSION_HEADER)?.trim() || null;
  if (p === "ios" || p === "android") return { platform: p, version };
  if (/^Bearer\s+\S+/i.test(h.get("authorization") ?? "")) return { platform: "app", version: null };
  return { platform: "web", version: null };
}

/** Shu mijoz uchun to'lov UI ko'rinadimi. */
export function paymentsVisibleFor(client: ClientInfo, s: PaymentSettings): boolean {
  if (!s.enabled) return false;
  if (client.platform === "web") return true;

  // Mobil: versiya noma'lum bo'lsa (eski build) — xavfsiz tomonga, yashiriladi
  if (!client.version) return false;
  if (s.hideVersions.some((v) => compareVersions(v, client.version!) === 0)) return false;
  if (s.minVersion && compareVersions(client.version, s.minVersion) < 0) return false;
  return true;
}

export async function paymentsVisible(): Promise<boolean> {
  const [client, s] = await Promise.all([getClientInfo(), getPaymentSettings()]);
  return paymentsVisibleFor(client, s);
}

/** Shu mijozda sotib olish (Click tugmasi) mumkinmi: saytda — ha; ilovada — faqat "ilova ichida to'lov" yoqilgan bo'lsa. */
export function purchaseAllowedFor(client: ClientInfo, s: PaymentSettings): boolean {
  if (client.platform === "web") return true;
  return s.inApp;
}

/** Click kalitlari yo'q va production emas — lokal test uchun to'lov darhol "paid" bo'ladi. */
export function isPaymentDevSkip(): boolean {
  return process.env.NODE_ENV !== "production" && !(process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID);
}
