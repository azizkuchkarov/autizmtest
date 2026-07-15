"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AgeGroupId } from "@/data";
import { useTranslations } from "@/lib/translations";
import { INITIAL_DATA_KEY, type Respondent, type ChildGender, type InitialData } from "@/lib/initial-data";

const AGE_IDS: AgeGroupId[] = ["AGE_1_5_2", "AGE_3_4", "AGE_5_6", "AGE_7_9"];
const RESPONDENT_VALUES: Respondent[] = ["Ota", "Ona", "Vasiy"];
const GENDER_VALUES: ChildGender[] = ["Qiz", "O'g'il"];

export default function StartPage() {
  const router = useRouter();
  const t = useTranslations();
  const [ageGroup, setAgeGroup] = React.useState<AgeGroupId | null>(null);
  const [respondent, setRespondent] = React.useState<Respondent | null>(null);
  const [childGender, setChildGender] = React.useState<ChildGender | null>(null);
  const [phone, setPhone] = React.useState("+998");
  const [error, setError] = React.useState("");
  const [isTestMode, setIsTestMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      setIsTestMode(host === "localhost" || host === "127.0.0.1");
    }
  }, []);

  const cleanedPhone = phone.replace(/\s+/g, "");

  function handleContinueToTest() {
    if (!ageGroup || !respondent || !childGender) {
      setError(t("start.fillAll"));
      return;
    }
    if (!/^\+998\d{9}$/.test(cleanedPhone)) {
      setError(t("register.errorPhone"));
      return;
    }
    setError("");
    try {
      sessionStorage.setItem(
        INITIAL_DATA_KEY,
        JSON.stringify({ ageGroup, respondent, childGender, phone: cleanedPhone } satisfies InitialData)
      );
      sessionStorage.setItem("asds_phone", cleanedPhone);
    } catch {}
    router.push("/test");
  }

  async function handleTestMode() {
    if (!ageGroup || !respondent || !childGender) {
      setError(t("start.fillAll"));
      return;
    }
    if (!/^\+998\d{9}$/.test(cleanedPhone)) {
      setError(t("register.errorPhone"));
      return;
    }
    setError("");
    try {
      sessionStorage.setItem(
        INITIAL_DATA_KEY,
        JSON.stringify({ ageGroup, respondent, childGender, phone: cleanedPhone } satisfies InitialData)
      );
      sessionStorage.setItem("asds_phone", cleanedPhone);
    } catch {}
    router.push("/test");
  }

  const allFilled =
    ageGroup && respondent && childGender && /^\+998\d{9}$/.test(cleanedPhone);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-50/60 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-xl px-4 sm:px-6 pb-20 pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-slate-200/25 dark:shadow-black/25 backdrop-blur-sm">
          {/* Dekorativ fon */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-200/40 dark:bg-indigo-900/20 blur-3xl" />
            <div className="absolute -left-16 top-1/3 h-32 w-32 rounded-full bg-amber-100/50 dark:bg-amber-900/10 blur-2xl" />
          </div>

          <section className="relative p-6 sm:p-8 md:p-10">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-sm font-bold">
                1
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest">
                {t("start.beforeStart")}
              </p>
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("start.pageTitle")}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
              {t("start.pageDescription")}
            </p>

            <div className="mt-8 space-y-8">
              {/* Yosh guruhi — katta kartalar */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("start.ageLabelFull")}
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AGE_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAgeGroup(id)}
                      className={`relative rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                        ageGroup === id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900"
                          : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20"
                      }`}
                    >
                      {t(`start.age.${id}`)}
                      {ageGroup === id && (
                        <span className="absolute top-2 right-2 text-white/80">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kim to'ldirayapti */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("start.respondentLabelFull")}
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {RESPONDENT_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRespondent(value)}
                      className={`relative rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                        respondent === value
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900"
                          : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20"
                      }`}
                    >
                      {t(`start.respondent.${value}`)}
                      {respondent === value && (
                        <span className="absolute top-2 right-2 text-white/80">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farzand jinsi */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </span>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("start.genderLabelFull")}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setChildGender(value)}
                      className={`relative rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                        childGender === value
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25 ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-900"
                          : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-900/20"
                      }`}
                    >
                      {t(`start.gender.${value}`)}
                      {childGender === value && (
                        <span className="absolute top-2 right-2 text-white/80">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobil raqam */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t("start.phoneLabelFull")}
                  </label>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={t("register.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl bg-white dark:bg-slate-800/80 px-4 py-3.5 text-base font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {t("start.phoneHint")}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/50 px-4 py-3">
                <svg className="h-5 w-5 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}

            <div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-600 px-6 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t("start.back")}
              </Link>
              <button
                type="button"
                onClick={handleContinueToTest}
                disabled={!allFilled}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0"
              >
                {t("start.continueToTest")}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              {isTestMode && (
                <button
                  type="button"
                  onClick={handleTestMode}
                  disabled={!allFilled}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-6 py-3.5 text-sm font-bold text-amber-800 dark:text-amber-200 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {t("start.testModeButton")}
                </button>
              )}
            </div>

            {allFilled && !isTestMode && (
              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                {t("start.nextStepHint")}
              </p>
            )}
            {allFilled && isTestMode && (
              <p className="mt-4 text-center text-xs text-amber-600 dark:text-amber-400">
                {t("start.testModeHint")}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
