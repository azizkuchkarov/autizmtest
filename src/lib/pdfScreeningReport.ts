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

/** Risk darajasi bo‘yicha RGB (jsPDF setFillColor uchun) */
function getRiskRgb(totalScore: number): [number, number, number] {
  if (totalScore <= 20) return [16, 185, 129];   // emerald — Juda past
  if (totalScore <= 40) return [34, 197, 94];   // green — Past
  if (totalScore <= 60) return [245, 158, 11];  // amber — O'rta
  if (totalScore <= 80) return [249, 115, 22];  // orange — Yuqori
  return [239, 68, 68];                          // rose — Juda yuqori
}

/** Blok foizi bo‘yicha bar rangi */
function getBlockBarRgb(score: number): [number, number, number] {
  if (score <= 30) return [16, 185, 129];
  if (score <= 60) return [245, 158, 11];
  return [239, 68, 68];
}

/** Donut chizish: tashqi rangli halqa, ichida foiz matni */
function drawDonut(doc: jsPDF, cx: number, cy: number, value: number): void {
  const outerR = 14;
  const innerR = 8;
  const [r, g, b] = getRiskRgb(value);
  doc.setFillColor(r, g, b);
  doc.circle(cx, cy, outerR, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`${Math.round(value)}%`, cx - 3.5, cy + 1.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  doc.setTextColor(0, 0, 0);
}

/** Gorizontal risk bar (0–100%) */
function drawRiskBar(doc: jsPDF, x: number, y: number, w: number, h: number, value: number): void {
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, w, h, "F");
  const fillW = Math.max(0, Math.min(100, value) / 100) * w;
  if (fillW > 0) {
    const [r, g, b] = getRiskRgb(value);
    doc.setFillColor(r, g, b);
    doc.rect(x, y, fillW, h, "F");
  }
}

/** Risk shkala — 5 ta rangli quti (0–20% … 80–100%) */
function drawRiskScale(doc: jsPDF, x: number, y: number, boxW: number, boxH: number, gap: number): number {
  const items: { label: string; rgb: [number, number, number] }[] = [
    { label: "0–20%", rgb: [16, 185, 129] },
    { label: "20–40%", rgb: [34, 197, 94] },
    { label: "40–60%", rgb: [245, 158, 11] },
    { label: "60–80%", rgb: [249, 115, 22] },
    { label: "80–100%", rgb: [239, 68, 68] },
  ];
  let xCur = x;
  for (const item of items) {
    doc.setFillColor(...item.rgb);
    doc.roundedRect(xCur, y, boxW, boxH, 1, 1, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(item.label, xCur + boxW / 2 - 4, y + boxH / 2 + 1.2);
    xCur += boxW + gap;
  }
  doc.setFontSize(FONT_SIZE_BODY);
  return y + boxH + 4;
}

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
  /** Tanlangan viloyat (va Toshkent shahar uchun tuman) — PDF da chiqadi */
  selectedAbaRegion?: string;
  selectedAbaDistrict?: string;
  abaCenters?: Array<{
    name: string;
    phone?: string | null;
    address?: string | null;
    url?: string | null;
    instagram?: string | null;
    note?: string | null;
    imageUrl?: string | null;
  }>;
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
    selectedAbaRegion,
    selectedAbaDistrict,
    abaCenters,
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
  y += LINE_HEIGHT + 2;

  // Rangli donut va risk bar (diagramma)
  const donutCx = MARGIN + 18;
  const donutCy = y + 18;
  drawDonut(doc, donutCx, donutCy, result.totalScore);
  const barX = MARGIN + 50;
  const barW = 55;
  const barH = 6;
  drawRiskBar(doc, barX, y + 12, barW, barH, result.totalScore);
  doc.text(`Risk: ${result.totalScore.toFixed(1)}%`, barX + barW + 4, y + 16);
  y += 38;

  const disclaimerUmumiy =
    "Bu natija faqat skrining hisoblanadi va diagnoz qo'yish uchun ishlatilmaydi. Aniq tashxis mutaxassis tomonidan qo'yiladi.";
  const disclaimerLines = doc.splitTextToSize(disclaimerUmumiy, contentW);
  doc.text(disclaimerLines, MARGIN, y);
  y += disclaimerLines.length * LINE_HEIGHT;
  const redFlagCount = (result.redFlags ?? []).length;
  doc.text(`Red-flag savollar: ${redFlagCount} ta`, MARGIN, y);
  y += LINE_HEIGHT + 4;

  // Risk shkalasi — 5 ta rangli quti
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Risk ko'rsatkichlari:", MARGIN, y);
  y += LINE_HEIGHT + 2;
  const boxW = 32;
  const boxH = 10;
  const gap = 2;
  y = drawRiskScale(doc, MARGIN, y, boxW, boxH, gap);
  doc.setFontSize(8);
  doc.text("Juda past   Past   O'rta   Yuqori   Juda yuqori", MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  y += 5;

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

  // ——— 3. Bloklar bo'yicha (%) — rangli barlar ———
  doc.setFont("helvetica", "bold");
  doc.text("Bloklar bo'yicha (%)", MARGIN, y);
  y += LINE_HEIGHT + 2;
  doc.setFont("helvetica", "normal");
  const blockBarW = 50;
  const blockBarH = 4;
  for (const b of result.blocks ?? []) {
    const score = Math.min(100, Math.max(0, Number(b.score) || 0));
    const [r, g, bl] = getBlockBarRgb(score);
    doc.setFillColor(230, 230, 230);
    doc.rect(MARGIN, y - 2.5, blockBarW, blockBarH, "F");
    if (score > 0) {
      doc.setFillColor(r, g, bl);
      doc.rect(MARGIN, y - 2.5, (score / 100) * blockBarW, blockBarH, "F");
    }
    doc.text(`${b.title}: ${Math.round(score)}%`, MARGIN + blockBarW + 4, y + 0.5);
    y += LINE_HEIGHT + 2;
  }
  y += 4;

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

  // ——— ABA markazlar (tanlangan viloyat) ———
  if (selectedAbaRegion && abaCenters && abaCenters.length > 0) {
    y = ensurePage(doc, y, 40);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text("ABA markazlar", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE_BODY);
    const regionLabel = selectedAbaDistrict
      ? `${selectedAbaRegion}, ${selectedAbaDistrict}`
      : selectedAbaRegion;
    doc.text(`Viloyat: ${regionLabel}`, MARGIN, y);
    y += LINE_HEIGHT + 3;
    for (const c of abaCenters) {
      y = ensurePage(doc, y, LINE_HEIGHT * 6);
      if (c.name) {
        doc.setFont("helvetica", "bold");
        doc.text(c.name, MARGIN, y);
        doc.setFont("helvetica", "normal");
        y += LINE_HEIGHT;
      }
      if (c.address) {
        const aLines = doc.splitTextToSize(`Manzil: ${c.address}`, contentW - 2);
        doc.text(aLines, MARGIN, y);
        y += aLines.length * LINE_HEIGHT;
      }
      if (c.phone) {
        doc.text(`Telefon: ${c.phone}`, MARGIN, y);
        y += LINE_HEIGHT;
      }
      if (c.url) {
        const urlAbs = c.url.startsWith("http") ? c.url : `https://${c.url}`;
        doc.setTextColor(0, 51, 102);
        doc.textWithLink(`URL: ${c.url}`, MARGIN, y, { url: urlAbs });
        doc.setTextColor(0, 0, 0);
        y += LINE_HEIGHT;
      }
      if (c.instagram) {
        const igAbs = c.instagram.startsWith("http")
          ? c.instagram
          : `https://instagram.com/${c.instagram.replace(/^@?\/?/, "")}`;
        doc.setTextColor(0, 51, 102);
        doc.textWithLink(`Instagram: ${c.instagram}`, MARGIN, y, { url: igAbs });
        doc.setTextColor(0, 0, 0);
        y += LINE_HEIGHT;
      }
      if (c.note) {
        const nLines = doc.splitTextToSize(c.note, contentW - 2);
        doc.text(nLines, MARGIN, y);
        y += nLines.length * LINE_HEIGHT;
      }
      y += 3;
    }
    y += 4;
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
