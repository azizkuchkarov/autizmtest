import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getScreeningConfig } from "@/data";
import { getProgressConfig } from "@/data/progress";
import { getScreeningSchemaV2 } from "@/data/screening-v2";
import type { AgeGroupId } from "@/data";
import type { TestType } from "@/lib/test-types";
import { scoreAssessment, type Question } from "@/lib/scoring";
import { scoreTest } from "@/lib/screening-v2-scoring";
import { scoreMonitoringTest, toMonitoringAgeGroup } from "@/lib/monitoringScoring";
import type { ScoreResponse } from "@/types/api";
import { logUserEvent } from "@/lib/user-event";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const testType = (body?.testType as TestType) ?? "screening";
    const ageGroup = body?.ageGroup as AgeGroupId | undefined;
    const answers = body?.answers as Record<string, 0 | 1 | 2 | 3 | undefined> | undefined;
    const paymentId = typeof body?.paymentId === "string" && body.paymentId ? body.paymentId : undefined;
    const respondent = typeof body?.respondent === "string" && body.respondent ? body.respondent : undefined;
    const childGender = typeof body?.childGender === "string" && body.childGender ? body.childGender : undefined;
    const phoneRaw = typeof body?.phone === "string" ? body.phone.replace(/\s+/g, "").trim() : "";
    const phone = /^\+998\d{9}$/.test(phoneRaw) ? phoneRaw : undefined;

    if (!ageGroup || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "ageGroup va answers majburiy." }, { status: 400 });
    }

    let scoring: object;

    if (testType === "progress") {
      const config = getProgressConfig(ageGroup);
      if (config.questions.length === 0) {
        return NextResponse.json(
          { error: "Ushbu test uchun savollar hali kiritilmagan." },
          { status: 400 }
        );
      }
      const progressQuestionIds = new Set(config.questions.map((q) => q.id));
      const progressAnswers: Record<string, 0 | 1 | 2 | 3> = {};
      for (const [key, val] of Object.entries(answers)) {
        if (
          progressQuestionIds.has(key) &&
          (val === 0 || val === 1 || val === 2 || val === 3)
        )
          progressAnswers[key] = val;
      }
      const monitoringAge = toMonitoringAgeGroup(ageGroup);
      const monitoringResult = scoreMonitoringTest({
        ageGroup: monitoringAge,
        answers: progressAnswers,
      });
      scoring = monitoringResult as object;
    } else {
      // Yangi screening algoritm (v2)
      const schema = getScreeningSchemaV2(ageGroup);
      if (schema.blocks.length === 0 || schema.blocks.every((b) => b.questions.length === 0)) {
        return NextResponse.json(
          { error: "Ushbu test uchun savollar hali kiritilmagan." },
          { status: 400 }
        );
      }
      // Faqat schema dagi savol id larini qabul qilish
      const allQuestionIds = new Set(
        schema.blocks.flatMap((b) => b.questions.map((q) => q.id))
      );
      const validAnswers: Record<string, 0 | 1 | 2 | 3 | null | undefined> = {};
      for (const [key, val] of Object.entries(answers)) {
        if (allQuestionIds.has(key)) {
          if (val === 0 || val === 1 || val === 2 || val === 3) {
            validAnswers[key] = val;
          } else {
            validAnswers[key] = null;
          }
        }
      }
      scoring = scoreTest(schema, validAnswers, ageGroup) as object;
    }

    const assessment = await prisma.assessment.create({
      data: {
        testType,
        ageGroup,
        answers: answers as object,
        scoring,
        aiSummaryStatus: "pending",
        ...(paymentId && { paymentId }),
        ...(respondent && { respondent }),
        ...(childGender && { childGender }),
      },
    });

    void logUserEvent("test_completed", {
      assessmentId: assessment.id,
      testType,
      ageGroup,
      phone: phone ?? null,
      respondent: respondent ?? null,
      childGender: childGender ?? null,
    });

    const response: ScoreResponse = {
      testType,
      scoring: scoring as ScoreResponse["scoring"],
      aiSummary: {
        status: "pending",
        payload: null,
        error: null,
      },
    };

    return NextResponse.json({ assessmentId: assessment.id, ...response }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
