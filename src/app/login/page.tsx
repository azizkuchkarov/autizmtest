"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("+998");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"phone" | "code">("phone");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const cleanedPhone = phone.replace(/\s+/g, "");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\+998\d{9}$/.test(cleanedPhone)) {
      setError("Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.details ? ` ${data.details}` : "";
        setError((data?.error ?? "Kod yuborilmadi.") + detail);
        return;
      }
      setStep("code");
      setCode("");
      setDevCode(data?.devCode ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(code) && !/^\d{6}$/.test(code)) {
      setError("Kod 4 yoki 6 raqamdan iborat bo‘lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Tasdiqlashda xatolik.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-md px-4 pb-16 pt-8">
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
          <DarkModeToggle />
        </div>

        <section className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 animate-fadeIn">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Kirish
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {step === "phone"
              ? "Telefon raqamingizga SMS orqali kod yuboramiz."
              : `${cleanedPhone} raqamiga yuborilgan 6 raqamli kodni kiriting.`}
          </p>
          {step === "code" && devCode && (
            <p className="mt-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-sm font-bold text-amber-800 dark:text-amber-200">
              Test rejim: kod <span className="font-mono">{devCode}</span>
            </p>
          )}

          {step === "phone" ? (
            <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Telefon raqam
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
              {error && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
              >
                {loading ? "Yuborilmoqda..." : "Kod yuborish"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  6 raqamli kod
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                />
              </div>
              {error && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
              >
                {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Boshqa raqam
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            PIN (parol) bilan kirishni xohlaysizmi?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ro‘yxatdan o‘ting
            </Link>
            , keyin PIN bilan kiring.
          </p>
        </section>
      </main>
    </div>
  );
}
