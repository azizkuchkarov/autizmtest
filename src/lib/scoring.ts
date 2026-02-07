// src/lib/scoring.ts
import { QUESTIONS, ageToBand, type AgeBand, type BlockId, type Direction } from "./questions";

export type AnswerValue = 0 | 1 | 2 | 3;
export type AnswersMap = Record<string, AnswerValue>;
export type DomainId = BlockId;

export type QuestionResponse = {
  questionId: string;
  domain: DomainId;
  answer: AnswerValue; // 0..3 (severity)
  isCore?: boolean; // Core ASD (social/communication)
  isRedFlag?: boolean; // kritik savol
};

export type ScoringInput = {
  ageBand: AgeBand;
  responses: QuestionResponse[];
};

export type DomainScore = {
  domain: DomainId;
  rawSum: number; // 0..18 (6 savol * 3)
  maxRaw: number; // 18
  severity01: number; // 0..1
  weighted01: number; // 0..weight normalized later
};

export type RiskTier = "LOW" | "WATCH" | "MODERATE" | "HIGH";

export type ScoringResult = {
  ageBand: AgeBand;
  domains: DomainScore[];
  coreSeverity01: number; // social + communication combined (0..1)
  functionalImpact01: number; // daily domain severity
  redFlagCount: number;
  riskScore01: number; // 0..1
  riskScorePercent: number; // 0..100
  tier: RiskTier;
  rationale: {
    topDomains: DomainId[];
    notes: string[];
  };
};

export type BlockScore = {
  rawSum: number;
  maxRaw: number;
  severity01: number;
  status: "Normal" | "O‘rtacha" | "Yuqori";
};

export type Summary = ScoringResult & {
  childAgeYears: number;
  answeredCount: number;
  totalCount: number;
  blocks: Record<DomainId, BlockScore>;
};

export type ScoringConfig = {
  weights: Record<DomainId, number>;
  coreBoost: { threshold: number; max: number };
  impactMultiplier: { threshold: number; max: number };
  redFlagBump: { one: number; two: number };
  tierThresholds: { watch: number; moderate: number; high: number };
  blockStatus: { normalMax: number; mediumMax: number };
};

export const defaultScoringConfig: ScoringConfig = {
  weights: {
    social: 2.6,
    communication: 2.4,
    repetitive: 2.0,
    sensory: 1.6,
    play: 1.4,
    daily: 1.8,
  },
  coreBoost: { threshold: 0.55, max: 0.18 },
  impactMultiplier: { threshold: 0.5, max: 0.25 },
  redFlagBump: { one: 0.08, two: 0.1 },
  tierThresholds: { watch: 25, moderate: 45, high: 65 },
  blockStatus: { normalMax: 0.34, mediumMax: 0.67 },
};

const DOMAIN_MAX_RAW = 6 * 3; // 6 savol, max 3 ball

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toSeverity(direction: Direction, v: AnswerValue): AnswerValue {
  return direction === "negative" ? v : ((3 - v) as AnswerValue);
}

function blockStatus(severity01: number, config: ScoringConfig): BlockScore["status"] {
  if (severity01 < config.blockStatus.normalMax) return "Normal";
  if (severity01 < config.blockStatus.mediumMax) return "O‘rtacha";
  return "Yuqori";
}

/**
 * Professional risk:
 * - Weighted domain severity (0..1 each domain)
 * - Core boost: social+communication yuqori bo‘lsa risk ko‘tariladi
 * - Functional impact multiplier: daily yuqori bo‘lsa risk ko‘tariladi
 * - Red-flag escalation: kritik savollar ko‘p bo‘lsa tier kamida MODERATE/HIGH
 */
export function scoreAutismScreening(
  input: ScoringInput,
  config: ScoringConfig = defaultScoringConfig
): ScoringResult {
  const { ageBand, responses } = input;

  // Group by domain
  const byDomain: Record<DomainId, QuestionResponse[]> = {
    social: [],
    communication: [],
    repetitive: [],
    sensory: [],
    play: [],
    daily: [],
  };

  for (const r of responses) {
    byDomain[r.domain].push(r);
  }

  // Compute per-domain severity
  const domains: DomainScore[] = (Object.keys(byDomain) as DomainId[]).map(
    (domain) => {
      const items = byDomain[domain];
      const rawSum = items.reduce((s, x) => s + x.answer, 0);
      const severity01 = clamp01(rawSum / DOMAIN_MAX_RAW); // 0..1
      return {
        domain,
        rawSum,
        maxRaw: DOMAIN_MAX_RAW,
        severity01,
        weighted01: severity01 * config.weights[domain],
      };
    }
  );

  // Normalize weighted score to 0..1
  const weightTotal = Object.values(config.weights).reduce((a, b) => a + b, 0);
  const weightedSum = domains.reduce((s, d) => s + d.weighted01, 0);
  const weighted01 = clamp01(weightedSum / weightTotal);

  // Core severity: social + communication
  const social = domains.find((d) => d.domain === "social")!;
  const comm = domains.find((d) => d.domain === "communication")!;
  const coreSeverity01 = clamp01((social.severity01 + comm.severity01) / 2);

  // Functional impact: daily
  const daily = domains.find((d) => d.domain === "daily")!;
  const functionalImpact01 = daily.severity01;

  // Red flags
  const redFlagCount = responses.filter((r) => r.isRedFlag && r.answer >= 2).length;

  // Core boost curve (smooth): 0..~0.18
  // Past coreSeverity 0.55 risk starts increasing faster
  const coreBoost = clamp01((coreSeverity01 - config.coreBoost.threshold) / (1 - config.coreBoost.threshold)) * config.coreBoost.max;

  // Functional impact multiplier: up to +25%
  // daily >=0.5 -> gradually increases
  const impactMultiplier =
    1 + clamp01((functionalImpact01 - config.impactMultiplier.threshold) / (1 - config.impactMultiplier.threshold)) * config.impactMultiplier.max;

  // Base score
  let riskScore01 = clamp01((weighted01 + coreBoost) * impactMultiplier);

  // Red-flag escalation: bump score and minimum tier
  if (redFlagCount >= 1) riskScore01 = clamp01(riskScore01 + config.redFlagBump.one);
  if (redFlagCount >= 2) riskScore01 = clamp01(riskScore01 + config.redFlagBump.two);

  const riskScorePercent = Math.round(riskScore01 * 100);

  // Tier thresholds (professional, conservative)
  // LOW: 0-24
  // WATCH: 25-44
  // MODERATE: 45-64
  // HIGH: 65+
  let tier: RiskTier =
    riskScorePercent >= config.tierThresholds.high
      ? "HIGH"
      : riskScorePercent >= config.tierThresholds.moderate
      ? "MODERATE"
      : riskScorePercent >= config.tierThresholds.watch
      ? "WATCH"
      : "LOW";

  // If red flags present, don't allow LOW
  if (redFlagCount >= 1 && tier === "LOW") tier = "WATCH";
  if (redFlagCount >= 2 && (tier === "LOW" || tier === "WATCH")) tier = "MODERATE";

  // Top domains for explanation
  const topDomains = [...domains]
    .sort((a, b) => b.severity01 - a.severity01)
    .slice(0, 2)
    .map((d) => d.domain);

  const notes: string[] = [];
  notes.push(`Weighted severity: ${(weighted01 * 100).toFixed(0)}%`);
  notes.push(`Core domains (social+communication): ${(coreSeverity01 * 100).toFixed(0)}%`);
  notes.push(`Functional impact (daily): ${(functionalImpact01 * 100).toFixed(0)}%`);
  if (redFlagCount > 0) notes.push(`Red flags (answer>=2): ${redFlagCount}`);

  return {
    ageBand,
    domains,
    coreSeverity01,
    functionalImpact01,
    redFlagCount,
    riskScore01,
    riskScorePercent,
    tier,
    rationale: { topDomains, notes },
  };
}

export function computeSummary(
  childAgeYears: number,
  answers: AnswersMap,
  config: ScoringConfig = defaultScoringConfig,
  questionsOverride?: typeof QUESTIONS
): Summary {
  const ageBand = ageToBand(childAgeYears);
  const source = questionsOverride ?? QUESTIONS;
  const ageQuestions = source.filter((q) => q.bands.includes(ageBand));
  const totalCount = ageQuestions.length;

  let answeredCount = 0;
  for (const q of ageQuestions) if (answers[q.id] !== undefined) answeredCount += 1;

  const responses: QuestionResponse[] = ageQuestions.map((q) => {
    const raw = answers[q.id] ?? 0;
    return {
      questionId: q.id,
      domain: q.block,
      answer: toSeverity(q.direction, raw),
      isCore: q.isCoreFlag,
      isRedFlag: q.isRedFlag,
    };
  });

  const result = scoreAutismScreening({ ageBand, responses }, config);

  const blocks = result.domains.reduce((acc, d) => {
    acc[d.domain] = {
      rawSum: d.rawSum,
      maxRaw: d.maxRaw,
      severity01: d.severity01,
      status: blockStatus(d.severity01, config),
    };
    return acc;
  }, {} as Record<DomainId, BlockScore>);

  return {
    childAgeYears,
    answeredCount,
    totalCount,
    blocks,
    ...result,
  };
}
