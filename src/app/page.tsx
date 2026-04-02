"use client";

import Link from "next/link";
import React from "react";
import { HomeTestServicesSection } from "@/components/home/HomeTestServicesSection";
import { useTranslations } from "@/lib/translations";
import { useLocale } from "@/contexts/LocaleContext";

export default function Home() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  const [offerAccepted, setOfferAccepted] = React.useState(false);

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-20 pt-10 sm:pt-12">
        {/* Til tanlash — asosiy kirish; tanlangan til barcha sahifalarda qo‘llanadi */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-sm p-1 gap-0.5">
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
            <div className="mt-8 space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-400">{t("home.offer.blockHint")}</p>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/offer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-indigo-50/80 px-6 py-3.5 text-sm font-bold text-indigo-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/30"
                >
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {t("home.offer.readLink")}
                </Link>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={offerAccepted}
                  onChange={(e) => setOfferAccepted(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
                />
                <span className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                  {t("home.offer.acceptCheckbox")}
                </span>
              </label>

              {offerAccepted ? (
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                >
                  {t("home.hero.cta")}
                  <span className="text-white/90">→</span>
                </Link>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-slate-300 px-8 py-4 text-base font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-500"
                  title={t("home.offer.needAccept")}
                  aria-disabled
                >
                  {t("home.hero.cta")}
                  <span className="opacity-60">→</span>
                </span>
              )}
            </div>
          </div>
        </section>

        <HomeTestServicesSection />

        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/50 p-5 sm:p-6">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-slate-100">{t("home.disclaimer.title")}</strong> {t("home.disclaimer.text")}
          </p>
        </section>
      </main>
    </div>
  );
}
