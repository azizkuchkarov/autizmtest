"use client";

import React from "react";
import type { ScoreResponse, AiSummaryResponse, AiSummaryPayload, ScreeningV2Result } from "@/types/api";
import { generateScreeningPdf } from "@/lib/pdfScreeningReport";
import type { MonitoringResult } from "@/lib/monitoringScoring";
import type { OverallResult } from "@/lib/scoring";
import { DOMAIN_LABELS_UZ, RISK_LABELS_UZ } from "@/lib/scoring";
import { BLOCK_LABELS_UZ, STATUS_LABELS_UZ } from "@/lib/monitoringScoring";
import DarkModeToggle from "@/components/DarkModeToggle";
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
};

function AbaCentersSection({
  region,
  setRegion,
  district,
  setDistrict,
  centers,
  setCenters,
}: {
  region: string;
  setRegion: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  centers: AbaCenterItem[];
  setCenters: (v: AbaCenterItem[]) => void;
}) {
  const [loading, setLoading] = React.useState(false);

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
    <section className="mt-8 rounded-3xl border border-indigo-200/60 dark:border-indigo-800/50 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        Yordam
      </p>
      <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
        ABA markazlar — viloyatingizni tanlang
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        O‘zingizga qulay viloyatni tanlang, shu viloyatdagi ABA terapiya markazlari ro‘yxati chiqadi. Toshkent shahar uchun tumanni ham tanlang.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={region}
          onChange={(e) => {
            setRegion(e.target.value);
            if (!isToshkentShahar(e.target.value)) setDistrict("");
          }}
          className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Viloyatni tanlang</option>
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
            className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tumanni tanlang</option>
            {TOSHKENT_SHAHAR_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Yuklanmoqda...</p>
      )}
      {!loading && region && (isToshkentShahar(region) ? district : true) && centers.length === 0 && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {isToshkentShahar(region) && !district
            ? "Tumanni tanlang."
            : "Ushbu viloyatda (tumanda) hozircha markazlar ro‘yxati kiritilmagan."}
        </p>
      )}
      {!loading && centers.length > 0 && (
        <div className="mt-6 space-y-4">
          {centers.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
            >
              {c.imageUrl && (
                <div className="shrink-0">
                  <img
                    src={c.imageUrl}
                    alt={c.name || "Markaz"}
                    className="rounded-xl object-cover w-full sm:w-32 h-32 sm:h-28 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {c.name && (
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{c.name}</h4>
                )}
                {c.address && (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">📍 {c.address}</p>
                )}
                {c.phone && (
                  <p className="mt-1 text-sm">
                    <a
                      href={`tel:${c.phone.replace(/\s/g, "")}`}
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      📞 {c.phone}
                    </a>
                  </p>
                )}
                {c.url && (
                  <p className="mt-1 text-sm">
                    <a
                      href={c.url.startsWith("http") ? c.url : `https://${c.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      🔗 {c.url}
                    </a>
                  </p>
                )}
                {c.instagram && (
                  <p className="mt-1 text-sm">
                    <a
                      href={c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@?\/?/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      📷 Instagram
                    </a>
                  </p>
                )}
                {c.note && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{c.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type Props = { assessmentId: string };

export default function ResultPageClient({ assessmentId }: Props) {
  const [data, setData] = React.useState<ScoreResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [aiLoading, setAiLoading] = React.useState(false);
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
        if (!res.ok) throw new Error("Natijani yuklab bo‘lmadi");
        const json: ScoreResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Xatolik");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  async function requestAiSummary() {
    if (!data) return;
    if (data.aiSummary.status === "ready") return;

    setAiLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          context: { mainLanguageAtHome: "uzbek" },
        }),
      });

      const json: AiSummaryResponse & { payload?: AiSummaryPayload } = await res.json();
      if (!res.ok || (!json.ok && json.status !== "pending")) {
        throw new Error(json.error ?? "AI xulosa yaratilmadi");
      }

      if (json.status === "ready" && json.payload) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                aiSummary: { ...prev.aiSummary, status: "ready", payload: json.payload ?? null, error: null },
              }
            : prev
        );
      } else {
        setData((prev) =>
          prev ? { ...prev, aiSummary: { ...prev.aiSummary, status: json.status } } : prev
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!data || !data.ageGroup || !isScreeningV2Result(data.scoring)) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/screening/questions?ageGroup=${encodeURIComponent(data.ageGroup)}`);
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

      const AGE_GROUP_LABELS_LOCAL: Record<string, string> = {
        AGE_1_5_2: "1,5–2 yosh",
        AGE_3_4: "3–4 yosh",
        AGE_5_6: "5–6 yosh",
        AGE_7_9: "7–9 yosh",
      };

      const ageLabel =
        data.ageGroup && AGE_GROUP_LABELS_LOCAL[data.ageGroup]
          ? AGE_GROUP_LABELS_LOCAL[data.ageGroup]
          : data.ageGroup ?? null;

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
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
        <div className="mx-auto max-w-md text-center py-12">Yuklanmoqda...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
        <div className="mx-auto max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
        <div className="mx-auto max-w-md text-center py-12">Ma’lumot topilmadi</div>
      </div>
    );
  }

  // Progress monitoring natija
  if (data.testType === "progress" && isMonitoringResult(data.scoring)) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 pb-16">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
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
                AI xulosa yaratilmadi: {data.aiSummary.error ?? "noma’lum xatolik"}
              </div>
            ) : (
              <button
                type="button"
                onClick={requestAiSummary}
                disabled={aiLoading}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? "AI xulosa tayyorlanmoqda..." : "AI xulosa olish"}
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
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>
        <div className="mx-auto max-w-[920px] px-4 sm:px-6 py-8 sm:py-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Skrining natijasi</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Natija</h1>
            {data.paidAmount != null && data.paidAmount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  To&apos;langan summa: {String(data.paidAmount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so&apos;m
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-400">Balans: 0 so&apos;m</span>
              </div>
            )}
          </div>

          <ScreeningV2ResultView
            result={normalizedResult}
            assessmentId={assessmentId}
            completedAt={data.completedAt ?? undefined}
            ageGroup={data.ageGroup ?? undefined}
          />

          <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
              AI xulosa
            </h3>
            {data.aiSummary.status === "ready" && data.aiSummary.payload ? (
              <AiReportView payload={data.aiSummary.payload} />
            ) : data.aiSummary.status === "failed" ? (
              <div className="text-sm text-rose-600 dark:text-rose-400">
                AI xulosa yaratilmadi: {data.aiSummary.error ?? "noma'lum xatolik"}
              </div>
            ) : (
              <button
                type="button"
                onClick={requestAiSummary}
                disabled={aiLoading}
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? "AI xulosa tayyorlanmoqda..." : "AI xulosa olish"}
              </button>
            )}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pdfLoading ? "PDF tayyorlanmoqda..." : "PDF yuklab olish (A4)"}
              </button>
            </div>
          </section>

          {/* ABA markazlar — AI xulosadan keyin; PDF da ham tanlangan viloyat/markazlar chiqadi */}
          <AbaCentersSection
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
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
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
                label="Umumiy risk"
                size="md"
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
            AI Premium xulosa
          </h3>

          {data.aiSummary.status === "ready" && data.aiSummary.payload ? (
            <AiReportView payload={data.aiSummary.payload} />
          ) : data.aiSummary.status === "failed" ? (
            <div className="text-sm text-rose-600 dark:text-rose-400">
              AI xulosa yaratilmadi: {data.aiSummary.error ?? "noma’lum xatolik"}
            </div>
          ) : (
            <button
              type="button"
              onClick={requestAiSummary}
              disabled={aiLoading}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? "AI xulosa tayyorlanmoqda..." : "AI xulosa olish"}
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
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      <div className="mx-auto max-w-md text-center py-12">Natija formati aniqlanmadi</div>
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

function ScreeningV2ResultView({
  result,
  assessmentId,
  completedAt,
  ageGroup,
}: {
  result: ScreeningV2Result;
  assessmentId?: string;
  completedAt?: string | null;
  ageGroup?: string | null;
}) {
  const riskTier =
    result.riskLabel === "Past xavf"
      ? "LOW"
      : result.riskLabel === "O'rtacha xavf"
        ? "MODERATE"
        : "HIGH";

  const blocks = result.blocks ?? [];
  const ageLabel = ageGroup ? AGE_GROUP_LABELS[ageGroup] ?? ageGroup : null;
  const barListData = blocks.map((b) => {
    const color = b.score <= 30 ? "emerald" : b.score <= 60 ? "amber" : "rose";
    return {
      label: `${b.title} (${Math.round(b.score)}%)`,
      value: b.score,
      max: 100,
      color: color as "indigo" | "emerald" | "amber" | "rose" | "slate",
    };
  });

  const ANSWER_LABELS: Record<number, string> = {
    0: "Yo‘q / hech qachon",
    1: "Kamdan-kam",
    2: "Ko‘pincha",
    3: "Doim / barqaror",
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
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Umumiy xulosa</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{result.riskLabel}</h2>
          <div className="mt-6 flex flex-wrap items-start gap-6 sm:gap-8">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-6 border border-slate-200/60 dark:border-slate-700/60">
              <DonutRisk
                value={Math.round(result.totalScore)}
                tier={riskTier as "LOW" | "WATCH" | "MODERATE" | "HIGH"}
                label="Umumiy risk"
                size="md"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Risk ko‘rsatkichi: <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{result.totalScore.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Bu skrining bo‘yicha autizm belgilari ehtimoli. Diagnoz emas; aniq tashxis bolalar nevrologi yoki rivojlanish mutaxassisi tomonidan to‘liq baholashdan keyin qo‘yiladi.
              </p>
              {result.redFlagCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  Red-flag: {result.redFlagCount} ta
                </div>
              )}
            </div>
          </div>
          {/* Risk ko'rsatkichlari shkalasi — 0–20% … 80–100% ranglar bilan */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Risk ko'rsatkichlari
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="h-2 w-4 rounded-sm bg-emerald-500" /> 0–20% — Juda past
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 dark:bg-green-900/40 px-3 py-1.5 text-xs font-semibold text-green-800 dark:text-green-200">
                <span className="h-2 w-4 rounded-sm bg-green-500" /> 20–40% — Past
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                <span className="h-2 w-4 rounded-sm bg-amber-500" /> 40–60% — O'rta
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40 px-3 py-1.5 text-xs font-semibold text-orange-800 dark:text-orange-200">
                <span className="h-2 w-4 rounded-sm bg-orange-500" /> 60–80% — Yuqori
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:text-rose-200">
                <span className="h-2 w-4 rounded-sm bg-rose-500" /> 80–100% — Juda yuqori
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Xulosa — professional, yoshga mos, sana va raqam */}
      <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Xulosa raqami</span>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getXulosaRaqami(assessmentId, completedAt ?? undefined)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Test sanasi</span>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatTestDate(completedAt ?? undefined)}
            </p>
          </div>
          {ageLabel && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Yosh guruhi</span>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{ageLabel}</p>
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">Xulosa</h3>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {result.riskLabel === "Past xavf" && (
            <>
              <p>
                {ageLabel === "1,5–2 yosh"
                  ? "Ushbu yoshdagi bolada skrining bo‘yicha autizm belgilari ehtimoli past baholandi. Erta yoshda ijtimoiy va muloqot ko‘nikmalari hali rivojlanayotgan bo‘lgani uchun kuzatishni davom ettirish, oilada ijtimoiy o‘yin va muloqotga vaqt ajratish tavsiya etiladi."
                  : ageLabel === "3–4 yosh" || ageLabel === "5–6 yosh"
                    ? "Skrining bo‘yicha autizm belgilari ehtimoli past. Bolaning ijtimoiy aloqa, muloqot va moslashuv ko‘rsatkichlari hozircha normativ rivojlanish doirasida baholandi. Maktabgacha yoki maktab yoshida kuzatishni davom ettirish va kerak bo‘lsa keyinchalik qayta tekshirish mumkin."
                    : "Skrining natijasiga ko‘ra autizm belgilari ehtimoli past. Bolaning javoblari asosida hozircha qo‘shimcha tekshiruv talab qilinmaydi. Rivojlanishni kuzatish va ota-ona savollari paydo bo‘lsa mutaxassisga murojaat qilish tavsiya etiladi."}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Tavsiya:</strong> Kuzatishni davom ettiring. Agar keyinchalik ota-ona tashvishlansa yoki bolada o‘zgarishlar sezilsa, qayta skrining yoki bolalar nevrologi yoki rivojlanish mutaxassisi bilan konsultatsiya qilish mumkin.
                {result.totalScore > 40 && " 40% dan yuqori bo‘lgan hollarda ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi."}
              </p>
            </>
          )}
          {result.riskLabel === "O'rtacha xavf" && (
            <>
              <p>
                {ageLabel
                  ? `${ageLabel} guruhidagi bolada skrining bo‘yicha ba’zi belgilar qayd etildi. Bu mutlaqo autizm borligini anglatmaydi; boshqa sabablar ham bo‘lishi mumkin. To‘liq klinik baholash orqali aniqroq yo‘nalish olish mumkin.`
                  : "Skrining bo‘yicha ba’zi belgilar qayd etildi. To‘liq klinik baholash orqali aniqroq yo‘nalish olish mumkin."}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Tavsiya:</strong> Bolalar nevrologi yoki rivojlanish bo‘yicha mutaxassis bilan konsultatsiya qilish tavsiya etiladi. Mutaxassis bolani ko‘rib, anamnez va qo‘shimcha tekshiruvlar asosida keyingi qadamni aniqlaydi.
                {result.totalScore > 40 && " 40% dan yuqori bo‘lgani uchun ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi."}
              </p>
            </>
          )}
          {result.riskLabel === "Yuqori xavf" && (
            <>
              <p>
                Skrining bo‘yicha belgilar sezilarli darajada qayd etildi. Bu natija <strong>diagnoz emas</strong>; faqat keyingi tekshiruv va mutaxassis bilan uchrashuvni rejalash uchun asos hisoblanadi. Aniq tashxis faqat mutaxassis tomonidan to‘liq klinik va kerak bo‘lsa instrumental baholashdan keyin qo‘yiladi.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Tavsiya:</strong> Tezroq bolalar nevrologi yoki rivojlanish/autizm bo‘yicha ixtisoslashtirilgan markazga murojaat qilish va diagnostik baholashdan o‘tish tavsiya etiladi. Erta yordam va qo‘llab-quvvatlash natijani yaxshilashda muhim rol o‘ynaydi. ABA mutaxassislari bilan ham konsultatsiya qilish tavsiya etiladi.
              </p>
            </>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
          Bu hujjat faqat skrining natijasidir va diagnoz qo‘yish uchun ishlatilmaydi. Keyingi qadamni rejalashda va bolalar nevrologi yoki rivojlanish mutaxassisi bilan muloqotda yordam beradi.
        </p>
      </section>

      {/* Bloklar bo'yicha */}
      <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Ko'rsatkichlar</p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-5">
          Bloklar bo'yicha (%)
        </h3>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6">
          <BarList data={barListData} title="" maxValue={100} showValue={false} />
        </div>
        <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
          {blocks.map((b) => (
            <li key={b.blockId} className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="font-medium text-slate-800 dark:text-slate-200">{b.title}</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{Math.round(b.score)}%</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Red-flag savollar */}
      {(result.redFlags ?? []).length > 0 && (
        <section className="mt-8 rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-600 dark:text-rose-400">Muhim</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            Red-flag savollar ({(result.redFlags ?? []).length} ta)
          </h3>
          <ul className="space-y-2.5 text-sm">
            {(result.redFlags ?? []).map((rf) => (
              <li key={rf.questionId} className="flex gap-3 rounded-xl bg-rose-50/80 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 px-4 py-3 text-rose-800 dark:text-rose-200 font-medium">
                <span className="text-rose-500 dark:text-rose-400 shrink-0">•</span>
                {rf.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Autizmga moyilligi bor savollar va javoblari — faqat ball olgan (risk > 0, javob > 0) */}
      {(() => {
        const withBall = (result.topOverall ?? []).filter(
          (issue) => (issue.risk ?? 0) > 0 && (issue.answer ?? 0) > 0
        );
        return withBall.length > 0 && (
        <section className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Savol va javoblar</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">
            Autizmga moyilligi bor savollar va javoblari
          </h3>
          <div className="space-y-3">
            {withBall.map((issue) => (
              <div
                key={issue.questionId}
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                  issue.isRedFlag
                    ? "bg-rose-50/60 dark:bg-rose-900/15 border-rose-200/70 dark:border-rose-800/50"
                    : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{issue.text}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${
                      issue.isRedFlag
                        ? "bg-rose-200/80 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200"
                        : "bg-slate-200/80 text-slate-700 dark:bg-slate-600 dark:text-slate-200"
                    }`}
                  >
                    {issue.risk.toFixed(1)}
                  </span>
                </div>
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {issue.blockTitle}
                </div>
                {typeof issue.answer === "number" && (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Ota-onaning javobi:{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {ANSWER_LABELS[issue.answer] ?? `Javob ${issue.answer}`}
                    </span>
                  </div>
                )}
                {issue.help && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{issue.help}</div>
                )}
              </div>
            ))}
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
  return (
    <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">
          {payload?.summary?.shortConclusion ?? "AI xulosa"}
        </h4>
        <p className="mt-1">{payload?.summary?.whyThisLevel}</p>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">Kuchli tomonlar</h4>
        <ul className="mt-1 list-disc list-inside space-y-0.5">
          {(payload?.strengths?.examples ?? []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">
          E’tibor kerak bo‘lgan yo‘nalishlar
        </h4>
        <ul className="mt-1 list-disc list-inside space-y-0.5">
          {(payload?.needsFocus?.priority ?? []).map((x: string, i: number) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100">Uy sharoitida reja</h4>
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
