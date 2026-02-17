import type { AgeGroupId } from "@/data";

export const INITIAL_DATA_KEY = "autizm_initial_data";
export const PAYMENT_ID_KEY = "autizm_payment_id";
export const PAID_AMOUNT_KEY = "autizm_paid_amount";

export type Respondent = "Ota" | "Ona" | "Vasiy";
export type ChildGender = "Qiz" | "O'g'il";

export interface InitialData {
  ageGroup: AgeGroupId;
  respondent: Respondent;
  childGender: ChildGender;
}

const AGE_IDS: AgeGroupId[] = ["AGE_1_5_2", "AGE_3_4", "AGE_5_6", "AGE_7_9"];
const RESPONDENTS: Respondent[] = ["Ota", "Ona", "Vasiy"];
const GENDERS: ChildGender[] = ["Qiz", "O'g'il"];

export function getStoredInitialData(): InitialData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INITIAL_DATA_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as InitialData;
    if (
      data?.ageGroup &&
      data?.respondent &&
      data?.childGender &&
      AGE_IDS.includes(data.ageGroup) &&
      RESPONDENTS.includes(data.respondent) &&
      GENDERS.includes(data.childGender)
    ) {
      return data;
    }
  } catch {}
  return null;
}

export function getStoredPaymentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PAYMENT_ID_KEY);
  } catch {}
  return null;
}

export function getStoredPaidAmount(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(PAID_AMOUNT_KEY);
    if (v == null) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch {}
  return null;
}
