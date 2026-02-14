"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function PaymentPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState("+998");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [merchantTransId, setMerchantTransId] = React.useState<string | null>(null);
  const [polling, setPolling] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("asds_phone");
      if (stored) setPhone(stored);
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!merchantTransId || !polling) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?merchant_trans_id=${encodeURIComponent(merchantTransId)}`);
        const data = await res.json();
        if (data.status === "paid") {
          setPolling(false);
          router.push("/test");
          router.refresh();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [merchantTransId, polling, router]);

  async function handlePay() {
    setError("");
    const cleaned = phone.replace(/\s+/g, "").trim();
    if (!/^\+998\d{9}$/.test(cleaned)) {
      setError("Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "To'lov yaratilmadi.");
        return;
      }
      try {
        sessionStorage.setItem("asds_phone", cleaned);
      } catch {}
      setMerchantTransId(data.merchantTransId);
      setPolling(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-md px-4 pb-16 pt-8">
        <div className="fixed top-4 right-4 z-50">
          <DarkModeToggle />
        </div>

        <section className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            To'lov
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Autizm skrining testi uchun to'lov — 125 000 so'm
          </p>

          {!merchantTransId ? (
            <>
              <div className="mt-6">
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
                  className="w-full rounded-2xl bg-white/90 dark:bg-slate-800/80 px-4 py-3 text-base font-semibold text-slate-900 dark:text-slate-100 ring-1 ring-slate-300/70 dark:ring-slate-600/70 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && (
                <div className="mt-4 text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
              >
                {loading ? "Yuborilmoqda..." : "Click orqali to'lash"}
              </button>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Telefoningizga to'lov yuborildi.
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Click ilovasida yoki <strong>click.uz</strong> saytida to'lang. To'lovdan keyin avtomatik ravishda test sahifasiga o'tkazamiz.
              </p>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                To'lovni tekshiryapmiz...
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
