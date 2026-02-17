/**
 * scoring.ts (single-file, production-friendly)
 * Premium Autism Screening — Professional Scoring Engine (age-normed)
 *
 * How to use:
 *   import { scoreAssessment } from "@/lib/scoring";
 *   const result = scoreAssessment({ ageGroup: "AGE_3_4", answers, questions });
 *
 * Notes:
 * - answers: Record<questionId, 0|1|2|3>
 * - questions: array from your JSON (must include: id, domain, weight, isRedFlag)
 * - The engine:
 *   1) Calculates question score = answer * weight
 *   2) Normalizes per domain (0..1)
 *   3) Computes overall riskIndex with domain weights
 *   4) Applies red-flag override rules (age-normed)
 *   5) Returns: risk level + domain profile + recommendations-ready insights
 */

export type AgeGroup = "AGE_1_5_2" | "AGE_3_4" | "AGE_5_6" | "AGE_7_9";
export type DomainId = "SOCIAL" | "COMM" | "JOINT" | "PLAY" | "RRB" | "SENSORY";
export type AnswerValue = 0 | 1 | 2 | 3;

/** Progress test bloklari (B1–B5) yoki screening domenlari */
export type AnyDomainId = DomainId | "B1" | "B2" | "B3" | "B4" | "B5";

export interface Question {
  id: string;
  domain: DomainId | string; // screening: DomainId; progress: B1..B5
  weight: number; // recommended 1..3
  isRedFlag: boolean;
  text?: string;
  example?: string;
  explanation?: string;
}

export interface ScoringInput {
  ageGroup: AgeGroup;
  answers: Record<string, AnswerValue | undefined>;
  questions: Question[];
  // Optional: allow tuning red-flag trigger threshold for what counts as "flagged"
  // default: answer >= 2
  redFlagTriggerAnswer?: AnswerValue; // 2 or 3 recommended
}

export type RiskLevel = "LOW" | "MONITOR" | "MODERATE" | "HIGH";

export interface DomainScore {
  domain: DomainId | string;
  raw: number;
  max: number;
  normalized: number;
  risk: number;
  band: DomainBand;
  flaggedQuestions: string[];
  answeredCount: number;
  totalCount: number;
}

export type DomainBand = "STRONG" | "AGE_APPROPRIATE" | "NEEDS_ATTENTION" | "NEEDS_SUPPORT";

export interface OverallResult {
  ageGroup: AgeGroup;
  completeness: {
    answered: number;
    total: number;
    ratio: number; // 0..1
    isValid: boolean; // e.g., >= 70% answered
  };
  redFlags: {
    count: number;
    triggeredIds: string[];
    triggerAnswer: AnswerValue;
    overrideApplied: boolean;
    overrideReason?: string;
  };
  domains: Record<string, DomainScore>;
  overall: {
    riskIndex: number;
    skillIndex: number;
    level: RiskLevel;
    levelReason: string;
    thresholdsUsed: RiskThresholds;
  };
  insights: {
    strengths: string[];
    needsAttention: string[];
    needsSupport: string[];
    topPriorityDomains: string[];
    aiFacts: Record<string, unknown>;
  };
}

/* -------------------------- CONFIGURATION -------------------------- */

// Domain weights (DSM-5 oriented: SOCIAL/COMM/JOINT higher)
const DOMAIN_WEIGHTS: Record<DomainId, number> = {
  SOCIAL: 0.25,
  COMM: 0.25,
  JOINT: 0.2,
  PLAY: 0.1,
  RRB: 0.1,
  SENSORY: 0.1,
};

const SCREENING_DOMAIN_IDS: DomainId[] = ["SOCIAL", "COMM", "JOINT", "PLAY", "RRB", "SENSORY"];

// Age-normed thresholds for riskIndex (higher = higher risk).
// These are "professional screening" thresholds (not a diagnosis).
export interface RiskThresholds {
  lowMax: number; // inclusive upper bound
  monitorMax: number;
  moderateMax: number;
  // above moderateMax => HIGH
}

// Thresholds become stricter with age (lower tolerance for missing milestones).
const AGE_THRESHOLDS: Record<AgeGroup, RiskThresholds> = {
  AGE_1_5_2: { lowMax: 0.24, monitorMax: 0.39, moderateMax: 0.59 },
  AGE_3_4: { lowMax: 0.19, monitorMax: 0.34, moderateMax: 0.54 },
  AGE_5_6: { lowMax: 0.17, monitorMax: 0.3, moderateMax: 0.49 },
  AGE_7_9: { lowMax: 0.15, monitorMax: 0.27, moderateMax: 0.44 },
};

// Domain bands based on normalized skill (0..1):
// Higher = better developed skills for that domain.
const DOMAIN_BANDS: Array<{ min: number; band: DomainBand }> = [
  { min: 0.75, band: "STRONG" },
  { min: 0.5, band: "AGE_APPROPRIATE" },
  { min: 0.3, band: "NEEDS_ATTENTION" },
  { min: 0, band: "NEEDS_SUPPORT" },
];

// Completeness rule: require at least 70% answered to be "valid enough".
const MIN_COMPLETENESS_RATIO = 0.7;

// Red-flag override rules (age-normed):
// If redFlagCount >= 2 => at least MODERATE
// If redFlagCount >= 4 => HIGH
// Additionally: if a SINGLE critical red flag appears with answer=3 in AGE_1_5_2/AGE_3_4, can bump to MODERATE.
const REDFLAG_MIN_MODERATE = 2;
const REDFLAG_HIGH = 4;

/* ---------------------------- UTILITIES ---------------------------- */

function clamp01(x: number): number {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function bandFromNormalized(normalized: number): DomainBand {
  const n = clamp01(normalized);
  for (const b of DOMAIN_BANDS) {
    if (n >= b.min) return b.band;
  }
  return "NEEDS_SUPPORT";
}

function safeDiv(n: number, d: number): number {
  if (!d) return 0;
  return n / d;
}

function riskLevelFromIndex(
  age: AgeGroup,
  riskIndex: number
): { level: RiskLevel; reason: string; thresholds: RiskThresholds } {
  const t = AGE_THRESHOLDS[age];
  const r = clamp01(riskIndex);

  if (r <= t.lowMax) return { level: "LOW", reason: `Risk indeksi ${r.toFixed(2)} ≤ ${t.lowMax}`, thresholds: t };
  if (r <= t.monitorMax) return { level: "MONITOR", reason: `Risk indeksi ${r.toFixed(2)} ≤ ${t.monitorMax}`, thresholds: t };
  if (r <= t.moderateMax) return { level: "MODERATE", reason: `Risk indeksi ${r.toFixed(2)} ≤ ${t.moderateMax}`, thresholds: t };
  return { level: "HIGH", reason: `Risk indeksi ${r.toFixed(2)} > ${t.moderateMax}`, thresholds: t };
}

// Escalate risk level to at least "minLevel"
function escalateLevel(current: RiskLevel, minLevel: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["LOW", "MONITOR", "MODERATE", "HIGH"];
  const c = order.indexOf(current);
  const m = order.indexOf(minLevel);
  return order[Math.max(c, m)] ?? current;
}

/* --------------------------- CORE SCORING -------------------------- */

export function scoreAssessment(input: ScoringInput): OverallResult {
  const { ageGroup, answers, questions } = input;
  const triggerAnswer: AnswerValue = input.redFlagTriggerAnswer ?? 2;

  const total = questions.length;

  // Count answered
  let answered = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (a === 0 || a === 1 || a === 2 || a === 3) answered += 1;
  }

  const completenessRatio = safeDiv(answered, total);
  const isValid = completenessRatio >= MIN_COMPLETENESS_RATIO;

  // Faqat savoli bor domenlar (screening: SOCIAL, COMM, ...; progress: B1..B5)
  const domainIdsFromQuestions = Array.from(
    new Map(questions.map((q) => [q.domain as string, true])).keys()
  );
  const activeDomainIds: string[] = domainIdsFromQuestions;
  const activeWeights: Record<string, number> = {};
  activeDomainIds.forEach((id) => {
    activeWeights[id] =
      (DOMAIN_WEIGHTS as Record<string, number>)[id] ?? 1 / activeDomainIds.length;
  });
  const weightSumTotal = activeDomainIds.reduce((s, id) => s + (activeWeights[id] ?? 0), 0);
  if (weightSumTotal > 0) {
    activeDomainIds.forEach((id) => {
      activeWeights[id] = (activeWeights[id] ?? 0) / weightSumTotal;
    });
  }

  const domainRaw: Record<string, number> = {};
  const domainMax: Record<string, number> = {};
  const domainCounts: Record<string, { answered: number; total: number; flagged: string[] }> = {};
  activeDomainIds.forEach((id) => {
    domainRaw[id] = 0;
    domainMax[id] = 0;
    domainCounts[id] = { answered: 0, total: 0, flagged: [] };
  });

  const redFlagTriggeredIds: string[] = [];

  // Savollarni hisoblash (faqat config dagi savol id lari)
  for (const q of questions) {
    const d = q.domain as string;
    if (!domainCounts[d]) continue;
    domainCounts[d].total += 1;

    const w = Math.max(0, q.weight ?? 1);
    domainMax[d] += 3 * w;

    const a = answers[q.id];
    const hasAnswer = a === 0 || a === 1 || a === 2 || a === 3;

    if (hasAnswer) {
      domainCounts[d].answered += 1;
      domainRaw[d] += (a as number) * w;

      if (q.isRedFlag && (a as number) >= triggerAnswer) {
        redFlagTriggeredIds.push(q.id);
        domainCounts[d].flagged.push(q.id);
      }
    }
  }

  // Domain normalized skill and risk
  const domains: Record<string, DomainScore> = {};
  activeDomainIds.forEach((d) => {
    const normalizedSkill = clamp01(safeDiv(domainRaw[d], domainMax[d]));
    const risk = clamp01(1 - normalizedSkill);

    domains[d] = {
      domain: d,
      raw: domainRaw[d],
      max: domainMax[d],
      normalized: normalizedSkill,
      risk,
      band: bandFromNormalized(normalizedSkill),
      flaggedQuestions: domainCounts[d].flagged,
      answeredCount: domainCounts[d].answered,
      totalCount: domainCounts[d].total,
    };
  });

  // Compute overall riskIndex as weighted sum of domain risks
  let riskIndex = 0;
  let weightSum = 0;

  activeDomainIds.forEach((d) => {
    const w = activeWeights[d] ?? 1 / activeDomainIds.length;
    if (domains[d]?.max <= 0) return;
    riskIndex += domains[d].risk * w;
    weightSum += w;
  });

  riskIndex = weightSum > 0 ? clamp01(riskIndex / weightSum) : 0;
  const skillIndex = clamp01(1 - riskIndex);

  const base = riskLevelFromIndex(ageGroup, riskIndex);
  let level: RiskLevel = base.level;
  let levelReason: string = base.reason;
  let overrideApplied = false;
  let overrideReason: string | undefined;

  const redFlagCount = redFlagTriggeredIds.length;

  if (redFlagCount >= REDFLAG_HIGH) {
    if (level !== "HIGH") {
      overrideApplied = true;
      overrideReason = `Red-flag soni ${redFlagCount} (≥ ${REDFLAG_HIGH}) → HIGH`;
    }
    level = "HIGH";
    levelReason = overrideReason ?? levelReason;
  } else if (redFlagCount >= REDFLAG_MIN_MODERATE) {
    const escalated = escalateLevel(level, "MODERATE");
    if (escalated !== level) {
      overrideApplied = true;
      overrideReason = `Red-flag soni ${redFlagCount} (≥ ${REDFLAG_MIN_MODERATE}) → kamida MODERATE`;
      levelReason = overrideReason;
    }
    level = escalated;
  } else {
    if ((ageGroup === "AGE_1_5_2" || ageGroup === "AGE_3_4") && redFlagTriggeredIds.length === 1) {
      const onlyId = redFlagTriggeredIds[0];
      const ans = answers[onlyId];
      if (ans === 3) {
        const escalated = escalateLevel(level, "MODERATE");
        if (escalated !== level) {
          overrideApplied = true;
          overrideReason = `Yosh ${ageGroup} va 1 ta kuchli red-flag (javob=3) → kamida MODERATE`;
          levelReason = overrideReason;
        }
        level = escalated;
      }
    }
  }

  const strengths: string[] = [];
  const needsAttention: string[] = [];
  const needsSupport: string[] = [];

  activeDomainIds.forEach((d) => {
    const b = domains[d]?.band;
    if (b === "STRONG") strengths.push(d);
    if (b === "NEEDS_ATTENTION") needsAttention.push(d);
    if (b === "NEEDS_SUPPORT") needsSupport.push(d);
  });

  const topPriorityDomains = activeDomainIds
    .slice()
    .sort((a, b) => (domains[b]?.risk ?? 0) - (domains[a]?.risk ?? 0))
    .slice(0, 3);

  const aiFacts = {
    ageGroup,
    completeness: { answered, total, ratio: Number(completenessRatio.toFixed(2)), isValid },
    overall: {
      riskIndex: Number(riskIndex.toFixed(2)),
      skillIndex: Number(skillIndex.toFixed(2)),
      level,
    },
    redFlags: {
      count: redFlagCount,
      ids: redFlagTriggeredIds,
      triggerAnswer,
    },
    domains: activeDomainIds.reduce(
      (acc, d) => {
        const dom = domains[d];
        if (dom)
          acc[d] = {
            normalized: Number(dom.normalized.toFixed(2)),
            risk: Number(dom.risk.toFixed(2)),
            band: dom.band,
            answered: dom.answeredCount,
            total: dom.totalCount,
            redFlags: dom.flaggedQuestions,
          };
        return acc;
      },
      {} as Record<string, unknown>
    ),
    priorities: {
      strengths,
      needsAttention,
      needsSupport,
      topPriorityDomains,
    },
  };

  if (!isValid) {
    levelReason = `Diqqat: test to‘liq emas (${answered}/${total}, ${(completenessRatio * 100).toFixed(0)}%). Natija taxminiy. ${levelReason}`;
  }

  return {
    ageGroup,
    completeness: {
      answered,
      total,
      ratio: completenessRatio,
      isValid,
    },
    redFlags: {
      count: redFlagCount,
      triggeredIds: redFlagTriggeredIds,
      triggerAnswer,
      overrideApplied,
      overrideReason,
    },
    domains,
    overall: {
      riskIndex,
      skillIndex,
      level,
      levelReason,
      thresholdsUsed: base.thresholds,
    },
    insights: {
      strengths,
      needsAttention,
      needsSupport,
      topPriorityDomains,
      aiFacts,
    },
  };
}

/* --------------------- OPTIONAL: HUMAN LABELS ---------------------- */

export const DOMAIN_LABELS_UZ: Record<string, string> = {
  SOCIAL: "Ijtimoiy aloqa",
  COMM: "Muloqot",
  JOINT: "Birgalikda diqqat",
  PLAY: "O‘yin va tasavvur",
  RRB: "Takroriy xatti-harakat / rigidlik",
  SENSORY: "Sensor va moslashuv",
  // Progress test bloklari (3–4 yosh)
  B1: "Muloqot va til rivoji",
  B2: "Ijtimoiy o‘zaro ta’sir",
  B3: "Xulq va moslashuv",
  B4: "Sensor va sezgirlik",
  B5: "Mustaqillik va kundalik ko‘nikmalar",
};

export const RISK_LABELS_UZ: Record<RiskLevel, string> = {
  LOW: "Past risk (yoshga mos)",
  MONITOR: "Monitoring kerak",
  MODERATE: "O‘rta risk (mutaxassis bilan maslahat tavsiya)",
  HIGH: "Yuqori risk (tezroq mutaxassis bahosi tavsiya)",
};

/* --------------------- OPTIONAL: QUICK SUMMARY --------------------- */
/**
 * If you want a short local (non-AI) summary string for the result page.
 */
export function buildShortUzSummary(result: OverallResult): string {
  const riskText = RISK_LABELS_UZ[result.overall.level];
  const pr = result.insights.topPriorityDomains.map((d) => DOMAIN_LABELS_UZ[d] ?? d).join(", ");
  const rf = result.redFlags.count > 0 ? ` Red-flag: ${result.redFlags.count} ta.` : "";
  const comp = result.completeness.isValid
    ? ""
    : ` Test to‘liq emas (${result.completeness.answered}/${result.completeness.total}).`;

  return `${riskText}.${comp}${rf} Eng muhim yo‘nalishlar: ${pr}.`;
}
