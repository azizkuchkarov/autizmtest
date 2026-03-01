"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp" | "pin" | "set-pin";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("+998");
  const [code, setCode] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pinConfirm, setPinConfirm] = React.useState("");
  const [step, setStep] = React.useState<Step>("phone");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const cleanedPhone = phone.replace(/\s+/g, "");

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\+998\d{9}$/.test(cleanedPhone)) {
      setError("Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Xatolik.");
        return;
      }
      if (data.exists && data.hasPin) {
        setStep("pin");
        setPin("");
      } else {
        setStep("otp");
        setCode("");
        const res2 = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanedPhone }),
        });
        const data2 = await res2.json();
        if (res2.ok) {
          setDevCode(data2?.devCode ?? null);
        } else {
          setError(data2?.error ?? "Kod yuborilmadi.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestCode() {
    setError("");
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
      setDevCode(data?.devCode ?? null);
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(code) && !/^\d{6}$/.test(code)) {
      setError("Kod 4 yoki 6 raqamdan iborat bo'lishi kerak.");
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
      if (data.needsPin) {
        setStep("set-pin");
        setPin("");
        setPinConfirm("");
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(pin) && !/^\d{6}$/.test(pin)) {
      setError("PIN 4 yoki 6 raqamdan iborat bo'lishi kerak.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("PINlar mos kelmadi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, pinConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Xatolik.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handlePinLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\d{4}$/.test(pin) && !/^\d{6}$/.test(pin)) {
      setError("PIN 4 yoki 6 raqamdan iborat bo'lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Kirishda xatolik.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function goBackToPhone() {
    setStep("phone");
    setError("");
    setCode("");
    setPin("");
    setPinConfirm("");
    setDevCode(null);
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-md px-4 pb-16 pt-8">
        <section className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60 animate-fadeIn">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Kirish
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {step === "phone" && "Telefon raqamingizni kiriting."}
            {step === "otp" && `${cleanedPhone} raqamiga yuborilgan 6 raqamli kodni kiriting.`}
            {step === "pin" && "4 yoki 6 raqamli PIN kodingizni kiriting."}
            {step === "set-pin" && "Kelajakda kirish uchun 4 yoki 6 raqamli PIN o'rnating."}
          </p>
          {step === "otp" && devCode && (
            <p className="mt-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 px-3 py-2 text-sm font-bold text-amber-800 dark:text-amber-200">
              Test rejim: kod <span className="font-mono">{devCode}</span>
            </p>
          )}

          {step === "phone" && (
            <form onSubmit={handleContinue} className="mt-6 space-y-4">
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
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
              >
                {loading ? "Tekshirilmoqda..." : "Davom etish"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
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
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</div>
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
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
              >
                Qayta kod yuborish
              </button>
              <button type="button" onClick={goBackToPhone} className="w-full text-sm text-slate-500">
                Boshqa raqam
              </button>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  PIN
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
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold tracking-widest text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
              >
                {loading ? "Kutilmoqda..." : "Kirish"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("otp");
                  setCode("");
                  setError("");
                  setDevCode(null);
                  handleRequestCode();
                }}
                className="w-full text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
              >
                PINni unutdingizmi? Qayta ro'yxatdan o'ting
              </button>
              <button type="button" onClick={goBackToPhone} className="w-full text-sm text-slate-500">
                Boshqa raqam
              </button>
            </form>
          )}

          {step === "set-pin" && (
            <form onSubmit={handleSetPin} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  4 yoki 6 raqamli PIN
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
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold tracking-widest ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  PINni takrorlang
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
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold tracking-widest ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
              >
                {loading ? "Saqlanmoqda..." : "PIN o'rnatish va kirish"}
              </button>
              <button type="button" onClick={goBackToPhone} className="w-full text-sm text-slate-500">
                Bekor qilish
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
