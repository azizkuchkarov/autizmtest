"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("+998");
  const [pin, setPin] = React.useState("");
  const [pinConfirm, setPinConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleaned = phone.replace(/\s+/g, "");
    if (!/^\+998\d{9}$/.test(cleaned)) {
      setError("Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak.");
      return;
    }
    if (!/^\d{4}$/.test(pin) && !/^\d{6}$/.test(pin)) {
      setError("Kod 4 yoki 6 raqamdan iborat bo‘lishi kerak.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("Kodlar mos kelmadi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Ro‘yxatdan o‘tishda xatolik.");
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
            Ro‘yxatdan o‘tish
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Telefon raqam va 4 yoki 6 raqamli kod o‘rnating (keyin kirishda ishlatasiz).
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                4 yoki 6 raqamli kod (o‘zingiz tanlang)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="•••• yoki ••••••"
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(v);
                  setError("");
                }}
                className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 tracking-widest ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Kodni takrorlang
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="•••• yoki ••••••"
                value={pinConfirm}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPinConfirm(v);
                  setError("");
                }}
                className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 tracking-widest ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
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
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
            >
              {loading ? "Kutilmoqda..." : "Ro‘yxatdan o‘tish"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Allaqachon akkauntingiz bormi?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Kirish
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
