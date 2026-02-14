/**
 * Eskiz.uz SMS API – token olish va SMS yuborish.
 * .env: ESKIZ_EMAIL, ESKIZ_PASSWORD, ESKIZ_FROM (ixtiyoriy, default: 4546)
 */

const BASE = "https://notify.eskiz.uz/api";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 25; // ~25 kun

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) {
    throw new Error("ESKIZ_EMAIL va ESKIZ_PASSWORD .env da belgilangan bo‘lishi kerak.");
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Eskiz auth xato (${res.status}): ${text.slice(0, 200)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Eskiz auth javobi JSON emas: " + text.slice(0, 100));
  }
  const token =
    (data as { data?: { token?: string }; token?: string })?.data?.token ??
    (data as { token?: string })?.token;
  if (!token || typeof token !== "string") {
    throw new Error("Eskiz javobida token topilmadi. Javob: " + text.slice(0, 150));
  }
  tokenCache = {
    token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return token;
}

/**
 * Telefon: 998901234567 (998 + 9 raqam, + siz).
 * SMS yuboradi; xato bo‘lsa throw.
 */
export async function sendSms(phone: string, message: string): Promise<void> {
  const token = await getToken();
  const fromRaw = process.env.ESKIZ_FROM || "4546";
  const from = /^\d+$/.test(fromRaw) ? parseInt(fromRaw, 10) : fromRaw;
  let mobilePhone = phone.replace(/\D/g, "");
  if (mobilePhone.length === 9 && mobilePhone.startsWith("9")) {
    mobilePhone = "998" + mobilePhone;
  }
  if (!/^998\d{9}$/.test(mobilePhone)) {
    throw new Error("Telefon 998XXXXXXXXX ko‘rinishida bo‘lishi kerak.");
  }
  const body: Record<string, unknown> = {
    mobile_phone: mobilePhone,
    message,
    from,
  };
  if (process.env.ESKIZ_CALLBACK_URL) {
    body.callback_url = process.env.ESKIZ_CALLBACK_URL;
  }
  const res = await fetch(`${BASE}/message/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const resText = await res.text();
  if (res.status === 401 || res.status === 403) {
    tokenCache = null;
    return sendSms(phone, message);
  }
  if (!res.ok) {
    throw new Error(`Eskiz SMS xato (${res.status}): ${resText.slice(0, 300)}`);
  }
  let json: { message?: string; status?: string; id?: unknown } | null = null;
  try {
    json = JSON.parse(resText);
  } catch {
    // 200 with non-JSON is ok
  }
  if (json?.message && typeof json.message === "string" && json.message.toLowerCase().includes("error")) {
    throw new Error("Eskiz: " + (json.message || resText.slice(0, 150)));
  }
}
