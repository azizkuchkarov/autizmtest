"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";

type AgeOption = { label: string; value: number };
type Gender = "male" | "female";

const AGE_OPTIONS: AgeOption[] = [
  { label: "1,5–3", value: 3 },
  { label: "4–5", value: 5 },
  { label: "6–7", value: 7 },
  { label: "7–10", value: 7 },
];

export default function StartPage() {
  const router = useRouter();
  const [age, setAge] = React.useState<AgeOption | null>(null);
  const [gender, setGender] = React.useState<Gender | "">("");
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    try {
      sessionStorage.removeItem("asds_answers");
    } catch {}
  }, []);

  function handleNext() {
    if (!age || !gender) {
      setError("Iltimos, yosh va jinsni tanlang.");
      return;
    }
    try {
      sessionStorage.setItem("asds_age", String(age.value));
      sessionStorage.setItem("asds_age_label", age.label);
      sessionStorage.setItem("asds_gender", gender);
    } catch {}
    router.push("/register");
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <DarkModeToggle />
        </div>

        <section className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 hover-lift animate-fadeIn">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 dark:bg-indigo-900/30 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100/70 dark:ring-indigo-800/60">
            Premium
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
            Dastlabki ma'lumotlar
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Farzandingizning yoshi va jinsini belgilang.
          </p>

          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Farzandingizning yoshi</div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {AGE_OPTIONS.map((opt) => {
                const active = age?.label === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setAge(opt);
                      setError("");
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition-all hover-lift ${
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-indigo-200/80 shadow-lg shadow-indigo-500/30"
                        : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-300/80 dark:ring-slate-600/70 hover:ring-indigo-300/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Bolaning jinsi</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {([
                { id: "male", label: "O‘g‘il" },
                { id: "female", label: "Qiz" },
              ] as const).map((opt) => {
                const active = gender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setGender(opt.id);
                      setError("");
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition-all hover-lift ${
                      active
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ring-emerald-200/80 shadow-lg shadow-emerald-500/30"
                        : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-300/80 dark:ring-slate-600/70 hover:ring-emerald-300/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="mt-4 text-sm font-semibold text-rose-600">{error}</div>}

          <div className="mt-6">
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:via-indigo-500 dark:hover:to-indigo-700 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Dastlabki ma'lumotlarni kiritish
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
