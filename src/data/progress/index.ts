import type { ScreeningConfig } from "@/lib/screening-types";
import type { AgeGroupId } from "@/data";
import { getAvailableAgeGroups } from "@/data";
import { progressAge1_5_2 } from "./progress-age-1-5-2";
import { progressAge3_4 } from "./progress-age-3-4";
import { progressAge5_6 } from "./progress-age-5-6";
import { progressAge7_9 } from "./progress-age-7-9";

/**
 * Progress test uchun konfiglar — barcha 4 yosh guruhi to‘ldirilgan.
 */
const configs: Record<AgeGroupId, ScreeningConfig> = {
  AGE_1_5_2: progressAge1_5_2,
  AGE_3_4: progressAge3_4,
  AGE_5_6: progressAge5_6,
  AGE_7_9: progressAge7_9,
};

export function getProgressConfig(ageGroupId: AgeGroupId): ScreeningConfig {
  const config = configs[ageGroupId];
  if (!config) throw new Error(`Unknown age group: ${ageGroupId}`);
  return config;
}

export function getProgressAgeGroups(): { id: AgeGroupId; label: string }[] {
  return getAvailableAgeGroups();
}
