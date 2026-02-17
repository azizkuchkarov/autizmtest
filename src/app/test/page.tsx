"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import TestWizard from "@/components/TestWizard";
import type { AgeGroupId } from "@/data";
import type { AnswerValue } from "@/lib/scoring";
import type { TestType } from "@/lib/test-types";
import {
  getStoredInitialData,
  getStoredPaymentId,
  getStoredPaidAmount,
  PAYMENT_ID_KEY,
  PAID_AMOUNT_KEY,
} from "@/lib/initial-data";

const DEFAULT_ANSWER_SCALE = [
  { value: 0, label: "Yo'q / hech qachon" },
  { value: 1, label: "Kamdan-kam / ayrim vaziyatda" },
  { value: 2, label: "Ko'pincha, lekin barqaror emas" },
  { value: 3, label: "Doim / barqaror" },
];

function TestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ageGroup, setAgeGroup] = React.useState<AgeGroupId | null>(null);
  const [config, setConfig] = React.useState<{
    questions: { id: string; domain: string; weight: number; isRedFlag: boolean; text: string; example: string; explanation: string }[];
    answerScale: { value: number; label: string }[];
    domains?: { id: string; title: string }[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paidAmount, setPaidAmount] = React.useState<number | null>(null);
  const [noInitialData, setNoInitialData] = React.useState(false);

  const questionsApi = "/api/screening/questions";
  const testType: TestType = "screening";

  React.useEffect(() => {
    const pid = searchParams.get("payment_id");
    const amt = searchParams.get("amount");
    if (pid) {
      try {
        sessionStorage.setItem(PAYMENT_ID_KEY, pid);
      } catch {}
    }
    if (amt) {
      const n = parseInt(amt, 10);
      if (Number.isFinite(n)) {
        setPaidAmount(n);
        try {
          sessionStorage.setItem(PAID_AMOUNT_KEY, amt);
        } catch {}
      }
    } else {
      const stored = getStoredPaidAmount();
      if (stored != null) setPaidAmount(stored);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const paymentId = searchParams.get("payment_id") || getStoredPaymentId();
    if (!paymentId) {
      router.replace("/start");
      return;
    }
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
    fetch(`${questionsApi}?ageGroup=${encodeURIComponent(ageGroup)}`)
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
      .catch((e) => setError(e?.message ?? "Xatolik"))
      .finally(() => setLoading(false));
  }, [ageGroup, questionsApi]);

  const handleComplete = async (answers: Record<string, AnswerValue>) => {
    if (!ageGroup) return;
    setError(null);
    const initial = getStoredInitialData();
    const paymentId = getStoredPaymentId();
    const payload: Record<string, unknown> = {
      testType,
      ageGroup,
      answers,
    };
    if (paymentId) payload.paymentId = paymentId;
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
        router.push(`/result/${id}`);
      } else {
        setError("Assessment ID topilmadi");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  };

  if (noInitialData) {
    return (
      <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
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
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
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
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
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

  const paidAmountFormatted =
    paidAmount != null && paidAmount > 0
      ? String(paidAmount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      : null;

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300 pb-20">
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      <main className="mx-auto max-w-lg px-4 sm:px-6 pt-8 sm:pt-10">
        {paidAmountFormatted && (
          <div className="mb-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
            To&apos;langan summa: {paidAmountFormatted} so&apos;m
          </div>
        )}
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
          <div className="fixed top-4 right-4 z-50">
            <DarkModeToggle />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Yuklanmoqda...</p>
        </div>
      }
    >
      <TestContent />
    </Suspense>
  );
}
