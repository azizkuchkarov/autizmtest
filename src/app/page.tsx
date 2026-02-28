"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/translations";
import { useLocale } from "@/contexts/LocaleContext";

export default function Home() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 pt-10 sm:pt-12">
        {/* Til tanlash — asosiy kirish; tanlangan til barcha sahifalarda qo‘llanadi */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-sm p-1 gap-0.5">
            <span className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{t("home.languageLabel")}</span>
            <button
              type="button"
              onClick={() => setLocale("uz")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                locale === "uz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t("home.lang.uz")}
            </button>
            <button
              type="button"
              onClick={() => setLocale("ru")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                locale === "ru"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t("home.lang.ru")}
            </button>
          </div>
        </div>

        {/* Hero — ota-onalarni jalb qiluvchi matn */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-8 md:p-12 mb-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              {t("home.hero.subtitle")}
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              {t("home.hero.title1")}
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">{t("home.hero.title2")}</span>
              {t("home.hero.title3")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("home.hero.description")}
            </p>
            <div className="mt-8">
              <Link
                href="/start"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
              >
                {t("home.hero.cta")}
                <span className="text-white/90">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Testlar haqida alohida ma'lumot */}
        <section className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("home.choice.label")}</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">
            {t("home.choice.title")}
          </h2>
          <div className="grid gap-6 md:grid-cols-1">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 md:p-8 transition hover:shadow-2xl hover:shadow-slate-200/30 dark:hover:shadow-black/30">
              <div className="inline-flex rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-200">
                {t("home.screening.badge")}
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t("home.screening.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("home.screening.description")}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                <li>• {t("home.screening.feature1")}</li>
                <li>• {t("home.screening.feature2")}</li>
                <li>• {t("home.screening.feature3")}</li>
              </ul>
            </div>

            {/* Autizm progressini aniqlash — tez kunda */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-6 md:p-8">
              <div className="inline-flex rounded-full bg-slate-200/80 dark:bg-slate-700/60 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                {t("home.progress.badge")}
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t("home.progress.title")}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("home.progress.description")}
              </p>
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-500 italic">
                {t("home.progress.comingSoon")}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 p-5 sm:p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">{t("home.disclaimer.title")}</strong> {t("home.disclaimer.text")}
          </p>
        </section>
      </main>
    </div>
  );
}
