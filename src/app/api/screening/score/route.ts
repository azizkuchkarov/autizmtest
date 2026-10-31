import { NextResponse } from "next/server";
import type { AgeGroupId } from "@/data";
import { getScreeningSchemaV2 } from "@/data/screening-v2";
import { scoreTest } from "@/lib/screening-v2-scoring";
import type { Answers } from "@/lib/screening-v2-types";

const AGE_GROUPS: AgeGroupId[] = ["AGE_1_5_2", "AGE_3_4", "AGE_5_6", "AGE_7_9"];

/**
 * Skrining natijasini hisoblash (saqlamasdan).
 * Ilova va /api/assessments bilan bir xil v2 algoritmi ishlatiladi — natijalar mos chiqishi uchun.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ageGroup = body?.ageGroup as AgeGroupId | undefined;
    const answers = body?.answers as Record<string, unknown> | undefined;

    if (!ageGroup || !AGE_GROUPS.includes(ageGroup) || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "ageGroup (AGE_1_5_2, AGE_3_4, AGE_5_6, AGE_7_9) va answers (object) majburiy." },
        { status: 400 }
      );
    }

    const schema = getScreeningSchemaV2(ageGroup);
    const questionIds = new Set(schema.blocks.flatMap((b) => b.questions.map((q) => q.id)));
    const validAnswers: Answers = {};
    for (const [key, val] of Object.entries(answers)) {
      if (questionIds.has(key) && (val === 0 || val === 1 || val === 2 || val === 3)) validAnswers[key] = val;
    }

    return NextResponse.json(scoreTest(schema, validAnswers, ageGroup), { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
