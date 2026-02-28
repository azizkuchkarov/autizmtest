import type { ScreeningConfig } from "@/lib/screening-types";
import type { Locale } from "@/lib/locale";
import { screeningAge1_5_2 } from "./questions-age-1-5-2";
import { screeningAge3_4 } from "./questions-age-3-4";
import { screeningAge5_6 } from "./questions-age-5-6";
import { screeningAge7_9 } from "./questions-age-7-9";
import {
  professionalAnswerScaleRu,
  professionalDomainsRu,
  professionalQuestionsRu,
  AGE_GROUP_LABELS_RU,
} from "./screening-questions-professional-ru";

export type AgeGroupId = "AGE_1_5_2" | "AGE_3_4" | "AGE_5_6" | "AGE_7_9";

const configs: Record<AgeGroupId, ScreeningConfig> = {
  AGE_1_5_2: screeningAge1_5_2,
  AGE_3_4: screeningAge3_4,
  AGE_5_6: screeningAge5_6,
  AGE_7_9: screeningAge7_9,
};

function getScreeningConfigRu(ageGroupId: AgeGroupId): ScreeningConfig {
  return {
    version: "2.0",
    ageGroup: { id: ageGroupId, label: AGE_GROUP_LABELS_RU[ageGroupId] ?? ageGroupId },
    answerScale: [...professionalAnswerScaleRu],
    domains: [...professionalDomainsRu],
    questions: [...professionalQuestionsRu],
  };
}

export function getScreeningConfig(ageGroupId: AgeGroupId, locale?: Locale): ScreeningConfig {
  if (locale === "ru") return getScreeningConfigRu(ageGroupId);
  const config = configs[ageGroupId];
  if (!config) throw new Error(`Unknown age group: ${ageGroupId}`);
  return config;
}

export function getAvailableAgeGroups(locale?: Locale): { id: AgeGroupId; label: string }[] {
  if (locale === "ru") {
    return (Object.keys(AGE_GROUP_LABELS_RU) as AgeGroupId[]).map((id) => ({
      id,
      label: AGE_GROUP_LABELS_RU[id],
    }));
  }
  return Object.values(configs).map((c) => ({
    id: c.ageGroup.id as AgeGroupId,
    label: c.ageGroup.label,
  }));
}

export { screeningAge1_5_2, screeningAge3_4, screeningAge5_6, screeningAge7_9 };
