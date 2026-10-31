import { cert, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/db";

/*
 * Mobil ilovaga server push: Firebase Cloud Messaging orqali (iOS ham, Android ham — iOS uchun APNs kaliti Firebase'da).
 * Kalit: FIREBASE_SERVICE_ACCOUNT (service account JSON matni) yoki GOOGLE_APPLICATION_CREDENTIALS (fayl yo'li).
 */

/** FCM bitta so'rovda 500 tagacha tokenga yuboradi */
const CHUNK = 500;
/** Bu xatolar — ilova o'chirilgan yoki token eskirgan: token bazadan tozalanadi */
const STALE_ERRORS = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

/** .env o'quvchilari private_key ichidagi "\n" ni haqiqiy yangi qatorga aylantirishi mumkin — JSON uchun qaytariladi. */
function parseServiceAccount(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(raw.replace(/\r?\n/g, "\\n"));
  }
}

function firebaseApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) return initializeApp({ credential: cert(parseServiceAccount(json)) });
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return initializeApp({ credential: applicationDefault() });
  throw new Error("Firebase sozlanmagan: FIREBASE_SERVICE_ACCOUNT yoki GOOGLE_APPLICATION_CREDENTIALS kerak.");
}

/** Bosilganda ochiladigan ekranlar (mobile/src/lib/reminders.ts dagi ro'yxat bilan bir xil). */
export const PUSH_TARGETS = ["/", "/exercises", "/lessons", "/test", "/skills/run", "/diary"] as const;
export type PushTarget = (typeof PUSH_TARGETS)[number];

export type PushMessage = { title: string; body: string; url: PushTarget };
export type PushAudience = "all" | "uz" | "ru";

/** Barcha (yoki bir tildagi) qurilmalarga yuboradi; o'chirilgan ilovalarning tokenlarini tozalaydi. */
export async function sendPushToAll(message: PushMessage, audience: PushAudience) {
  const messaging = getMessaging(firebaseApp());
  const tokens = await prisma.pushToken.findMany({
    where: audience === "all" ? {} : { locale: audience },
    select: { token: true },
  });

  let sent = 0;
  const failed: string[] = [];
  const stale: string[] = [];

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const chunk = tokens.slice(i, i + CHUNK).map((t) => t.token);
    const res = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: { title: message.title, body: message.body },
      data: { url: message.url },
      android: { priority: "high", notification: { channelId: "reminders", sound: "default" } },
      apns: { payload: { aps: { sound: "default" } } },
    });
    sent += res.successCount;
    res.responses.forEach((r, j) => {
      if (r.success) return;
      const code = r.error?.code ?? "unknown";
      if (STALE_ERRORS.has(code)) stale.push(chunk[j]);
      else failed.push(code);
    });
  }

  if (stale.length) await prisma.pushToken.deleteMany({ where: { token: { in: stale } } });
  return { total: tokens.length, sent, failed: failed.length, removed: stale.length, errors: [...new Set(failed)].slice(0, 5) };
}

export async function pushAudienceStats() {
  const rows = await prisma.pushToken.groupBy({ by: ["locale", "platform"], _count: { _all: true } });
  const count = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).reduce((n, r) => n + r._count._all, 0);
  return {
    all: count(() => true),
    uz: count((r) => r.locale === "uz"),
    ru: count((r) => r.locale === "ru"),
    ios: count((r) => r.platform === "ios"),
    android: count((r) => r.platform === "android"),
  };
}
