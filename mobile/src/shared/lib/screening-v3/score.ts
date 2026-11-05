// NUSXA: asl fayl web loyihada — src/lib/screening-v3/score.ts. Ikkala nusxa birga o'zgartirilishi shart (faqat import yo'llari farq qiladi).
/*
 * Skrining v3 va oylik ko'nikmalar testini hisoblash. Brauzerda ham, serverda ham bir xil ishlaydi.
 *
 * Skrining:
 *  - har savol uchun xavf 0..1: ko'nikma (skill) uchun "Deyarli doim" → 0, "Ko'pincha" → 0.17, "Ba'zan" → 0.67, "Hech qachon" → 1;
 *    belgi (concern) uchun teskarisi. "Bilmayman" ballga kirmaydi.
 *  - muhim ko'nikma bo'yicha aniqlashtiruvchi savolga "Ha" deyilsa, ko'nikma bor deb olinadi (xavf 0.17).
 *  - bo'lim balli = savollar xavfining o'rtachasi × 100; ikki soha (ijtimoiy muloqot va takroriy xatti-harakatlar)
 *    yoshga qarab vaznlanadi — kichik yoshda ijtimoiy muloqot belgilari ancha ishonchliroq.
 *  - daraja: umumiy ball yoki "muhim" savollardagi qiyinchiliklar soni bo'yicha; regress — har doim mutaxassisga.
 *
 * DIQQAT: chegaralar (THRESHOLDS) dastlabki — ilmiy tekshiruvdan so'ng aniqlashtiriladi (docs/skrining-v3.md).
 */
import { bandForMonths, ITEMS, itemsFor, SECTIONS, type Band, type FreqAnswer, type Item, type SectionId } from "@/shared/lib/screening-v3/items";
import { skillItemsFor, SKILL_SECTIONS, type SkillSectionId } from "@/shared/lib/screening-v3/skills";

export type V3Answers = Record<string, FreqAnswer>;
/** Aniqlashtiruvchi savollar javoblari: savol id → [ha/yo'q, ...] */
export type V3FollowUps = Record<string, boolean[]>;
export type RiskLevel = "low" | "moderate" | "high";

const SKILL_RISK: Record<0 | 1 | 2 | 3, number> = { 3: 0, 2: 0.17, 1: 0.67, 0: 1 };
const CONCERN_RISK: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 0.17, 2: 0.67, 3: 1 };
/** Shu xavfdan yuqori — savol bo'yicha qiyinchilik bor ("Hech qachon" yoki "Ba'zan") */
const DIFFICULTY = 0.6;

/** Ijtimoiy muloqot (sc) va takroriy xatti-harakatlar (rrb) vazni yosh guruhiga qarab */
const DOMAIN_WEIGHTS: Record<Band, { sc: number; rrb: number }> = {
  toddler: { sc: 0.75, rrb: 0.25 },
  preschool: { sc: 0.65, rrb: 0.35 },
  school: { sc: 0.6, rrb: 0.4 },
};

/** Dastlabki chegaralar (xom ball, 0–100) va muhim savollar soni */
export const THRESHOLDS = { moderate: 25, high: 45, criticalModerate: 2, criticalHigh: 3 };

/** Ijtimoiy muloqot balli shundan past bo'lsa, faqat takroriy belgilar bilan "yuqori" daraja berilmaydi */
const SOCIAL_FLOOR = 20;

/** "Bilmayman" javoblari shu ulushdan ko'p bo'lsa — natija to'liq emas deb ogohlantiriladi */
const INCOMPLETE_SHARE = 0.3;

export function itemRisk(item: Item, answer: FreqAnswer, followUp?: boolean[]): number | null {
  if (answer === -1) return null;
  if (item.kind === "yesno") return answer >= 2 ? 1 : 0;
  let risk = item.direction === "skill" ? SKILL_RISK[answer] : CONCERN_RISK[answer];
  if (item.direction === "skill" && risk >= DIFFICULTY && followUp?.some(Boolean)) risk = CONCERN_RISK[1];
  return risk;
}

/** Aniqlashtiruvchi savollar kerakmi: muhim ko'nikma bo'yicha "Hech qachon" yoki "Ba'zan" deyilganda. */
export function needsFollowUp(item: Item, answer: FreqAnswer | undefined): boolean {
  return !!item.followUp?.length && item.direction === "skill" && (answer === 0 || answer === 1);
}

/**
 * Xom ballni ilova bo'ylab ishlatiladigan ko'rsatkichga (0–100) aylantiradi: dastlabki chegaralar
 * 30 va 60 ga to'g'ri keladi — grafik zonalari, ro'yxatlar va eski natijalar bilan bir xil shkalada ko'rinadi.
 */
function toIndex(raw: number) {
  const { moderate: m, high: h } = THRESHOLDS;
  if (raw < m) return (raw / m) * 30;
  if (raw < h) return 30 + ((raw - m) / (h - m)) * 30;
  return 60 + ((raw - h) / (100 - h)) * 40;
}

/** Eski yosh guruhi (videolar uchun) */
export function legacyAgeGroup(months: number) {
  if (months <= 24) return "AGE_1_5_2" as const;
  if (months <= 48) return "AGE_3_4" as const;
  if (months <= 72) return "AGE_5_6" as const;
  return "AGE_7_9" as const;
}

/** Tug'ilgan yil va oydan bugungi yosh (oy). Oy noma'lum bo'lsa — yil o'rtasi (iyul) olinadi. */
export function ageInMonths(birthYear: number, birthMonth: number | null | undefined, now = new Date()) {
  const month = birthMonth ?? 7;
  return Math.max(0, (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - month));
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number) => Math.round(n * 10) / 10;

export function scoreScreeningV3(input: { months: number; answers: V3Answers; followUps?: V3FollowUps; band?: Band }) {
  const months = input.months;
  const band = input.band ?? bandForMonths(months) ?? "toddler";
  const items = itemsFor(band, months);
  const followUps = input.followUps ?? {};

  const risks = new Map<string, number>();
  let unknownCount = 0;
  for (const item of items) {
    const a = input.answers[item.id];
    if (a === undefined) continue;
    const r = itemRisk(item, a, followUps[item.id]);
    if (r === null) unknownCount++;
    else risks.set(item.id, r);
  }

  const sectionScores = SECTIONS.filter((s) => s.domain !== "history").map((s) => {
    const sectionItems = items.filter((i) => i.section === s.id);
    const vals = sectionItems.flatMap((i) => (risks.has(i.id) ? [risks.get(i.id)!] : []));
    return { id: s.id, domain: s.domain, score: round((mean(vals) ?? 0) * 100), answered: vals.length, total: sectionItems.length };
  });

  const domainScore = (domain: "sc" | "rrb") => {
    const vals = items.filter((i) => SECTIONS.find((s) => s.id === i.section)?.domain === domain).flatMap((i) => (risks.has(i.id) ? [risks.get(i.id)!] : []));
    const m = mean(vals);
    return m === null ? null : m * 100;
  };
  const sc = domainScore("sc");
  const rrb = domainScore("rrb");
  const w = DOMAIN_WEIGHTS[band];
  const raw = sc !== null && rrb !== null ? sc * w.sc + rrb * w.rrb : (sc ?? rrb ?? 0);

  const criticalItems = items.filter((i) => i.critical?.includes(band));
  const criticalFailed = criticalItems.filter((i) => (risks.get(i.id) ?? 0) >= DIFFICULTY).map((i) => i.id);
  const urgentFlags = items.filter((i) => i.urgent && (risks.get(i.id) ?? 0) >= DIFFICULTY).map((i) => i.id);
  const urgent = urgentFlags.length > 0;

  let level: RiskLevel = "low";
  if (raw >= THRESHOLDS.high || criticalFailed.length >= THRESHOLDS.criticalHigh) level = "high";
  else if (raw >= THRESHOLDS.moderate || criticalFailed.length >= THRESHOLDS.criticalModerate || urgent) level = "moderate";
  // DSM-5 bo'yicha autizmda ikkala soha ham ta'sirlangan bo'ladi: ijtimoiy muloqot yaxshi bo'lib, faqat sezgi/takroriy
  // belgilar ko'p bo'lsa (masalan, sezgi buzilishi, xavotir) — "yuqori" emas, "o'rta" (kuzatish) deb olinadi
  if (level === "high" && (sc ?? 0) < SOCIAL_FLOOR && criticalFailed.length < THRESHOLDS.criticalModerate) level = "moderate";

  let index = toIndex(raw);
  // Daraja muhim savollar yoki regress tufayli ko'tarilgan bo'lsa — ko'rsatkich ham shu zonaga chiqadi
  if (level === "high") index = Math.max(index, 61);
  if (level === "moderate") index = Math.min(Math.max(index, 31), 60);
  if (level === "low") index = Math.min(index, 30);
  index = Math.min(100, Math.max(0, Math.round(index)));

  const answeredCount = items.filter((i) => input.answers[i.id] !== undefined).length;
  const textOf = (id: string) => ITEMS.find((i) => i.id === id)?.text.uz ?? id;
  const issue = (i: Item) => {
    const risk = risks.get(i.id) ?? 0;
    const answer = input.answers[i.id];
    return {
      questionId: i.id,
      risk: round(risk * 3),
      weight: 1,
      weightedRisk: round(risk * 3),
      text: i.text.uz,
      isRedFlag: criticalFailed.includes(i.id) || urgentFlags.includes(i.id),
      ...(answer !== undefined && answer >= 0 ? { answer } : {}),
    };
  };
  const redFlags = [...urgentFlags, ...criticalFailed].map((id) => ({ questionId: id, text: textOf(id) }));

  // Eski natija tuzilmasi bilan mos (ro'yxatlar, Rivojlanish sahifasi) + v3 maydonlari
  const blocks = sectionScores.map((s) => {
    const sectionItems = items.filter((i) => i.section === s.id && risks.has(i.id));
    return {
      blockId: s.id,
      title: SECTIONS.find((x) => x.id === s.id)!.title.uz,
      score: s.score,
      redFlags: redFlags.filter((f) => sectionItems.some((i) => i.id === f.questionId)),
      topIssues: sectionItems.map(issue).sort((a, b) => b.weightedRisk - a.weightedRisk),
    };
  });

  return {
    version: 3 as const,
    ageGroupId: legacyAgeGroup(months),
    band,
    ageMonths: months,
    level,
    urgent,
    totalScore: index,
    rawScore: round(raw),
    riskLabel: level === "high" ? ("Yuqori xavf" as const) : level === "moderate" ? ("O'rtacha xavf" as const) : ("Past xavf" as const),
    domains: { sc: sc === null ? null : round(sc), rrb: rrb === null ? null : round(rrb) },
    sections: sectionScores,
    blocks,
    critical: { failed: criticalFailed, total: criticalItems.length },
    redFlags,
    redFlagCount: redFlags.length,
    topOverall: blocks
      .flatMap((b) => b.topIssues.map((i) => ({ ...i, blockId: b.blockId, blockTitle: b.title })))
      .sort((a, b) => b.weightedRisk - a.weightedRisk),
    followUpsPassed: Object.entries(followUps).flatMap(([id, ans]) => (ans.some(Boolean) ? [id] : [])),
    answeredCount,
    unknownCount,
    totalItems: items.length,
    incomplete: items.length > 0 && unknownCount / items.length > INCOMPLETE_SHARE,
  };
}

export type ScreeningV3Result = ReturnType<typeof scoreScreeningV3>;

export function isScreeningV3(r: unknown): r is ScreeningV3Result {
  return !!r && typeof r === "object" && (r as { version?: unknown }).version === 3 && "level" in r;
}

/* ------------------------------ Ko'nikmalar testi ------------------------------ */

export function skillsBand(months: number): Band {
  return bandForMonths(months) ?? "toddler";
}

export function scoreSkills(input: { months: number; answers: V3Answers }) {
  const band = skillsBand(input.months);
  const items = skillItemsFor(band, input.months);
  let unknownCount = 0;
  const sections = SKILL_SECTIONS.map((s) => {
    const vals = items
      .filter((i) => i.section === s.id)
      .flatMap((i) => {
        const a = input.answers[i.id];
        if (a === undefined) return [];
        if (a === -1) {
          unknownCount++;
          return [];
        }
        return [a / 3];
      });
    const m = mean(vals);
    return { id: s.id as SkillSectionId, score: m === null ? null : Math.round(m * 100), answered: vals.length };
  });
  const scored = sections.flatMap((s) => (s.score === null ? [] : [s.score]));
  return {
    version: 3 as const,
    kind: "skills" as const,
    band,
    ageMonths: input.months,
    sections,
    total: Math.round(mean(scored) ?? 0),
    unknownCount,
    totalItems: items.length,
  };
}

export type SkillsResult = ReturnType<typeof scoreSkills>;

export type { SectionId };
