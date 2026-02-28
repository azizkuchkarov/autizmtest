"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useTranslations } from "@/lib/translations";

export default function StartRegisterPage() {
  const router = useRouter();
  const t = useTranslations();
  const [phone, setPhone] = React.useState("+998");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const cleanedPhone = phone.replace(/\s+/g, "");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\+998\d{9}$/.test(cleanedPhone)) {
      setError(t("register.errorPhone"));
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
        const detail = data?.details ? ` (${data.details})` : "";
        setError((data?.error ?? t("register.errorSend")) + detail);
        return;
      }
      setDevCode(data?.devCode ?? null);
      setCode("");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError(t("register.errorCode"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone, code, flow: "test" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("register.errorVerify"));
        return;
      }
      try {
        sessionStorage.setItem("asds_phone", cleanedPhone);
      } catch {}
      router.push("/payment");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-md px-4 pb-16 pt-10 sm:pt-12">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>

        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("register.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("register.description")}
          </p>

          {step === "phone" && (
            <form onSubmit={handleSendCode} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t("register.phoneLabel")}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={t("register.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-white dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? t("register.sending") : t("register.sendCode")}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              {devCode && (
                <p className="rounded-xl bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                  {t("register.devCodeHint")} <span className="font-mono">{devCode}</span>
                </p>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t("register.codeLabel")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("register.codePlaceholder")}
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-white dark:bg-slate-800/80 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? t("register.checking") : t("register.verifyAndPay")}
              </button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
              >
                {t("register.otherNumber")}
              </button>
            </form>
          )}

          <Link
            href="/start"
            className="mt-6 inline-block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
          >
            ← {t("register.back")}
          </Link>
        </section>
      </main>
    </div>
  );
}
