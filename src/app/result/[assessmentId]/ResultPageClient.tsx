"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScoreResponse, AiSummaryResponse, AiSummaryPayload, ScreeningV2Result } from "@/types/api";
import { generateScreeningPdf } from "@/lib/pdfScreeningReport";
import type { MonitoringResult } from "@/lib/monitoringScoring";
import type { OverallResult } from "@/lib/scoring";
import { DOMAIN_LABELS_UZ, RISK_LABELS_UZ } from "@/lib/scoring";
import { BLOCK_LABELS_UZ, STATUS_LABELS_UZ } from "@/lib/monitoringScoring";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslations, getTranslation } from "@/lib/translations";
import { DonutRisk, RadarProfile, BarList } from "@/components/Charts";
import { ABA_REGIONS, TOSHKENT_SHAHAR_DISTRICTS, isToshkentShahar } from "@/data/regions";

function isMonitoringResult(scoring: ScoreResponse["scoring"]): scoring is MonitoringResult {
  return "overallPercent" in scoring && "blocks" in scoring && "recommendations" in scoring;
}

function isScreeningV2Result(scoring: ScoreResponse["scoring"]): scoring is ScreeningV2Result {
  if (!scoring || typeof scoring !== "object") return false;
  const s = scoring as unknown as Record<string, unknown>;
  // Screening v2: totalScore (son yoki string) va riskLabel bo‘lsa; blocks/topOverall view da default
  const hasScore =
    typeof s.totalScore === "number" ||
    (typeof s.totalScore === "string" && !Number.isNaN(Number(s.totalScore)));
  return hasScore && (typeof s.riskLabel === "string" || s.riskLabel === undefined);
}

function isOverallResult(scoring: ScoreResponse["scoring"]): scoring is OverallResult {
  return "overall" in scoring && "domains" in scoring && "insights" in scoring;
}

export type AbaCenterAmenity = { title: string; imageUrl: string };

export type AbaCenterItem = {
  id: string;
  region: string;
  district?: string | null;
  name: string;
  phone?: string | null;
  address?: string | null;
  url?: string | null;
  instagram?: string | null;
  note?: string | null;
  imageUrl?: string | null;
  directorName?: string | null;
  directorImageUrl?: string | null;
  directorBio?: string | null;
  amenities?: AbaCenterAmenity[] | null;
  portfolioDescription?: string | null;
};

function AiSummaryLoadingCard({ progress, t }: { progress: number; t: (key: string) => string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-indigo-50/80 to-white dark:from-slate-800/60 dark:to-slate-900/80 p-6 sm:p-8 shadow-inner">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" style={{ animationDuration: "1.5s" }} />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 ring-4 ring-indigo-200/50 dark:ring-indigo-800/50">
            <svg className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
        <p className="mt-5 text-base font-semibold text-slate-800 dark:text-slate-200">{t("result.aiGenerating")}</p>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{t("result.aiLoadingHint")}</p>
        <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AbaCenterPortfolioModal({
  center,
  onClose,
  onRegister,
  isRegistering,
}: {
  center: AbaCenterItem;
  onClose: () => void;
  onRegister?: () => void;
  isRegistering?: boolean;
}) {
  const amenities = Array.isArray(center.amenities) ? center.amenities : [];
  const hasDirector = center.directorName || center.directorImageUrl || center.directorBio;
  const hasAmenities = amenities.length > 0;
  const hasPortfolioText = center.portfolioDescription?.trim();
  const hasAnyPortfolio = hasDirector || hasAmenities || hasPortfolioText;

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl shadow-black/25 ring-1 ring-slate-200/80 dark:ring-slate-700 flex flex-col"
        >
          {/* Hero */}
          <div className="relative shrink-0 overflow-hidden">
            {center.imageUrl ? (
              <div className="aspect-[2.4/1] w-full bg-slate-200 dark:bg-slate-800">
                <img
                  src={center.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(99,102,241,0.15),transparent)]" />
              </div>
            ) : (
              <div className="aspect-[2.4/1] w-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 dark:from-indigo-600 dark:via-indigo-700 dark:to-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.15),transparent)]" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-7">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {center.name}
              </h2>
              {(center.region || center.district) && (
                <p className="mt-1.5 text-sm text-white/95 font-medium">
                  {[center.region, center.district].filter(Boolean).join(" • ")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-md ring-1 ring-white/20 transition-all duration-200 hover:scale-105"
              aria-label="Yopish"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-10 scroll-smooth">
            {!hasAnyPortfolio && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                  Markaz haqida batafsil ma’lumot hozircha kiritilmagan. Quyida aloqa ma’lumotlari mavjud.
                </p>
              </motion.div>
            )}

            {hasDirector && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 max-w-12 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    Markaz rahbari
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 items-start rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 p-6 shadow-sm">
                  {center.directorImageUrl && (
                    <div className="shrink-0 relative">
                      <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-indigo-400/40 to-violet-500/30 dark:from-indigo-500/30 dark:to-violet-600/20 blur-sm" />
                      <img
                        src={center.directorImageUrl}
                        alt={center.directorName || "Rahbar"}
                        className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700 shadow-xl"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    {center.directorName && (
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        {center.directorName}
                      </h3>
                    )}
                    {center.directorBio && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-[1.7] whitespace-pre-line">
                        {center.directorBio}
                      </p>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {hasAmenities && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 max-w-12 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    Qulayliklar
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {amenities.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.04 }}
                      whileHover={{ y: -4 }}
                      className="group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 dark:hover:ring-indigo-400/20 transition-all duration-300"
                    >
                      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {a.imageUrl ? (
                          <img
                            src={a.imageUrl}
                            alt={a.title || ""}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {a.title && (
                        <p className="p-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200 text-center bg-white dark:bg-slate-800/80 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                          {a.title}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {hasPortfolioText && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 max-w-12 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    Markaz haqida
                  </p>
                </div>
                <div className="rounded-2xl border-l-4 border-indigo-500/60 dark:border-indigo-400/50 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-6">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-[1.75] whitespace-pre-line">
                    {center.portfolioDescription}
                  </p>
                </div>
              </motion.section>
            )}

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-slate-50/90 to-white dark:from-slate-800/60 dark:to-slate-900/80 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px flex-1 max-w-12 bg-gradient-to-r from-indigo-500 to-transparent rounded-full" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Aloqa
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {center.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(center.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-xl p-3 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      📍
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 leading-snug">
                      {center.address}
                    </span>
                  </a>
                )}
                {center.phone && (
                  <a
                    href={`tel:${center.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      📞
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {center.phone}
                    </span>
                  </a>
                )}
                {center.url && (
                  <a
                    href={center.url.startsWith("http") ? center.url : `https://${center.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      📍
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      Lokatsiya
                    </span>
                  </a>
                )}
                {center.instagram && (
                  <a
                    href={center.instagram.startsWith("http") ? center.instagram : `https://instagram.com/${center.instagram.replace(/^@?\/?/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-3 bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      📷
                    </span>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      Instagram
                    </span>
                  </a>
                )}
              </div>
              {onRegister && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={onRegister}
                    disabled={isRegistering}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    {isRegistering ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      "Ro'yxatga yozilish"
                    )}
                  </button>
                </div>
              )}
              {center.note && (
                <p className="mt-4 pt-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
                  {center.note}
                </p>
              )}
            </motion.section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AbaCentersSection({
  assessmentId,
  region,
  setRegion,
  district,
  setDistrict,
  centers,
  setCenters,
}: {
  assessmentId: string;
  region: string;
  setRegion: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  centers: AbaCenterItem[];
  setCenters: (v: AbaCenterItem[]) => void;
}) {
  const t = useTranslations();
  const [loading, setLoading] = React.useState(false);
  const [portfolioCenter, setPortfolioCenter] = React.useState<AbaCenterItem | null>(null);
  const [registeringId, setRegisteringId] = React.useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleRegister(centerId: string) {
    setRegisterMessage(null);
    setRegisteringId(centerId);
    try {
      const res = await fetch("/api/aba-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, centerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRegisterMessage({ type: "ok", text: "Yuborildi. Markaz siz bilan bog‘lanadi." });
      } else {
        setRegisterMessage({ type: "err", text: data?.error || "Xatolik yuz berdi." });
      }
    } catch {
      setRegisterMessage({ type: "err", text: "Tarmoq xatoligi." });
    } finally {
      setRegisteringId(null);
    }
  }

  React.useEffect(() => {
    if (!region) {
      setCenters([]);
      return;
    }
    if (isToshkentShahar(region) && !district) {
      setCenters([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ region });
    if (district) params.set("district", district);
    fetch(`/api/aba-centers?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setCenters(Array.isArray(data?.items) ? data.items : []);
      })
      .finally(() => setLoading(false));
  }, [region, district]);

  return (
    <section className="mt-10 rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/25 dark:shadow-black/20 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              Yordam
            </p>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("aba.title")}
            </h3>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
          {t("aba.selectRegionHint")}
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              if (!isToshkentShahar(e.target.value)) setDistrict("");
            }}
            className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
          >
            <option value="">{t("aba.selectRegion")}</option>
            {ABA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {isToshkentShahar(region) && (
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
            >
              <option value="">{t("aba.selectDistrict")}</option>
              {TOSHKENT_SHAHAR_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading && (
          <div className="mt-6 flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="text-sm font-medium">Yuklanmoqda...</span>
          </div>
        )}
        {registerMessage && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              registerMessage.type === "ok"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200"
            }`}
          >
            {registerMessage.text}
          </div>
        )}
        {!loading && region && (isToshkentShahar(region) ? district : true) && centers.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/30 p-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isToshkentShahar(region) && !district
                ? "Tumanni tanlang."
                : "Ushbu viloyatda (tumanda) hozircha markazlar ro‘yxati kiritilmagan."}
            </p>
          </div>
        )}
        {!loading && centers.length > 0 && (
          <div className="mt-6 space-y-5">
            {centers.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-800/40 dark:to-slate-800/20 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 shadow-sm hover:shadow-lg hover:border-indigo-200/60 dark:hover:border-indigo-800/40 transition-all duration-300"
              >
                {c.imageUrl && (
                  <div className="shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200/80 dark:ring-slate-700/80">
                    <img
                      src={c.imageUrl}
                      alt={c.name || "Markaz"}
                      className="w-full sm:w-36 h-40 sm:h-28 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col">
                  {c.name && (
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{c.name}</h4>
                  )}
                  {c.address && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="shrink-0">📍</span>
                      <span className="leading-snug">{c.address}</span>
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/\s/g, "")}`}
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        📞 {c.phone}
                      </a>
                    )}
                    {c.url && (
                      <a
                        href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        📍 Lokatsiya
                      </a>
                    )}
                    {c.instagram && (
                      <a
                        href={c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@?\/?/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        📷 Instagram
                      </a>
                    )}
                  </div>
                  {c.note && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{c.note}</p>
                  )}
                  <div className="mt-4 sm:mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleRegister(c.id)}
                      disabled={!!registeringId}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      {registeringId === c.id ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Yuborilmoqda...
                        </>
                      ) : (
                        "Ro'yxatga yozilish"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioCenter(c)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      Batafsil
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {portfolioCenter && (
        <AbaCenterPortfolioModal
          center={portfolioCenter}
          onClose={() => setPortfolioCenter(null)}
          onRegister={() => {
            handleRegister(portfolioCenter.id);
          }}
          isRegistering={registeringId === portfolioCenter.id}
        />
      )}
    </section>
  );
}

type Props = { assessmentId: string };

export default function ResultPageClient({ assessmentId }: Props) {
  const { locale } = useLocale();
  const t = useTranslations();
  const [data, setData] = React.useState<ScoreResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiProgress, setAiProgress] = React.useState(0);
  const aiLoadStartRef = React.useRef<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [abaRegion, setAbaRegion] = React.useState("");
  const [abaDistrict, setAbaDistrict] = React.useState("");
  const [abaCenters, setAbaCenters] = React.useState<AbaCenterItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/assessments/${assessmentId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("result.error"));
        const json: ScoreResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("result.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  // Progress bar 0→100% ~10 soniya davomida (faqat aiLoading true bo‘lganda)
  React.useEffect(() => {
    if (!aiLoading) {
      setAiProgress(0);
      return;
    }
    aiLoadStartRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - aiLoadStartRef.current;
      const p = Math.min(100, (elapsed / 10_000) * 100);
      setAiProgress(p);
    }, 200);
    return () => clearInterval(interval);
  }, [aiLoading]);

  // AI xulosa faqat foydalanuvchi "AI xulosa olish" tugmasini bosganda so'raladi (avtomatik so'rov yo'q).
  async function requestAiSummary() {
    if (!data) return;
    const storedLocale = data.aiSummaryLocale ?? null;
    if (data.aiSummary.status === "ready" && storedLocale === locale) return;

    setAiLoading(true);
    setAiProgress(0);
    setError(null);
    const startTime = Date.now();

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      const json: AiSummaryResponse & { payload?: AiSummaryPayload } = await res.json();
      if (!res.ok || (!json.ok && json.status !== "pending")) {
        const err = json.error ?? t("result.aiError");
        const friendly = err === "AI javobi JSON emas." ? t("result.aiErrorJson") : err;
        throw new Error(friendly);
      }

      if (json.status === "ready" && json.payload) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                aiSummary: { ...prev.aiSummary, status: "ready", payload: json.payload ?? null, error: null },
                aiSummaryLocale: locale,
              }
            : prev
        );
      } else {
        setData((prev) =>
          prev ? { ...prev, aiSummary: { ...prev.aiSummary, status: json.status } } : prev
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("result.error"));
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 10_000) {
        await new Promise((r) => setTimeout(r, 10_000 - elapsed));
      }
      setAiLoading(false);
      setAiProgress(0);
    }
  }

  async function handleDownloadPdf() {
    if (!data || !data.ageGroup || !isScreeningV2Result(data.scoring)) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/screening/questions?ageGroup=${encodeURIComponent(data.ageGroup)}&locale=${locale}`);
      if (!res.ok) throw new Error("Savollar yuklanmadi");
      const { questions: qList, domains: domainList } = await res.json();
      const questions = Array.isArray(qList)
        ? qList.map((q: { id: string; text: string; domain: string }) => ({
            id: q.id,
            text: q.text,
            domain: q.domain,
          }))
        : [];
      const domains = Array.isArray(domainList) ? domainList : [];

      const raw = data.scoring as unknown as Record<string, unknown>;
      const totalScore = Number(raw.totalScore) || 0;
      const riskLabelFromScore: ScreeningV2Result["riskLabel"] =
        totalScore <= 30 ? "Past xavf" : totalScore <= 60 ? "O'rtacha xavf" : "Yuqori xavf";
      const normalizedResult: ScreeningV2Result = {
        ageGroupId: (raw.ageGroupId as string) ?? "",
        totalScore,
        riskLabel:
          typeof raw.riskLabel === "string" && raw.riskLabel
            ? (raw.riskLabel as ScreeningV2Result["riskLabel"])
            : riskLabelFromScore,
        redFlagCount: typeof raw.redFlagCount === "number" ? raw.redFlagCount : 0,
        redFlags: Array.isArray(raw.redFlags) ? (raw.redFlags as ScreeningV2Result["redFlags"]) : [],
        blocks: Array.isArray(raw.blocks) ? (raw.blocks as ScreeningV2Result["blocks"]) : [],
        topOverall: Array.isArray(raw.topOverall)
          ? (raw.topOverall as ScreeningV2Result["topOverall"])
          : [],
      };

      const AGE_GROUP_LABELS_UZ: Record<string, string> = {
        AGE_1_5_2: "1,5–2 yosh",
        AGE_3_4: "3–4 yosh",
        AGE_5_6: "5–6 yosh",
        AGE_7_9: "7–9 yosh",
      };
      const AGE_GROUP_LABELS_RU: Record<string, string> = {
        AGE_1_5_2: "1,5–2 года",
        AGE_3_4: "3–4 года",
        AGE_5_6: "5–6 лет",
        AGE_7_9: "7–9 лет",
      };
      const ageLabels = locale === "ru" ? AGE_GROUP_LABELS_RU : AGE_GROUP_LABELS_UZ;
      const ageLabel =
        data.ageGroup && ageLabels[data.ageGroup]
          ? ageLabels[data.ageGroup]
          : data.ageGroup ?? null;

      const getBlockTitle = (blockId: string) => {
        const d = domains.find((dm: { id: string; title?: string }) => dm.id === blockId);
        return d?.title ?? getTranslation(locale, `result.block${blockId}`);
      };
      const blockInterpretations = (normalizedResult.blocks ?? []).map((b) => {
        const score = Math.round(b.score);
        const rangeKey =
          score < 20 ? "veryLow" : score < 40 ? "low" : score < 60 ? "mid" : score < 80 ? "high" : "veryHigh";
        const blockKey = ["A", "B", "C"].includes(String(b.blockId)) ? `block${b.blockId}` : "blockA";
        return {
          blockTitle: getBlockTitle(b.blockId),
          score,
          rangeLabel: getTranslation(locale, `result.screening.range.${rangeKey}`),
          interpretation: getTranslation(locale, `result.screening.${blockKey}.${rangeKey}`),
        };
      });

      let fontBase64: string | undefined;
      if (locale === "ru") {
        try {
          const fontRes = await fetch("/fonts/Roboto-Regular.ttf");
          if (fontRes.ok) {
            const fontBuf = await fontRes.arrayBuffer();
            const bytes = new Uint8Array(fontBuf);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            fontBase64 = btoa(binary);
          }
        } catch {
          // Shrift yuklanmasa ruscha PDF da matn buzilgan chiqadi
        }
      }

      generateScreeningPdf({
        result: normalizedResult,
        assessmentId,
        completedAt: data.completedAt ?? undefined,
        ageLabel,
        questions,
        domains,
        answers: data.answers ?? null,
        aiPayload: data.aiSummary.payload ?? null,
        selectedAbaRegion: abaRegion || undefined,
        selectedAbaDistrict: abaDistrict || undefined,
        abaCenters: abaCenters.length > 0 ? abaCenters : undefined,
        locale,
        fontBase64,
        blockInterpretations: blockInterpretations.length > 0 ? blockInterpretations : undefined,
      });
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pdf_download", metadata: { assessmentId } }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="mx-auto max-w-md text-center py-12">{t("result.loading")}</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="mx-auto max-w-md text-center py-12">{t("result.noData")}</div>
      </div>
    );
  }

  // Progress monitoring natija
  if (data.testType === "progress" && isMonitoringResult(data.scoring)) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 pb-16">
        <div className="mx-auto max-w-[900px] px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Progress monitoring — Natija
          </h1>

          <MonitoringResultView result={data.scoring} />

          <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
              AI xulosa
            </h3>
            {data.aiSummary.status === "ready" && data.aiSummary.payload ? (
              <AiReportView payload={data.aiSummary.payload} />
            ) : data.aiSummary.status === "failed" ? (
              <div className="text-sm text-rose-600 dark:text-rose-400">
                {data.aiSummary.error === "AI javobi JSON emas." ? t("result.aiErrorJson") : `${t("result.aiError")}: ${data.aiSummary.error ?? t("result.aiErrorUnknown")}`}
              </div>
            ) : aiLoading ? (
              <AiSummaryLoadingCard progress={aiProgress} t={t} />
            ) : (
              <button
                type="button"
                onClick={requestAiSummary}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("result.getAiSummary")}
              </button>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Yangi screening natija (v2)
  if (isScreeningV2Result(data.scoring)) {
    const raw = data.scoring as unknown as Record<string, unknown>;
    const totalScore = Number(raw.totalScore) || 0;
    const riskLabelFromScore: ScreeningV2Result["riskLabel"] =
      totalScore <= 30 ? "Past xavf" : totalScore <= 60 ? "O'rtacha xavf" : "Yuqori xavf";
    const normalizedResult: ScreeningV2Result = {
      ageGroupId: (raw.ageGroupId as string) ?? "",
      totalScore,
      riskLabel: (typeof raw.riskLabel === "string" && raw.riskLabel) ? (raw.riskLabel as ScreeningV2Result["riskLabel"]) : riskLabelFromScore,
      redFlagCount: typeof raw.redFlagCount === "number" ? raw.redFlagCount : 0,
      redFlags: Array.isArray(raw.redFlags) ? raw.redFlags : [],
      blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
      topOverall: Array.isArray(raw.topOverall) ? raw.topOverall : [],
    };

    return (
      <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300 pb-20">
        <div className="mx-auto max-w-[920px] px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("result.screeningTitle")}</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t("result.resultTitle")}</h1>
            {assessmentId.startsWith("demo-") && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-700/70">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{t("result.demoBadge")}</span>
              </div>
            )}
          </div>

          <ScreeningV2ResultView
            result={normalizedResult}
            assessmentId={assessmentId}
            completedAt={data.completedAt ?? undefined}
            ageGroup={data.ageGroup ?? undefined}
            locale={locale}
          />

          <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
              {t("result.aiSummary")}
            </h3>
            {data.aiSummary.status === "ready" && data.aiSummary.payload ? (
              <AiReportView payload={data.aiSummary.payload} />
            ) : data.aiSummary.status === "failed" ? (
              <div className="text-sm text-rose-600 dark:text-rose-400">
                {data.aiSummary.error === "AI javobi JSON emas." ? t("result.aiErrorJson") : `${t("result.aiError")}: ${data.aiSummary.error ?? t("result.aiErrorUnknown")}`}
              </div>
            ) : aiLoading ? (
              <AiSummaryLoadingCard progress={aiProgress} t={t} />
            ) : (
              <button
                type="button"
                onClick={requestAiSummary}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t("result.getAiSummary")}
              </button>
            )}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pdfLoading ? t("result.pdfPreparing") : t("result.pdfDownload")}
              </button>
            </div>
          </section>

          {/* ABA markazlar — AI xulosadan keyin; PDF da ham tanlangan viloyat/markazlar chiqadi */}
          <AbaCentersSection
            assessmentId={assessmentId}
            region={abaRegion}
            setRegion={setAbaRegion}
            district={abaDistrict}
            setDistrict={setAbaDistrict}
            centers={abaCenters}
            setCenters={setAbaCenters}
          />
        </div>
      </div>
    );
  }

  // Eski screening natija (backward compatibility)
  if (isOverallResult(data.scoring)) {
    const level = data.scoring.overall.level;
    const riskIndex = data.scoring.overall.riskIndex;
    const topDomains = data.scoring.insights.topPriorityDomains;
    const domains = data.scoring.domains;

    const chartTier = level === "MONITOR" ? "WATCH" : level;
    const riskPercent = Math.round(riskIndex * 100);

  const domainOrder = Object.keys(domains);
  const radarData = domainOrder.map((d) => ({
    label: DOMAIN_LABELS_UZ[d] ?? d,
    value: domains[d]?.raw ?? 0,
    fullMark: domains[d]?.max ?? 18,
  }));
  const barListData = domainOrder.map((d) => {
    const dom = domains[d];
    const risk = dom?.risk ?? 0;
    const color = risk >= 0.6 ? "rose" : risk >= 0.4 ? "amber" : "emerald";
    return {
      label: DOMAIN_LABELS_UZ[d] ?? d,
      value: dom?.raw ?? 0,
      max: dom?.max ?? 18,
      color: color as "indigo" | "emerald" | "amber" | "rose" | "slate",
    };
  });

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 pb-16">
      <div className="mx-auto max-w-[900px] px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">Natija</h1>

        <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {RISK_LABELS_UZ[level]}
          </h2>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Risk indeksi: {riskIndex.toFixed(2)}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {data.scoring.overall.levelReason}
          </div>
          {data.scoring.redFlags.count > 0 && (
            <div className="mt-3 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Red-flag:</span>{" "}
              {data.scoring.redFlags.count} ta
            </div>
          )}
        </section>

        {/* Premium grafiklar */}
        <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-around">
            <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60">
              <DonutRisk
                value={riskPercent}
                tier={chartTier as "LOW" | "WATCH" | "MODERATE" | "HIGH"}
                label={t("result.riskIndicator")} size="md"
              />
            </div>
            <div className="w-full flex-1 max-w-sm">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                Rivojlanish profili (ball)
              </div>
              <RadarProfile data={radarData} title="" />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60">
            <BarList data={barListData} title="Bloklar bo‘yicha (ball)" showValue />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
            Yo‘nalishlar bo‘yicha profil
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {Object.entries(data.scoring.domains).map(([domain, d]) => (
              <li key={domain}>
                <span className="font-semibold">{DOMAIN_LABELS_UZ[domain] ?? domain}:</span> {d.band}{" "}
                (skill {d.normalized.toFixed(2)})
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
            Ustuvor e’tibor yo‘nalishlari
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {topDomains.map((d) => (
              <li key={d}>{DOMAIN_LABELS_UZ[d] ?? d}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
            AI xulosa
          </h3>

          {data.aiSummary.status === "ready" && data.aiSummary.payload ? (
            <AiReportView payload={data.aiSummary.payload} />
          ) : data.aiSummary.status === "failed" ? (
            <div className="text-sm text-rose-600 dark:text-rose-400">
              {data.aiSummary.error === "AI javobi JSON emas." ? t("result.aiErrorJson") : `${t("result.aiError")}: ${data.aiSummary.error ?? t("result.aiErrorUnknown")}`}
            </div>
          ) : aiLoading ? (
            <AiSummaryLoadingCard progress={aiProgress} t={t} />
          ) : (
            <button
              type="button"
              onClick={requestAiSummary}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("result.getAiSummary")}
            </button>
          )}
        </section>
      </div>
    </div>
  );
  }

  // Agar hech qanday natija topilmasa
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="mx-auto max-w-md text-center py-12">{t("result.formatUnknown")}</div>
    </div>
  );
}

const AGE_GROUP_LABELS: Record<string, string> = {
  AGE_1_5_2: "1,5–2 yosh",
  AGE_3_4: "3–4 yosh",
  AGE_5_6: "5–6 yosh",
  AGE_7_9: "7–9 yosh",
};

function formatTestDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function getXulosaRaqami(assessmentId: string | undefined, completedAt: string | undefined): string {
  if (!assessmentId) return "—";
  const year = completedAt ? new Date(completedAt).getFullYear() : new Date().getFullYear();
  const short = assessmentId.replace(/-/g, "").slice(-6).toUpperCase();
  return `XL-${year}-${short}`;
}

type LocalizedQuestionsMap = {
  questionText: Record<string, string>;
  blockTitle: Record<string, string>;
  questionHelp: Record<string, string>;
};

function ScreeningV2ResultView({
  result,
  assessmentId,
  completedAt,
  ageGroup,
  locale,
}: {
  result: ScreeningV2Result;
  assessmentId?: string;
  completedAt?: string | null;
  ageGroup?: string | null;
  locale?: "uz" | "ru";
}) {
  const t = useTranslations();
  const [localizedMap, setLocalizedMap] = React.useState<LocalizedQuestionsMap | null>(null);

  // Ruscha (yoki boshqa til) tanlanganida savol/blok matnlarini shu tilga yuklash — "Autizmga moyilligi" va red-flag bo'limida
  React.useEffect(() => {
    if (!ageGroup || locale !== "ru") {
      setLocalizedMap(null);
      return;
    }
    const ageId = ageGroup as "AGE_1_5_2" | "AGE_3_4" | "AGE_5_6" | "AGE_7_9";
    if (ageId !== "AGE_1_5_2" && ageId !== "AGE_3_4" && ageId !== "AGE_5_6" && ageId !== "AGE_7_9") return;
    let cancelled = false;
    fetch(`/api/screening/questions?ageGroup=${encodeURIComponent(ageGroup)}&locale=ru`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: {
        questions?: Array<{ id: string; text: string; domain: string; example?: string; explanation?: string }>;
        domains?: Array<{ id: string; title: string }>;
      } | null) => {
        if (cancelled || !data) return;
        const questionText: Record<string, string> = {};
        const blockTitle: Record<string, string> = {};
        const questionHelp: Record<string, string> = {};
        (data.questions ?? []).forEach((q) => {
          questionText[q.id] = q.text;
          const parts = [];
          if (q.example) parts.push(q.example);
          if (q.explanation) parts.push(q.explanation);
          if (parts.length) questionHelp[q.id] = parts.join("\n\n");
        });
        (data.domains ?? []).forEach((d) => {
          blockTitle[d.id] = d.title;
        });
        if (!cancelled) setLocalizedMap({ questionText, blockTitle, questionHelp });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ageGroup, locale]);

  const riskTier =
    result.riskLabel === "Past xavf"
      ? "LOW"
      : result.riskLabel === "O'rtacha xavf"
        ? "MODERATE"
        : "HIGH";

  const blocks = result.blocks ?? [];
  const ageLabel = ageGroup ? (t(`start.age.${ageGroup}`) !== `start.age.${ageGroup}` ? t(`start.age.${ageGroup}`) : AGE_GROUP_LABELS[ageGroup] ?? ageGroup) : null;
  const getBlockTitle = (blockId: string) => {
    const key = `result.block${blockId}`;
    return t(key) !== key ? t(key) : (result.blocks ?? []).find((x) => x.blockId === blockId)?.title ?? blockId;
  };
  const barListData = blocks.map((b) => {
    const color = b.score <= 30 ? "emerald" : b.score <= 60 ? "amber" : "rose";
    return {
      label: `${getBlockTitle(b.blockId)} (${Math.round(b.score)}%)`,
      value: b.score,
      max: 100,
      color: color as "indigo" | "emerald" | "amber" | "rose" | "slate",
    };
  });

  const ANSWER_LABELS: Record<number, string> = {
    0: t("answer.0"),
    1: t("answer.1"),
    2: t("answer.2"),
    3: t("answer.3"),
  };

  const riskAccent =
    riskTier === "LOW"
      ? "border-l-emerald-500 dark:border-l-emerald-400"
      : riskTier === "MODERATE"
        ? "border-l-amber-500 dark:border-l-amber-400"
        : "border-l-rose-500 dark:border-l-rose-400";

  return (
    <>
      {/* Umumiy xulosa — premium hero card */}
      <section
        className={`mt-0 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden border-l-4 ${riskAccent}`}
      >
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("result.overallSummary")}</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{riskTier === "LOW" ? t("result.riskLabelLow") : riskTier === "MODERATE" ? t("result.riskLabelModerate") : t("result.riskLabelHigh")}</h2>
          <div className="mt-6 flex flex-wrap items-start gap-6 sm:gap-8">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-6 border border-slate-200/60 dark:border-slate-700/60">
              <DonutRisk
                value={Math.round(result.totalScore)}
                tier={riskTier as "LOW" | "WATCH" | "MODERATE" | "HIGH"}
                label={t("result.riskIndicator")}
                size="md"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("result.riskIndicator")}: <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{result.totalScore.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {t("result.screeningDisclaimerShort")}
              </p>
              {result.redFlagCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  {t("result.redFlagCount")}: {result.redFlagCount}
                </div>
              )}
            </div>
          </div>
          {/* Risk ko'rsatkichlari shkalasi — 0–20% … 80–100% ranglar bilan */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              {t("result.riskScale")}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="h-2 w-4 rounded-sm bg-emerald-500" /> {t("result.riskVeryLow")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-800 dark:text-green-200">
                <span className="h-2 w-4 rounded-sm bg-green-500" /> {t("result.riskLow")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="h-2 w-4 rounded-sm bg-amber-500" /> {t("result.riskMid")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 text-xs font-semibold text-orange-800 dark:text-orange-200">
                <span className="h-2 w-4 rounded-sm bg-orange-500" /> {t("result.riskHigh")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:text-rose-200">
                <span className="h-2 w-4 rounded-sm bg-rose-500" /> {t("result.riskVeryHigh")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Xulosa — professional, yoshga mos, sana va raqam */}
      <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("result.conclusionNumber")}</span>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getXulosaRaqami(assessmentId, completedAt ?? undefined)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("result.testDate")}</span>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatTestDate(completedAt ?? undefined)}
            </p>
          </div>
          {ageLabel && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("result.ageGroupLabel")}</span>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{ageLabel}</p>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">{t("result.conclusion")}</h3>
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {result.riskLabel === "Past xavf" && (
            <p>
              {ageGroup === "AGE_1_5_2"
                ? t("result.screening.lowRiskDesc1_5_2")
                : ageGroup === "AGE_3_4" || ageGroup === "AGE_5_6"
                  ? t("result.screening.lowRiskDesc3_6")
                  : t("result.screening.lowRiskDesc7_9")}
            </p>
          )}
          {result.riskLabel === "O'rtacha xavf" && (
            <p>
              {ageLabel ? ageLabel + " " + t("result.screening.moderateRiskDesc") : t("result.screening.moderateRiskDescNoAge")}
            </p>
          )}
          {result.riskLabel === "Yuqori xavf" && (
            <p>{t("result.screening.highRiskDesc")}</p>
          )}

          {/* Har bir blok bo'yicha foiz, 5 daraja (0–20% … 80–100%) va blokga xos professional tushuntirish */}
          {blocks.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {t("result.screening.blocksConclusionTitle")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {t("result.screening.range.veryLow")} · {t("result.screening.range.low")} · {t("result.screening.range.mid")} · {t("result.screening.range.high")} · {t("result.screening.range.veryHigh")}
              </p>
              <ul className="space-y-4">
                {blocks.map((b) => {
                  const score = Math.round(b.score);
                  const rangeKey =
                    score < 20
                      ? "veryLow"
                      : score < 40
                        ? "low"
                        : score < 60
                          ? "mid"
                          : score < 80
                            ? "high"
                            : "veryHigh";
                  const blockKey = ["A", "B", "C"].includes(String(b.blockId)) ? `block${b.blockId}` : "blockA";
                  const interpretation = t(`result.screening.${blockKey}.${rangeKey}`);
                  const rangeLabel = t(`result.screening.range.${rangeKey}`);
                  return (
                    <li key={b.blockId} className="flex flex-col gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {getBlockTitle(b.blockId)} — {score}% ({rangeLabel})
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{interpretation}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-400 pt-2">
            <strong>{t("result.recommendation")}:</strong>{" "}
            {result.riskLabel === "Past xavf" && (
              <>
                {t("result.screening.lowRiskAdvice")}
                {result.totalScore > 40 && " " + t("result.screening.lowRiskAdvice40")}
              </>
            )}
            {result.riskLabel === "O'rtacha xavf" && (
              <>
                {t("result.screening.moderateAdvice")}
                {result.totalScore > 40 && " " + t("result.screening.moderateAdvice40")}
              </>
            )}
            {result.riskLabel === "Yuqori xavf" && t("result.screening.highRiskAdvice")}
          </p>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
          {t("result.screeningDocDisclaimer")}</p>
      </section>

      {/* Bloklar bo'yicha */}
      <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("result.indicators")}</p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-5">
          {t("result.blocksByPercent")}
        </h3>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6">
          <BarList data={barListData} title="" maxValue={100} showValue={false} />
        </div>
        <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          {blocks.map((b) => (
            <li key={b.blockId} className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="font-medium text-slate-800 dark:text-slate-200">{getBlockTitle(b.blockId)}</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{Math.round(b.score)}%</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Red-flag savollar */}
      {(result.redFlags ?? []).length > 0 && (
        <section className="mt-8 rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">{t("result.important")}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            {t("result.redFlagQuestions")} ({(result.redFlags ?? []).length})
          </h3>
          <ul className="space-y-2.5 text-sm">
            {(result.redFlags ?? []).map((rf) => (
              <li key={rf.questionId} className="flex gap-3 rounded-xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 px-4 py-3 text-rose-800 dark:text-rose-200 font-medium">
                <span className="text-rose-500 dark:text-rose-400 shrink-0">•</span>
                {localizedMap?.questionText[rf.questionId] ?? rf.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Autizmga moyilligi bor savollar va javoblari — risk > 0 bo‘lgan barcha savollar (javob 0 bo‘lsa ham, masalan A/B da "Yo‘q" = yuqori risk) */}
      {(() => {
        const withBall = (result.topOverall ?? []).filter(
          (issue) => (issue.risk ?? 0) > 0
        );
        return withBall.length > 0 && (
        <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("result.questionsAndAnswers")}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            {t("result.tendencyQuestions")}
          </h3>
          <div className="space-y-3">
            {withBall.map((issue) => {
              const r = issue.risk ?? 0;
              const riskTier = r >= 2.5 ? "red" : r >= 1 && r < 2.5 ? "yellow" : "green";
              const cardClass =
                riskTier === "red"
                  ? "bg-rose-50/60 dark:bg-rose-900/15 border-rose-200/70 dark:border-rose-800/50"
                  : riskTier === "yellow"
                    ? "bg-amber-50/60 dark:bg-amber-900/15 border-amber-200/70 dark:border-amber-800/50"
                    : "bg-emerald-50/60 dark:bg-emerald-900/15 border-emerald-200/70 dark:border-emerald-800/50";
              const badgeClass =
                riskTier === "red"
                  ? "bg-rose-200/80 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200"
                  : riskTier === "yellow"
                    ? "bg-amber-200/80 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200"
                    : "bg-emerald-200/80 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200";
              return (
              <div
                key={issue.questionId}
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${cardClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {localizedMap?.questionText[issue.questionId] ?? issue.text}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${badgeClass}`}
                  >
                    {issue.risk.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {localizedMap?.blockTitle[issue.blockId] ?? issue.blockTitle}
                </div>
                {typeof issue.answer === "number" && (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {t("result.parentAnswer")}:{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ANSWER_LABELS[issue.answer] ?? `Javob ${issue.answer}`}
                    </span>
                  </div>
                )}
                {(localizedMap?.questionHelp[issue.questionId] ?? issue.help) && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {localizedMap?.questionHelp[issue.questionId] ?? issue.help}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </section>
      );
      })()}
    </>
  );
}

function MonitoringResultView({ result }: { result: MonitoringResult }) {
  const barListData = result.blocks.map((b) => {
    const color =
      b.status === "good" ? "emerald" : b.status === "ok" ? "amber" : "rose";
    return {
      label: `${BLOCK_LABELS_UZ[b.blockId]} (${Math.round(b.percent)}%)`,
      value: b.percent,
      max: 100,
      color: color as "indigo" | "emerald" | "amber" | "rose" | "slate",
    };
  });

  return (
    <>
      {/* Xulosa */}
      <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Umumiy xulosa
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {Math.round(result.overallPercent)}%
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {STATUS_LABELS_UZ[result.overallStatus]}
            </div>
            {result.deltaOverallPercent != null && (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Oldingi testga nisbatan:{" "}
                {result.deltaOverallPercent >= 0
                  ? `+${result.deltaOverallPercent}%`
                  : `${result.deltaOverallPercent}%`}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Diagramma — bloklar bo‘yicha */}
      <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
          Bloklar bo‘yicha ko‘rsatkich (%)
        </h3>
        <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <BarList data={barListData} title="" maxValue={100} showValue={false} />
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {result.blocks.map((b) => (
            <li key={b.blockId} className="flex justify-between gap-2">
              <span className="font-medium">{BLOCK_LABELS_UZ[b.blockId]}</span>
              <span>
                {b.percent}% — {STATUS_LABELS_UZ[b.status]}
                {b.deltaPercent != null && (
                  <span className="ml-1 text-slate-500">
                    ({b.deltaPercent >= 0 ? "+" : ""}{b.deltaPercent}%)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tavsiyalar */}
      <section className="mt-6 rounded-2xl bg-white dark:bg-slate-900/80 p-5 ring-1 ring-slate-200/60 dark:ring-slate-700/60 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
          Tavsiyalar
        </h3>
        <div className="space-y-4">
          {result.recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    rec.priority === "high"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                      : rec.priority === "medium"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {rec.priority === "high" ? "Yuqori" : rec.priority === "medium" ? "O‘rta" : "Past"}
                </span>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{rec.title}</h4>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{rec.rationale}</p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {rec.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function AiReportView({ payload }: { payload: AiSummaryPayload }) {
  const t = useTranslations();
  return (
    <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">
          {payload?.summary?.shortConclusion ?? t("result.aiSummary")}
        </h4>
        <p className="mt-1">{payload?.summary?.whyThisLevel}</p>
      </div>

      {(payload?.strengths?.examples?.length ?? 0) > 0 && (
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100">{t("result.strengths")}</h4>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            {(payload?.strengths?.examples ?? []).map((x: string, i: number) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">
          {t("result.needsFocus")}
        </h4>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {t("result.needsFocusHint")}
        </p>
        <ul className="mt-1 list-disc list-inside space-y-0.5">
          {(payload?.needsFocus?.priority ?? []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">{t("result.homePlan")}</h4>
        <div className="mt-2 space-y-3">
          {(payload?.nextSteps?.homePlan ?? []).map(
            (p: { title?: string; why?: string; how?: string[] }, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100">{p.title}</div>
                <div className="mt-1 text-slate-600 dark:text-slate-400">{p.why}</div>
                <ul className="mt-2 list-disc list-inside space-y-0.5">
                  {(p.how ?? []).map((h: string, j: number) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>

      {payload?.disclaimer?.text && (
        <p className="text-xs opacity-80">{payload.disclaimer.text}</p>
      )}
    </div>
  );
}
