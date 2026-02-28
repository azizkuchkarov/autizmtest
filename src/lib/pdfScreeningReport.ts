/**
 * Skrining natijasini A4 PDF sifatida yaratish.
 * Tartib va tarkib ekrandagi "Skrining natijasi" sahifasi bilan bir xil.
 * locale = "ru" bo'lsa barcha sarlavha va yorliqlar ruscha.
 */

import { jsPDF } from "jspdf";
import type { ScreeningV2Result } from "@/types/api";
import type { AiSummaryPayload } from "@/types/api";

export type PdfLocale = "uz" | "ru";

const ANSWER_LABELS_UZ: Record<number, string> = {
  0: "Yo'q / hech qachon",
  1: "Kamdan-kam",
  2: "Ko'pincha",
  3: "Doim / barqaror",
};
const ANSWER_LABELS_RU: Record<number, string> = {
  0: "Нет / Никогда",
  1: "Редко",
  2: "Часто",
  3: "Всегда / Постоянно",
};

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

/** Donut chizish: tashqi rangli halqa, ichida foiz matni. fontName — kirillitsa uchun "Roboto" */
function drawDonut(doc: jsPDF, cx: number, cy: number, value: number, fontName = "helvetica"): void {
  const outerR = 14;
  const innerR = 8;
  const [r, g, b] = getRiskRgb(value);
  doc.setFillColor(r, g, b);
  doc.circle(cx, cy, outerR, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerR, "F");
  doc.setFontSize(9);
  doc.setFont(fontName, fontName === "Roboto" ? "normal" : "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`${Math.round(value)}%`, cx - 3.5, cy + 1.2);
  doc.setFont(fontName, "normal");
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

/** Risk shkala — 5 ta rangli quti (0–20% … 80–100%). fontName — kirillitsa uchun "Roboto" */
function drawRiskScale(doc: jsPDF, x: number, y: number, boxW: number, boxH: number, gap: number, fontName = "helvetica"): number {
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
    doc.setFont(fontName, "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(item.label, xCur + boxW / 2 - 4, y + boxH / 2 + 1.2);
    xCur += boxW + gap;
  }
  doc.setFontSize(FONT_SIZE_BODY);
  return y + boxH + 4;
}

function getXulosaRaqami(assessmentId: string, completedAt: string | undefined): string {
  if (!assessmentId) return "—";
  const year = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear();
  const short = assessmentId.replace(/-/g, "").slice(-6).toUpperCase();
  return `XL-${year}-${short}`;
}

function formatDate(iso: string | undefined, locale: PdfLocale): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** PDF sarlavha va yorliqlari — til bo‘yicha */
function getPdfLabels(locale: PdfLocale) {
  const uz = {
    title: "Skrining natijasi — Autizm belgilari",
    overallSummary: "Umumiy xulosa",
    riskIndicator: "Risk ko'rsatkichi",
    disclaimerUmumiy: "Bu natija faqat skrining hisoblanadi va diagnoz qo'yish uchun ishlatilmaydi. Aniq tashxis mutaxassis tomonidan qo'yiladi.",
    redFlagSavollar: "Red-flag savollar",
    riskKoorsatkichlari: "Risk ko'rsatkichlari:",
    riskScaleLegend: "Juda past   Past   O'rta   Yuqori   Juda yuqori",
    xulosa: "Xulosa",
    xulosaRaqami: "Xulosa raqami",
    testSanasi: "Test sanasi",
    yoshGuruhi: "Yosh guruhi",
    smallDisclaimer: "Agar ota-ona tashvishlansa yoki bolada o'zgarishlar sezilsa, mutaxassis bilan muloqot qilish tavsiya etiladi.",
    bloklarBuyicha: "Bloklar bo'yicha (%)",
    redFlagTitle: "Red-flag savollar",
    tendencyTitle: "Autizmga moyilligi bor savollar va javoblari",
    javob: "Javob",
    aiXulosa: "AI xulosa",
    kuchliTomonlar: "Kuchli tomonlar (haqiqiy ijobiy tomonlar):",
    etiborKerak: "E'tibor kerak (belgilar kuchli kuzatilgan sohalar):",
    uyRejasi: "Uy rejasi",
    abaMarkazlar: "ABA markazlar",
    viloyat: "Viloyat",
    manzil: "Manzil",
    telefon: "Telefon",
    footerDisclaimer: "Bu hujjat faqat skrining natijasidir va diagnoz qo'yish uchun ishlatilmaydi. Mutaxassis bilan muloqot tavsiya etiladi.",
    riskLabelPast: "Past xavf",
    riskLabelModerate: "O'rtacha xavf",
    riskLabelHigh: "Yuqori xavf",
  };
  const ru = {
    title: "Результат скрининга — Признаки аутизма",
    overallSummary: "Общее заключение",
    riskIndicator: "Показатель риска",
    disclaimerUmumiy: "Данный результат является скринингом и не используется для постановки диагноза. Окончательный диагноз ставит специалист.",
    redFlagSavollar: "Вопросы «красного флага»",
    riskKoorsatkichlari: "Показатели риска:",
    riskScaleLegend: "Очень низкий   Низкий   Средний   Высокий   Очень высокий",
    xulosa: "Заключение",
    xulosaRaqami: "Номер заключения",
    testSanasi: "Дата теста",
    yoshGuruhi: "Возрастная группа",
    smallDisclaimer: "При беспокойстве или изменениях в поведении ребёнка рекомендуется консультация специалиста.",
    bloklarBuyicha: "По блокам (%)",
    redFlagTitle: "Вопросы «красного флага»",
    tendencyTitle: "Вопросы с признаками и ответы",
    javob: "Ответ",
    aiXulosa: "Заключение ИИ",
    kuchliTomonlar: "Сильные стороны:",
    etiborKerak: "Направления, требующие внимания:",
    uyRejasi: "План действий дома",
    abaMarkazlar: "Центры ABA",
    viloyat: "Регион",
    manzil: "Адрес",
    telefon: "Телефон",
    footerDisclaimer: "Документ носит скрининговый характер и не используется для постановки диагноза. Рекомендуется консультация специалиста.",
    riskLabelPast: "Низкий риск",
    riskLabelModerate: "Средний риск",
    riskLabelHigh: "Высокий риск",
  };
  return locale === "ru" ? ru : uz;
}

function getRiskLabelForPdf(riskLabel: string, locale: PdfLocale): string {
  const labels = getPdfLabels(locale) as { riskLabelPast: string; riskLabelModerate: string; riskLabelHigh: string };
  if (riskLabel === "Past xavf") return labels.riskLabelPast;
  if (riskLabel === "O'rtacha xavf") return labels.riskLabelModerate;
  if (riskLabel === "Yuqori xavf") return labels.riskLabelHigh;
  return riskLabel;
}

/** Ekrandagi "Xulosa" bo'limi matnlari — risk darajasi, yosh guruhiga va tilga qarab */
function getXulosaParagraphs(riskLabel: string, ageLabel: string | null, totalScore: number, locale: PdfLocale): string[] {
  const lines: string[] = [];
  const isRu = locale === "ru";
  if (riskLabel === "Past xavf") {
    const p1 = isRu
      ? (ageLabel === "1,5–2 года"
          ? "У ребёнка этого возраста по скринингу вероятность признаков аутизма оценена как низкая. Рекомендуется продолжать наблюдение и уделять время играм и общению в семье."
          : ageLabel === "3–4 года" || ageLabel === "5–6 лет"
            ? "По скринингу вероятность признаков аутизма низкая. Рекомендуется продолжать наблюдение и при необходимости повторить скрининг."
            : "По результатам скрининга вероятность признаков аутизма низкая. Рекомендуется наблюдение; при вопросах — консультация специалиста.")
      : (ageLabel === "1,5–2 yosh"
          ? "Ushbu yoshdagi bolada skrining bo'yicha autizm belgilari ehtimoli past baholandi. Erta yoshda ijtimoiy va muloqot ko'nikmalari hali rivojlanayotgan bo'lgani uchun kuzatishni davom ettirish, oilada ijtimoiy o'yin va muloqotga vaqt ajratish tavsiya etiladi."
          : ageLabel === "3–4 yosh" || ageLabel === "5–6 yosh"
            ? "Skrining bo'yicha autizm belgilari ehtimoli past. Bolaning ijtimoiy aloqa, muloqot va moslashuv ko'rsatkichlari hozircha normativ rivojlanish doirasida baholandi. Maktabgacha yoki maktab yoshida kuzatishni davom ettirish va kerak bo'lsa keyinchalik qayta tekshirish mumkin."
            : "Skrining natijasiga ko'ra autizm belgilari ehtimoli past. Bolaning javoblari asosida hozircha qo'shimcha tekshiruv talab qilinmaydi. Rivojlanishni kuzatish va ota-ona savollari paydo bo'lsa mutaxassisga murojaat qilish tavsiya etiladi.");
    lines.push(p1);
    const tavsiyaKey = isRu ? "Продолжайте наблюдение. При беспокойстве — повторный скрининг или консультация детского невролога / специалиста по развитию." : "Kuzatishni davom ettiring. Agar keyinchalik ota-ona tashvishlansa yoki bolada o'zgarishlar sezilsa, qayta skrining yoki bolalar nevrologi yoki rivojlanish mutaxassisi bilan konsultatsiya qilish mumkin.";
    let tavsiya = isRu ? "Рекомендация: " + tavsiyaKey : "Tavsiya: " + tavsiyaKey;
    if (totalScore > 40) tavsiya += isRu ? " При показателе выше 40% также рекомендуется консультация специалистов по ABA." : " 40% dan yuqori bo'lgan hollarda ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.";
    lines.push(tavsiya);
  } else if (riskLabel === "O'rtacha xavf") {
    const p1 = isRu
      ? (ageLabel ? `${ageLabel}. У ребёнка этой возрастной группы по скринингу отмечены некоторые признаки. Это не означает наличие аутизма; возможны другие причины. Более точное направление даст полная клиническая оценка.` : "По скринингу отмечены некоторые признаки. Более точное направление даст полная клиническая оценка.")
      : (ageLabel ? `${ageLabel} guruhidagi bolada skrining bo'yicha ba'zi belgilar qayd etildi. Bu mutlaqo autizm borligini anglatmaydi; boshqa sabablar ham bo'lishi mumkin. To'liq klinik baholash orqali aniqroq yo'nalish olish mumkin.` : "Skrining bo'yicha ba'zi belgilar qayd etildi. To'liq klinik baholash orqali aniqroq yo'nalish olish mumkin.");
    lines.push(p1);
    let tavsiya = isRu ? "Рекомендация: Рекомендуется консультация детского невролога или специалиста по развитию. Специалист определит дальнейшие шаги." : "Tavsiya: Bolalar nevrologi yoki rivojlanish bo'yicha mutaxassis bilan konsultatsiya qilish tavsiya etiladi. Mutaxassis bolani ko'rib, anamnez va qo'shimcha tekshiruvlar asosida keyingi qadamni aniqlaydi.";
    if (totalScore > 40) tavsiya += isRu ? " При показателе выше 40% также рекомендуется консультация специалистов по ABA." : " 40% dan yuqori bo'lgani uchun ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.";
    lines.push(tavsiya);
  } else if (riskLabel === "Yuqori xavf") {
    lines.push(isRu
      ? "По скринингу отмечены выраженные признаки. Результат не является диагнозом; это основа для планирования дальнейшего обследования и консультации. Точный диагноз ставит специалист после полной клинической оценки."
      : "Skrining bo'yicha belgilar sezilarli darajada qayd etildi. Bu natija diagnoz emas; faqat keyingi tekshiruv va mutaxassis bilan uchrashuvni rejalash uchun asos hisoblanadi. Aniq tashxis faqat mutaxassis tomonidan to'liq klinik va kerak bo'lsa instrumental baholashdan keyin qo'yiladi.");
    lines.push(isRu
      ? "Рекомендация: Рекомендуется обратиться к детскому неврологу или в центр по развитию/аутизму и пройти диагностическую оценку. Также рекомендуется консультация специалистов по ABA."
      : "Tavsiya: Tezroq bolalar nevrologi yoki rivojlanish/autizm bo'yicha ixtisoslashtirilgan markazga murojaat qilish va diagnostik baholashdan o'tish tavsiya etiladi. Erta yordam va qo'llab-quvvatlash natijani yaxshilashda muhim rol o'ynaydi. ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.");
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
  locale?: PdfLocale;
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
  /** Base64-encoded TTF (Cyrillic) — ruscha PDF da matn to'g'ri ko'rinsin */
  fontBase64?: string;
};

function ensurePage(doc: jsPDF, y: number, needSpace: number): number {
  if (y + needSpace > A4_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

const CYRILLIC_FONT_VFS = "Roboto-Regular.ttf";
const CYRILLIC_FONT_NAME = "Roboto";

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
    locale: localeParam,
    fontBase64,
  } = params;

  const locale: PdfLocale = localeParam === "ru" ? "ru" : "uz";
  const L = getPdfLabels(locale);
  const answerLabels = locale === "ru" ? ANSWER_LABELS_RU : ANSWER_LABELS_UZ;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const useCyrillicFont = locale === "ru" && typeof fontBase64 === "string" && fontBase64.length > 0;
  if (useCyrillicFont && fontBase64) {
    try {
      doc.addFileToVFS(CYRILLIC_FONT_VFS, fontBase64);
      doc.addFont(CYRILLIC_FONT_VFS, CYRILLIC_FONT_NAME, "normal");
    } catch {
      // fallback: ruscha matn helvetica da buzilgan ko‘rinadi
    }
  }
  const pdfFont = useCyrillicFont ? CYRILLIC_FONT_NAME : "helvetica";
  const pdfFontStyle = (style: "normal" | "bold") => (useCyrillicFont ? "normal" : style);

  const contentW = A4_W - 2 * MARGIN;
  let y = MARGIN;

  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setFont(pdfFont, pdfFontStyle("bold"));
  doc.text(L.title, MARGIN, y);
  y += LINE_HEIGHT + 2;

  // ——— 1. Umumiy xulosa (ekrandagi birinchi blok) ———
  doc.setFont(pdfFont, pdfFontStyle("bold"));
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text(L.overallSummary, MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont(pdfFont, "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  doc.text(`${getRiskLabelForPdf(result.riskLabel, locale)} — ${L.riskIndicator}: ${result.totalScore.toFixed(1)}%`, MARGIN, y);
  y += LINE_HEIGHT + 2;

  // Rangli donut va risk bar (diagramma)
  const donutCx = MARGIN + 18;
  const donutCy = y + 18;
  drawDonut(doc, donutCx, donutCy, result.totalScore, pdfFont);
  const barX = MARGIN + 50;
  const barW = 55;
  const barH = 6;
  drawRiskBar(doc, barX, y + 12, barW, barH, result.totalScore);
  doc.text(`Risk: ${result.totalScore.toFixed(1)}%`, barX + barW + 4, y + 16);
  y += 38;

  const disclaimerLines = doc.splitTextToSize(L.disclaimerUmumiy, contentW);
  doc.text(disclaimerLines, MARGIN, y);
  y += disclaimerLines.length * LINE_HEIGHT;
  const redFlagCount = (result.redFlags ?? []).length;
  doc.text(`${L.redFlagSavollar}: ${redFlagCount}${locale === "ru" ? "" : " ta"}`, MARGIN, y);
  y += LINE_HEIGHT + 4;

  // Risk shkalasi — 5 ta rangli quti
  doc.setFont(pdfFont, pdfFontStyle("bold"));
  doc.setFontSize(9);
  doc.text(L.riskKoorsatkichlari, MARGIN, y);
  y += LINE_HEIGHT + 2;
  const boxW = 32;
  const boxH = 10;
  const gap = 2;
  y = drawRiskScale(doc, MARGIN, y, boxW, boxH, gap, pdfFont);
  doc.setFontSize(8);
  doc.text(L.riskScaleLegend, MARGIN, y);
  doc.setFont(pdfFont, "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  y += 5;

  // ——— 2. Xulosa (ekrandagi ikkinchi blok: metadata + xulosa matni + tavsiya) ———
  doc.setFont(pdfFont, pdfFontStyle("bold"));
  doc.text(L.xulosa, MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont(pdfFont, "normal");
  doc.text(`${L.xulosaRaqami}: ${getXulosaRaqami(assessmentId, completedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`${L.testSanasi}: ${formatDate(completedAt, locale)}`, MARGIN, y);
  y += LINE_HEIGHT;
  if (ageLabel) {
    doc.text(`${L.yoshGuruhi}: ${ageLabel}`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  const xulosaParagraphs = getXulosaParagraphs(result.riskLabel, ageLabel, result.totalScore, locale);
  for (const p of xulosaParagraphs) {
    y += 2;
    const pLines = doc.splitTextToSize(p, contentW);
    doc.text(pLines, MARGIN, y);
    y += pLines.length * LINE_HEIGHT;
  }
  y += 2;
  const smallLines = doc.splitTextToSize(L.smallDisclaimer, contentW);
  doc.text(smallLines, MARGIN, y);
  y += smallLines.length * LINE_HEIGHT + 4;

  // ——— 3. Bloklar bo'yicha (%) — rangli barlar ———
  doc.setFont(pdfFont, pdfFontStyle("bold"));
  doc.text(L.bloklarBuyicha, MARGIN, y);
  y += LINE_HEIGHT + 2;
  doc.setFont(pdfFont, "normal");
  const blockBarW = 50;
  const blockBarH = 4;
  const domainById = new Map(domains.map((d) => [d.id, d.title]));
  for (const b of result.blocks ?? []) {
    const score = Math.min(100, Math.max(0, Number(b.score) || 0));
    const [r, g, bl] = getBlockBarRgb(score);
    doc.setFillColor(230, 230, 230);
    doc.rect(MARGIN, y - 2.5, blockBarW, blockBarH, "F");
    if (score > 0) {
      doc.setFillColor(r, g, bl);
      doc.rect(MARGIN, y - 2.5, (score / 100) * blockBarW, blockBarH, "F");
    }
    const blockTitle = domainById.get(b.blockId) ?? b.title;
    doc.text(`${blockTitle}: ${Math.round(score)}%`, MARGIN + blockBarW + 4, y + 0.5);
    y += LINE_HEIGHT + 2;
  }
  y += 4;

  // ——— 4. Red-flag savollar ———
  if ((result.redFlags ?? []).length > 0) {
    y = ensurePage(doc, y, 30);
    doc.setFont(pdfFont, pdfFontStyle("bold"));
    doc.text(L.redFlagTitle, MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont(pdfFont, "normal");
    for (const rf of result.redFlags ?? []) {
      const lines = doc.splitTextToSize(rf.text, contentW);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT;
    }
    y += 5;
  }

  // ——— 5. Autizmga moyilligi bor savollar va javoblari ——— (barcha risk > 0)
  const topWithBall = (result.topOverall ?? []).filter((issue) => (issue.risk ?? 0) > 0);
  const questionById = new Map(questions.map((q) => [q.id, q]));
  if (topWithBall.length > 0) {
    y = ensurePage(doc, y, 25);
    doc.setFont(pdfFont, pdfFontStyle("bold"));
    doc.text(L.tendencyTitle, MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont(pdfFont, "normal");
    for (const issue of topWithBall) {
      y = ensurePage(doc, y, LINE_HEIGHT * 3);
      const ansStr =
        typeof issue.answer === "number"
          ? answerLabels[issue.answer] ?? (locale === "ru" ? "Ответ " : "Javob ") + issue.answer
          : "—";
      const qText = questionById.get(issue.questionId)?.text ?? issue.text;
      const lines = doc.splitTextToSize(`${qText}  — ${L.javob}: ${ansStr}`, contentW);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT;
    }
    y += 5;
  }

  if (aiPayload) {
    y = ensurePage(doc, y, 55);
    y += 6;
    doc.setFont(pdfFont, pdfFontStyle("bold"));
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text(L.aiXulosa, MARGIN, y);
    y += LINE_HEIGHT + 2;
    doc.setFont(pdfFont, "normal");
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
      doc.setFont(pdfFont, pdfFontStyle("bold"));
      doc.text(L.kuchliTomonlar, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont(pdfFont, "normal");
      for (const ex of aiPayload.strengths.examples) {
        const exLines = doc.splitTextToSize(`• ${ex}`, contentW - 4);
        doc.text(exLines, MARGIN + 2, y);
        y += exLines.length * LINE_HEIGHT;
      }
    }
    if (Array.isArray(aiPayload.needsFocus?.priority) && aiPayload.needsFocus.priority.length > 0) {
      y += 2;
      doc.setFont(pdfFont, pdfFontStyle("bold"));
      doc.text(L.etiborKerak, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont(pdfFont, "normal");
      for (const p of aiPayload.needsFocus.priority) {
        const pLines = doc.splitTextToSize(`• ${p}`, contentW - 4);
        doc.text(pLines, MARGIN + 2, y);
        y += pLines.length * LINE_HEIGHT;
      }
    }
    if (Array.isArray(aiPayload.nextSteps?.homePlan) && aiPayload.nextSteps.homePlan.length > 0) {
      y += 2;
      doc.setFont(pdfFont, pdfFontStyle("bold"));
      doc.text(L.uyRejasi, MARGIN, y);
      y += LINE_HEIGHT;
      doc.setFont(pdfFont, "normal");
      for (const plan of aiPayload.nextSteps.homePlan) {
        y = ensurePage(doc, y, LINE_HEIGHT * 4);
        if (plan.title) {
          doc.setFont(pdfFont, pdfFontStyle("bold"));
          const tLines = doc.splitTextToSize(plan.title, contentW - 2);
          doc.text(tLines, MARGIN + 2, y);
          y += tLines.length * LINE_HEIGHT;
          doc.setFont(pdfFont, "normal");
        }
        if (plan.why) {
          const wLines = doc.splitTextToSize(plan.why, contentW - 4);
          doc.text(wLines, MARGIN + 2, y);
          y += wLines.length * LINE_HEIGHT;
        }
        if (Array.isArray(plan.how) && plan.how.length > 0) {
          for (const step of plan.how) {
            const sLines = doc.splitTextToSize(`• ${step}`, contentW - 6);
            doc.text(sLines, MARGIN + 4, y);
            y += sLines.length * LINE_HEIGHT;
          }
        }
        y += 2;
      }
    }
    if (aiPayload.disclaimer?.text) {
      y += 4;
      const dLines = doc.splitTextToSize(aiPayload.disclaimer.text, contentW);
      doc.setFont(pdfFont, useCyrillicFont ? "normal" : "italic");
      doc.text(dLines, MARGIN, y);
      doc.setFont(pdfFont, "normal");
    }
  }

  // ——— ABA markazlar (tanlangan viloyat) ———
  if (selectedAbaRegion && abaCenters && abaCenters.length > 0) {
    y = ensurePage(doc, y, 40);
    y += 6;
    doc.setFont(pdfFont, pdfFontStyle("bold"));
    doc.setFontSize(FONT_SIZE_HEADING);
    doc.text(L.abaMarkazlar, MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(FONT_SIZE_BODY);
    const regionLabel = selectedAbaDistrict
      ? `${selectedAbaRegion}, ${selectedAbaDistrict}`
      : selectedAbaRegion;
    doc.text(`${L.viloyat}: ${regionLabel}`, MARGIN, y);
    y += LINE_HEIGHT + 3;
    for (const c of abaCenters) {
      y = ensurePage(doc, y, LINE_HEIGHT * 6);
      if (c.name) {
        doc.setFont(pdfFont, pdfFontStyle("bold"));
        doc.text(c.name, MARGIN, y);
        doc.setFont(pdfFont, "normal");
        y += LINE_HEIGHT;
      }
      if (c.address) {
        const aLines = doc.splitTextToSize(`${L.manzil}: ${c.address}`, contentW - 2);
        doc.text(aLines, MARGIN, y);
        y += aLines.length * LINE_HEIGHT;
      }
      if (c.phone) {
        doc.text(`${L.telefon}: ${c.phone}`, MARGIN, y);
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
  doc.text(L.footerDisclaimer, MARGIN, y);

  const fileName = locale === "ru"
    ? `Skrining-rezultat-${getXulosaRaqami(assessmentId, completedAt)}.pdf`
    : `Skrining-natija-${getXulosaRaqami(assessmentId, completedAt)}.pdf`;
  doc.save(fileName);
}
