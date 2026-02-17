import { NextResponse } from "next/server";
import { getScreeningConfig } from "@/data";
import type { AgeGroupId } from "@/data";
import { scoreAssessment, type AnswerValue, type Question } from "@/lib/scoring";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ageGroup = body?.ageGroup as AgeGroupId | undefined;
    const answers = body?.answers as Record<string, AnswerValue | undefined> | undefined;

    if (!ageGroup || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "ageGroup va answers (object) majburiy." },
        { status: 400 }
      );
    }

    const config = getScreeningConfig(ageGroup);
    const questions: Question[] = config.questions.map((q) => ({
      id: q.id,
      domain: q.domain as Question["domain"],
      weight: q.weight,
      isRedFlag: q.isRedFlag,
      text: q.text,
      example: q.example,
      explanation: q.explanation,
    }));

    const result = scoreAssessment({
      ageGroup,
      answers,
      questions,
      redFlagTriggerAnswer: body?.redFlagTriggerAnswer,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
