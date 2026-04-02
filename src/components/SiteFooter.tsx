"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/translations";

export default function SiteFooter() {
  const pathname = usePathname();
  const t = useTranslations();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-slate-100/80 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900/95">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">Autizm skrining</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("footer.tagline")}</p>
          </div>
          <nav
            className="flex flex-col gap-3 text-sm font-semibold lg:col-span-4 lg:pt-1"
            aria-label="Footer"
          >
            <Link
              href="/"
              className="text-slate-700 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              {t("footer.navHome")}
            </Link>
            <Link
              href="/offer"
              className="text-slate-700 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
            >
              {t("footer.navOffer")}
            </Link>
            <p className="pt-1 text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-500">
              {t("footer.helpHint")}
            </p>
          </nav>
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-slate-700/80 dark:bg-slate-800/40 lg:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footer.disclaimerShortTitle")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{t("footer.disclaimerShort")}</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200/80 pt-8 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-500">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
