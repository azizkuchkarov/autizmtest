"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";

type ParentType = "mother" | "father" | "other";
type FamilyHistory = "yes" | "no" | "unknown";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("+998");
  const [parentType, setParentType] = React.useState<ParentType | "">("");
  const [familyHistory, setFamilyHistory] = React.useState<FamilyHistory | "">("");
  const [error, setError] = React.useState<string>("");

  function handleStart() {
    const cleaned = phone.replace(/\s+/g, "");
    const phoneOk = /^\+998\d{9}$/.test(cleaned);
    if (!phoneOk || !parentType || !familyHistory) {
      setError("Iltimos, barcha maydonlarni to‘ldiring.");
      return;
    }
    try {
      sessionStorage.setItem("asds_phone", cleaned);
      sessionStorage.setItem("asds_parent", parentType);
      sessionStorage.setItem("asds_family_history", familyHistory);
      sessionStorage.setItem("asds_lang", "uz");
    } catch {}
    router.push("/test");
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
            Ro'yxatdan o'tish
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Telefon raqam va test haqidagi qisqa ma'lumotlarni kiriting.
          </p>

          <div className="mt-6">
            <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Telefon raqam
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+998 11 1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Testni kim to‘ldirmoqda?</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([
                { id: "mother", label: "Ona" },
                { id: "father", label: "Ota" },
                { id: "other", label: "Vasiy" },
              ] as const).map((opt) => {
                const active = parentType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setParentType(opt.id);
                      setError("");
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition-all hover-lift ${
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white ring-indigo-200/80 shadow-lg shadow-indigo-500/30"
                        : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-300/80 dark:ring-slate-600/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Oilada autizm bilan kasallanganlar bormi?
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([
                { id: "yes", label: "Ha" },
                { id: "no", label: "Yo‘q" },
                { id: "unknown", label: "Bilmayman" },
              ] as const).map((opt) => {
                const active = familyHistory === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setFamilyHistory(opt.id);
                      setError("");
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition-all hover-lift ${
                      active
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ring-emerald-200/80 shadow-lg shadow-emerald-500/30"
                        : "bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 ring-slate-300/80 dark:ring-slate-600/70"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/20 p-4 ring-1 ring-indigo-100/70 dark:ring-indigo-800/40">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Testga qanday javob berish?</div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Oxirgi 2–4 hafta kuzatuvingiz bo‘yicha belgilang. Ikkilansangiz — “Ba’zan”ni tanlang.
            </p>
          </div>

          {error && <div className="mt-4 text-sm font-semibold text-rose-600">{error}</div>}

          <div className="mt-6">
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 dark:from-indigo-500 dark:via-indigo-400 dark:to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/40 transition-all hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:via-indigo-500 dark:hover:to-indigo-700 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Testni boshlash
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
