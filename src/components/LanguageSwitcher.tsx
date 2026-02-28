"use client";

import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/locale";

const LABELS: Record<Locale, string> = {
  uz: "O'ZB",
  ru: "РУС",
};

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 p-0.5">
      <button
        type="button"
        onClick={() => setLocale("uz")}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          locale === "uz"
            ? "bg-indigo-600 text-white shadow"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
        aria-pressed={locale === "uz"}
      >
        {LABELS.uz}
      </button>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          locale === "ru"
            ? "bg-indigo-600 text-white shadow"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
        aria-pressed={locale === "ru"}
      >
        {LABELS.ru}
      </button>
    </div>
  );
}
