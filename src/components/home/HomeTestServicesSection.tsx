"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/translations";

function IconCheckSoft() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/40">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function HomeTestServicesSection() {
  const t = useTranslations();

  const stats = [
    { val: t("home.choice.stat1Val"), lab: t("home.choice.stat1Lab") },
    { val: t("home.choice.stat2Val"), lab: t("home.choice.stat2Lab") },
    { val: t("home.choice.stat3Val"), lab: t("home.choice.stat3Lab") },
  ];

  const steps = [1, 2, 3, 4].map((n) => ({
    title: t(`home.choice.step${n}Title`),
    desc: t(`home.choice.step${n}Desc`),
  }));

  const benefits = Array.from({ length: 8 }, (_, i) => t(`home.screening.benefit${i + 1}`));

  const techFeatures = [t("home.screening.feature1"), t("home.screening.feature2"), t("home.screening.feature3")];

  return (
    <section className="relative mb-12 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-indigo-50/20 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-xl shadow-slate-200/25 dark:shadow-black/30">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-900/20" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-100/20 blur-3xl dark:bg-emerald-900/10" />
      </div>

      <div className="relative px-5 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14">
        <header className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            {t("home.choice.label")}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl md:text-[2rem] md:leading-tight">
            {t("home.choice.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            {t("home.choice.subtitle")}
          </p>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.lab}
              className="rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-4 text-center shadow-sm dark:border-slate-700/80 dark:bg-slate-800/60 sm:text-left"
            >
              <p className="text-2xl font-bold tabular-nums tracking-tight text-indigo-600 dark:text-indigo-400">{s.val}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{s.lab}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/25 sm:p-6">
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{t("home.choice.whyTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-indigo-950/85 dark:text-indigo-100/80">{t("home.choice.whyBody")}</p>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("home.choice.stepsTitle")}</h3>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-slate-200/80 bg-white/95 p-4 pt-8 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80"
              >
                <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white dark:bg-indigo-500">
                  {i + 1}
                </span>
                <p className="mt-2 font-bold text-slate-900 dark:text-slate-100">{step.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5 lg:gap-10">
          {/* Skrining — asosiy kartochka */}
          <article className="lg:col-span-3">
            <div className="h-full rounded-[1.5rem] border border-slate-200/90 bg-white p-6 shadow-lg ring-1 ring-slate-100 dark:border-slate-700/80 dark:bg-slate-900/95 dark:ring-slate-800 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {t("home.screening.badge")}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {t("home.screening.title")}
              </h3>
              <p className="mt-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">{t("home.screening.lead")}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("home.screening.description")}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("home.screening.extended")}</p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("home.choice.techTitle")}</p>
                <ul className="mt-3 space-y-2">
                  {techFeatures.map((line) => (
                    <li key={line} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <h4 className="mt-8 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("home.choice.includedTitle")}
              </h4>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700/60 dark:bg-slate-800/40">
                    <IconCheckSoft />
                    <span className="text-sm leading-snug text-slate-700 dark:text-slate-300">{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("home.choice.afterTitle")}</p>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t("home.choice.afterBody")}</p>
                </div>
                <Link
                  href="/result/demo-40-60"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-indigo-200 bg-indigo-50/80 px-4 py-2.5 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/30"
                >
                  {t("home.choice.demoCta")} →
                </Link>
              </div>
            </div>
          </article>

          {/* Kelajakdagi monitoring */}
          <aside className="lg:col-span-2">
            <div className="sticky top-6 rounded-[1.5rem] border border-dashed border-slate-300/90 bg-slate-50/90 p-6 dark:border-slate-600 dark:bg-slate-800/40 sm:p-7">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {t("home.progress.badge")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">{t("home.progress.title")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("home.progress.description")}</p>
              <p className="mt-4 rounded-xl bg-white/80 p-3 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:text-slate-400 dark:ring-slate-700">
                {t("home.progress.comingSoon")}
              </p>
              <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-500">{t("home.progress.hint")}</p>
              <div className="mt-6 flex justify-center opacity-40 dark:opacity-30" aria-hidden>
                <svg className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
