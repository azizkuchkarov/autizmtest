"use client";

import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DonutRisk, RadarBlocks } from "@/components/Charts";
import {
  computeSummary,
  type AnswerValue,
  type AnswersMap,
  type Summary,
  type RiskTier,
  type ScoringConfig,
  defaultScoringConfig,
} from "@/lib/scoring";
import { QUESTIONS, type Direction } from "@/lib/questions";
import DarkModeToggle from "@/components/DarkModeToggle";

type AiOut = {
  text: string;
};

type ParentConclusion = {
  summaryText: string;
  strengths: string[];
  concerns: string[];
};

function normalizeAi(data: any): AiOut {
  return {
    text: typeof data?.text === "string" && data.text.trim()
      ? data.text.trim()
      : "AI xulosasi tayyor bo‘lmadi. Keyinroq qayta urinib ko‘ring.",
  };
}

function blockLabel(id: keyof Summary["blocks"], lang: "uz" | "ru") {
  const labels = {
    uz: {
      social: "Ijtimoiy",
      communication: "Muloqot",
      repetitive: "Takroriy",
      sensory: "Sensor",
      play: "O‘yin",
      daily: "Kundalik",
    },
    ru: {
      social: "Социальные",
      communication: "Коммуникация",
      repetitive: "Повторяющиеся",
      sensory: "Сенсорные",
      play: "Игра",
      daily: "Быт",
    },
  };
  return labels[lang][id];
}

function statusLabel(status: Summary["blocks"][keyof Summary["blocks"]]["status"], lang: "uz" | "ru") {
  const isMedium = status === "O‘rtacha";
  if (lang === "ru") {
    if (status === "Normal") return "Норма";
    if (isMedium) return "Средний риск";
    return "Высокий риск";
  }
  if (isMedium) return "O'rtacha";
  return status;
}

function answerLabel(value: AnswerValue, lang: "uz" | "ru") {
  const map = {
    uz: {
      3: "Doimiy / Juda kuchli",
      2: "Ko'pincha",
      1: "Kamdan-kam / Ba'zan",
      0: "Yo'q / Hech qachon",
    },
    ru: {
      3: "Постоянно / очень сильно",
      2: "Часто",
      1: "Редко / иногда",
      0: "Нет / никогда",
    },
  };
  return map[lang][value];
}

function cleanQuestionText(text: string) {
  return text.trim().replace(/[.\s]+$/, "");
}

function toSeverity(direction: Direction, value: AnswerValue): AnswerValue {
  return direction === "negative" ? value : ((3 - value) as AnswerValue);
}

function buildParentConclusion(summary: Summary, answers: AnswersMap | null, lang: "uz" | "ru"): ParentConclusion {
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (!answers) {
    return {
      summaryText:
        lang === "ru"
          ? "Данные ответов не найдены. Пожалуйста, пройдите тест заново."
          : "Javoblar topilmadi. Iltimos, testni qayta to'ldiring.",
      strengths: [],
      concerns: [],
    };
  }

  const testAnswerSuffix = lang === "ru" ? "Ответ теста" : "Testdan javob";

  for (const [blockId, block] of Object.entries(summary.blocks) as [
    keyof Summary["blocks"],
    Summary["blocks"][keyof Summary["blocks"]]
  ][]) {
    const label = blockLabel(blockId, lang);
    const status = statusLabel(block.status, lang);

    const blockQuestions = QUESTIONS.filter(
      (q) => q.block === blockId && q.bands.includes(summary.ageBand)
    );

    const riskItems = blockQuestions
      .map((q) => {
        const v = answers[q.id];
        if (v === undefined) return null;
        const risk = toSeverity(q.direction, v);
        if (risk < 2) return null;
        return {
          text: cleanQuestionText(q.text),
          answer: `${answerLabel(v, lang)} (${testAnswerSuffix})`,
          risk,
          isCore: Boolean(q.isCoreFlag),
        };
      })
      .filter(Boolean) as { text: string; answer: string; risk: number; isCore: boolean }[];

    riskItems.sort((a, b) => (b.isCore ? 10 : 0) + b.risk - ((a.isCore ? 10 : 0) + a.risk));

    const strengthItems = blockQuestions
      .map((q) => {
        const v = answers[q.id];
        if (v === undefined) return null;
        const isStrength = q.direction === "positive" ? v >= 2 : v <= 1;
        if (!isStrength) return null;
        return {
          text: cleanQuestionText(q.text),
          answer: `${answerLabel(v, lang)} (${testAnswerSuffix})`,
          isCore: Boolean(q.isCoreFlag),
        };
      })
      .filter(Boolean) as { text: string; answer: string; isCore: boolean }[];

    strengthItems.sort((a, b) => (b.isCore ? 10 : 0) - (a.isCore ? 10 : 0));

    if (block.status === "Normal") {
      const topStrengths = strengthItems.slice(0, 2).map((i) => `${i.text}. ${i.answer}`);
      if (topStrengths.length > 0) strengths.push(...topStrengths);
      else
        strengths.push(
          lang === "ru"
            ? `${label}: выраженных рисков не отмечено.`
            : `${label}: aniq xavotirli belgilar kuzatilmadi.`
        );
    } else {
      const topRisks = riskItems.slice(0, 2).map((i) => `${i.text}. ${i.answer}`);
      const flagsText = topRisks.length
        ? lang === "ru"
          ? ` Наблюдаемые признаки: ${topRisks.join("; ")}.`
          : ` Kuzatilgan belgilar: ${topRisks.join("; ")}.`
        : lang === "ru"
        ? " Наблюдаемые признаки не указаны."
        : " Kuzatilgan belgilar topilmadi.";
      concerns.push(`${label}: ${status}.${flagsText}`);
    }
  }

  if (strengths.length === 0) {
    strengths.push(
      lang === "ru"
        ? "Выраженных сильных сторон по ответам не выделено."
        : "Javoblarga ko'ra aniq kuchli tomonlar ajralmadi."
    );
  }
  if (concerns.length === 0) {
    concerns.push(
      lang === "ru"
        ? "Явных зон риска не выявлено."
        : "Hozircha yaqqol xavotirli yo'nalishlar ko'rinmadi."
    );
  }

  let summaryText = "";
  if (summary.tier === "LOW") {
    summaryText =
      lang === "ru"
        ? "Результаты близки к возрастной норме. Риск низкий, но наблюдение полезно."
        : "Natijalar yosh me'yoriga yaqin. Risk past, ammo kuzatuv foydali.";
  } else if (summary.tier === "WATCH") {
    summaryText =
      lang === "ru"
        ? "Есть отдельные области, где требуется внимание. Это не диагноз, но наблюдение и поддержка важны."
        : "Ba'zi yo'nalishlarda e'tibor kerak. Bu tashxis emas, kuzatuv va qo‘llab-quvvatlash muhim.";
  } else if (summary.tier === "MODERATE") {
    summaryText =
      lang === "ru"
        ? "Есть признаки, которые стоит обсудить со специалистом. Это не диагноз."
        : "Mutaxassis bilan muhokama qilishga arziydigan belgilar bor. Bu tashxis emas.";
  } else {
    summaryText =
      lang === "ru"
        ? "Высокий риск — нужна очная оценка специалиста. Это не диагноз."
        : "Yuqori xavf — mutaxassisning yuzma-yuz baholashi zarur. Bu tashxis emas.";
  }

  return { summaryText, strengths, concerns };
}

function riskChipStyle(tier: RiskTier) {
  if (tier === "LOW") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (tier === "WATCH") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (tier === "MODERATE") return "bg-rose-100 text-rose-800 ring-rose-200";
  return "bg-rose-200 text-rose-900 ring-rose-300";
}

function riskTierLabel(tier: RiskTier, lang: "uz" | "ru") {
  const labels = {
    uz: {
      LOW: "Past xavf",
      WATCH: "Kuzatish tavsiya etiladi",
      MODERATE: "O‘rtacha xavf",
      HIGH: "Yuqori xavf",
    },
    ru: {
      LOW: "Низкий риск",
      WATCH: "Наблюдение",
      MODERATE: "Умеренный риск",
      HIGH: "Высокий риск",
    },
  };
  return labels[lang][tier];
}

export default function ResultClient() {
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [ai, setAi] = React.useState<AiOut | null>(null);
  const [summary, setSummary] = React.useState<ReturnType<typeof computeSummary> | null>(null);
  const [lang, setLang] = React.useState<"uz" | "ru">("uz");
  const [answers, setAnswers] = React.useState<AnswersMap | null>(null);
  const [questions, setQuestions] = React.useState<any[]>(QUESTIONS);
  const [blocks, setBlocks] = React.useState<any[]>([]);
  const [abaCenters, setAbaCenters] = React.useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = React.useState<string>("");
  const [scoringConfig, setScoringConfig] = React.useState<ScoringConfig>(defaultScoringConfig);
  const [reportId, setReportId] = React.useState<string>("");
  const [reportDate, setReportDate] = React.useState<string>("");

  React.useEffect(() => {
    const rawA = sessionStorage.getItem("asds_answers");
    const rawAge = sessionStorage.getItem("asds_age");
    const rawLang = sessionStorage.getItem("asds_lang");
    if (!rawA || !rawAge) return;

    const answers = JSON.parse(rawA) as AnswersMap;
    const age = Number(rawAge);
    if (rawLang === "ru" || rawLang === "uz") setLang(rawLang);
    setAnswers(answers);
    setSummary(computeSummary(age, answers, scoringConfig, questions));

    const now = new Date();
    const dateLabel =
      rawLang === "ru"
        ? now.toLocaleString("ru-RU")
        : now.toLocaleString("uz-UZ");
    setReportDate(dateLabel);
    setReportId(`ASDS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  }, [scoringConfig, questions]);

  React.useEffect(() => {
    const age = Number(sessionStorage.getItem("asds_age") || "0");
    const ageBand = age ? (age <= 3 ? "2-3" : age <= 5 ? "4-5" : "6-7") : null;
    Promise.all([
      fetch("/api/scoring-config").then((r) => r.json()),
      fetch("/api/blocks").then((r) => r.json()),
      ageBand ? fetch(`/api/questions?ageBand=${ageBand}`).then((r) => r.json()) : Promise.resolve({ items: QUESTIONS }),
      fetch("/api/aba-centers").then((r) => r.json()).catch(() => ({ items: [] })),
    ])
      .then(([cfg, blk, q, aba]) => {
        setScoringConfig(cfg.config ?? defaultScoringConfig);
        setBlocks(blk.items ?? []);
        setQuestions(q.items ?? QUESTIONS);
        setAbaCenters(aba.items ?? []);
        if (!selectedRegion && Array.isArray(aba.items) && aba.items.length > 0) {
          setSelectedRegion(String(aba.items[0].region ?? ""));
        }
      })
      .catch(() => {});
  }, [selectedRegion]);

  async function requestAiText(): Promise<AiOut | null> {
    if (!summary) return null;
    const domainSeverities = {
      social: Math.round(summary.blocks.social.severity01 * 100),
      communication: Math.round(summary.blocks.communication.severity01 * 100),
      repetitive: Math.round(summary.blocks.repetitive.severity01 * 100),
      sensory: Math.round(summary.blocks.sensory.severity01 * 100),
      play: Math.round(summary.blocks.play.severity01 * 100),
      daily: Math.round(summary.blocks.daily.severity01 * 100),
    };

    const aiInput = {
      ageBand: summary.ageBand,
      riskTier: summary.tier,
      riskScorePercent: summary.riskScorePercent,
      topDomains: summary.rationale.topDomains,
      domainSeverities,
      redFlagCount: summary.redFlagCount,
      parentNotes: "",
    };

    const res = await fetch("/api/ai-explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiInput),
    });
    const data = await res.json();
    return normalizeAi(data);
  }

  async function renderNodeToCanvas(node: HTMLElement) {
    const keepColor = node.classList.contains("pdf-keep-color");
    const temp = document.createElement("div");
    temp.className = keepColor ? "pdf-layout" : "pdf-safe pdf-layout";
    temp.style.position = "fixed";
    temp.style.left = "-99999px";
    temp.style.top = "0";
    temp.style.background = "#ffffff";
    temp.style.padding = "24px";
    temp.style.width = "794px";
    temp.style.maxWidth = "794px";

    const style = document.createElement("style");
    style.textContent = `
      * { box-shadow: none !important; text-shadow: none !important; filter: none !important; background-image: none !important; }
      svg, svg * { box-shadow: none !important; text-shadow: none !important; filter: none !important; }
    `;
    temp.appendChild(style);

    const cloned = node.cloneNode(true) as HTMLElement;
    if (!keepColor) cloned.classList.add("pdf-safe");
    temp.appendChild(cloned);
    if (keepColor) {
      const nodes = cloned.querySelectorAll("*");
      nodes.forEach((n) => {
        if (n instanceof SVGElement) return;
        const el = n as HTMLElement;
        el.style.color = "#111827";
        el.style.backgroundColor = "#ffffff";
        el.style.boxShadow = "none";
        el.style.textShadow = "none";
        el.style.backgroundImage = "none";
      });
    }
    document.body.appendChild(temp);

    const canvas = await html2canvas(temp, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(temp);
    return canvas;
  }

  async function generatePdf() {
    if (!summary) return;
    if (!ai) {
      setLoadingAi(true);
      try {
        const out = await requestAiText();
        if (out) setAi(out);
      } finally {
        setLoadingAi(false);
      }
      // Allow React to render AI text before snapshot
      await new Promise((r) => setTimeout(r, 150));
    }
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    let cursorY = margin;

    const report = document.getElementById("report");
    if (!report) return;

    const sections = Array.from(report.querySelectorAll(".pdf-section")) as HTMLElement[];
    const items: HTMLElement[] = [];
    for (const section of sections) {
      if (section.classList.contains("pdf-qa-section")) {
        const title = section.querySelector(".pdf-qa-title") as HTMLElement | null;
        if (title) items.push(title);
        const blocks = Array.from(section.querySelectorAll(".pdf-qa-block")) as HTMLElement[];
        items.push(...blocks);
      } else {
        items.push(section);
      }
    }

    for (let i = 0; i < items.length; i += 1) {
      const canvas = await renderNodeToCanvas(items[i]);
      const imgData = canvas.toDataURL("image/png");
      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > maxHeight) {
        const scale = maxHeight / imgHeight;
        imgWidth = imgWidth * scale;
        imgHeight = imgHeight * scale;
      }

      if (cursorY + imgHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
      pdf.addImage(imgData, "PNG", margin, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 4;
    }

    pdf.save("autism-screening-report.pdf");
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pdf_download",
        metadata: { ageBand: summary.ageBand, riskScorePercent: summary.riskScorePercent },
      }),
    }).catch(() => null);
  }

  async function fetchAi() {
    if (!summary) return;
    setLoadingAi(true);
    try {
      const out = await requestAiText();
      if (out) setAi(out);
    } finally {
      setLoadingAi(false);
    }
  }

  if (!summary) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-6">
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <DarkModeToggle />
        </div>
        <div className="mx-auto max-w-md rounded-2xl glass dark:bg-slate-800/50 p-6 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50">
          <div className="text-sm text-slate-700 dark:text-slate-300">Natija topilmadi. Testdan o'ting.</div>
        </div>
      </div>
    );
  }

  const chip = riskChipStyle(summary.tier);
  const parentConclusion = buildParentConclusion(summary, answers, lang);
  const ageQuestions = (questions.length ? questions : QUESTIONS).filter((q) => q.bands.includes(summary.ageBand));
  const qaList = ageQuestions.map((q) => {
    const v = answers?.[q.id];
    return {
      id: q.id,
      block: q.block,
      text: cleanQuestionText(q.text),
      answerLabel: v === undefined ? (lang === "ru" ? "Нет ответа" : "Javob berilmagan") : answerLabel(v, lang),
    };
  });
  const qaByBlock = qaList.reduce((acc, item) => {
    acc[item.block] = acc[item.block] ?? [];
    acc[item.block].push(item);
    return acc;
  }, {} as Record<string, typeof qaList>);
  const radar = [
    { label: "Ijtimoiy", value: summary.blocks.social.rawSum },
    { label: "Muloqot", value: summary.blocks.communication.rawSum },
    { label: "Takroriy", value: summary.blocks.repetitive.rawSum },
    { label: "Sensor", value: summary.blocks.sensory.rawSum },
    { label: "O‘yin", value: summary.blocks.play.rawSum },
    { label: "Kundalik", value: summary.blocks.daily.rawSum },
  ];
  const regionOptions = Array.from(
    new Set(abaCenters.map((c) => String(c.region)).filter(Boolean))
  );
  const filteredCenters =
    selectedRegion && regionOptions.length > 0
      ? abaCenters.filter((c) => String(c.region) === selectedRegion)
      : abaCenters;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 pb-16">
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50 animate-fadeIn">
        <DarkModeToggle />
      </div>
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover-lift animate-fadeIn" id="report">
          <div className="pointer-events-none absolute -right-12 top-10 rotate-12 text-5xl font-bold tracking-widest text-indigo-200/40 dark:text-indigo-400/20 pdf-hide">
            PREMIUM
          </div>
          <div className="flex items-start justify-between gap-3 pdf-section pdf-header">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100/70 dark:ring-indigo-800/60">
                Premium hisobot
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Skrining natijasi</h1>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Yoshi: <span className="font-semibold text-indigo-700 dark:text-indigo-400">{summary.childAgeYears}</span> (band: {summary.ageBand})
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Report ID: <span className="font-semibold text-slate-600 dark:text-slate-300">{reportId}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {lang === "ru" ? "Сформировано:" : "Yaratilgan:"}{" "}
                <span className="font-semibold text-slate-600 dark:text-slate-300">{reportDate}</span>
              </p>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Eslatma: bu skrining — tashxis emas. Natija yo'naltirish uchun.
              </p>
            </div>
            <div className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold ring-1 shadow-sm ${chip}`}>
              {riskTierLabel(summary.tier, lang)}
            </div>
          </div>

          <div className="mt-5 grid gap-4 pdf-grid">
            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section pdf-keep-color">
              <DonutRisk value={summary.riskScorePercent} />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="font-medium">Umumiy risk</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">{summary.riskScorePercent}%</span>
              </div>
              <div className="mt-3 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-900/20 dark:to-slate-900/40 p-4 text-xs text-slate-700 dark:text-slate-300 ring-1 ring-indigo-100/70 dark:ring-indigo-800/50 shadow-sm">
                <div className="font-bold text-indigo-900 dark:text-indigo-300">Natija:</div>
                <div className="mt-1.5 font-medium">{riskTierLabel(summary.tier, lang)}</div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Risk balli: {summary.riskScorePercent}% · Core: {Math.round(summary.coreSeverity01 * 100)}% · Kundalik ta’sir:{" "}
                  {Math.round(summary.functionalImpact01 * 100)}%
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section pdf-keep-color">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Rivojlanish profili</div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">Yuqori qiymat — shu sohada yordam ehtiyoji ko'proq bo'lishi mumkin.</p>
              <RadarBlocks points={radar} />
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section pdf-qa-section">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 pdf-qa-title">
                {lang === "ru" ? "Вопросы и ответы" : "Savollar va javoblar"}
              </div>
              <div className="mt-3 space-y-4 text-sm text-slate-700 dark:text-slate-300 pdf-qa">
                {Object.entries(qaByBlock).map(([blockId, items]) => (
                  <div key={blockId} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3 pdf-qa-block">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {blockLabel(blockId as any, lang)}
                    </div>
                    <ol className="mt-2 list-decimal pl-5 space-y-1.5">
                      {items.map((item) => (
                        <li key={item.id} className="leading-relaxed">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{item.text}</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {" "}
                            — {lang === "ru" ? "Ответ:" : "Javob:"} {item.answerLabel}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                {lang === "ru" ? "Вывод по ответам родителей" : "Ota-ona javoblari bo'yicha xulosa"}
              </div>
              <Section
                title={lang === "ru" ? "Общий вывод" : "Umumiy xulosa"}
                items={[parentConclusion.summaryText]}
              />
              <Section
                title={lang === "ru" ? "Сильные стороны" : "Kuchli tomonlar"}
                items={parentConclusion.strengths}
              />
              <Section
                title={lang === "ru" ? "Зоны внимания" : "E'tibor talab qiladigan yo'nalishlar"}
                items={parentConclusion.concerns}
              />
              <p className="mt-3 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-900/20 dark:to-slate-900/40 p-3.5 text-xs text-slate-700 dark:text-slate-300 ring-1 ring-amber-200/60 dark:ring-amber-800/50 shadow-sm">
                {lang === "ru"
                  ? "Примечание: это скрининг, не диагноз. Итоговая оценка возможна только при очной консультации."
                  : "Eslatma: bu skrining, tashxis emas. Yakuniy baho faqat yuzma-yuz konsultatsiyada beriladi."}
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100">AI xulosa</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Profilga mos, qat'iy qoidalar asosida</div>
                </div>
                <button
                  onClick={fetchAi}
                  disabled={loadingAi}
                  className="rounded-2xl bg-gradient-to-r from-rose-500 via-rose-500 to-rose-600 dark:from-rose-600 dark:via-rose-500 dark:to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 dark:shadow-rose-500/40 transition-all hover:from-rose-600 hover:via-rose-600 hover:to-rose-700 dark:hover:from-rose-700 dark:hover:via-rose-600 dark:hover:to-rose-700 hover:shadow-xl disabled:opacity-50"
                >
                  {loadingAi ? "Yuklanmoqda..." : ai ? "Qayta yaratish" : "AI xulosa"}
                </button>
              </div>

              {!ai ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {loadingAi ? "Yuklanmoqda..." : "AI xulosa hali tayyor emas."}
                </p>
              ) : (
                <div className="mt-4 rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {ai.text}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-md hover-lift pdf-section">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                ABA markazlar ro‘yxati (12 viloyat)
              </div>
              {regionOptions.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs font-semibold text-slate-600">Viloyatni tanlang</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    {regionOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {abaCenters.length === 0 ? (
                <div className="text-sm text-slate-600">Ro‘yxat hali kiritilmagan.</div>
              ) : filteredCenters.length === 0 ? (
                <div className="text-sm text-slate-600">Ushbu viloyat uchun markaz topilmadi.</div>
              ) : (
                <div className="grid gap-2 text-sm text-slate-700">
                  {filteredCenters.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200/70 p-3">
                      <div className="text-xs font-semibold text-slate-500">{c.region}</div>
                      <div className="mt-0.5 font-semibold text-slate-900">{c.name}</div>
                      {c.address && <div className="text-xs text-slate-600 mt-1">{c.address}</div>}
                      {c.phone && <div className="text-xs text-slate-600">{c.phone}</div>}
                      {c.note && <div className="text-xs text-slate-500 mt-1">{c.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={generatePdf}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:via-indigo-500 dark:hover:to-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 pdf-hide"
            >
              PDF yuklab olish
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/60 p-4 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm hover-lift">
      <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">{title}</div>
      <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {safeItems.map((t, i) => (
          <li key={i} className="flex items-start gap-2 leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/80 dark:bg-indigo-400" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
