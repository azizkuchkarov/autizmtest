import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { bandForMonths, itemsFor } from "@/lib/screening-v3/items";
import { legacyAgeGroup, scoreScreeningV3, scoreSkills, skillsBand } from "@/lib/screening-v3/score";
import { skillItemsFor } from "@/lib/screening-v3/skills";
import { logUserEvent } from "@/lib/user-event";
import { getSessionUser } from "@/lib/user-auth";

/*
 * Skrining v3 va oylik ko'nikmalar testi: natija serverda qayta hisoblanadi (brauzerdagi hisob bilan bir xil kod).
 * Akkauntga kirgan ota-onaning natijasi bolaga bog'lanadi.
 */

const answer = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(-1)]);

const bodySchema = z.object({
  testType: z.enum(["screening", "skills"]),
  ageMonths: z.number().int().min(12).max(180),
  answers: z.record(z.string().max(40), answer),
  followUps: z.record(z.string().max(40), z.array(z.boolean()).max(5)).optional(),
  childId: z.string().optional(),
  childGender: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ma'lumot noto'g'ri." }, { status: 400 });
  const { testType, ageMonths, followUps, childGender } = parsed.data;

  const sessionUser = parsed.data.childId ? await getSessionUser().catch(() => null) : null;
  const childId =
    sessionUser && parsed.data.childId && (await prisma.child.findFirst({ where: { id: parsed.data.childId, userId: sessionUser.id }, select: { id: true } }))
      ? parsed.data.childId
      : undefined;
  const phoneRaw = parsed.data.phone?.replace(/\s+/g, "") ?? "";
  const phone = /^\+998\d{9}$/.test(phoneRaw) ? phoneRaw : undefined;

  // Faqat shu yoshga tegishli savollar qabul qilinadi
  let scoring: object;
  let answers: Record<string, number>;
  if (testType === "screening") {
    const band = bandForMonths(ageMonths);
    if (!band) return NextResponse.json({ error: "Skrining 16 oylikdan boshlab o'tkaziladi." }, { status: 400 });
    const allowed = new Set(itemsFor(band, ageMonths).map((i) => i.id));
    answers = Object.fromEntries(Object.entries(parsed.data.answers).filter(([id]) => allowed.has(id)));
    if (Object.keys(answers).length < allowed.size * 0.8) return NextResponse.json({ error: "Savollarning ko'pchiligiga javob berilmagan." }, { status: 400 });
    const fu = Object.fromEntries(Object.entries(followUps ?? {}).filter(([id]) => allowed.has(id)));
    scoring = scoreScreeningV3({ months: ageMonths, answers: answers as never, followUps: fu });
  } else {
    const allowed = new Set(skillItemsFor(skillsBand(ageMonths), ageMonths).map((i) => i.id));
    answers = Object.fromEntries(Object.entries(parsed.data.answers).filter(([id]) => allowed.has(id)));
    if (Object.keys(answers).length < allowed.size * 0.8) return NextResponse.json({ error: "Savollarning ko'pchiligiga javob berilmagan." }, { status: 400 });
    scoring = scoreSkills({ months: ageMonths, answers: answers as never });
  }

  const assessment = await prisma.assessment.create({
    data: {
      testType,
      ageGroup: legacyAgeGroup(ageMonths),
      answers: { version: 3, ageMonths, answers, followUps: followUps ?? {} },
      scoring,
      ...(childGender && { childGender }),
      ...(phone && { phone }),
      ...(childId && { childId }),
    },
  });

  void logUserEvent("test_completed", { assessmentId: assessment.id, testType, version: 3, ageMonths, phone: phone ?? null });

  return NextResponse.json({ assessmentId: assessment.id, scoring }, { status: 201 });
}
