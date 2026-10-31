import { NextResponse } from "next/server";
import { z } from "zod";
import type { Child, DiaryEntry } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/user-auth";

const currentYear = () => new Date().getFullYear();

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt HH:MM ko'rinishida bo'lishi kerak.");

export const childSchema = z.object({
  name: z.string().trim().min(1).max(40),
  birthYear: z.number().int().refine((y) => y >= currentYear() - 18 && y <= currentYear(), "Tug'ilgan yil noto'g'ri."),
  gender: z.enum(["Qiz", "O'g'il"]),
  /** Tug'ilgan oy (1–12) — test bolaning aniq yoshiga moslanadi */
  birthMonth: z.number().int().min(1).max(12).nullish(),
  avatar: z.string().trim().min(1).max(40),
  /** Kunlik mashg'ulot va kundalik eslatmasi vaqti "HH:MM" */
  practiceTime: hhmm.nullish(),
  diaryTime: hhmm.nullish(),
  remindersOn: z.boolean().optional(),
});

export function toPublicChild(c: Child) {
  return {
    id: c.id,
    name: c.name,
    birthYear: c.birthYear,
    birthMonth: c.birthMonth,
    gender: c.gender,
    avatar: c.avatar,
    practiceTime: c.practiceTime,
    diaryTime: c.diaryTime,
    remindersOn: c.remindersOn,
  };
}

/** Sessiya foydalanuvchisini qaytaradi yoki 401 javobini. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, denied: NextResponse.json({ error: "Avtorizatsiya talab qilinadi." }, { status: 401 }) } as const;
  return { user, denied: null } as const;
}

export function validationError(error: z.ZodError) {
  return NextResponse.json({ error: error.issues.map((i) => i.message).join("; ") }, { status: 400 });
}

/* --------------------------------- Kundalik --------------------------------- */

const level3 = z.number().int().min(0).max(2);

export const diarySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD ko'rinishida bo'lishi kerak."),
  bedTime: hhmm.nullish(),
  wakeTime: hhmm.nullish(),
  nightWakings: level3.nullish(),
  mood: z.number().int().min(1).max(5).nullish(),
  breakfast: z.enum(["full", "little", "none"]).nullish(),
  appetite: z.enum(["good", "normal", "poor"]).nullish(),
  meltdowns: level3.nullish(),
  selfHarm: z.boolean().nullish(),
  repetitive: z.enum(["low", "mid", "high"]).nullish(),
  eyeContact: z.enum(["good", "some", "none"]).nullish(),
  requests: z.enum(["words", "gestures", "none"]).nullish(),
  sick: z.boolean().nullish(),
  constipation: z.boolean().nullish(),
  medicine: z.boolean().nullish(),
  note: z.string().trim().max(2000).nullish(),
});

export function toPublicDiary(e: DiaryEntry) {
  return {
    date: e.date,
    bedTime: e.bedTime,
    wakeTime: e.wakeTime,
    nightWakings: e.nightWakings,
    mood: e.mood,
    breakfast: e.breakfast,
    appetite: e.appetite,
    meltdowns: e.meltdowns,
    selfHarm: e.selfHarm,
    repetitive: e.repetitive,
    eyeContact: e.eyeContact,
    requests: e.requests,
    sick: e.sick,
    constipation: e.constipation,
    medicine: e.medicine,
    note: e.note,
    updatedAt: e.updatedAt.toISOString(),
  };
}

/** Bola shu foydalanuvchinikimi — boshqa birovning kundaligini o'qish/yozishga yo'l qo'ymaymiz. */
export async function ownChild(userId: string, childId: string) {
  return prisma.child.findFirst({ where: { id: childId, userId }, select: { id: true } });
}
