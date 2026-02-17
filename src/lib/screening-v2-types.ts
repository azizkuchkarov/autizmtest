// Yangi screening struktura va turlar

export type AnswerValue = 0 | 1 | 2 | 3;

export type Trigger = {
  operator: ">=" | "<=";
  value: number;
};

export type Question = {
  id: string;
  text: string;
  help?: string;
  ageGroupIds: string[];
  weight: number;
  reverse: boolean;
  isRedFlag?: boolean;
  redFlagTrigger?: Trigger;
};

export type Block = {
  id: string;
  title: string;
  subtitle?: string;
  questions: Question[];
};

export type TestSchema = {
  version: string;
  scale: { min: number; max: number };
  blocks: Block[];
  scoring: any;
};

export type Answers = Record<string, AnswerValue | null | undefined>;
