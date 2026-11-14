/**
 * To'lov sozlamalari (.env). Skrining testlari bepul; to'lov faqat Darslar bo'limi (video va ovozli darslar) uchun.
 *   PAYMENTS_UI=show | hide        — to'lov UI ko'rinadimi (default: hide). hide bo'lsa Darslar bepul ochiladi,
 *                                    Click endpointlari esa ishlashda davom etadi (faqat UI yashiriladi).
 *   PAYMENTS_MIN_VERSION=1.1.0     — mobil ilova shu versiyadan past bo'lsa to'lov ko'rinmaydi (ixtiyoriy)
 *   PAYMENTS_HIDE_VERSIONS=1.2.0   — vergul bilan: shu versiyalarda to'lov yashiriladi, masalan App Store review'dagi build (ixtiyoriy)
 *   PAYMENT_AMOUNT=99000           — Darslar bo'limiga oylik kirish narxi, so'm
 *   PAYMENT_PERIOD_DAYS=30         — bitta to'lov necha kunlik kirish beradi
 * Veb sayt faqat PAYMENTS_UI ga bo'ysunadi; mobil ilova versiyasini X-App-Version sarlavhasida yuboradi.
 */

import { headers } from "next/headers";

export const APP_VERSION_HEADER = "x-app-version";
export const APP_PLATFORM_HEADER = "x-app-platform";

export function getPaymentPeriodDays(): number {
  const n = parseInt(process.env.PAYMENT_PERIOD_DAYS ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function getPaymentAmount(): number {
  const v = process.env.PAYMENT_AMOUNT;
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 1_000;
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
export function paymentsVisibleFor(client: ClientInfo): boolean {
  if ((process.env.PAYMENTS_UI ?? "hide").trim().toLowerCase() !== "show") return false;
  if (client.platform === "web") return true;

  // Mobil: versiya noma'lum bo'lsa (eski build) — xavfsiz tomonga, yashiriladi
  if (!client.version) return false;
  const hidden = (process.env.PAYMENTS_HIDE_VERSIONS ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (hidden.some((v) => compareVersions(v, client.version!) === 0)) return false;
  const min = process.env.PAYMENTS_MIN_VERSION?.trim();
  if (min && compareVersions(client.version, min) < 0) return false;
  return true;
}

export async function paymentsVisible(): Promise<boolean> {
  return paymentsVisibleFor(await getClientInfo());
}

/** Click kalitlari yo'q va production emas — lokal test uchun to'lov darhol "paid" bo'ladi. */
export function isPaymentDevSkip(): boolean {
  return process.env.NODE_ENV !== "production" && !(process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID);
}
