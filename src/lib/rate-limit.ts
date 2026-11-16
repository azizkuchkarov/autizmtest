import { headers } from "next/headers";
import { NextResponse } from "next/server";

/*
 * Oddiy in-memory cheklov (fixed window). Bitta PM2 jarayonida to'g'ri ishlaydi; server qayta ishga tushsa hisob nolga tushadi.
 * Bu "eng yaxshi harakat" himoyasi — asosiy cheklovlar bazada (masalan, OTP: telefon raqami bo'yicha).
 * O'zbekistonda mobil abonentlar ko'pincha bitta umumiy IP orqali chiqadi (CGNAT) — IP chegaralari keng qo'yiladi.
 */

type Bucket = { count: number; resetAt: number };

const store = globalThis as unknown as { __rateLimitBuckets?: Map<string, Bucket> };
const buckets = (store.__rateLimitBuckets ??= new Map<string, Bucket>());

/** Shundan ko'p kalit yig'ilsa, muddati o'tganlari tozalanadi */
const SWEEP_AT = 20_000;

/** So'rovni hisobga oladi: true — ruxsat, false — oynadagi chegaradan oshdi. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > SWEEP_AT) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/**
 * Mijoz IP manzili — faqat X-Real-IP: nginx uni `proxy_set_header X-Real-IP $remote_addr;` bilan o'zi yozadi
 * (mijoz yuborgan qiymatni almashtiradi). X-Forwarded-For ishlatilmaydi — uning boshini mijoz istalgancha yozishi mumkin.
 * Sarlavha bo'lmasa null qaytadi va IP cheklovi qo'llanmaydi: hammani bitta "unknown" chelakka solib, barchani bloklab qo'ymaslik uchun.
 * IPv6 manzillar /64 tarmoq bo'yicha guruhlanadi — abonent o'z tarmog'ida manzilni almashtirib cheklovni chetlab o'tmasin.
 */
export async function clientIp(): Promise<string | null> {
  const raw = (await headers()).get("x-real-ip")?.trim();
  if (!raw) return null;
  if (!raw.includes(":")) return raw;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(raw);
  if (mapped) return mapped[1];
  return ipv6Prefix64(raw.split("%")[0]);
}

function ipv6Prefix64(ip: string): string {
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const missing = tail === undefined ? 0 : Math.max(0, 8 - left.length - right.length);
  const groups = [...left, ...Array<string>(missing).fill("0"), ...right];
  return `${groups
    .slice(0, 4)
    .map((g) => g.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

export function tooManyRequests(message = "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.") {
  return NextResponse.json({ error: message }, { status: 429 });
}
