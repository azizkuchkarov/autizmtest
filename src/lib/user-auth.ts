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

const PIN_SETUP_COOKIE = "pin_setup";

export async function createPinSetupToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 daqiqa
  await prisma.pinSetupToken.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function setPinSetupCookie(token: string) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  const cookieStore = await cookies();
  cookieStore.set(PIN_SETUP_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getPinSetupUserId(): Promise<string | null> {
  const token = (await cookies()).get(PIN_SETUP_COOKIE)?.value;
  if (!token) return null;
  const record = await prisma.pinSetupToken.findUnique({
    where: { token },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.pinSetupToken.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return record.userId;
}

export async function consumePinSetupToken(): Promise<void> {
  const token = (await cookies()).get(PIN_SETUP_COOKIE)?.value;
  if (token) {
    await prisma.pinSetupToken.delete({ where: { token } }).catch(() => {});
    const cookieStore = await cookies();
    cookieStore.set(PIN_SETUP_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });
  }
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
