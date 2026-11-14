"use client";

import { CreditCard, Lock, Ticket } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { accent, Button, Card, FadeIn, IconBadge } from "@/components/app/ui";
import { ApiError, redeemPromo, startCheckout } from "@/lib/app/api";
import type { TranslationKey } from "@/lib/app-i18n";

const PROMO_ERRORS: Record<string, TranslationKey> = {
  invalid_format: "pay.promoInvalid",
  not_found: "pay.promoNotFound",
  expired: "pay.promoExpired",
  used: "pay.promoUsed",
};

export function formatSum(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Qulflangan skrining natijasi: Click orqali to'lov yoki promokod. */
export function Paywall({
  assessmentId,
  amount,
  checking,
  notConfirmed,
  onUnlocked,
  onRecheck,
}: {
  assessmentId: string;
  amount: number | null;
  /** Click'dan qaytgandan keyin to'lov tekshirilmoqda */
  checking?: boolean;
  /** Qaytdi, lekin to'lov hali tasdiqlanmagan */
  notConfirmed?: boolean;
  onUnlocked: () => void;
  onRecheck: () => void;
}) {
  const { t } = useLocale();
  const tint = accent("test");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const pay = async () => {
    setError("");
    setPaying(true);
    try {
      const res = await startCheckout(assessmentId);
      if (res.paid) return onUnlocked();
      if (res.redirectUrl) window.location.href = res.redirectUrl;
    } catch {
      setError(t("pay.error"));
    } finally {
      setPaying(false);
    }
  };

  const redeem = async () => {
    setError("");
    setRedeeming(true);
    try {
      await redeemPromo(assessmentId, code);
      onUnlocked();
    } catch (e) {
      const key = e instanceof ApiError ? PROMO_ERRORS[e.message] : undefined;
      setError(t(key ?? "pay.error"));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <FadeIn>
      <Card className="items-center !gap-4 !py-8 text-center">
        <IconBadge icon={Lock} color={tint.fg} background={tint.soft} size={64} />
        <h2 className="t-subtitle">{t("pay.title")}</h2>
        <p className="t-body max-w-[460px] px-2 text-ink-2">{t("pay.body")}</p>

        {amount != null && (
          <div className="flex items-baseline gap-2">
            <span className="t-small text-ink-3">{t("pay.price")}</span>
            <span className="t-subtitle">
              {formatSum(amount)} {t("pay.currency")}
            </span>
          </div>
        )}

        {checking ? (
          <p className="t-small-bold text-ink-2">{t("pay.checking")}</p>
        ) : notConfirmed ? (
          <div className="flex w-full max-w-[360px] flex-col gap-2">
            <p className="t-small text-warning">{t("pay.notYet")}</p>
            <Button title={t("pay.recheck")} variant="secondary" size="md" onClick={onRecheck} />
          </div>
        ) : null}

        <div className="flex w-full max-w-[360px] flex-col gap-2">
          <Button title={t("pay.button")} icon={CreditCard} onClick={pay} loading={paying} disabled={checking} />
          <span className="t-small text-ink-3">{t("pay.methods")}</span>
        </div>

        {promoOpen ? (
          <div className="flex w-full max-w-[360px] gap-2">
            <input
              value={code}
              onChange={(e) => {
                setError("");
                setCode(e.target.value.toUpperCase());
              }}
              placeholder="DEMO-XXXXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              aria-label={t("pay.promoToggle")}
              className="h-11 min-w-0 flex-1 rounded-[14px] border border-line bg-element px-4 font-mono text-[15px] text-ink outline-none focus:border-tint"
            />
            <div className="w-[120px]">
              <Button title={t("pay.promoApply")} size="md" variant="ghost" onClick={redeem} loading={redeeming} disabled={!code.trim()} />
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setPromoOpen(true)} className="t-small-bold inline-flex items-center gap-1.5 text-tint hover:underline">
            <Ticket className="h-4 w-4" />
            {t("pay.promoToggle")}
          </button>
        )}

        {error ? <p className="t-small text-danger">{error}</p> : null}
      </Card>
    </FadeIn>
  );
}
