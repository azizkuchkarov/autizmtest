"use client";

import React from "react";
import { type BlockId } from "@/lib/questions";
import { type AnswersMap } from "@/lib/scoring";
import BlockIntroLoader from "@/components/BlockIntroLoader";
import { tBlock, type Lang } from "@/lib/i18n";
import SaveProgress, { loadProgress } from "@/components/SaveProgress";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useRouter } from "next/navigation";

type Props = {
  childAgeYears: number;
  lang: Lang;
  onComplete: (answers: AnswersMap) => void;
  questions: {
    id: string;
    block: BlockId;
    text: string;
    example: string;
    explain: string;
    bands: string[];
  }[];
  blocks: { id: BlockId; title: string; subtitle: string }[];
};

export default function TestWizard({ childAgeYears, lang, onComplete, questions, blocks }: Props) {
  const router = useRouter();
  // Try to load saved progress
  const savedProgress = React.useMemo(() => loadProgress(), []);
  const [idx, setIdx] = React.useState(savedProgress?.currentIndex ?? 0);
  const [answers, setAnswers] = React.useState<AnswersMap>(savedProgress?.answers ?? {});

  /** ===== INTRO STATE ===== */
  const [showIntro, setShowIntro] = React.useState(false);
  const [introBlock, setIntroBlock] = React.useState<BlockId>("social");
  const [showBlockComplete, setShowBlockComplete] = React.useState(false);
  const [completedBlock, setCompletedBlock] = React.useState<BlockId | null>(null);
  const [showExplain, setShowExplain] = React.useState(false);

  const hasShownFirstIntroRef = React.useRef(false);
  const lastBlockRef = React.useRef<BlockId | null>(null);

  const ageQuestions = questions;

  React.useEffect(() => {
    if (idx >= ageQuestions.length) {
      setIdx(0);
    }
  }, [ageQuestions.length, idx]);

  const q = ageQuestions[idx];

  /** ===== BLOCK INTRO TRIGGER ===== */
  React.useEffect(() => {
    const currentBlock = q.block;

    // 1) birinchi kirishda 1 marta
    if (!hasShownFirstIntroRef.current) {
      hasShownFirstIntroRef.current = true;
      lastBlockRef.current = currentBlock;
      setIntroBlock(currentBlock);
      setShowIntro(true);
      window.setTimeout(() => setShowIntro(false), 2000);
      return;
    }

    // 2) keyingi bloklarga o'tganda
    if (lastBlockRef.current !== currentBlock) {
      lastBlockRef.current = currentBlock;
      setIntroBlock(currentBlock);
      setShowIntro(true);
      window.setTimeout(() => setShowIntro(false), 2000);
      return;
    }
  }, [q.block]);

  React.useEffect(() => {
    setShowExplain(false);
  }, [q.id]);

  /** ===== INTRO RENDER ===== */
  if (showIntro) {
    const meta = tBlock(lang, introBlock);
    return <BlockIntroLoader title={meta.title} desc={meta.desc} focus={meta.focus} />;
  }

  // Check if we're at the last question of current block
  const currentBlockQuestionsList = ageQuestions.filter((question) => question.block === q.block);
  const currentQuestionIndexInBlock = currentBlockQuestionsList.findIndex((question) => question.id === q.id);
  const isLastQuestionInBlock = currentQuestionIndexInBlock === currentBlockQuestionsList.length - 1;

  /** ===== PROGRESS ===== */
  const total = ageQuestions.length;
  const progress = Math.round(((idx + 1) / total) * 100);
  const currentValue: 0 | 1 | 2 | 3 = (answers[q.id] ?? 0) as 0 | 1 | 2 | 3;

  // Get current block info
  const blockIndex = blocks.findIndex((b) => b.id === q.block);
  const blockTitle = blocks[blockIndex]?.title ?? "";
  const isLastBlock = blockIndex === blocks.length - 1;

  /** ===== HANDLERS ===== */
  function setAnswer(v: 0 | 1 | 2 | 3) {
    setAnswers((p) => ({ ...p, [q.id]: v }));
  }

  function prev() {
    if (idx > 0) {
      setShowBlockComplete(false);
      setIdx((x) => x - 1);
    }
  }

  function next() {
    const merged: AnswersMap = { ...answers, [q.id]: currentValue };
    setAnswers(merged);

    // If this is the last question in the block, show completion screen
    if (isLastQuestionInBlock && !isLastBlock) {
      setCompletedBlock(q.block);
      setShowBlockComplete(true);
      return;
    }

    // If this is the last question overall, complete test
    if (idx === total - 1) {
      onComplete(merged);
      return;
    }

    setIdx((x) => x + 1);
  }

  function goToNextBlock() {
    setShowBlockComplete(false);
    // Find first question of next block
    const nextBlockIndex = blockIndex + 1;
    if (nextBlockIndex < blocks.length) {
      const nextBlock = blocks[nextBlockIndex];
    const nextBlockFirstQuestion = ageQuestions.findIndex((q) => q.block === nextBlock.id);
      if (nextBlockFirstQuestion !== -1) {
        setIdx(nextBlockFirstQuestion);
      }
    }
  }

  function showResults() {
    const merged: AnswersMap = { ...answers, [q.id]: currentValue };
    onComplete(merged);
  }

  /** ===== LABELS ===== */
  const labels =
    lang === "ru"
      ? {
          always: "Постоянно / очень сильно",
          often: "Часто",
          sometimes: "Редко / иногда",
          no: "Нет / никогда",
          back: "Назад",
          next: "Далее",
          finish: "Завершить",
          nextBlock: "Перейти к следующему блоку",
          showResults: "Показать результаты",
          blockComplete: "Блок завершён",
          blockCompleteText: "Вы ответили на все вопросы этого блока. Переходите к следующему блоку.",
          q: "Вопрос",
          block: "Блок",
          score: "Общий риск",
          note: "Это скрининг, не диагноз.",
        }
      : {
          always: "Doimiy / Juda kuchli",
          often: "Ko'pincha",
          sometimes: "Kamdan-kam / Ba'zan",
          no: "Yo'q / Hech qachon",
          back: "Orqaga",
          next: "Keyingi",
          finish: "Yakunlash",
          nextBlock: "Keyingi blokka o'tish",
          showResults: "Natijani ko'rish",
          blockComplete: "Blok yakunlandi",
          blockCompleteText: "Siz ushbu blokdagi barcha savollarga javob berdingiz. Keyingi blokka o'ting.",
          q: "Savol",
          block: "Blok",
          score: "Umumiy risk",
          note: "Bu skrining, tashxis emas.",
        };

  /** ===== BLOCK COMPLETE SCREEN ===== */
  if (showBlockComplete && completedBlock) {
    const completedBlockInfo = blocks.find((b) => b.id === completedBlock);
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 px-4 pt-6 pb-10 flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-2xl glass dark:bg-slate-800/50 p-8 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 animate-scaleIn">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {labels.blockComplete}
            </h2>
            <p className="text-slate-700 dark:text-slate-300 mb-2">
              {completedBlockInfo?.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {labels.blockCompleteText}
            </p>
            <button
              onClick={goToNextBlock}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
            >
              {labels.nextBlock}
              <svg className="inline ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 px-4 pt-6 pb-10">
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-50 animate-fadeIn">
        <DarkModeToggle />
      </div>
      <div className="mx-auto max-w-md rounded-2xl glass dark:bg-slate-800/50 p-5 shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50 hover-lift animate-fadeIn">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-800">
              {labels.block}: {blockTitle}
            </div>
            <div className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {labels.q} {idx + 1} / {total}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-700 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-800 shadow-sm">
            {progress}%
          </div>
        </div>

        {/* Save Progress */}
        <div className="mt-3">
          <SaveProgress answers={answers} currentIndex={idx} totalQuestions={total} />
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* QUESTION */}
        <div className="mt-4 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 p-5 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm hover-lift animate-scaleIn">
          <div className="text-base font-bold leading-relaxed text-slate-900 dark:text-slate-100 mb-5">
            {q.text}
          </div>
          <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-900/20 p-4 ring-1 ring-indigo-100/70 dark:ring-indigo-800/40 shadow-sm">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1">Misol</div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{q.example}</p>
            <button
              type="button"
              onClick={() => setShowExplain((v) => !v)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/90 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200/70 dark:ring-indigo-700/60 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800"
            >
              {showExplain ? "Izohni yopish" : "Izoh"}
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showExplain ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExplain && (
              <div className="mt-3 rounded-lg bg-white/80 dark:bg-slate-900/60 p-3 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-indigo-100/60 dark:ring-indigo-800/40">
                {q.explain}
              </div>
            )}
          </div>

          <div className="grid gap-3 mt-4">
            <Answer label={labels.always} active={currentValue === 3} onClick={() => setAnswer(3)} />
            <Answer label={labels.often} active={currentValue === 2} onClick={() => setAnswer(2)} />
            <Answer label={labels.sometimes} active={currentValue === 1} onClick={() => setAnswer(1)} />
            <Answer label={labels.no} active={currentValue === 0} onClick={() => setAnswer(0)} />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            className="flex-1 rounded-2xl bg-white/80 dark:bg-slate-800/70 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 ring-1 ring-slate-300/70 dark:ring-slate-600/70 shadow-sm transition-all hover:bg-white hover:shadow-md hover:ring-indigo-300/60 dark:hover:bg-slate-800 dark:hover:ring-indigo-500/60 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {labels.back}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isLastQuestionInBlock && isLastBlock) {
                showResults();
              } else {
                next();
              }
            }}
            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:via-indigo-500 dark:hover:to-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/40"
          >
            {isLastQuestionInBlock && isLastBlock
              ? labels.showResults
              : isLastQuestionInBlock
              ? labels.nextBlock
              : idx === total - 1
              ? labels.finish
              : labels.next}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">{labels.note}</p>
      </div>
    </div>
  );
}

function Answer({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3.5 text-left text-sm font-semibold ring-1 transition-all hover-lift ${
        active
          ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 text-white ring-indigo-200/80 dark:ring-indigo-700/80 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 scale-[1.02]"
          : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-300/80 dark:ring-slate-600/70 hover:bg-white hover:ring-indigo-300/60 dark:hover:bg-slate-800 dark:hover:ring-indigo-500/60"
      }`}
    >
      {label}
    </button>
  );
}
