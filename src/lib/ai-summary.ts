import type { AiSummaryPayload, ScreeningV2Result } from "@/types/api";
import type { MonitoringResult } from "./monitoringScoring";
import type { Locale } from "@/lib/locale";

/** OpenAI API bazasi. Region bloklangan bo'lsa proxy yoki boshqa endpoint .env da OPENAI_BASE_URL qilib o'rnating. */
function getOpenAiBaseUrl(): string {
  const base = process.env.OPENAI_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : "https://api.openai.com";
}

const OPENAI_CHAT_URL = () => `${getOpenAiBaseUrl()}/v1/chat/completions`;

const DEFAULT_DISCLAIMER =
  "Bu skrining natijasi — tibbiy tashxis emas. Yakuniy baho va tavsiyalar uchun mutaxassis (pediatr, bolalar nevrologi yoki rivoj mutaxassisi) bilan muloqot qilishingiz tavsiya etiladi.";

const AI_JSON_ERROR = "AI javobi JSON emas.";

/** Birinchi { dan boshlanib, mos } gacha bo‘lgan qatorni topadi (ichki qavslar hisobga olinadi). */
function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** AI dan kelgan matndan JSON obyektini ajratib parse qiladi (markdown, izohlar yoki ortiqcha matn bo'lsa ham). */
function parseAiJson(raw: string): unknown {
  let s = raw.trim();
  // Markdown code block
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  // Boshqa til (masalan ru) da "Вот JSON:" kabi matn olib tashlanadi — faqat birinchi { ... } qismi
  const extracted = extractFirstJsonObject(s);
  const toParse = extracted ?? s;
  try {
    return JSON.parse(toParse);
  } catch {
    // Trailing comma yoki boshqa kichik xatolarni tuzatishga urinish
    const fixed = toParse
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/\r\n/g, "\n");
    try {
      return JSON.parse(fixed);
    } catch {
      throw new Error(AI_JSON_ERROR);
    }
  }
}

const MONITORING_DISCLAIMER =
  "Bu progress monitoring xulosasi — tibbiy tashxis emas. Reja va davolash uchun mutaxassis bilan hamkorlik qilishingiz tavsiya etiladi.";

const SYSTEM_PROMPT = `Siz autizm skriningi natijalarini tushuntiradigan professional yordamchisiz. Vazifa: ota-onaga natijani TO'LIQ, ANIQ va PROFESSIONAL tarzda berish — qisqa va sust xulosa yozmang.

MUHIM: Yuqori ball = autizm belgilari kuchli (xavf), "kuchli tomon" emas. Yuqori balllarni "Kuchli tomonlar" ga yozmang; faqat haqiqiy kuchli tomonlarni strengths ga, yuqori balli sohalarni needsFocus ga "Belgilar kuchli kuzatilgan soha: ..." deb yozing.

QAT'IY: Tashxis qo'ymang, vahima uyg'otmang. Til: o'zbek (lotin). Javobni FAQAT quyidagi JSON da qaytaring. Har bir maydon to'liq to'ldirilsin.

JSON (to'liq va professional):
{
  "summary": {
    "shortConclusion": "2–4 jumla to'liq xulosa",
    "whyThisLevel": "4–7 jumla: nima uchun shu daraja, natija nimani anglatadi"
  },
  "strengths": { "examples": ["3–5 ta to'liq jumla, faqat haqiqiy kuchli tomonlar"] },
  "needsFocus": { "priority": ["Yuqori balli sohalar 1–2 jumla bilan; past risk bo'lsa bo'sh []"] },
  "nextSteps": {
    "homePlan": [
      { "title": "Sarlavha", "why": "2–4 jumla", "how": ["4–6 ta aniq qadam"] }
    ]
  },
  "disclaimer": { "text": "Bu skrining natijasi — tibbiy tashxis emas. Mutaxassis bilan muloqot tavsiya etiladi." }
}
— homePlan da 4–6 ta element, har birida how da 4–6 ta qadam.`;

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

  const userContent = `Quyidagi skrining natijasi asosida TO'LIQ va PROFESSIONAL JSON xulosa yozing. Faqat JSON. shortConclusion 2–4 jumla, whyThisLevel 4–7 jumla, strengths 3–5 ta, homePlan 4–6 ta element (har birida how da 4–6 ta qadam).\n\n${JSON.stringify(aiFacts, null, 2)}`;

  const res = await fetch(OPENAI_CHAT_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2048,
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

  const p = parseAiJson(raw) as Record<string, unknown>;
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

const SCREENING_V2_SYSTEM_PROMPT = `Siz bolalar rivojlanishi va autizm skriningi bo'yicha professional yordamchisiz. Vazifangiz — ota-onaga skrining natijasini TO'LIQ, ANIQ va PROFESSIONAL tarzda tushuntirish. Xulosa qisqa va sust bo'lmasin: ota-ona natijani to'liq tushunishi, qanday harakat qilish kerakligini aniq bilishi kerak.

USLUB: Professional, ammo tushunarli til. Tibbiy terminlar kam, lekin matn qisqa va umuman yozilmasin. Har bir bo'limda yetarli hajmda ma'lumot bering.

SIZGA BERILADIGAN MA'LUMOT: riskLabel ("Past xavf" / "O'rtacha xavf" / "Yuqori xavf"), totalScore (0–100), blocks — har biri uchun title va score (0–100). score = xavf ko'rsatkichi: yuqori score = shu sohada autizm belgilari kuchli.

"E'tibor kerak" (needsFocus): Faqat score 50+ bo'lgan bloklarni "belgilar kuchli kuzatilgan" deb yozing. riskLabel "Past xavf" va barcha blok score lari past (40 dan past) bo'lsa — needsFocus ni bo'sh [] qoldiring yoki bitta umumiy band (masalan "Rivojlanishni kuzatishda davom eting").

"Kuchli tomonlar" (strengths): Yuqori ball olgan bloklarni bu yerga yozmang. Past risk/past ball bo'lsa — 3–5 ta to'liq jumla bilan kuchli tomonlarni (qaysi sohalar yaxshi) yozing.

QAT'IY: Tashxis qo'ymang, vahima uyg'otmang. Til: o'zbek (lotin). Javobni FAQAT quyidagi JSON da qaytaring.

JSON — HAR BIR MAYDON TO'LIQ TO'LDIRILSIN:
{
  "summary": {
    "shortConclusion": "2–4 jumladan iborat to'liq xulosa: risk darajasi, umumiy baho, ota-ona uchun asosiy xabar. Qisqa 1 jumla emas — to'liq professional xulosa.",
    "whyThisLevel": "4–7 jumla: Nima uchun shu risk darajasi chiqdi, qaysi sohalar qanday baholangan, bu natija nimani anglatadi, ota-ona nima bilishi kerak. Paragraf shaklida, to'liq tushuntirish."
  },
  "strengths": {
    "examples": ["Har biri 1–2 jumla. Risk past bo'lsa 3–5 ta: ijtimoiy aloqa/muloqot/takroriy sohalar bo'yicha ijobiy tomonlar. Yuqori risk bo'lsa bo'sh [] yoki 1 qo'llab-quvvatlovchi jumla."]
  },
  "needsFocus": {
    "priority": ["Faqat yuqori score li bloklar uchun. Har biri 1–2 jumla: soha nomi va qisqacha nima uchun e'tibor kerak. Past risk bo'lsa bo'sh []."]
  },
  "nextSteps": {
    "homePlan": [
      { "title": "Sarlavha", "why": "2–4 jumla nima uchun muhim", "how": ["Qadam 1", "Qadam 2", "… 4–6 ta aniq qadam"] }
    ]
  }
  — homePlan da 4–6 ta element bo'lsin, har birida how da 4–6 ta aniq qadam.
  "disclaimer": {
    "text": "Bu skrining natijasi — tibbiy tashxis emas. Yakuniy baho va davolash rejasi uchun bolalar nevrologi yoki rivojlanish mutaxassisi bilan muloqot qilishingiz tavsiya etiladi."
  }
}`;

const SCREENING_V2_SYSTEM_PROMPT_RU = `Вы — профессиональный помощник по скринингу развития ребёнка и признаков аутизма. Ваша задача — дать родителям ПОЛНОЕ, ТОЧНОЕ и ПРОФЕССИОНАЛЬНОЕ заключение по результатам скрининга. Заключение не должно быть кратким или сухим: родитель должен полностью понимать результат и что делать дальше.

СТИЛЬ: Профессиональный, но понятный язык. Медицинских терминов минимум. Достаточный объём в каждом разделе.

ДАННЫЕ: riskLabel (уровень риска), totalScore (0–100), blocks — название блока и score (0–100). score = показатель риска по блоку: высокий score = выраженные признаки в этой сфере.

"Направления, требующие внимания" (needsFocus): Указывайте только блоки с score 50+. При низком риске и низких score — пустой [] или одна общая фраза.

"Сильные стороны" (strengths): Не включайте блоки с высоким score. При низком риске — 3–5 предложений о сильных сторонах.

КРИТИЧЕСКИ ВАЖНО: Не ставьте диагноз, не пугайте. Язык ответа: ТОЛЬКО РУССКИЙ. Весь текст во всех полях JSON должен быть на русском языке. Ответ — СТРОГО в формате JSON ниже.

JSON — ВСЕ ПОЛЯ ЗАПОЛНИТЕ НА РУССКОМ:
{
  "summary": {
    "shortConclusion": "2–4 предложения: уровень риска, общая оценка, главный вывод для родителей.",
    "whyThisLevel": "4–7 предложений: почему такой уровень риска, как оценены сферы, что это значит, что важно знать родителям."
  },
  "strengths": {
    "examples": ["Каждый пункт 1–2 предложения. При низком риске 3–5 пунктов; при высоком — [] или одна поддерживающая фраза."]
  },
  "needsFocus": {
    "priority": ["Только блоки с высоким score. 1–2 предложения на сферу. При низком риске — []."]
  },
  "nextSteps": {
    "homePlan": [
      { "title": "Название", "why": "2–4 предложения зачем важно", "how": ["Шаг 1", "Шаг 2", "… 4–6 конкретных шагов"] }
    ]
  },
  "disclaimer": {
    "text": "Результат скрининга не является медицинским диагнозом. Для окончательной оценки и плана рекомендована консультация детского невролога или специалиста по развитию."
  }
}
В homePlan 4–6 элементов, в каждом how — 4–6 конкретных шагов. ВСЕ ТЕКСТЫ СТРОГО НА РУССКОМ.`;

const AGE_GROUP_LABELS_UZ: Record<string, string> = {
  AGE_1_5_2: "1,5–2 yosh",
  AGE_3_4: "3–4 yosh",
  AGE_5_6: "5–6 yosh",
  AGE_7_9: "7–9 yosh",
};
const AGE_GROUP_LABELS_RU: Record<string, string> = {
  AGE_1_5_2: "1,5–2 года",
  AGE_3_4: "3–4 года",
  AGE_5_6: "5–6 лет",
  AGE_7_9: "7–9 лет",
};

const RISK_LABELS_RU: Record<string, string> = {
  "Past xavf": "Низкий риск",
  "O'rtacha xavf": "Средний риск",
  "Yuqori xavf": "Высокий риск",
};

const BLOCK_TITLES_RU: Record<string, string> = {
  A: "Социальное взаимодействие и общение",
  B: "Общение и речь",
  C: "Ограниченные и повторяющиеся модели поведения",
};

function getAgeGroupLabel(ageGroupId: string | null | undefined, locale: Locale): string | null {
  if (!ageGroupId) return null;
  const labels = locale === "ru" ? AGE_GROUP_LABELS_RU : AGE_GROUP_LABELS_UZ;
  return labels[ageGroupId] ?? ageGroupId;
}

/**
 * Screening V2 natijasi uchun AI xulosa.
 * locale === "ru" bo'lsa, barcha matn rus tilida qaytariladi.
 * ageGroupId berilsa, xulosa bolaning yoshiga moslashtiriladi.
 */
export async function generateAiSummaryForScreeningV2(
  result: ScreeningV2Result,
  locale?: Locale,
  ageGroupId?: string | null
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

  const ageLabel = getAgeGroupLabel(ageGroupId, locale ?? "uz");
  const ageLine =
    locale === "ru"
      ? ageLabel
        ? `\nВозраст ребёнка: ${ageLabel}. Формулируйте заключение и рекомендации строго с учётом этого возраста (нормы развития, формулировки и советы должны соответствовать возрасту).\n`
        : ""
      : ageLabel
        ? `\nBola yoshi (yosh guruhi): ${ageLabel}. Xulosani va tavsiyalarni shu yoshga moslashtiring — rivojlanish normasi va tushuntirishlar bolaning yoshiga mos bo'lsin.\n`
        : "";

  const isRu = locale === "ru";

  const facts = {
    riskLabel: isRu ? (RISK_LABELS_RU[result.riskLabel] ?? result.riskLabel) : result.riskLabel,
    totalScore: result.totalScore,
    redFlagCount: result.redFlagCount,
    redFlags: (result.redFlags ?? []).slice(0, 10).map((r) => r.text),
    blocks: (result.blocks ?? []).map((b) => ({
      title: isRu ? (BLOCK_TITLES_RU[b.blockId] ?? b.title) : b.title,
      score: b.score,
      redFlagsCount: (b.redFlags ?? []).length,
    })),
    topOverall: (result.topOverall ?? []).slice(0, 8).map((t) => ({
      text: t.text,
      blockTitle: isRu ? (BLOCK_TITLES_RU[t.blockId] ?? t.blockTitle) : t.blockTitle,
      risk: t.risk,
      isRedFlag: t.isRedFlag,
    })),
  };

  const systemPrompt = isRu ? SCREENING_V2_SYSTEM_PROMPT_RU : SCREENING_V2_SYSTEM_PROMPT;

  const userContentRu = `Составьте ПОЛНОЕ и ПРОФЕССИОНАЛЬНОЕ заключение по результатам скрининга. Ответ — ТОЛЬКО валидный JSON.

КРИТИЧЕСКИ ВАЖНО: Весь ваш ответ (все поля JSON: summary.shortConclusion, summary.whyThisLevel, strengths.examples, needsFocus.priority, nextSteps.homePlan, disclaimer.text) должен быть написан СТРОГО на русском языке. Не используйте узбекский язык в ответе. Входные данные ниже могут содержать узбекские названия — переводите смысл на русский в своём ответе.${ageLine}

Требования: shortConclusion — 2–4 предложения; whyThisLevel — 4–7 предложений; strengths — при низком риске 3–5 пунктов; homePlan — 4–6 планов, в каждом title, why (2–4 предложения), how (4–6 конкретных шагов). Блоки score 0–100. При низком riskLabel и низких score — needsFocus пустой [].

Данные скрининга:\n${JSON.stringify(facts, null, 2)}`;

  const userContentUz = `Quyidagi skrining natijasi asosida TO'LIQ va PROFESSIONAL JSON xulosa yozing. Faqat JSON qaytaring.${ageLine}

Talablar: shortConclusion 2–4 jumla; whyThisLevel 4–7 jumla to'liq tushuntirish; strengths da risk past bo'lsa 3–5 ta band; homePlan da 4–6 ta reja, har birida title, why (2–4 jumla), how (4–6 ta aniq qadam). Ota-ona natijani to'liq tushunishi kerak.

MUHIM: Barcha javobni faqat o'zbek tilida (lotin) yozing. JSON dagi barcha maydonlar o'zbekcha bo'lsin. Esda tuting: blocks da score 0–100. riskLabel "Past xavf" va barcha score past bo'lsa, needsFocus ni bo'sh [] qoldiring.

\n${JSON.stringify(facts, null, 2)}`;

  const userContent = isRu ? userContentRu : userContentUz;

  const res = await fetch(OPENAI_CHAT_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
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

  const p = parseAiJson(raw) as Record<string, unknown>;
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

const MONITORING_SYSTEM_PROMPT = `Siz bolalar rivojlanishi monitoringi (progress test) natijalarini tushuntiradigan professional yordamchisiz. Vazifa: ota-onaga natijani TO'LIQ va PROFESSIONAL tarzda berish — qisqa va sust xulosa yozmang.

QAT'IY: Tashxis qo'ymang, vahima uyg'otmang. Ijobiy, qo'llab-quvvatlovchi til. O'zbek (lotin). Javobni FAQAT quyidagi JSON da qaytaring. Har bir maydon to'liq to'ldirilsin.

JSON (to'liq va professional):
{
  "summary": {
    "shortConclusion": "2–4 jumla: umumiy foiz, status, asosiy xulosa",
    "whyThisLevel": "4–7 jumla: nima uchun shu natija, qaysi bloklar qanday, ota-ona nima bilishi kerak"
  },
  "strengths": {
    "examples": ["3–5 ta to'liq jumla — yaxshi rivojlangan bloklar va kuchli tomonlar"]
  },
  "needsFocus": {
    "priority": ["E'tibor kerak yo'nalishlar 1–2 jumla bilan; 2–4 ta band"]
  },
  "nextSteps": {
    "homePlan": [
      { "title": "Sarlavha", "why": "2–4 jumla nima uchun muhim", "how": ["4–6 ta aniq qadam"] }
    ]
  },
  "disclaimer": {
    "text": "Bu progress monitoring xulosasi — tibbiy tashxis emas. Reja va davolash uchun mutaxassis bilan hamkorlik qilishingiz tavsiya etiladi."
  }
}
— homePlan da 4–6 ta element, har birida how da 4–6 ta aniq, bajariladigan qadam.`;

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

  const userContent = `Quyidagi progress monitoring natijasi asosida TO'LIQ va PROFESSIONAL JSON xulosa yozing. Faqat JSON. shortConclusion 2–4 jumla, whyThisLevel 4–7 jumla, strengths 3–5 ta, homePlan 4–6 ta element (har birida how da 4–6 ta aniq qadam).\n\n${JSON.stringify(facts, null, 2)}`;

  const res = await fetch(OPENAI_CHAT_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2048,
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

  const p = parseAiJson(raw) as Record<string, unknown>;
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
