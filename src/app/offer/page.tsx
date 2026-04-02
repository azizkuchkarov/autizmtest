"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { getPublicOffer } from "@/content/public-offer";
import { useTranslations } from "@/lib/translations";

export default function PublicOfferPage() {
  const { locale } = useLocale();
  const t = useTranslations();
  const doc = getPublicOffer(locale);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-900/15" />
      </div>

      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t("offer.backHome")}
          </Link>
          <span className="hidden text-xs font-bold uppercase tracking-wider text-slate-400 sm:inline">
            {t("offer.docKind")}
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-10 pb-20 sm:px-6 sm:py-14">
        <article className="rounded-[1.75rem] border border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-slate-200/30 ring-1 ring-slate-100 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/25 dark:ring-slate-800 sm:p-10 md:p-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">{t("offer.docKind")}</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-base font-medium text-slate-600 dark:text-slate-400">{doc.subtitle}</p>
          <p className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
            {t("offer.updated")}: {doc.updated}
          </p>

          <div className="prose-offer mt-10 space-y-10">
            <p className="text-sm leading-[1.75] text-slate-700 dark:text-slate-300 border-l-4 border-indigo-200 pl-5 dark:border-indigo-800">
              {doc.preamble}
            </p>

            {doc.sections.map((section) => (
              <section key={section.title} className="scroll-mt-24">
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-[1.8] text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {section.body}
                </p>
              </section>
            ))}

            <footer className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 text-sm leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100/90">
              {doc.footerNote}
            </footer>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-8 dark:border-slate-700 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("offer.backHome")}
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700"
            >
              {t("home.hero.cta")}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
