import AsyncStorage from '@react-native-async-storage/async-storage';

import { riskTier, type AgeGroupId, type RiskTier, type ScreeningResult } from '@/lib/screening';
import { isScreeningV3 } from '@/shared/lib/screening-v3/score';

const STORAGE_KEY = 'autizm_assessments_v1';

/** Qurilmada saqlanadigan test natijasi. */
export type StoredAssessment = {
  id: string;
  /** Serverdagi assessment ID. Internet bo'lmasa null. */
  serverId: string | null;
  createdAt: string;
  ageGroup: AgeGroupId;
  childGender: string;
  result: ScreeningResult;
};

export async function listAssessments(): Promise<StoredAssessment[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as StoredAssessment[]) : [];
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function getAssessment(id: string): Promise<StoredAssessment | null> {
  const items = await listAssessments();
  return items.find((a) => a.id === id) ?? null;
}

export async function saveAssessment(item: StoredAssessment): Promise<void> {
  const items = await listAssessments();
  const next = [item, ...items.filter((a) => a.id !== item.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Akkaunt o'chirilganda qurilmadagi natijalarni ham tozalaydi. */
export async function clearAssessments(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function newLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Natija darajasi: v3 da hisoblangan daraja, eski testlarda — ball bo'yicha. */
export function assessmentTier(item: StoredAssessment): RiskTier {
  return isScreeningV3(item.result) ? item.result.level : riskTier(item.result.totalScore);
}

/** Keyingi skrining sanasi: past darajada 6 oydan, o'rtacha va yuqorida 3 oydan keyin. */
export function nextScreeningDate(createdAt: string, tier: RiskTier) {
  const d = new Date(createdAt);
  d.setMonth(d.getMonth() + (tier === 'low' ? 6 : 3));
  return d.toISOString();
}
