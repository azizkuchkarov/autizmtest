import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ScoreResponse, ScreeningV2Result } from "@/types/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;

    // Demo (namunaviy) natijalar — real bazaga tegmaydi
    if (
      assessmentId === "demo-0-20" ||
      assessmentId === "demo-20-40" ||
      assessmentId === "demo-40-60" ||
      assessmentId === "demo-60-80" ||
      assessmentId === "demo-80-100"
    ) {
      const demoTotal =
        assessmentId === "demo-0-20"
          ? 10
          : assessmentId === "demo-20-40"
            ? 30
            : assessmentId === "demo-40-60"
              ? 50
              : assessmentId === "demo-60-80"
                ? 70
                : 90;
      const demoRiskLabel: ScreeningV2Result["riskLabel"] =
        demoTotal <= 30 ? "Past xavf" : demoTotal <= 60 ? "O'rtacha xavf" : "Yuqori xavf";

      const scoring: ScreeningV2Result = {
        ageGroupId: "AGE_3_4",
        totalScore: demoTotal,
        riskLabel: demoRiskLabel,
        redFlagCount: demoTotal >= 60 ? 3 : demoTotal >= 40 ? 1 : 0,
        redFlags:
          demoTotal >= 60
            ? [
                { questionId: "RF1", text: "Bola ismi bilan murojaat qilinganda ko‘p hollarda javob bermaydi." },
                { questionId: "RF2", text: "Ko‘z bilan aloqa juda qisqa yoki deyarli yo‘q." },
                { questionId: "RF3", text: "Bola qiziquvchan narsalarni ko‘rsatish o‘rniga kattalarning qo‘lini tortadi." },
              ]
            : demoTotal >= 40
              ? [{ questionId: "RF1", text: "Bola ba’zan ismiga javob bermaydi yoki reaktsiya sust." }]
              : [],
        blocks: [
          {
            blockId: "SOCIAL",
            title: "Ijtimoiy aloqa",
            score: demoTotal,
            redFlags: [],
            topIssues: [],
          },
          {
            blockId: "COMM",
            title: "Muloqot",
            score: Math.min(100, demoTotal + 5),
            redFlags: [],
            topIssues: [],
          },
          {
            blockId: "RRB",
            title: "Takroriy xatti-harakat / rigidlik",
            score: Math.max(0, demoTotal - 5),
            redFlags: [],
            topIssues: [],
          },
        ],
        topOverall: [],
      };

      const response: ScoreResponse = {
        testType: "screening",
        scoring,
        completedAt: new Date().toISOString(),
        ageGroup: "AGE_3_4",
        answers: null,
      };

      return NextResponse.json(response, { status: 200 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
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
      completedAt: assessment.createdAt?.toISOString?.() ?? null,
      ageGroup: assessment.ageGroup ?? null,
      answers,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
