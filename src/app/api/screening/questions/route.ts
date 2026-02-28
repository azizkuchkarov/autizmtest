import { NextResponse } from "next/server";
import { getScreeningConfig, getAvailableAgeGroups } from "@/data";
import type { Locale } from "@/lib/locale";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ageGroupId = searchParams.get("ageGroup") as "AGE_1_5_2" | "AGE_3_4" | "AGE_5_6" | "AGE_7_9" | null;
  const locale = (searchParams.get("locale") === "ru" ? "ru" : "uz") as Locale;

  if (ageGroupId === "AGE_1_5_2" || ageGroupId === "AGE_3_4" || ageGroupId === "AGE_5_6" || ageGroupId === "AGE_7_9") {
    const config = getScreeningConfig(ageGroupId, locale);
    return NextResponse.json({
      version: config.version,
      ageGroup: config.ageGroup,
      answerScale: config.answerScale,
      domains: config.domains,
      questions: config.questions,
    });
  }

  // Barcha yosh guruhlari ro'yxati
  if (!ageGroupId || ageGroupId === "") {
    return NextResponse.json({
      ageGroups: getAvailableAgeGroups(locale),
    });
  }

  return NextResponse.json(
    { error: "Bunday yosh guruhi topilmadi. ageGroup=AGE_1_5_2, AGE_3_4, AGE_5_6 yoki AGE_7_9 qo'llang." },
    { status: 404 }
  );
}
