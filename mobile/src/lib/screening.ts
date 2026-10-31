import { getScreeningConfig, type AgeGroupId } from '@/shared/data';
import { getScreeningSchemaV2 } from '@/shared/data/screening-v2';
import type { Locale } from '@/shared/lib/locale';
import { scoreTest } from '@/shared/lib/screening-v2-scoring';
import type { AnswerValue } from '@/shared/lib/screening-v2-types';

export type { AgeGroupId };

export const AGE_GROUPS: AgeGroupId[] = ['AGE_1_5_2', 'AGE_3_4', 'AGE_5_6', 'AGE_7_9'];
export const GENDERS = ['Qiz', "O'g'il"] as const;

export type ScreeningResult = ReturnType<typeof scoreTest>;
export type RiskTier = 'low' | 'moderate' | 'high';

/** Saytdagi chegaralar bilan bir xil: 0–30 past, 31–60 o'rta, 61+ yuqori. */
export function riskTier(totalScore: number): RiskTier {
  // Ekranda foiz butun songa yaxlitlanadi — daraja ham shu son bo'yicha (30,4% → "30%" → past)
  const score = Math.round(totalScore);
  if (score <= 30) return 'low';
  if (score <= 60) return 'moderate';
  return 'high';
}

export function getTestConfig(ageGroup: AgeGroupId, locale: Locale) {
  return getScreeningConfig(ageGroup, locale);
}

/** Ball hisoblash har doim o'zbekcha sxema bo'yicha (savol ID lari ikkala tilda bir xil). */
export function scoreScreening(ageGroup: AgeGroupId, answers: Record<string, AnswerValue>): ScreeningResult {
  return scoreTest(getScreeningSchemaV2(ageGroup), answers, ageGroup);
}

/** Soha (A/B/C) sarlavhasini tanlangan tilda qaytaradi. */
export function domainTitles(ageGroup: AgeGroupId, locale: Locale): Record<string, string> {
  return Object.fromEntries(getScreeningConfig(ageGroup, locale).domains.map((d) => [d.id, d.title]));
}

/** E'tibor talab qiladigan sohalar — mashqlarni tavsiya qilish uchun. */
export function weakDomains(result: ScreeningResult, threshold = 35): string[] {
  return result.blocks.filter((b) => b.score > threshold).map((b) => b.blockId);
}

/** Tug'ilgan yil bo'yicha test yosh guruhi (taxminiy yosh = joriy yil − tug'ilgan yil). */
export function ageGroupFromBirthYear(birthYear: number): AgeGroupId {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 2) return 'AGE_1_5_2';
  if (age <= 4) return 'AGE_3_4';
  if (age <= 6) return 'AGE_5_6';
  return 'AGE_7_9';
}
