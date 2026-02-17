/**
 * Skrining natijasini A4 PDF sifatida yaratish.
 * Barcha savollar va javoblar, xulosa, risk shkalasi, AI xulosa.
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

  doc.setFontSize(FONT_SIZE_BODY);
  doc.setFont("helvetica", "normal");
  doc.text(`Xulosa raqami: ${getXulosaRaqami(assessmentId, completedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Test sanasi: ${formatDate(completedAt)}`, MARGIN, y);
  y += LINE_HEIGHT;
  if (ageLabel) {
    doc.text(`Yosh guruhi: ${ageLabel}`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text("Umumiy xulosa", MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_BODY);
  doc.text(`${result.riskLabel} — Risk ko'rsatkichi: ${result.totalScore.toFixed(1)}%`, MARGIN, y);
  y += LINE_HEIGHT + 2;

  const scaleText =
    "Risk ko'rsatkichlari: 0–20% Juda past | 20–40% Past | 40–60% O'rta | 60–80% Yuqori | 80–100% Juda yuqori";
  const scaleLines = doc.splitTextToSize(scaleText, contentW);
  doc.text(scaleLines, MARGIN, y);
  y += scaleLines.length * LINE_HEIGHT + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Bloklar bo'yicha (%)", MARGIN, y);
  y += LINE_HEIGHT;
  doc.setFont("helvetica", "normal");
  for (const b of result.blocks ?? []) {
    doc.text(`${b.title}: ${Math.round(b.score)}%`, MARGIN, y);
    y += LINE_HEIGHT;
  }
  y += 6;

  y = ensurePage(doc, y, 35);
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_HEADING);
  doc.text("Barcha savollar va ota-onaning javoblari", MARGIN, y);
  y += LINE_HEIGHT + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE_BODY);

  const domainTitles = Object.fromEntries(domains.map((d) => [d.id, d.title]));

  for (const q of questions) {
    y = ensurePage(doc, y, LINE_HEIGHT * 5);
    const blockTitle = domainTitles[q.domain] ?? q.domain;
    const answerVal = answers?.[q.id];
    const answerStr =
      answerVal !== undefined && answerVal !== null
        ? ANSWER_LABELS[answerVal] ?? `Javob: ${answerVal}`
        : "—";

    const qLines = doc.splitTextToSize(`${q.text}`, contentW - 2);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * LINE_HEIGHT;
    doc.setFont("helvetica", "bold");
    doc.text(`Javob: ${answerStr}  (${blockTitle})`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    y += LINE_HEIGHT + 3;
  }

  if ((result.redFlags ?? []).length > 0) {
    y = ensurePage(doc, y, 30);
    y += 6;
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

  if ((result.topOverall ?? []).length > 0) {
    y = ensurePage(doc, y, 25);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Autizmga moyilligi bor savollar va javoblari", MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    for (const issue of result.topOverall ?? []) {
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
