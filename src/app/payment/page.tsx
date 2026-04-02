"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/translations";
import { getStoredPhone, INITIAL_DATA_KEY } from "@/lib/initial-data";

function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function IconClick() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconCard() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg className="h-5 w-5 text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BenefitRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5 py-3 first:pt-0 border-b border-slate-100/90 last:border-0 dark:border-slate-700/60">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/40">
        <IconCheck />
      </span>
      <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</span>
    </li>
  );
}

function PaymentMethodCard({
  title,
  subtitle,
  icon,
  onClick,
  disabled,
  variant,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant: "emerald" | "slate";
}) {
  const ring =
    variant === "emerald"
      ? "hover:border-emerald-300/80 hover:shadow-emerald-500/10 focus-visible:ring-emerald-500/30 dark:hover:border-emerald-700/60"
      : "hover:border-slate-300 hover:shadow-slate-500/5 focus-visible:ring-slate-400/25 dark:hover:border-slate-500";
  const iconBg =
    variant === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100/90 dark:bg-emerald-950/45 dark:text-emerald-300 dark:ring-emerald-900/50"
      : "bg-slate-100 text-slate-800 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/60";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-left shadow-sm ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-900/90 ${ring}`}
    >
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ${iconBg}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <IconChevron />
    </button>
  );
}

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
  const [clickModalPhone, setClickModalPhone] = React.useState("");
  const [clickModalPhoneError, setClickModalPhoneError] = React.useState("");
  const clickModalWasOpen = React.useRef(false);
  const [assessmentId, setAssessmentId] = React.useState<string | null>(null);
  const [promoCode, setPromoCode] = React.useState("");
  const [promoLoading, setPromoLoading] = React.useState(false);
  const [promoError, setPromoError] = React.useState("");

  const amountText = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

  React.useEffect(() => {
    fetch("/api/payment/config")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.amount === "number" && d.amount > 0) setAmount(d.amount);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    try {
      const fromStart = getStoredPhone();
      if (fromStart) {
        setPhone(fromStart);
        setPhoneLoaded(true);
        return;
      }
    } catch {}
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const p = d?.user?.phone;
        if (p && /^\+998\d{9}$/.test(String(p).replace(/\s+/g, ""))) {
          setPhone(String(p));
          try {
            sessionStorage.setItem("asds_phone", String(p).replace(/\s+/g, ""));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setPhoneLoaded(true));
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
      try {
        sessionStorage.setItem("autizm_assessment_id", aid);
      } catch {}
    } else {
      try {
        const storedAid = sessionStorage.getItem("autizm_assessment_id");
        if (storedAid) {
          setAssessmentId(storedAid);
        }
      } catch {}
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (clickConfirmOpen && !clickModalWasOpen.current) {
      setClickModalPhoneError("");
      setClickModalPhone(phone ?? "+998");
    }
    clickModalWasOpen.current = clickConfirmOpen;
  }, [clickConfirmOpen, phone]);

  React.useEffect(() => {
    if (!merchantTransId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?merchant_trans_id=${encodeURIComponent(merchantTransId)}`);
        const data = await res.json();
        if (data.status === "paid") {
          setPolling(false);
          let aid = assessmentId;
          if (!aid && typeof window !== "undefined") {
            try {
              aid = sessionStorage.getItem("autizm_assessment_id");
            } catch {
              aid = null;
            }
          }
          if (aid && data.paymentId) {
            try {
              await fetch("/api/assessments/link-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assessmentId: aid, paymentId: data.paymentId }),
              });
            } catch {
              // ignore
            }
            router.push(`/result/${aid}`);
            router.refresh();
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [merchantTransId, polling, router, assessmentId]);

  function persistPhoneChoice(cleaned: string) {
    setPhone(cleaned);
    try {
      sessionStorage.setItem("asds_phone", cleaned);
      const raw = sessionStorage.getItem(INITIAL_DATA_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data && typeof data === "object" && data.ageGroup) {
          sessionStorage.setItem(INITIAL_DATA_KEY, JSON.stringify({ ...data, phone: cleaned }));
        }
      }
    } catch {}
  }

  async function handlePayClick(forPhone?: string) {
    setError("");
    const raw = (forPhone ?? phone ?? "").replace(/\s+/g, "");
    if (!/^\+998\d{9}$/.test(raw)) {
      setError(t("payment.errorPhone"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? t("payment.errorCreate"));
        return;
      }
      persistPhoneChoice(raw);
      setMerchantTransId(data.merchantTransId);
      setPolling(true);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromoRedeem() {
    if (!assessmentId) {
      setPromoError(t("payment.promoNeedAssessment"));
      return;
    }
    const raw = promoCode.trim();
    if (!raw) {
      setPromoError(t("payment.promoEmpty"));
      return;
    }
    setPromoError("");
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: raw, assessmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(typeof data?.error === "string" ? data.error : t("payment.promoError"));
        return;
      }
      router.push(`/result/${assessmentId}`);
      router.refresh();
    } catch {
      setPromoError(t("payment.promoError"));
    } finally {
      setPromoLoading(false);
    }
  }

  async function handlePayByCard() {
    setCardModalOpen(false);
    setError("");
    setLoading(true);
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.origin : "";
      let aidForReturn = assessmentId;
      if (!aidForReturn && typeof window !== "undefined") {
        try {
          aidForReturn = sessionStorage.getItem("autizm_assessment_id");
        } catch {
          aidForReturn = null;
        }
      }
      const res = await fetch("/api/payment/redirect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_url: returnUrl,
          ...(aidForReturn ? { assessment_id: aidForReturn } : {}),
        }),
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

  const demoLinks = [
    { href: "/result/demo-0-20", label: t("payment.riskScaleLine1") },
    { href: "/result/demo-20-40", label: t("payment.riskScaleLine2") },
    { href: "/result/demo-40-60", label: t("payment.riskScaleLine3") },
    { href: "/result/demo-60-80", label: t("payment.riskScaleLine4") },
    { href: "/result/demo-80-100", label: t("payment.riskScaleLine5") },
  ] as const;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/25 blur-3xl dark:bg-indigo-900/20" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-100/30 blur-3xl dark:bg-emerald-900/10" />
      </div>

      <main className="relative mx-auto max-w-xl px-4 pb-24 pt-10 sm:pt-14">
        <header className="text-center sm:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            {t("payment.proBadge")}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            {t("payment.title")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mx-0">
            {t("payment.forTest")}
          </p>
        </header>

        <div className="mt-10 space-y-6">
          {/* Buyurtma xulosasi */}
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 dark:border-slate-700/70 dark:bg-slate-900/85 dark:shadow-black/30 dark:ring-slate-800/80">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white px-6 py-5 dark:border-slate-800 dark:from-slate-800/40 dark:to-slate-900/80 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("payment.orderRef")}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("payment.infoIntro")}</p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t("payment.currency")}</p>
                  <p className="whitespace-nowrap text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    {amountText}
                  </p>
                </div>
              </div>
              {canPay && phone && (
                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/60">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("payment.accountPhone")}</span>
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{phone}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("payment.includedTitle")}
              </h2>
              <ul className="mt-1">
                <BenefitRow>{t("payment.whatResult")}</BenefitRow>
                <BenefitRow>{t("payment.whatTavsiyalar")}</BenefitRow>
                <BenefitRow>{t("payment.whatQuestionsAnswers")}</BenefitRow>
                <BenefitRow>{t("payment.whatAiSummary")}</BenefitRow>
                <BenefitRow>{t("payment.whatAiTavsiyalar")}</BenefitRow>
                <BenefitRow>{t("payment.whatAbaList")}</BenefitRow>
                <BenefitRow>{t("payment.whatAbaRegister")}</BenefitRow>
                <BenefitRow>{t("payment.whatPdf")}</BenefitRow>
              </ul>

              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("payment.riskScaleInfoTitle")}
                </p>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {demoLinks.map(({ href, label }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-white hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
                      >
                        <span className="min-w-0 truncate">{label}</span>
                        <span className="shrink-0 text-slate-400 group-hover:text-indigo-500" aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                <IconShield />
                <span>{t("payment.trustLine")}</span>
              </p>
              <p className="mt-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-left">
                {t("payment.afterPaymentAutoTest")}
              </p>
            </div>
          </section>

          {showNeedPhone ? (
            <section className="rounded-[1.75rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-6 shadow-lg dark:border-amber-900/40 dark:from-amber-950/30 dark:to-slate-900 sm:p-8">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t("payment.needPhoneTitle")}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t("payment.needPhoneText")}</p>
                  <Link
                    href="/start"
                    className="mt-5 inline-flex items-center justify-center rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-600/25 transition hover:bg-amber-700"
                  >
                    {t("payment.goToRegister")}
                  </Link>
                </div>
              </div>
            </section>
          ) : !merchantTransId ? (
            <section className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
                >
                  <span className="shrink-0" aria-hidden>
                    !
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("payment.chooseMethod")}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("payment.hint")}</p>
                <div className="mt-4 flex flex-col gap-3">
                  <PaymentMethodCard
                    variant="emerald"
                    title={t("payment.btnClickApp")}
                    subtitle={t("payment.methodClickSub")}
                    icon={<IconClick />}
                    disabled={loading || !canPay}
                    onClick={() => setClickConfirmOpen(true)}
                  />
                  <PaymentMethodCard
                    variant="slate"
                    title={t("payment.btnCardPay")}
                    subtitle={t("payment.methodCardSub")}
                    icon={<IconCard />}
                    disabled={loading || !canPay}
                    onClick={() => setCardModalOpen(true)}
                  />
                </div>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[1.75rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-lg dark:border-emerald-900/40 dark:from-emerald-950/25 dark:to-slate-900 sm:p-8">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <svg className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{t("payment.sentTitle")}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t("payment.sentText")}</p>
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-emerald-200/60 dark:bg-slate-800/80 dark:text-slate-300 dark:ring-emerald-900/40">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    {t("payment.checking")}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {assessmentId && phoneLoaded && phone && (
          <section className="mt-10 rounded-[1.75rem] border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-slate-50/90 p-6 shadow-lg ring-1 ring-violet-100/80 dark:border-violet-900/40 dark:from-violet-950/20 dark:via-slate-900 dark:to-slate-950 dark:ring-violet-900/30 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200">
                  {t("payment.promoTitle")}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("payment.promoHint")}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="promo-code-input">
                  {t("payment.promoTitle")}
                </label>
                <input
                  id="promo-code-input"
                  type="text"
                  autoComplete="off"
                  placeholder={t("payment.promoPlaceholder")}
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError("");
                  }}
                  className="w-full rounded-xl border border-violet-200/90 bg-white px-4 py-3.5 font-mono text-sm font-semibold tracking-wide text-slate-900 outline-none ring-0 placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-violet-800/60 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-violet-500"
                />
              </div>
              <button
                type="button"
                onClick={() => void handlePromoRedeem()}
                disabled={promoLoading}
                className="shrink-0 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700 disabled:opacity-60"
              >
                {promoLoading ? t("payment.promoApplying") : t("payment.promoSubmit")}
              </button>
            </div>
            {promoError && (
              <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-400" role="alert">
                {promoError}
              </p>
            )}
          </section>
        )}

        {/* Click modali */}
        {clickConfirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setClickConfirmOpen(false)}
          >
            <div
              className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("payment.clickConfirmTitle")}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("payment.clickConfirmText")}</p>
              </div>
              <div className="px-6 py-5">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("register.phoneLabel")}
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("register.phonePlaceholder")}
                  value={clickModalPhone}
                  onChange={(e) => {
                    setClickModalPhone(e.target.value);
                    setClickModalPhoneError("");
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base font-mono font-semibold text-slate-900 outline-none ring-0 transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-emerald-500"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t("payment.clickModalPhoneHint")}</p>
                {clickModalPhoneError && (
                  <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">{clickModalPhoneError}</p>
                )}
              </div>
              <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setClickConfirmOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t("payment.clickConfirmCancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleaned = clickModalPhone.replace(/\s+/g, "");
                    if (!/^\+998\d{9}$/.test(cleaned)) {
                      setClickModalPhoneError(t("payment.errorPhone"));
                      return;
                    }
                    setClickConfirmOpen(false);
                    void handlePayClick(cleaned);
                  }}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60"
                >
                  {t("payment.clickConfirmOk")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Karta modali */}
        {cardModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setCardModalOpen(false)}
          >
            <div
              className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <IconCard />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("payment.cardModalTitle")}</h3>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t("payment.cardModalText")}</p>
              </div>
              <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setCardModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t("payment.cardModalClose")}
                </button>
                <button
                  type="button"
                  onClick={handlePayByCard}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-60"
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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t("payment.loading")}</p>
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
