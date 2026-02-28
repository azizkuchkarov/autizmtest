"use client";

import React from "react";
import type { ScreeningQuestion } from "@/lib/screening-types";
import type { AnswerValue } from "@/lib/scoring";
import { useTranslations } from "@/lib/translations";

type AnswerScaleItem = { value: number; label: string };

type Step =
  | { type: "blockIntro"; blockId: string; blockTitle: string; blockSubtitle?: string; blockIndex: number; totalBlocks: number }
  | { type: "question"; question: ScreeningQuestion; questionIndex: number; totalQuestions: number };

type Props = {
  ageGroup: string;
  questions: ScreeningQuestion[];
  answerScale: AnswerScaleItem[];
  domainLabels?: Record<string, string>;
  domainSubtitles?: Record<string, string>; // ixtiyoriy: blok ostisarlavhasi
  onComplete: (answers: Record<string, AnswerValue>) => Promise<void>;
};

function buildSteps(questions: ScreeningQuestion[], domainLabels?: Record<string, string>, domainSubtitles?: Record<string, string>): Step[] {
  const steps: Step[] = [];
  const seen = new Set<string>();
  const order: string[] = [];
  for (const q of questions) {
    if (!seen.has(q.domain)) {
      seen.add(q.domain);
      order.push(q.domain);
    }
  }
  const totalBlocks = order.length;
  let questionIndex = 0;
  for (let b = 0; b < order.length; b++) {
    const blockId = order[b];
    const blockQuestions = questions.filter((q) => q.domain === blockId);
    const blockTitle = domainLabels?.[blockId] ?? blockId;
    const blockSubtitle = domainSubtitles?.[blockId];
    steps.push({
      type: "blockIntro",
      blockId,
      blockTitle,
      blockSubtitle,
      blockIndex: b + 1,
      totalBlocks,
    });
    for (let i = 0; i < blockQuestions.length; i++) {
      questionIndex += 1;
      steps.push({
        type: "question",
        question: blockQuestions[i],
        questionIndex,
        totalQuestions: questions.length,
      });
    }
  }
  return steps;
}

export default function TestWizard({
  ageGroup,
  questions,
  answerScale,
  domainLabels,
  domainSubtitles,
  onComplete,
}: Props) {
  const t = useTranslations();
  const steps = React.useMemo(
    () => buildSteps(questions, domainLabels, domainSubtitles),
    [questions, domainLabels, domainSubtitles]
  );

  const [stepIndex, setStepIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const step = steps[stepIndex];
  const isIntro = step?.type === "blockIntro";
  const isQuestion = step?.type === "question";
  const q = isQuestion ? step.question : null;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const currentAnswer = q ? answers[q.id] : undefined;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (value: AnswerValue) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) setStepIndex((i) => i + 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await onComplete(answers);
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = stepIndex === totalSteps - 1;
  const isLastQuestion = isQuestion && step && step.questionIndex === questions.length;

  if (!step) {
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl p-8 text-center text-slate-600 dark:text-slate-400">
        {t("test.noQuestions")}
      </div>
    );
  }

  // ——— Blok tanishtirish ekrani ———
  if (isIntro) {
    const isFirstBlock = step.blockIndex === 1;
    return (
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span>{t("test.block")} {step.blockIndex} / {step.totalBlocks}</span>
        </div>
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {step.blockIndex}-blok
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {step.blockTitle}
          </h2>
          {step.blockSubtitle && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {step.blockSubtitle}
            </p>
          )}
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {t("test.blockIntroText")}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {t("test.back")}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
          >
            {isFirstBlock ? t("test.startTest") : t("test.startNextBlock")}
          </button>
        </div>
      </div>
    );
  }

  // ——— Savol ekrani ———
  if (!q) return null;

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <span>{t("test.question")} {step.questionIndex} / {step.totalQuestions}</span>
        <span>{t("test.answers")}: {answeredCount}</span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {domainLabels?.[q.domain] ?? q.domain}
        </p>
        <h2 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">{q.text}</h2>
        {q.example && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("test.example")}: {q.example}</p>
        )}
        {q.explanation && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 border-l-2 border-indigo-300 dark:border-indigo-600 pl-4 py-1 rounded-r-lg bg-indigo-50/50 dark:bg-indigo-900/20">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t("test.note")}: </span>
            {q.explanation}
          </p>
        )}
        {q.isRedFlag && (
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200/80 dark:border-amber-700/50 bg-amber-50/90 dark:bg-amber-900/20 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{t("test.redFlagTitle")}</p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300/90 leading-relaxed">
                {t("test.redFlagText")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {answerScale.map((opt) => {
          const value = opt.value as AnswerValue;
          const active = currentAnswer === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAnswer(value)}
              className={`w-full rounded-2xl px-4 py-3.5 text-left text-sm font-medium border transition-all ${
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-600/80 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {t("test.back")}
        </button>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting || answeredCount < questions.length}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/25"
          >
            {submitting ? t("test.submitting") : t("test.submitResult")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentAnswer === undefined}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/25"
          >
            {t("test.next")}
          </button>
        )}
      </div>
    </div>
  );
}