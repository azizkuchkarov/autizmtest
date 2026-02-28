import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAiSummary, generateAiSummaryForMonitoring, generateAiSummaryForScreeningV2 } from "@/lib/ai-summary";
import type { AiSummaryResponse, ScoreResponse, ScreeningV2Result } from "@/types/api";
import type { MonitoringResult } from "@/lib/monitoringScoring";

function isMonitoringResult(s: unknown): s is MonitoringResult {
  return (
    typeof s === "object" &&
    s !== null &&
    "overallPercent" in s &&
    "blocks" in s &&
    "recommendations" in s
  );
}

function isScreeningV2Result(s: unknown): s is ScreeningV2Result {
  if (!s || typeof s !== "object") return false;
  const r = s as Record<string, unknown>;
  const hasScore =
    typeof r.totalScore === "number" ||
    (typeof r.totalScore === "string" && !Number.isNaN(Number(r.totalScore)));
  const hasBlocks = Array.isArray(r.blocks);
  return Boolean(hasScore && hasBlocks);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    let locale: "uz" | "ru" = "uz";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.locale === "ru") locale = "ru";
    } catch {}

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ ok: false, status: "failed" as const, error: "Assessment topilmadi." }, { status: 404 });
    }

    const storedLocale = (assessment.aiSummaryLocale as "uz" | "ru" | null) ?? null;
    const wantLocale = locale;
    const needRegenerate = assessment.aiSummaryStatus === "ready" && storedLocale !== null && storedLocale !== wantLocale;

    if (assessment.aiSummaryStatus === "ready" && assessment.aiSummaryPayload && !needRegenerate) {
      return NextResponse.json({
        ok: true,
        status: "ready" as const,
        payload: assessment.aiSummaryPayload as object,
      } satisfies AiSummaryResponse & { payload?: object });
    }

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { aiSummaryStatus: "pending", aiSummaryError: null },
    });

    const scoring = assessment.scoring as unknown as ScoreResponse["scoring"];
    const testType = (assessment.testType as "screening" | "progress") ?? "screening";

    if (testType === "progress" && isMonitoringResult(scoring)) {
      try {
        const payload = await generateAiSummaryForMonitoring(scoring);
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: {
            aiSummaryStatus: "ready",
            aiSummaryPayload: payload as object,
            aiSummaryError: null,
          },
        });
        return NextResponse.json({
          ok: true,
          status: "ready" as const,
          payload,
        } as AiSummaryResponse & { payload?: typeof payload });
      } catch (aiError) {
        const errMsg = aiError instanceof Error ? aiError.message : "AI xulosa yaratilmadi.";
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: { aiSummaryStatus: "failed", aiSummaryError: errMsg },
        });
        return NextResponse.json({
          ok: false,
          status: "failed" as const,
          error: errMsg,
        } satisfies AiSummaryResponse);
      }
    }

    // Screening V2: totalScore, riskLabel, blocks, redFlags, topOverall
    if (isScreeningV2Result(scoring)) {
      try {
        const payload = await generateAiSummaryForScreeningV2(scoring, locale);
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: {
            aiSummaryStatus: "ready",
            aiSummaryPayload: payload as object,
            aiSummaryLocale: locale,
            aiSummaryError: null,
          },
        });
        return NextResponse.json({
          ok: true,
          status: "ready" as const,
          payload,
        } as AiSummaryResponse & { payload?: typeof payload });
      } catch (aiError) {
        const errMsg = aiError instanceof Error ? aiError.message : "AI xulosa yaratilmadi.";
        await prisma.assessment.update({
          where: { id: assessmentId },
          data: { aiSummaryStatus: "failed", aiSummaryError: errMsg },
        });
        return NextResponse.json({
          ok: false,
          status: "failed" as const,
          error: errMsg,
        } satisfies AiSummaryResponse);
      }
    }

    // Eski screening: insights.aiFacts
    const aiFacts = (scoring as { insights?: { aiFacts?: Record<string, unknown> } })?.insights?.aiFacts;
    if (!aiFacts) {
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { aiSummaryStatus: "failed", aiSummaryError: "Scoring aiFacts topilmadi." },
      });
      return NextResponse.json({
        ok: false,
        status: "failed" as const,
        error: "Scoring aiFacts topilmadi.",
      } satisfies AiSummaryResponse);
    }

    try {
      const payload = await generateAiSummary(aiFacts);
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          aiSummaryStatus: "ready",
          aiSummaryPayload: payload as object,
          aiSummaryError: null,
        },
      });
      return NextResponse.json({
        ok: true,
        status: "ready" as const,
        payload,
      } as AiSummaryResponse & { payload?: typeof payload });
    } catch (aiError) {
      const errMsg = aiError instanceof Error ? aiError.message : "AI xulosa yaratilmadi.";
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { aiSummaryStatus: "failed", aiSummaryError: errMsg },
      });
      return NextResponse.json({
        ok: false,
        status: "failed" as const,
        error: errMsg,
      } satisfies AiSummaryResponse);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json(
      { ok: false, status: "failed" as const, error: message } satisfies AiSummaryResponse,
      { status: 500 }
    );
  }
}
