/**
 * Yangi screening struktura (v2) - barcha yosh guruhlari uchun
 */

import type { TestSchema } from "@/lib/screening-v2-types";
import type { AgeGroupId } from "../index";
import { convertScreeningToV2 } from "./convert";
import { screeningAge1_5_2 } from "../questions-age-1-5-2";
import { screeningAge3_4 } from "../questions-age-3-4";
import { screeningAge5_6 } from "../questions-age-5-6";
import { screeningAge7_9 } from "../questions-age-7-9";

const schemas: Record<AgeGroupId, TestSchema> = {
  AGE_1_5_2: convertScreeningToV2(screeningAge1_5_2, "AGE_1_5_2"),
  AGE_3_4: convertScreeningToV2(screeningAge3_4, "AGE_3_4"),
  AGE_5_6: convertScreeningToV2(screeningAge5_6, "AGE_5_6"),
  AGE_7_9: convertScreeningToV2(screeningAge7_9, "AGE_7_9"),
};

export function getScreeningSchemaV2(ageGroupId: AgeGroupId): TestSchema {
  const schema = schemas[ageGroupId];
  if (!schema) throw new Error(`Unknown age group: ${ageGroupId}`);
  return schema;
}

export { schemas };
