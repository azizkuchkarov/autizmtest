"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TestWizard from "@/components/TestWizard";
import type { AgeGroupId } from "@/data";
import type { AnswerValue } from "@/lib/scoring";
import type { TestType } from "@/lib/test-types";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslations } from "@/lib/translations";
import { getStoredInitialData } from "@/lib/initial-data";

const DEFAULT_ANSWER_SCALE = [
  { value: 0, label: "Yo'q / hech qachon" },
  { value: 1, label: "Kamdan-kam / ayrim vaziyatda" },
  { value: 2, label: "Ko'pincha, lekin barqaror emas" },
  { value: 3, label: "Doim / barqaror" },
];

function TestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const t = useTranslations();
  const [ageGroup, setAgeGroup] = React.useState<AgeGroupId | null>(null);
  const [config, setConfig] = React.useState<{
    questions: { id: string; domain: string; weight: number; isRedFlag: boolean; text: string; example: string; explanation: string }[];
    answerScale: { value: number; label: string }[];
    domains?: { id: string; title: string }[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [noInitialData, setNoInitialData] = React.useState(false);

  const questionsApi = "/api/screening/questions";
  const testType: TestType = "screening";

  React.useEffect(() => {
    const initial = getStoredInitialData();
    if (!initial?.ageGroup) {
      setNoInitialData(true);
      setLoading(false);
      return;
    }
    setAgeGroup(initial.ageGroup);
  }, [searchParams, router]);

  React.useEffect(() => {
    if (!ageGroup) return;
    setLoading(true);
    setError(null);
    fetch(`${questionsApi}?ageGroup=${encodeURIComponent(ageGroup)}&locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error("Savollar yuklanmadi");
        return r.json();
      })
      .then((data) => {
        const questions = data.questions ?? [];
        setConfig({
          questions,
          answerScale: data.answerScale ?? DEFAULT_ANSWER_SCALE,
          domains: data.domains ?? [],
        });
      })
      .catch((e) => {
        const msg = e?.message ?? "";
        const isNetworkError = msg === "Failed to fetch" || e?.name === "TypeError";
        setError(isNetworkError ? t("common.fetchFailed") : (msg || t("common.error")));
      })
      .finally(() => setLoading(false));
  }, [ageGroup, questionsApi, locale, t]);

  const handleComplete = async (answers: Record<string, AnswerValue>) => {
    if (!ageGroup) return;
    setError(null);
    const initial = getStoredInitialData();
    const payload: Record<string, unknown> = {
      testType,
      ageGroup,
      answers,
    };
    if (initial?.respondent) payload.respondent = initial.respondent;
    if (initial?.childGender) payload.childGender = initial.childGender;
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Natija yuborilmadi");
        return;
      }
      const id = data?.assessmentId;
      if (id) {
        router.push(`/payment?assessment_id=${id}`);
      } else {
        setError("Assessment ID topilmadi");
      }
    } catch (e) {
      const err = e instanceof Error ? e : null;
      const msg = err?.message ?? "";
      const isNetworkError = msg === "Failed to fetch" || (err && "name" in err && err.name === "TypeError");
      setError(isNetworkError ? t("common.fetchFailed") : (msg || "Xatolik yuz berdi"));
    }
  };

  if (noInitialData) {
    return (
      <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
        <main className="mx-auto max-w-md px-4 pb-16 pt-8 sm:pt-10">
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Dastlabki ma&apos;lumotlar kerak
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Testni boshlash uchun avval dastlabki ma&apos;lumotlarni (yosh, kim to&apos;ldiradi, jins) to&apos;ldiring.
            </p>
            <Link
              href="/start"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Dastlabki ma&apos;lumotlarga o&apos;tish
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (loading || !ageGroup || !config) {
    return (
      <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 p-6">
        <div className="mx-auto max-w-md text-center py-12 text-slate-600 dark:text-slate-400">
          Savollar yuklanmoqda...
        </div>
      </div>
    );
  }

  const hasNoQuestions = config.questions.length === 0;
  if (hasNoQuestions) {
    return (
      <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
        <main className="mx-auto max-w-md px-4 pb-16 pt-8 sm:pt-10">
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl p-6 sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Autizmni aniqlash
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Ushbu yosh guruhi uchun savollar hali kiritilmagan. Tez kunda qo&apos;shiladi.
            </p>
            <Link
              href="/start"
              className="mt-6 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              ← Dastlabki ma&apos;lumotlarga qaytish
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300 pb-20">
      <main className="mx-auto max-w-lg px-4 sm:px-6 pt-8 sm:pt-10">
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
        <TestWizard
          ageGroup={ageGroup}
          questions={config.questions}
          answerScale={config.answerScale}
          domainLabels={config.domains?.length ? Object.fromEntries(config.domains.map((d) => [d.id, d.title])) : undefined}
          domainSubtitles={config.domains?.length ? Object.fromEntries(config.domains.filter((d) => "subtitle" in d && (d as unknown as { subtitle?: string }).subtitle).map((d) => [d.id, (d as unknown as { subtitle: string }).subtitle])) : undefined}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 flex items-center justify-center">
          <p className="text-slate-600 dark:text-slate-400">Yuklanmoqda...</p>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}
