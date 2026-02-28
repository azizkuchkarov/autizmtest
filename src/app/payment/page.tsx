"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DarkModeToggle from "@/components/DarkModeToggle";
import { useTranslations } from "@/lib/translations";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [phone, setPhone] = React.useState("+998");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [merchantTransId, setMerchantTransId] = React.useState<string | null>(null);
  const [polling, setPolling] = React.useState(false);
  const [amount, setAmount] = React.useState<number>(125_000);

  // Format raqam — server va client da bir xil (hydration xatosiz)
  const amountText = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  React.useEffect(() => {
    fetch("/api/payment/config")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.amount === "number" && d.amount > 0) setAmount(d.amount);
      })
      .catch(() => {});
  }, []);

  // OTP tasdiqlangan raqamni avtomatik olish: avval sessionStorage, bo‘lmasa sessiyadan (/api/auth/me)
  React.useEffect(() => {
    let done = false;
    try {
      const stored = sessionStorage.getItem("asds_phone");
      if (stored && /^\+998\d{9}$/.test(stored.replace(/\s+/g, ""))) {
        setPhone(stored);
        done = true;
      }
    } catch {}
    if (!done) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((d) => {
          const p = d?.user?.phone;
          if (p && /^\+998\d{9}$/.test(String(p).replace(/\s+/g, ""))) {
            setPhone(String(p));
            try {
              sessionStorage.setItem("asds_phone", p);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const mt = searchParams.get("mt") || searchParams.get("merchant_trans_id");
    if (mt) {
      setMerchantTransId(mt);
      setPolling(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!merchantTransId || !polling) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?merchant_trans_id=${encodeURIComponent(merchantTransId)}`);
        const data = await res.json();
        if (data.status === "paid") {
          setPolling(false);
          const params = new URLSearchParams();
          if (data.paymentId) params.set("payment_id", data.paymentId);
          if (typeof data.amount === "number") params.set("amount", String(data.amount));
          const qs = params.toString() ? `?${params.toString()}` : "";
          router.push(`/test${qs}`);
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
      setError(t("payment.errorPhone"));
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
        setError(data?.error ?? t("payment.errorCreate"));
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

  async function handlePayByCard() {
    setError("");
    const cleaned = phone.replace(/\s+/g, "").trim();
    if (!/^\+998\d{9}$/.test(cleaned)) {
      setError(t("payment.errorPhone"));
      return;
    }
    setLoading(true);
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/payment/redirect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned, return_url: returnUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("common.error"));
        return;
      }
      try {
        sessionStorage.setItem("asds_phone", cleaned);
      } catch {}
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
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
            {t("payment.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t("payment.forTest")} — {amountText} {t("payment.currency")}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("payment.hint")}
          </p>

          {!merchantTransId ? (
            <>
              <div className="mt-6">
                <label className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {t("payment.phoneLabel")}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder={t("payment.phonePlaceholder")}
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
                {loading ? t("payment.sending") : t("payment.btnClick")}
              </button>
              <button
                type="button"
                onClick={handlePayByCard}
                disabled={loading}
                className="mt-3 w-full rounded-2xl bg-slate-800 dark:bg-slate-700 text-white px-6 py-4 text-base font-bold shadow-lg transition-all hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60"
              >
                {t("payment.btnCard")}
              </button>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                {t("payment.sentTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {t("payment.sentText")}
              </p>
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                {t("payment.checking")}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function PaymentFallback() {
  const t = useTranslations();
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      <p className="text-slate-600 dark:text-slate-400">{t("payment.loading")}</p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentContent />
    </Suspense>
  );
}
