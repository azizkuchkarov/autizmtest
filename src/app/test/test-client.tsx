"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TestWizard from "@/components/TestWizard";
import type { Lang } from "@/lib/i18n";
import type { AnswersMap } from "@/lib/scoring";

export default function TestClient() {
  const router = useRouter();

  const [lang, setLang] = React.useState<Lang>("uz");
  const [age, setAge] = React.useState<number | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const rawAge = sessionStorage.getItem("asds_age");
    const rawLang = sessionStorage.getItem("asds_lang");
    if (!rawAge) {
      router.replace("/start");
      return;
    }
    const ageVal = Number(rawAge);
    if (!Number.isFinite(ageVal)) {
      router.replace("/start");
      return;
    }
    setAge(ageVal);
    if (rawLang === "ru" || rawLang === "uz") setLang(rawLang);
    setReady(true);
  }, [router]);

  function onComplete(answers: AnswersMap) {
    try {
      sessionStorage.setItem("asds_answers", JSON.stringify(answers));
    } catch {}

    router.push("/result");
  }

  if (!ready || age === null) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 px-4 pt-10 pb-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white/80 dark:bg-slate-900/70 p-6 shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <div className="text-sm text-slate-700 dark:text-slate-300">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  return <TestWizard childAgeYears={age} lang={lang} onComplete={onComplete} />;
}
