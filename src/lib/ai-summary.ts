import type { AiSummaryPayload, ScreeningV2Result } from "@/types/api";
import type { MonitoringResult } from "./monitoringScoring";

const DEFAULT_DISCLAIMER =
  "Bu skrining natijasi — tibbiy tashxis emas. Yakuniy baho va tavsiyalar uchun mutaxassis (pediatr, bolalar nevrologi yoki rivoj mutaxassisi) bilan muloqot qilishingiz tavsiya etiladi.";

const MONITORING_DISCLAIMER =
  "Bu progress monitoring xulosasi — tibbiy tashxis emas. Reja va davolash uchun mutaxassis bilan hamkorlik qilishingiz tavsiya etiladi.";

const SYSTEM_PROMPT = `Siz autizm skriningi natijalarini tushuntiradigan professional yordamchisiz.
Vazifa: ota-onaga natijani aniq, ehtiyotkor va tushunarli qilib berish.

QAT'IY QOIDALAR:
1) TASHXIS qo'ymang. "Autizm bor/yo'q" demang. Faqat risk darajasi va kuzatish haqida yozing.
2) Vahima uyg'otmang. Balansli, professional tilda yozing.
3) Har doim disclaimer bo'lsin: tibbiy tashxis emas, mutaxassis bilan muloqot tavsiya.
4) Tavsiyalar aniq bo'lsin: kimga murojaat, qanday kuzatish, uy sharoitida qilish mumkin bo'lgan qadamlari.
5) Til: o'zbek (lotin). Tibbiy terminlar minimal.
6) Javobni FAQAT quyidagi JSON formatida qaytaring, boshqa matn yozmang.

JSON STRUKTURASI (strict):
{
  "summary": {
    "shortConclusion": "1-2 jumla qisqa xulosa",
    "whyThisLevel": "Nima uchun shu daraja (2-3 jumla)"
  },
  "strengths": {
    "examples": ["kuchli tomon 1", "kuchli tomon 2", "..."]
  },
  "needsFocus": {
    "priority": ["e'tibor kerak yo'nalish 1", "yo'nalish 2", "..."]
  },
  "nextSteps": {
    "homePlan": [
      {
        "title": "Qisqa sarlavha",
        "why": "Nima uchun muhim",
        "how": ["Qadam 1", "Qadam 2"]
      }
    ]
  },
  "disclaimer": {
    "text": "Bu skrining natijasi — tibbiy tashxis emas. Mutaxassis bilan muloqot tavsiya etiladi."
  }
}`;

export async function generateAiSummary(aiFacts: Record<string, unknown>): Promise<AiSummaryPayload> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: {
        shortConclusion: "AI xulosa sozlamasi topilmadi.",
        whyThisLevel: "OPENAI_API_KEY .env da o'rnatilmagan.",
      },
      strengths: { examples: [] },
      needsFocus: { priority: [] },
      nextSteps: { homePlan: [] },
      disclaimer: { text: DEFAULT_DISCLAIMER },
    };
  }

  const userContent = `Quyidagi skrining natijasi (aiFacts) asosida JSON xulosa yozing. Faqat JSON qaytaring.\n\n${JSON.stringify(aiFacts, null, 2)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI xatolik: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("AI javobi bo'sh.");
  }

  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("AI javobi JSON emas.");
  }

  const p = parsed as Record<string, unknown>;
  const payload: AiSummaryPayload = {
    summary: p.summary as AiSummaryPayload["summary"],
    strengths: p.strengths as AiSummaryPayload["strengths"],
    needsFocus: p.needsFocus as AiSummaryPayload["needsFocus"],
    nextSteps: p.nextSteps as AiSummaryPayload["nextSteps"],
    disclaimer: (p.disclaimer as AiSummaryPayload["disclaimer"]) ?? { text: DEFAULT_DISCLAIMER },
  };

  if (!payload.summary?.shortConclusion) payload.summary = { shortConclusion: "Xulosa", whyThisLevel: "" };
  if (!Array.isArray(payload.strengths?.examples)) payload.strengths = { examples: [] };
  if (!Array.isArray(payload.needsFocus?.priority)) payload.needsFocus = { priority: [] };
  if (!Array.isArray(payload.nextSteps?.homePlan)) payload.nextSteps = { homePlan: [] };

  return payload;
}

const SCREENING_V2_SYSTEM_PROMPT = `Siz autizm skriningi (screening v2) natijalarini tushuntiradigan professional yordamchisiz.
Vazifa: ota-onaga natijani aniq, ehtiyotkor va tushunarli qilib berish — risk darajasi, qaysi bloklar (ijtimoiy, muloqot, takroriy/sezgi) qanday, qanday tavsiyalar.

QAT'IY QOIDALAR:
1) TASHXIS qo'ymang. "Autizm bor/yo'q" demang. Faqat risk darajasi va kuzatish haqida yozing.
2) Vahima uyg'otmang. Balansli, professional tilda yozing.
3) Har doim disclaimer: tibbiy tashxis emas, bolalar nevrologi yoki rivojlanish mutaxassisi bilan muloqot tavsiya.
4) Tavsiyalar aniq bo'lsin: kimga murojaat, qanday kuzatish, uy sharoitida qilish mumkin bo'lgan qadamlari.
5) Til: o'zbek (lotin). Tibbiy terminlar minimal.
6) Javobni FAQAT quyidagi JSON formatida qaytaring, boshqa matn yozmang.

JSON STRUKTURASI (strict):
{
  "summary": {
    "shortConclusion": "1-2 jumla qisqa xulosa (risk darajasi asosida)",
    "whyThisLevel": "Nima uchun shu risk darajasi (2-3 jumla)"
  },
  "strengths": {
    "examples": ["kuchli tomon yoki yaxshi ko'rsatkich 1", "2", "..."]
  },
  "needsFocus": {
    "priority": ["e'tibor kerak yo'nalish 1", "yo'nalish 2", "..."]
  },
  "nextSteps": {
    "homePlan": [
      {
        "title": "Qisqa sarlavha",
        "why": "Nima uchun muhim",
        "how": ["Qadam 1", "Qadam 2"]
      }
    ]
  },
  "disclaimer": {
    "text": "Bu skrining natijasi — tibbiy tashxis emas. Mutaxassis bilan muloqot tavsiya etiladi."
  }
}`;

/**
 * Screening V2 natijasi uchun AI xulosa.
 * totalScore, riskLabel, blocks, redFlags, topOverall asosida xulosa yaratadi.
 */
export async function generateAiSummaryForScreeningV2(
  result: ScreeningV2Result
): Promise<AiSummaryPayload> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: {
        shortConclusion: "AI xulosa sozlamasi topilmadi.",
        whyThisLevel: "OPENAI_API_KEY .env da o'rnatilmagan.",
      },
      strengths: { examples: [] },
      needsFocus: { priority: [] },
      nextSteps: { homePlan: [] },
      disclaimer: { text: DEFAULT_DISCLAIMER },
    };
  }

  const facts = {
    riskLabel: result.riskLabel,
    totalScore: result.totalScore,
    redFlagCount: result.redFlagCount,
    redFlags: (result.redFlags ?? []).slice(0, 10).map((r) => r.text),
    blocks: (result.blocks ?? []).map((b) => ({
      title: b.title,
      score: b.score,
      redFlagsCount: (b.redFlags ?? []).length,
    })),
    topOverall: (result.topOverall ?? []).slice(0, 8).map((t) => ({
      text: t.text,
      blockTitle: t.blockTitle,
      risk: t.risk,
      isRedFlag: t.isRedFlag,
    })),
  };

  const userContent = `Quyidagi skrining (screening v2) natijasi asosida JSON xulosa yozing. Faqat JSON qaytaring.\n\n${JSON.stringify(facts, null, 2)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SCREENING_V2_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI xatolik: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("AI javobi bo'sh.");
  }

  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("AI javobi JSON emas.");
  }

  const p = parsed as Record<string, unknown>;
  const payload: AiSummaryPayload = {
    summary: p.summary as AiSummaryPayload["summary"],
    strengths: p.strengths as AiSummaryPayload["strengths"],
    needsFocus: p.needsFocus as AiSummaryPayload["needsFocus"],
    nextSteps: p.nextSteps as AiSummaryPayload["nextSteps"],
    disclaimer: (p.disclaimer as AiSummaryPayload["disclaimer"]) ?? { text: DEFAULT_DISCLAIMER },
  };

  if (!payload.summary?.shortConclusion) payload.summary = { shortConclusion: "Xulosa", whyThisLevel: "" };
  if (!Array.isArray(payload.strengths?.examples)) payload.strengths = { examples: [] };
  if (!Array.isArray(payload.needsFocus?.priority)) payload.needsFocus = { priority: [] };
  if (!Array.isArray(payload.nextSteps?.homePlan)) payload.nextSteps = { homePlan: [] };

  return payload;
}

const MONITORING_SYSTEM_PROMPT = `Siz autizm rivojlanishini monitoring qilish (progress test) natijalarini tushuntiradigan professional yordamchisiz.
Vazifa: ota-onaga monitoring natijasini aniq, ehtiyotkor va tushunarli qilib berish — qaysi bloklar yaxshi, qaysi bloklarda e'tibor kerak, uyda qanday mashqlar qilish mumkin.

QAT'IY QOIDALAR:
1) TASHXIS qo'ymang. Faqat rivojlanish ko'rsatkichlari va tavsiyalar haqida yozing.
2) Vahima uyg'otmang. Ijobiy va qo'llab-quvvatlovchi tilda yozing.
3) Har doim disclaimer bo'lsin: tibbiy tashxis emas, mutaxassis bilan muloqot tavsiya.
4) Kuchli tomonlarni va e'tibor kerak yo'nalishlarni tizimli qiling. Uy rejasi aniq qadamlardan iborat bo'lsin.
5) Til: o'zbek (lotin). Tibbiy terminlar minimal.
6) Javobni FAQAT quyidagi JSON formatida qaytaring, boshqa matn yozmang.

JSON STRUKTURASI (strict):
{
  "summary": {
    "shortConclusion": "1-2 jumla qisqa xulosa (umumiy foiz va status asosida)",
    "whyThisLevel": "Nima uchun shu umumiy natija (2-3 jumla)"
  },
  "strengths": {
    "examples": ["kuchli tomon / yaxshi rivojlangan blok 1", "2", "..."]
  },
  "needsFocus": {
    "priority": ["e'tibor kerak yo'nalish 1", "yo'nalish 2", "..."]
  },
  "nextSteps": {
    "homePlan": [
      {
        "title": "Qisqa sarlavha",
        "why": "Nima uchun muhim",
        "how": ["Qadam 1", "Qadam 2"]
      }
    ]
  },
  "disclaimer": {
    "text": "Bu progress monitoring xulosasi — tibbiy tashxis emas. Mutaxassis bilan muloqot tavsiya etiladi."
  }
}`;

/**
 * Progress monitoring natijasi uchun AI xulosa.
 * monitoringResult ni JSON qilib AI ga yuboradi, bir xil AiSummaryPayload qaytaradi.
 */
export async function generateAiSummaryForMonitoring(
  monitoringResult: MonitoringResult
): Promise<AiSummaryPayload> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: {
        shortConclusion: "AI xulosa sozlamasi topilmadi.",
        whyThisLevel: "OPENAI_API_KEY .env da o'rnatilmagan.",
      },
      strengths: { examples: [] },
      needsFocus: { priority: [] },
      nextSteps: { homePlan: [] },
      disclaimer: { text: MONITORING_DISCLAIMER },
    };
  }

  const facts = {
    ageGroup: monitoringResult.ageGroup,
    overallPercent: monitoringResult.overallPercent,
    overallStatus: monitoringResult.overallStatus,
    deltaOverallPercent: monitoringResult.deltaOverallPercent,
    blocks: monitoringResult.blocks.map((b) => ({
      blockId: b.blockId,
      percent: b.percent,
      status: b.status,
      deltaPercent: b.deltaPercent,
    })),
    recommendationsSummary: monitoringResult.recommendations.map((r) => ({
      id: r.id,
      title: r.title,
      priority: r.priority,
      rationale: r.rationale,
      actionsCount: r.actions.length,
    })),
  };

  const userContent = `Quyidagi progress monitoring natijasi asosida JSON xulosa yozing. Faqat JSON qaytaring.\n\n${JSON.stringify(facts, null, 2)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: MONITORING_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI xatolik: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("AI javobi bo'sh.");
  }

  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("AI javobi JSON emas.");
  }

  const p = parsed as Record<string, unknown>;
  const payload: AiSummaryPayload = {
    summary: p.summary as AiSummaryPayload["summary"],
    strengths: p.strengths as AiSummaryPayload["strengths"],
    needsFocus: p.needsFocus as AiSummaryPayload["needsFocus"],
    nextSteps: p.nextSteps as AiSummaryPayload["nextSteps"],
    disclaimer: (p.disclaimer as AiSummaryPayload["disclaimer"]) ?? { text: MONITORING_DISCLAIMER },
  };

  if (!payload.summary?.shortConclusion) payload.summary = { shortConclusion: "Xulosa", whyThisLevel: "" };
  if (!Array.isArray(payload.strengths?.examples)) payload.strengths = { examples: [] };
  if (!Array.isArray(payload.needsFocus?.priority)) payload.needsFocus = { priority: [] };
  if (!Array.isArray(payload.nextSteps?.homePlan)) payload.nextSteps = { homePlan: [] };

  return payload;
}
