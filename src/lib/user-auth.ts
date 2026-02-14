import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const USER_SESSION_COOKIE = "user_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 kun

/** Telefonni normalizatsiya: +998XXXXXXXXX (bo'shliqsiz) */
export function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

/** 4 yoki 6 raqamli PIN tekshiruvi */
export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin) || /^\d{6}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
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
  cookieStore.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

export async function getSessionUser() {
  const token = (await cookies()).get(USER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.userSession.delete({ where: { token } });
    return null;
  }
  return session.user;
}
