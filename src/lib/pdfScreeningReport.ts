/**
 * Skrining natijasini A4 PDF sifatida yaratish.
 * Tartib va tarkib ekrandagi "Skrining natijasi" sahifasi bilan bir xil.
 */

import { jsPDF } from "jspdf";
import type { ScreeningV2Result } from "@/types/api";
import type { AiSummaryPayload } from "@/types/api";

const A4_W = 210;
const A4_H = 297;
const MARGIN = 18;
const LINE_HEIGHT = 5.5;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_TITLE = 14;
const FONT_SIZE_HEADING = 11;

const ANSWER_LABELS: Record<number, string> = {
  0: "Yo'q / hech qachon",
  1: "Kamdan-kam",
  2: "Ko'pincha",
  3: "Doim / barqaror",
};

function getXulosaRaqami(assessmentId: string, completedAt: string | undefined): string {
  if (!assessmentId) return "—";
  const year = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear();
  const short = assessmentId.replace(/-/g, "").slice(-6).toUpperCase();
  return `XL-${year}-${short}`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Ekrandagi "Xulosa" bo'limi matnlari — risk darajasi va yosh guruhiga qarab */
function getXulosaParagraphs(riskLabel: string, ageLabel: string | null, totalScore: number): string[] {
  const lines: string[] = [];
  if (riskLabel === "Past xavf") {
    const p1 =
      ageLabel === "1,5–2 yosh"
        ? "Ushbu yoshdagi bolada skrining bo'yicha autizm belgilari ehtimoli past baholandi. Erta yoshda ijtimoiy va muloqot ko'nikmalari hali rivojlanayotgan bo'lgani uchun kuzatishni davom ettirish, oilada ijtimoiy o'yin va muloqotga vaqt ajratish tavsiya etiladi."
        : ageLabel === "3–4 yosh" || ageLabel === "5–6 yosh"
          ? "Skrining bo'yicha autizm belgilari ehtimoli past. Bolaning ijtimoiy aloqa, muloqot va moslashuv ko'rsatkichlari hozircha normativ rivojlanish doirasida baholandi. Maktabgacha yoki maktab yoshida kuzatishni davom ettirish va kerak bo'lsa keyinchalik qayta tekshirish mumkin."
          : "Skrining natijasiga ko'ra autizm belgilari ehtimoli past. Bolaning javoblari asosida hozircha qo'shimcha tekshiruv talab qilinmaydi. Rivojlanishni kuzatish va ota-ona savollari paydo bo'lsa mutaxassisga murojaat qilish tavsiya etiladi.";
    lines.push(p1);
    let tavsiya =
      "Kuzatishni davom ettiring. Agar keyinchalik ota-ona tashvishlansa yoki bolada o'zgarishlar sezilsa, qayta skrining yoki bolalar nevrologi yoki rivojlanish mutaxassisi bilan konsultatsiya qilish mumkin.";
    if (totalScore > 40) tavsiya += " 40% dan yuqori bo'lgan hollarda ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.";
    lines.push("Tavsiya: " + tavsiya);
  } else if (riskLabel === "O'rtacha xavf") {
    const p1 = ageLabel
      ? `${ageLabel} guruhidagi bolada skrining bo'yicha ba'zi belgilar qayd etildi. Bu mutlaqo autizm borligini anglatmaydi; boshqa sabablar ham bo'lishi mumkin. To'liq klinik baholash orqali aniqroq yo'nalish olish mumkin.`
      : "Skrining bo'yicha ba'zi belgilar qayd etildi. To'liq klinik baholash orqali aniqroq yo'nalish olish mumkin.";
    lines.push(p1);
    let tavsiya =
      "Bolalar nevrologi yoki rivojlanish bo'yicha mutaxassis bilan konsultatsiya qilish tavsiya etiladi. Mutaxassis bolani ko'rib, anamnez va qo'shimcha tekshiruvlar asosida keyingi qadamni aniqlaydi.";
    if (totalScore > 40) tavsiya += " 40% dan yuqori bo'lgani uchun ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.";
    lines.push("Tavsiya: " + tavsiya);
  } else if (riskLabel === "Yuqori xavf") {
    lines.push(
      "Skrining bo'yicha belgilar sezilarli darajada qayd etildi. Bu natija diagnoz emas; faqat keyingi tekshiruv va mutaxassis bilan uchrashuvni rejalash uchun asos hisoblanadi. Aniq tashxis faqat mutaxassis tomonidan to'liq klinik va kerak bo'lsa instrumental baholashdan keyin qo'yiladi."
    );
    lines.push(
      "Tavsiya: Tezroq bolalar nevrologi yoki rivojlanish/autizm bo'yicha ixtisoslashtirilgan markazga murojaat qilish va diagnostik baholashdan o'tish tavsiya etiladi. Erta yordam va qo'llab-quvvatlash natijani yaxshilashda muhim rol o'ynaydi. ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi."
    );
  }
  return lines;
}

export type PdfScreeningParams = {
  result: ScreeningV2Result;
  assessmentId: string;
  completedAt: string | undefined;
  ageLabel: string | null;
  questions: Array<{ id: string; text: string; domain: string }>;
  domains: Array<{ id: string; title: string }>;
  answers: Record<string, number> | null;
  aiPayload: AiSummaryPayload | null | undefined;
};

function ensurePage(doc: jsPDF, y: number, needSpace: number): number {
  if (y + needSpace > A4_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

export function generateScreeningPdf(params: PdfScreeningParams): void {
  const {
    result,
    assessmentId,
    completedAt,
    ageLabel,
    questions,
    domains,
    answers,
    aiPayload,
  } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const contentW = A4_W - 2 * MARGIN;
  let y = MARGIN;

  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont("helvetica", "bold");
  doc.text("Skrining natijasi — Autizm belgilari", MARGIN, y);
  y += LINE_HEIGHT + 2;

  // ——— 1. Umumiy xulosa (ekrandagi birinchi blok) ———
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text("Umumiy xulosa", MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  doc.text(`${result.riskLabel} — Risk ko'rsatkichi: ${result.totalScore.toFixed(1)}%`, MARGIN, y);
  y += LINE_HEIGHT;
  const disclaimerUmumiy =
    "Bu natija faqat skrining hisoblanadi va diagnoz qo'yish uchun ishlatilmaydi. Aniq tashxis mutaxassis tomonidan qo'yiladi.";
  const disclaimerLines = doc.splitTextToSize(disclaimerUmumiy, contentW);
  doc.text(disclaimerLines, MARGIN, y);
  y += disclaimerLines.length * LINE_HEIGHT;
  const redFlagCount = (result.redFlags ?? []).length;
  doc.text(`Red-flag savollar: ${redFlagCount} ta`, MARGIN, y);
  y += LINE_HEIGHT + 2;
  const scaleText =
    "Risk ko'rsatkichlari: 0–20% Juda past | 20–40% Past | 40–60% O'rta | 60–80% Yuqori | 80–100% Juda yuqori";
  const scaleLines = doc.splitTextToSize(scaleText, contentW);
  doc.text(scaleLines, MARGIN, y);
  y += scaleLines.length * LINE_HEIGHT + 4;

  // ——— 2. Xulosa (ekrandagi ikkinchi blok: metadata + xulosa matni + tavsiya) ———
  doc.setFont("helvetica", "bold");
  doc.text("Xulosa", MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  doc.text(`Xulosa raqami: ${getXulosaRaqami(assessmentId, completedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Test sanasi: ${formatDate(completedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  if (ageLabel) {
    doc.text(`Yosh guruhi: ${ageLabel}`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  const xulosaParagraphs = getXulosaParagraphs(result.riskLabel, ageLabel, result.totalScore);
  for (const p of xulosaParagraphs) {
    y += 2;
    const pLines = doc.splitTextToSize(p, contentW);
    doc.text(pLines, MARGIN, y);
    y += pLines.length * LINE_HEIGHT;
  }
  y += 2;
  const smallDisclaimer =
    "Agar ota-ona tashvishlansa yoki bolada o'zgarishlar sezilsa, mutaxassis bilan muloqot qilish tavsiya etiladi.";
  const smallLines = doc.splitTextToSize(smallDisclaimer, contentW);
  doc.text(smallLines, MARGIN, y);
  y += smallLines.length * LINE_HEIGHT + 4;

  // ——— 3. Bloklar bo'yicha (%) ———
  doc.setFont("helvetica", "bold");
  doc.text("Bloklar bo'yicha (%)", MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  for (const b of result.blocks ?? []) {
    doc.text(`${b.title}: ${Math.round(b.score)}%`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  y += 6;

  // ——— 4. Red-flag savollar ———
  if ((result.redFlags ?? []).length > 0) {
    y = ensurePage(doc, y, 30);
    doc.setFont("helvetica", "bold");
    doc.text("Red-flag savollar", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    for (const rf of result.redFlags ?? []) {
      const lines = doc.splitTextToSize(rf.text, contentW);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT;
    }
    y += 5;
  }

  // ——— 5. Autizmga moyilligi bor savollar va javoblari ———
  const topWithBall = (result.topOverall ?? []).filter(
    (issue) => (issue.risk ?? 0) > 0 && (issue.answer ?? 0) > 0
  );
  if (topWithBall.length > 0) {
    y = ensurePage(doc, y, 25);
    doc.setFont("helvetica", "bold");
    doc.text("Autizmga moyilligi bor savollar va javoblari", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    for (const issue of topWithBall) {
      y = ensurePage(doc, y, LINE_HEIGHT * 3);
      const ansStr =
        typeof issue.answer === "number"
          ? ANSWER_LABELS[issue.answer] ?? `Javob ${issue.answer}`
          : "—";
      const lines = doc.splitTextToSize(`${issue.text}  — Javob: ${ansStr}`, contentW);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT;
    }
    y += 5;
  }

  if (aiPayload) {
    y = ensurePage(doc, y, 55);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text("AI xulosa", MARGIN, y);
    y += LINE_HEIGHT + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE_BODY);

    if (aiPayload.summary?.shortConclusion) {
      const cLines = doc.splitTextToSize(aiPayload.summary.shortConclusion, contentW);
      doc.text(cLines, MARGIN, y);
      y += cLines.length * LINE_HEIGHT;
    }
    if (aiPayload.summary?.whyThisLevel) {
      const wLines = doc.splitTextToSize(aiPayload.summary.whyThisLevel, contentW);
      doc.text(wLines, MARGIN, y);
      y += wLines.length * LINE_HEIGHT;
    }
    if (Array.isArray(aiPayload.strengths?.examples) && aiPayload.strengths.examples.length > 0) {
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Kuchli tomonlar:", MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      for (const ex of aiPayload.strengths.examples) {
        const exLines = doc.splitTextToSize(`• ${ex}`, contentW - 4);
        doc.text(exLines, MARGIN + 2, y);
        y += exLines.length * LINE_HEIGHT;
      }
    }
    if (Array.isArray(aiPayload.needsFocus?.priority) && aiPayload.needsFocus.priority.length > 0) {
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.text("E'tibor kerak:", MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont("helvetica", "normal");
      for (const p of aiPayload.needsFocus.priority) {
        const pLines = doc.splitTextToSize(`• ${p}`, contentW - 4);
        doc.text(pLines, MARGIN + 2, y);
        y += pLines.length * LINE_HEIGHT;
      }
    }
    if (aiPayload.disclaimer?.text) {
      y += 4;
      const dLines = doc.splitTextToSize(aiPayload.disclaimer.text, contentW);
      doc.setFont("helvetica", "italic");
      doc.text(dLines, MARGIN, y);
      doc.setFont("helvetica", "normal");
    }
  }

  y += 8;
  doc.setFontSize(9);
  doc.text(
    "Bu hujjat faqat skrining natijasidir va diagnoz qo'yish uchun ishlatilmaydi. Mutaxassis bilan muloqot tavsiya etiladi.",
    MARGIN,
    y
  );

  doc.save(`Skrining-natija-${getXulosaRaqami(assessmentId, completedAt)}.pdf`);
}
