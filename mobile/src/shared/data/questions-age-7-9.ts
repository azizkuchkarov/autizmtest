import type { ScreeningConfig } from "@/shared/lib/screening-types";
import {
  professionalAnswerScale,
  professionalDomains,
  professionalAgeOverrides,
  professionalQuestions,
  questionsForAge,
} from "./screening-questions-professional";

export const screeningAge7_9: ScreeningConfig = {
  version: "2.0",
  ageGroup: { id: "AGE_7_9", label: "7–9 yosh" },
  answerScale: [...professionalAnswerScale],
  domains: [...professionalDomains],
  questions: questionsForAge(professionalQuestions, "AGE_7_9", professionalAgeOverrides),
};
