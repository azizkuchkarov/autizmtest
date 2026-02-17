import type { ScreeningConfig } from "@/lib/screening-types";
import { screeningAge1_5_2 } from "./questions-age-1-5-2";
import { screeningAge3_4 } from "./questions-age-3-4";
import { screeningAge5_6 } from "./questions-age-5-6";
import { screeningAge7_9 } from "./questions-age-7-9";

export type AgeGroupId = "AGE_1_5_2" | "AGE_3_4" | "AGE_5_6" | "AGE_7_9";

const configs: Record<AgeGroupId, ScreeningConfig> = {
  AGE_1_5_2: screeningAge1_5_2,
  AGE_3_4: screeningAge3_4,
  AGE_5_6: screeningAge5_6,
  AGE_7_9: screeningAge7_9,
};

export function getScreeningConfig(ageGroupId: AgeGroupId): ScreeningConfig {
  const config = configs[ageGroupId];
  if (!config) throw new Error(`Unknown age group: ${ageGroupId}`);
  return config;
}

export function getAvailableAgeGroups(): { id: AgeGroupId; label: string }[] {
  return Object.values(configs).map((c) => ({
    id: c.ageGroup.id as AgeGroupId,
    label: c.ageGroup.label,
  }));
}

export { screeningAge1_5_2, screeningAge3_4, screeningAge5_6, screeningAge7_9 };
