import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";

const USER_SESSION_COOKIE = "user_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 kun

/** Bitta kod uchun noto'g'ri urinishlar chegarasi (OTP tasdiqlash va Telegram bot) */
export const OTP_MAX_ATTEMPTS = 5;

/** Telefonni normalizatsiya: +998XXXXXXXXX (bo'shliqsiz) */
export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

export async function createUserSession(userId: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.userSession.create({
    data: { userId, token, expiresAt },
  });
  return { token, expiresAt };
}

export async function setUserSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearUserSessionCookie() {
  const cookieStore = await cookies();
  // Bazadagi sessiyani ham o'chiramiz — cookie o'g'irlangan bo'lsa ham qayta ishlatib bo'lmaydi
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (token) await prisma.userSession.deleteMany({ where: { token } });
  cookieStore.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

/** Mobil ilova sessiya tokenini `Authorization: Bearer <token>` sarlavhasida yuboradi. */
async function getBearerToken(): Promise<string | null> {
  const auth = (await headers()).get("authorization");
  const match = auth?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function getSessionUser() {
  const token = (await getBearerToken()) ?? (await cookies()).get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // deleteMany: parallel so'rov uni allaqachon o'chirgan bo'lsa ham xato bermaydi
    await prisma.userSession.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
}

/** Mobil ilovadan chiqish: Bearer tokenga tegishli sessiyani o'chiradi. */
export async function deleteBearerSession(): Promise<void> {
  const token = await getBearerToken();
  if (token) await prisma.userSession.deleteMany({ where: { token } });
}
