import type { ScreeningConfig } from "@/lib/screening-types";
import {
  professionalAnswerScale,
  professionalDomains,
  professionalQuestions,
} from "./screening-questions-professional";

export const screeningAge5_6: ScreeningConfig = {
  version: "2.0",
  ageGroup: { id: "AGE_5_6", label: "5–6 yosh" },
  answerScale: [...professionalAnswerScale],
  domains: [...professionalDomains],
  questions: [...professionalQuestions],
};
