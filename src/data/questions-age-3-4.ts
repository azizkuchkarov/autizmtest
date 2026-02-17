import type { ScreeningConfig } from "@/lib/screening-types";
import {
  professionalAnswerScale,
  professionalDomains,
  professionalQuestions,
} from "./screening-questions-professional";

export const screeningAge3_4: ScreeningConfig = {
  version: "2.0",
  ageGroup: { id: "AGE_3_4", label: "3–4 yosh" },
  answerScale: [...professionalAnswerScale],
  domains: [...professionalDomains],
  questions: [...professionalQuestions],
};
