import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ScoreResponse } from "@/types/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { payment: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment topilmadi." }, { status: 404 });
    }

    const rawScoring = assessment.scoring;
    if (rawScoring === null || rawScoring === undefined) {
      return NextResponse.json(
        { error: "Natija saqlanmagan yoki o‘chirilgan." },
        { status: 404 }
      );
    }
    const scoring = rawScoring as unknown as ScoreResponse["scoring"];
    const answersRaw = assessment.answers;
    const answers =
      answersRaw && typeof answersRaw === "object" && !Array.isArray(answersRaw)
        ? (answersRaw as Record<string, number>)
        : null;

    const response: ScoreResponse = {
      testType: (assessment.testType as "screening" | "progress") ?? "screening",
      scoring,
      aiSummary: {
        status: assessment.aiSummaryStatus as "pending" | "ready" | "failed",
        payload: (assessment.aiSummaryPayload as ScoreResponse["aiSummary"]["payload"]) ?? null,
        error: assessment.aiSummaryError ?? null,
      },
      completedAt: assessment.createdAt?.toISOString?.() ?? null,
      ageGroup: assessment.ageGroup ?? null,
      answers,
      paidAmount: assessment.payment?.amount ?? null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
