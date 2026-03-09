"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/translations";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [phone, setPhone] = React.useState<string | null>(null);
  const [phoneLoaded, setPhoneLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [merchantTransId, setMerchantTransId] = React.useState<string | null>(null);
  const [polling, setPolling] = React.useState(false);
  const [amount, setAmount] = React.useState<number>(1_000);
  const [cardModalOpen, setCardModalOpen] = React.useState(false);
  const [clickConfirmOpen, setClickConfirmOpen] = React.useState(false);
  const [assessmentId, setAssessmentId] = React.useState<string | null>(null);

  const amountText = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  React.useEffect(() => {
    fetch("/api/payment/config")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.amount === "number" && d.amount > 0) setAmount(d.amount);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    let done = false;
    try {
      const stored = sessionStorage.getItem("asds_phone");
      if (stored && /^\+998\d{9}$/.test(stored.replace(/\s+/g, ""))) {
        setPhone(stored);
        done = true;
      }
    } catch {}
    if (done) setPhoneLoaded(true);
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
        .catch(() => {})
        .finally(() => setPhoneLoaded(true));
    } else {
      setPhoneLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    const mt = searchParams.get("mt") || searchParams.get("merchant_trans_id");
    const aid = searchParams.get("assessment_id");
    if (mt) {
      setMerchantTransId(mt);
      setPolling(true);
    }
    if (aid) {
      setAssessmentId(aid);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!merchantTransId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?merchant_trans_id=${encodeURIComponent(merchantTransId)}`);
        const data = await res.json();
        if (data.status === "paid") {
          setPolling(false);
          if (assessmentId && data.paymentId) {
            try {
              await fetch("/api/assessments/link-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId, paymentId: data.paymentId }),
              });
            } catch {
              // ignore linking error, result baribir ochiladi
            }
            router.push(`/result/${assessmentId}`);
          } else {
            const params = new URLSearchParams();
            if (data.paymentId) params.set("payment_id", data.paymentId);
            if (typeof data.amount === "number") params.set("amount", String(data.amount));
            const qs = params.toString() ? `?${params.toString()}` : "";
            router.push(`/test${qs}`);
          }
          router.refresh();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [merchantTransId, polling, router]);

  async function handlePayClick() {
    setError("");
    if (!phone || !/^\+998\d{9}$/.test(phone.replace(/\s+/g, ""))) {
      setError(t("payment.needPhoneText"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("payment.errorCreate"));
        return;
      }
      try {
        if (phone) {
          sessionStorage.setItem("asds_phone", phone);
        }
      } catch {}
      setMerchantTransId(data.merchantTransId);
      setPolling(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayByCard() {
    setCardModalOpen(false);
    setError("");
    setLoading(true);
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch("/api/payment/redirect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: returnUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("common.error"));
        return;
      }
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

  const showNeedPhone = phoneLoaded && !phone;
  const canPay = phoneLoaded && phone && /^\+998\d{9}$/.test(phone.replace(/\s+/g, ""));

  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <main className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <section className="rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 md:p-10 shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/60">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {t("payment.title")}
          </h1>

          {/* Narx va nima olinadi — professional informatsiya */}
          <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 ring-1 ring-slate-200/60 dark:ring-slate-600/40">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {amountText} {t("payment.currency")}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("payment.infoIntro")}
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("payment.whatYouGet")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatResult")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatTavsiyalar")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatQuestionsAnswers")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatAiSummary")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatAiTavsiyalar")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatAbaList")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatAbaRegister")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                <span>{t("payment.whatPdf")}</span>
              </li>
            </ul>
            <div className="mt-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("payment.riskScaleInfoTitle")}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <li>
                  <Link href="/result/demo-0-20" className="hover:underline text-indigo-600 dark:text-indigo-400">
                    {t("payment.riskScaleLine1")}
                  </Link>
                </li>
                <li>
                  <Link href="/result/demo-20-40" className="hover:underline text-indigo-600 dark:text-indigo-400">
                    {t("payment.riskScaleLine2")}
                  </Link>
                </li>
                <li>
                  <Link href="/result/demo-40-60" className="hover:underline text-indigo-600 dark:text-indigo-400">
                    {t("payment.riskScaleLine3")}
                  </Link>
                </li>
                <li>
                  <Link href="/result/demo-60-80" className="hover:underline text-indigo-600 dark:text-indigo-400">
                    {t("payment.riskScaleLine4")}
                  </Link>
                </li>
                <li>
                  <Link href="/result/demo-80-100" className="hover:underline text-indigo-600 dark:text-indigo-400">
                    {t("payment.riskScaleLine5")}
                  </Link>
                </li>
              </ul>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("payment.afterPaymentAutoTest")}
            </p>
          </div>

          {showNeedPhone ? (
            <div className="mt-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-5 ring-1 ring-amber-200/60 dark:ring-amber-800/40">
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                {t("payment.needPhoneTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {t("payment.needPhoneText")}
              </p>
              <Link
                href="/start/register"
                className="mt-4 inline-block rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors"
              >
                {t("payment.goToRegister")}
              </Link>
            </div>
          ) : !merchantTransId ? (
            <>
              {error && (
                <div className="mt-4 text-sm font-semibold text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setClickConfirmOpen(true)}
                  disabled={loading || !canPay}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("payment.sending") : t("payment.btnClickApp")}
                </button>
                <button
                  type="button"
                  onClick={() => setCardModalOpen(true)}
                  disabled={loading || !canPay}
                  className="w-full rounded-2xl bg-slate-800 dark:bg-slate-700 text-white px-6 py-4 text-base font-bold shadow-lg transition-all hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("payment.btnCardPay")}
                </button>
              </div>
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

        {/* Click orqali to'lov — raqamni tasdiqlash modali */}
        {clickConfirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setClickConfirmOpen(false)}
          >
            <div
              className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-w-md w-full ring-1 ring-slate-200 dark:ring-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("payment.clickConfirmTitle")}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t("payment.clickConfirmText")}
              </p>
              {phone && (
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("payment.phoneLabel")}: <span className="font-mono">{phone}</span>
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <Link
                  href="/start/register"
                  className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 text-center"
                  onClick={() => setClickConfirmOpen(false)}
                >
                  {t("payment.clickConfirmCancel")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setClickConfirmOpen(false);
                    void handlePayClick();
                  }}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {t("payment.clickConfirmOk")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Karta orqali to'lash — tushuntirish modali */}
        {cardModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setCardModalOpen(false)}
          >
            <div
              className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-w-md w-full ring-1 ring-slate-200 dark:ring-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("payment.cardModalTitle")}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t("payment.cardModalText")}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCardModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  {t("payment.cardModalClose")}
                </button>
                <button
                  type="button"
                  onClick={handlePayByCard}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {t("payment.cardModalContinue")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PaymentFallback() {
  const t = useTranslations();
  return (
    <div className="min-h-dvh bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
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
