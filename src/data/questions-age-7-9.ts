import type { ScreeningConfig } from "@/lib/screening-types";
import {
  professionalAnswerScale,
  professionalDomains,
  professionalQuestions,
} from "./screening-questions-professional";

export const screeningAge7_9: ScreeningConfig = {
  version: "2.0",
  ageGroup: { id: "AGE_7_9", label: "7–9 yosh" },
  answerScale: [...professionalAnswerScale],
  domains: [...professionalDomains],
  questions: [...professionalQuestions],
};
