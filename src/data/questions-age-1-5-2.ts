import type { ScreeningConfig } from "@/lib/screening-types";
import {
  professionalAnswerScale,
  professionalDomains,
  professionalQuestions,
} from "./screening-questions-professional";

export const screeningAge1_5_2: ScreeningConfig = {
  version: "2.0",
  ageGroup: { id: "AGE_1_5_2", label: "1,5–2 yosh" },
  answerScale: [...professionalAnswerScale],
  domains: [...professionalDomains],
  questions: [...professionalQuestions],
};
