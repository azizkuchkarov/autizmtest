"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TestWizard from "@/components/TestWizard";
import { ageToBand } from "@/lib/questions";
import type { Lang } from "@/lib/i18n";
import type { AnswersMap } from "@/lib/scoring";

export default function TestClient() {
  const router = useRouter();

  const [lang, setLang] = React.useState<Lang>("uz");
  const [age, setAge] = React.useState<number | null>(null);
  const [ready, setReady] = React.useState(false);
  const [questions, setQuestions] = React.useState<any[]>([]);
  const [blocks, setBlocks] = React.useState<any[]>([]);

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

  React.useEffect(() => {
    if (!ready || age === null) return;
    const band = ageToBand(age);
    Promise.all([
      fetch(`/api/questions?ageBand=${band}`).then((r) => r.json()),
      fetch("/api/blocks").then((r) => r.json()),
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "test_open", metadata: { ageBand: band, lang } }),
      }).catch(() => null),
    ])
      .then(([q, b]) => {
        setQuestions(q.items ?? []);
        const items = b.items ?? [];
        const mapped = items.map((blk: any) => ({
          id: blk.id,
          title: lang === "ru" ? blk.titleRu ?? blk.titleUz : blk.titleUz ?? blk.titleRu,
          subtitle: lang === "ru" ? blk.subtitleRu ?? blk.subtitleUz : blk.subtitleUz ?? blk.subtitleRu,
        }));
        setBlocks(mapped);
      })
      .catch(() => {});
  }, [ready, age, lang]);

  function onComplete(answers: AnswersMap) {
    try {
      sessionStorage.setItem("asds_answers", JSON.stringify(answers));
    } catch {}

    router.push("/result");
  }

  if (!ready || age === null || questions.length === 0 || blocks.length === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 px-4 pt-10 pb-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white/80 dark:bg-slate-900/70 p-6 shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <div className="text-sm text-slate-700 dark:text-slate-300">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  return <TestWizard childAgeYears={age} lang={lang} onComplete={onComplete} questions={questions} blocks={blocks} />;
}
