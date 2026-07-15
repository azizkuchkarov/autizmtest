import type { OverallResult } from "@/lib/scoring";
import type { MonitoringResult } from "@/lib/monitoringScoring";

export type AiSummaryStatus = "pending" | "ready" | "failed";

export interface AiSummaryPayload {
  summary?: {
    shortConclusion?: string;
    whyThisLevel?: string;
  };
  strengths?: {
    examples?: string[];
  };
  needsFocus?: {
    priority?: string[];
  };
  nextSteps?: {
    homePlan?: Array<{
      title?: string;
      why?: string;
      how?: string[];
    }>;
  };
  disclaimer?: {
    text?: string;
  };
}

/** Screening v2 natija struktura */
export interface ScreeningV2Result {
  ageGroupId: string;
  totalScore: number; // 0-100
  riskLabel: "Past xavf" | "O'rtacha xavf" | "Yuqori xavf";
  redFlagCount: number;
  redFlags: Array<{ questionId: string; text: string }>;
  blocks: Array<{
    blockId: string;
    title: string;
    score: number; // 0-100
    redFlags: Array<{ questionId: string; text: string }>;
    topIssues: Array<{
      questionId: string;
      risk: number;
      weight: number;
      weightedRisk: number;
      text: string;
      help?: string;
      isRedFlag: boolean;
      /** Ota-ona tanlagan javob (0–3), agar mavjud bo'lsa */
      answer?: number;
    }>;
  }>;
  topOverall: Array<{
    questionId: string;
    risk: number;
    weight: number;
    weightedRisk: number;
    text: string;
    help?: string;
    isRedFlag: boolean;
    blockId: string;
    blockTitle: string;
    /** Ota-ona tanlagan javob (0–3), agar mavjud bo'lsa */
    answer?: number;
  }>;
}

/** Screening: ScreeningV2Result (yangi) yoki OverallResult (eski); progress: MonitoringResult */
export type AssessmentScoring = ScreeningV2Result | OverallResult | MonitoringResult;

export interface ScoreResponse {
  testType?: "screening" | "progress";
  scoring: AssessmentScoring;
  aiSummary: {
    status: AiSummaryStatus;
    payload?: AiSummaryPayload | null;
    error?: string | null;
  };
  aiSummaryLocale?: string | null;
  /** Test to‘ldirilgan sana (ISO string) */
  completedAt?: string | null;
  /** Yosh guruhi (AGE_1_5_2, AGE_3_4, …) */
  ageGroup?: string | null;
  /** Ota-onaning javoblari (savol id → 0|1|2|3), PDF va boshqa maqsadlar uchun */
  answers?: Record<string, number> | null;
}

export interface AiSummaryResponse {
  ok: boolean;
  status: AiSummaryStatus;
  error?: string;
}
