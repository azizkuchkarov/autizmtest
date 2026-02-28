/**
 * Yangi screening test hisoblash algoritmi
 * Bloklar bo'yicha hisoblash, A/B/C sohalariga mos professional risk logikasi.
 *
 * Professional mantiq:
 * - A (ijtimoiy) va B (muloqot): ijobiy ko'nikmalar — "Doim" va "Ko'pincha" yaxshi (past risk).
 *   Yo'q/Kamdan-kam = e'tibor kerak (yuqori risk). Shuning uchun 2 va 3 → risk 0, 1 → 2, 0 → 3.
 * - C (takroriy/sezgi): cheklangan xatti-harakatlar — "Yo'q" va "Kamdan-kam" yaxshi (past risk).
 *   Ko'pincha/Doim = e'tibor kerak. Shuning uchun 0 va 1 → risk 0, 2 → 2, 3 → 3.
 */

import type { AnswerValue, Question, TestSchema, Answers, Trigger } from "./screening-v2-types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Blok (soha) bo'yicha risk 0..3 (float bo'lishi mumkin):
 * - A/B (ijtimoiy, muloqot): Ko'pincha Doimga yaqin, lekin butunlay 0 emas.
 *   3 (Doim) -> 0, 2 (Ko'pincha) -> 0.5, 1 (Kamdan-kam) -> 2, 0 (Yo'q) -> 3.
 * - C (takroriy/sezgi): Kamdan-kam ham juda past risk, lekin nol emas.
 *   0 (Yo'q) -> 0, 1 (Kamdan-kam) -> 0.5, 2 (Ko'pincha) -> 2, 3 (Doim) -> 3.
 */
function computeRiskForBlock(answer: AnswerValue, blockId: string): number {
  if (blockId === "A" || blockId === "B") {
    switch (answer) {
      case 3:
        return 0;
      case 2:
        return 0.5;
      case 1:
        return 2;
      case 0:
      default:
        return 3;
    }
  }
  if (blockId === "C") {
    switch (answer) {
      case 0:
        return 0;
      case 1:
        return 0.5;
      case 2:
        return 2;
      case 3:
      default:
        return 3;
    }
  }
  // Boshqa bloklar bo'lsa, oddiy chiziqli risk (0..3) qoldiramiz
  return answer;
}

function isRedFlagTriggered(q: Question, answer: AnswerValue): boolean {
  if (!q.isRedFlag || !q.redFlagTrigger) return false;

  // For reverse questions: low answers mean high risk.
  // We keep triggers intuitive:
  // - reverse questions: trigger when answer <= X
  // - normal questions: trigger when answer >= X
  const { operator, value } = q.redFlagTrigger;
  if (operator === "<=") return answer <= value;
  if (operator === ">=") return answer >= value;
  return false;
}

export function scoreTest(
  schema: TestSchema,
  answers: Answers,
  ageGroupId: string
) {
  const blocks = schema.blocks;

  const blockResults = blocks.map((b) => {
    const applicable = b.questions.filter((q) => q.ageGroupIds.includes(ageGroupId));

    let wSum = 0;
    let wrSum = 0;

    const issues: Array<{
      questionId: string;
      risk: number;
      weight: number;
      weightedRisk: number;
      text: string;
      help?: string;
      isRedFlag: boolean;
      // Ota-ona tanlagan javob (0–3) ni natijaga qo'shamiz, ustuvor savollarda ko'rsatish uchun
      answer?: AnswerValue;
    }> = [];

    let redFlags: Array<{ questionId: string; text: string }> = [];

    for (const q of applicable) {
      const a = answers[q.id];
      if (a === null || a === undefined) continue;

      const risk = computeRiskForBlock(a, b.id); // 0..3, A/B va C uchun professional mantiq
      const weightedRisk = risk * q.weight;

      wSum += q.weight;
      wrSum += weightedRisk;

      const rf = isRedFlagTriggered(q, a);
      if (rf) redFlags.push({ questionId: q.id, text: q.text });

      issues.push({
        questionId: q.id,
        risk,
        weight: q.weight,
        weightedRisk,
        text: q.text,
        help: q.help,
        isRedFlag: !!rf,
        answer: a,
      });
    }

    const blockScore = wSum > 0 ? (wrSum / wSum) * 100 : 0;

    // Barcha javob berilgan savollar (weightedRisk bo‘yicha kamayish tartibida) — "Autizmga moyilligi bor" bo‘limida to‘liq ko‘rsatish uchun
    issues.sort((x, y) => y.weightedRisk - x.weightedRisk);

    return {
      blockId: b.id,
      title: b.title,
      score: clamp(blockScore, 0, 100),
      redFlags,
      topIssues: issues,
    };
  });

  // Soha vaznlari: A (ijtimoiy) 50%, B (muloqot) 30%, C (takroriy/sezgi) 20%
  const BLOCK_WEIGHTS: Record<string, number> = {
    A: 0.5,
    B: 0.3,
    C: 0.2,
  };
  const totalScore =
    blockResults.length > 0
      ? blockResults.reduce(
          (s, b) => s + b.score * (BLOCK_WEIGHTS[b.blockId] ?? 1 / blockResults.length),
          0
        )
      : 0;

  const allRedFlags = blockResults.flatMap((b) => b.redFlags);

  // Darajalar: Past 0–30%, O'rta 31–60%, Yuqori 61%+
  const riskLabel =
    totalScore <= 30 ? "Past xavf" : totalScore <= 60 ? "O'rtacha xavf" : "Yuqori xavf";

  // Barcha bloklardagi barcha ball olgan savollar (cheklovsiz) — natija sahifasida "Autizmga moyilligi bor savollar va javoblari" to‘liq chiqishi uchun
  const topOverall = blockResults
    .flatMap((b) =>
      b.topIssues.map((i) => ({ ...i, blockId: b.blockId, blockTitle: b.title }))
    )
    .sort((a, b) => b.weightedRisk - a.weightedRisk);

  return {
    ageGroupId,
    totalScore: clamp(totalScore, 0, 100),
    riskLabel,
    redFlagCount: allRedFlags.length,
    redFlags: allRedFlags,
    blocks: blockResults,
    topOverall,
  };
}
