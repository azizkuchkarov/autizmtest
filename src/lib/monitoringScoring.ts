/**
 * Progress monitoring test hisoblash algoritmi.
 * Bloklar B1–B5, har birida 7 ta savol (0–3 ball). Xulosa, diagramma va tavsiyalar.
 */

export type AnswerValue = 0 | 1 | 2 | 3;

/** Monitoring API da ishlatiladigan yosh format (1.5-2, 3-4, 5-6, 7-9) */
export type MonitoringAgeGroup = "1.5-2" | "3-4" | "5-6" | "7-9";

export type BlockId = "B1" | "B2" | "B3" | "B4" | "B5";

export type BlockStatus = "good" | "ok" | "needs_focus";

export type AnswersMap = Record<string, AnswerValue>;

export interface BlockScore {
  blockId: BlockId;
  rawSum: number;
  rawMax: number;
  percent: number;
  status: BlockStatus;
  deltaPercent?: number;
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  actions: string[];
  priority: "high" | "medium" | "low";
  targetBlockId?: BlockId;
}

export interface MonitoringResult {
  ageGroup: MonitoringAgeGroup;
  overallPercent: number;
  overallStatus: BlockStatus;
  blocks: BlockScore[];
  recommendations: Recommendation[];
  deltaOverallPercent?: number;
}

type QuestionWeightMap = Record<string, number>;
type BlockWeightMap = Record<BlockId, number>;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

function statusFromPercent(p: number): BlockStatus {
  if (p >= 75) return "good";
  if (p >= 55) return "ok";
  return "needs_focus";
}

export const BLOCK_WEIGHTS: BlockWeightMap = {
  B1: 0.22,
  B2: 0.22,
  B3: 0.2,
  B4: 0.18,
  B5: 0.18,
};

export const QUESTION_WEIGHTS_BY_AGE: Record<MonitoringAgeGroup, QuestionWeightMap> = {
  "1.5-2": {
    B1Q1: 1.4,
    B1Q3: 1.3,
    B1Q4: 1.4,
    B1Q6: 1.3,
    B2Q1: 1.2,
    B2Q6: 1.3,
    B3Q2: 1.1,
    B3Q5: 1.1,
    B4Q1: 1.1,
    B5Q7: 1.1,
  },
  "3-4": {
    B1Q2: 1.3,
    B1Q4: 1.2,
    B2Q3: 1.4,
    B2Q1: 1.2,
    B3Q3: 1.2,
    B3Q7: 1.1,
    B5Q4: 1.1,
  },
  "5-6": {
    B1Q2: 1.3,
    B1Q3: 1.2,
    B2Q1: 1.2,
    B2Q7: 1.2,
    B3Q6: 1.2,
  },
  "7-9": {
    B1Q2: 1.2,
    B2Q4: 1.4,
    B2Q5: 1.3,
    B3Q3: 1.3,
    B3Q7: 1.2,
    B5Q1: 1.2,
    B5Q5: 1.1,
  },
};

const BLOCK_QUESTION_IDS: Record<BlockId, string[]> = {
  B1: ["B1Q1", "B1Q2", "B1Q3", "B1Q4", "B1Q5", "B1Q6", "B1Q7"],
  B2: ["B2Q1", "B2Q2", "B2Q3", "B2Q4", "B2Q5", "B2Q6", "B2Q7"],
  B3: ["B3Q1", "B3Q2", "B3Q3", "B3Q4", "B3Q5", "B3Q6", "B3Q7"],
  B4: ["B4Q1", "B4Q2", "B4Q3", "B4Q4", "B4Q5", "B4Q6", "B4Q7"],
  B5: ["B5Q1", "B5Q2", "B5Q3", "B5Q4", "B5Q5", "B5Q6", "B5Q7"],
};

function getQuestionWeight(ageGroup: MonitoringAgeGroup, questionId: string): number {
  const map = QUESTION_WEIGHTS_BY_AGE[ageGroup] ?? {};
  return map[questionId] ?? 1.0;
}

function computeBlockPercent(
  ageGroup: MonitoringAgeGroup,
  questionIds: string[],
  answers: AnswersMap
): { sum: number; max: number; percent: number } {
  let weightedSum = 0;
  let weightedMax = 0;
  for (const qid of questionIds) {
    const w = getQuestionWeight(ageGroup, qid);
    const a = answers[qid];
    const val = (a ?? 0) as AnswerValue;
    weightedSum += val * w;
    weightedMax += 3 * w;
  }
  const percent = weightedMax > 0 ? (weightedSum / weightedMax) * 100 : 0;
  return { sum: weightedSum, max: weightedMax, percent: round1(clamp(percent, 0, 100)) };
}

/** Loyihadagi AgeGroupId (AGE_1_5_2 va h.k.) ni MonitoringAgeGroup ga aylantiradi */
export function toMonitoringAgeGroup(ageGroupId: string): MonitoringAgeGroup {
  const map: Record<string, MonitoringAgeGroup> = {
    AGE_1_5_2: "1.5-2",
    AGE_3_4: "3-4",
    AGE_5_6: "5-6",
    AGE_7_9: "7-9",
  };
  return map[ageGroupId] ?? "3-4";
}

export function scoreMonitoringTest(params: {
  ageGroup: MonitoringAgeGroup;
  answers: AnswersMap;
  previousAnswers?: AnswersMap;
}): MonitoringResult {
  const { ageGroup, answers, previousAnswers } = params;

  const blocks: BlockScore[] = (Object.keys(BLOCK_QUESTION_IDS) as BlockId[]).map((blockId) => {
    const { sum, max, percent } = computeBlockPercent(
      ageGroup,
      BLOCK_QUESTION_IDS[blockId],
      answers
    );
    let deltaPercent: number | undefined;
    if (previousAnswers) {
      const prev = computeBlockPercent(ageGroup, BLOCK_QUESTION_IDS[blockId], previousAnswers)
        .percent;
      deltaPercent = round1(percent - prev);
    }
    return {
      blockId,
      rawSum: round1(sum),
      rawMax: round1(max),
      percent,
      status: statusFromPercent(percent),
      ...(deltaPercent !== undefined ? { deltaPercent } : {}),
    };
  });

  const overall =
    blocks.reduce((acc, b) => acc + b.percent * (BLOCK_WEIGHTS[b.blockId] ?? 0), 0) /
    Object.values(BLOCK_WEIGHTS).reduce((a, b) => a + b, 0);
  const overallPercent = round1(clamp(overall, 0, 100));
  const overallStatus = statusFromPercent(overallPercent);

  let deltaOverallPercent: number | undefined;
  if (previousAnswers) {
    const prevRes = scoreMonitoringTest({ ageGroup, answers: previousAnswers });
    deltaOverallPercent = round1(overallPercent - prevRes.overallPercent);
  }

  const recommendations = buildRecommendations({
    ageGroup,
    blocks,
    overallPercent,
    deltaOverallPercent,
  });

  return {
    ageGroup,
    overallPercent,
    overallStatus,
    blocks,
    recommendations,
    ...(deltaOverallPercent !== undefined ? { deltaOverallPercent } : {}),
  };
}

export function buildRecommendations(input: {
  ageGroup: MonitoringAgeGroup;
  blocks: BlockScore[];
  overallPercent: number;
  deltaOverallPercent?: number;
}): Recommendation[] {
  const { blocks, overallPercent, deltaOverallPercent } = input;
  const byId = Object.fromEntries(blocks.map((b) => [b.blockId, b])) as Record<BlockId, BlockScore>;
  const recs: Recommendation[] = [];
  const add = (r: Recommendation) => recs.push(r);

  if (overallPercent < 50) {
    add({
      id: "overall_support",
      title: "Rejani kuchaytirish va mutaxassis bilan reja tuzish",
      rationale:
        "Umumiy ko‘rsatkich past. Bu ko‘p yo‘nalishda bir vaqtda qo‘llab-quvvatlash kerakligini bildiradi.",
      actions: [
        "ABA/logoped/sensor mutaxassis bilan 4–6 haftalik aniq maqsadlar qo‘ying",
        "Har hafta 2–3 ta asosiy ko‘nikmaga fokus qiling (ko‘p narsani bir vaqtda emas)",
        "Uy sharoitida har kuni 15–20 daqiqa strukturalangan mashg‘ulot qiling",
      ],
      priority: "high",
    });
  }

  const blockRules: Record<BlockId, () => void> = {
    B1: () => {
      const p = byId.B1.percent;
      if (p < 55) {
        add({
          id: "b1_comm_focus",
          title: "Muloqot va nutqni kuchaytirish (B1)",
          rationale:
            "Bola ehtiyojini aniq bildirish va savol-javob ko‘nikmalari yetarli darajada barqaror emas.",
          actions: [
            "Kuniga 10–15 daqiqa “so‘rash mashqi”: bola biror narsani so‘rashini kuting, so‘raganda darhol bering",
            "Vizual yordam (visual supports — rasm/kartochka) bilan “ber/ol/kel” ko‘rsatmalarini mustahkamlang",
            "Har kuni 5–10 ta ‘taqlid’ mashqi: tovush/so‘z/harakatni takrorlash",
          ],
          priority: p < 45 ? "high" : "medium",
          targetBlockId: "B1",
        });
      }
    },
    B2: () => {
      const p = byId.B2.percent;
      if (p < 55) {
        add({
          id: "b2_social_focus",
          title: "Ijtimoiy o‘zaro ta’sirni kuchaytirish (B2)",
          rationale:
            "Joint attention, navbat, birga o‘yin yoki tengdoshlar bilan aloqa sust bo‘lishi mumkin.",
          actions: [
            "Har kuni 10 daqiqa ‘navbat’ o‘yini: koptok otish, kubik qo‘yish, stol o‘yinlari",
            "‘Birga diqqat’ mashqi: siz ko‘rsatgan narsaga qarashini rag‘batlantiring (maqtov + mukofot)",
            "Qisqa rolli o‘yinlar (pretend play): qo‘g‘irchoq, oshxona, doktor",
          ],
          priority: p < 45 ? "high" : "medium",
          targetBlockId: "B2",
        });
      }
    },
    B3: () => {
      const p = byId.B3.percent;
      if (p < 55) {
        add({
          id: "b3_behavior_focus",
          title: "Xulq va moslashuvni yaxshilash (B3)",
          rationale:
            "O‘tish (transition), qoidaga amal qilish, tantrum yoki impuls nazorati ustida ishlash kerak bo‘lishi mumkin.",
          actions: [
            "O‘tishdan oldin ogohlantirish: “yana 2 daqiqa, keyin tugatamiz” + taymer ishlatish",
            "Tantrum paytida qisqa va bir xil reaksiya: xavfsizlik + tinch ohang + alternativ so‘rashni o‘rgatish",
            "“Avval–Keyin” (First–Then) jadvali: avval vazifa, keyin yoqimli faoliyat",
          ],
          priority: p < 45 ? "high" : "medium",
          targetBlockId: "B3",
        });
      }
    },
    B4: () => {
      const p = byId.B4.percent;
      if (p < 55) {
        add({
          id: "b4_sensory_focus",
          title: "Sensor sezgirlik bilan ishlash (B4)",
          rationale:
            "Tovush/tegish/muhit/ovqat sezgirligi bola stressini oshirishi va xulqqa ta’sir qilishi mumkin.",
          actions: [
            "Bosqichma-bosqich moslashtirish: tovush/kiyim/ovqatni kichik qadamlar bilan",
            "Kun tartibiga sensor tanaffus: bosim, sakrash, cho‘zilish mashqlari",
            "Gavjum joylar uchun oldindan reja: qisqa kirish, tinch zona, qulay quloqchin (agar kerak bo‘lsa)",
          ],
          priority: p < 45 ? "high" : "medium",
          targetBlockId: "B4",
        });
      }
    },
    B5: () => {
      const p = byId.B5.percent;
      if (p < 55) {
        add({
          id: "b5_daily_focus",
          title: "Mustaqillik va kundalik ko‘nikmalarni oshirish (B5)",
          rationale:
            "Self-care va kundalik vazifalar bola va ota-onaning hayot sifatiga kuchli ta’sir qiladi.",
          actions: [
            "Vazifani mayda qadamga bo‘ling (task analysis): kiyinish/qo‘l yuvish/ovqatlanish",
            "Vizual jadval (visual schedule) bilan har kuni bir xil ketma-ketlik",
            "Har bir mustaqil urinish uchun darhol maqtov va kichik mukofot",
          ],
          priority: p < 45 ? "high" : "medium",
          targetBlockId: "B5",
        });
      }
    },
  };

  (Object.keys(blockRules) as BlockId[]).forEach((bid) => blockRules[bid]());

  if (deltaOverallPercent !== undefined) {
    if (deltaOverallPercent >= 8) {
      add({
        id: "trend_positive",
        title: "Ijobiy dinamika",
        rationale: "Oldingi testga nisbatan umumiy natija sezilarli yaxshilangan.",
        actions: [
          "Ayni strategiyalarni davom ettiring",
          "Eng kuchli o‘sayotgan blokdagi mashqlarni haftasiga 10–20% kuchaytiring",
        ],
        priority: "low",
      });
    } else if (deltaOverallPercent <= -8) {
      add({
        id: "trend_negative",
        title: "Dinamika pasaygan",
        rationale:
          "Oldingi testga nisbatan pasayish bor. Bu stress, muhit o‘zgarishi yoki terapiya uzilishi bilan bog‘liq bo‘lishi mumkin.",
        actions: [
          "Oxirgi 2–4 haftada nima o‘zgarganini yozib chiqing (uyqu, bog‘cha, kasallik, jadval)",
          "2 hafta ichida qayta monitoring qiling",
          "Agar pasayish davom etsa, mutaxassis bilan rejani qayta ko‘rib chiqing",
        ],
        priority: "medium",
      });
    }
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  recs.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  return recs;
}

export const BLOCK_LABELS_UZ: Record<BlockId, string> = {
  B1: "Muloqot va til rivoji",
  B2: "Ijtimoiy o‘zaro ta’sir",
  B3: "Xulq va moslashuv",
  B4: "Sensor va sezgirlik",
  B5: "Mustaqillik va kundalik ko‘nikmalar",
};

export const STATUS_LABELS_UZ: Record<BlockStatus, string> = {
  good: "Yaxshi",
  ok: "Qoniqarli",
  needs_focus: "E’tibor kerak",
};
