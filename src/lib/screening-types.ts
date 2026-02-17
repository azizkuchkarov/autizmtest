// Skrining savollari va konfiguratsiya uchun turlar

export type AnswerScaleItem = {
  value: number;
  label: string;
};

export type AgeGroup = {
  id: string;
  label: string;
};

export type Domain = {
  id: string;
  title: string;
  /** Ota-onalar uchun: soha nima aniqlashga yordam beradi */
  subtitle?: string;
};

export type ScreeningQuestion = {
  id: string;
  domain: string;
  weight: number;
  isRedFlag: boolean;
  text: string;
  example: string;
  explanation: string;
};

export type ScreeningConfig = {
  version: string;
  ageGroup: AgeGroup;
  answerScale: AnswerScaleItem[];
  domains: Domain[];
  questions: ScreeningQuestion[];
};

export type AnswerValue = 0 | 1 | 2 | 3;
export type AnswersMap = Record<string, AnswerValue>;
