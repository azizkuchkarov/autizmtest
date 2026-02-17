import { NextResponse } from "next/server";
import { getProgressConfig, getProgressAgeGroups } from "@/data/progress";
import type { AgeGroupId } from "@/data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ageGroupId = searchParams.get("ageGroup") as AgeGroupId | null;

  if (
    ageGroupId === "AGE_1_5_2" ||
    ageGroupId === "AGE_3_4" ||
    ageGroupId === "AGE_5_6" ||
    ageGroupId === "AGE_7_9"
  ) {
    const config = getProgressConfig(ageGroupId);
    return NextResponse.json({
      version: config.version,
      ageGroup: config.ageGroup,
      answerScale: config.answerScale,
      domains: config.domains,
      questions: config.questions,
    });
  }

  if (!ageGroupId || ageGroupId === "") {
    return NextResponse.json({
      ageGroups: getProgressAgeGroups(),
    });
  }

  return NextResponse.json(
    { error: "Bunday yosh guruhi topilmadi." },
    { status: 404 }
  );
}
