"use client";

import { CreditCard, Lock } from "lucide-react";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { accent, Button, Card, FadeIn, IconBadge } from "@/components/app/ui";
import { refreshLessonAccess } from "@/hooks/use-lesson-access";
import { startCheckout, type LessonAccess } from "@/lib/app/api";

export function formatSum(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Darslar yopiq: oylik kirish uchun Click orqali to'lov. */
export function LessonsPaywall({
  access,
  checking,
  notConfirmed,
  onRecheck,
  compact,
}: {
  access: LessonAccess;
  /** Click'dan qaytgandan keyin to'lov tekshirilmoqda */
  checking?: boolean;
  /** Qaytdi, lekin to'lov hali tasdiqlanmagan */
  notConfirmed?: boolean;
  onRecheck?: () => void;
  /** Darslar ro'yxati tepasidagi ixcham ko'rinish */
  compact?: boolean;
}) {
  const { t } = useLocale();
  const tint = accent("lessons");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setError("");
    setPaying(true);
    try {
      const res = await startCheckout();
      if (res.paid) await refreshLessonAccess();
      else if (res.redirectUrl) window.location.href = res.redirectUrl;
    } catch {
      setError(t("pay.error"));
    } finally {
      setPaying(false);
    }
  };

  return (
    <FadeIn>
      <Card className={`items-center !gap-3.5 text-center ${compact ? "!py-6" : "!py-8"}`}>
        <IconBadge icon={Lock} color={tint.fg} background={tint.soft} size={compact ? 52 : 64} />
        <h2 className={compact ? "t-heading text-[19px]" : "t-subtitle"}>{t("pay.title")}</h2>
        <p className="t-body max-w-[460px] px-2 text-ink-2">{t("pay.body")}</p>

        {access.amount != null && (
          <div className="flex items-baseline gap-2">
            <span className="t-subtitle">
              {formatSum(access.amount)} {t("pay.currency")}
            </span>
            <span className="t-small text-ink-3">/ {t("pay.perDays").replace("{n}", String(access.days))}</span>
          </div>
        )}

        {checking ? (
          <p className="t-small-bold text-ink-2">{t("pay.checking")}</p>
        ) : notConfirmed ? (
          <div className="flex w-full max-w-[360px] flex-col gap-2">
            <p className="t-small text-warning">{t("pay.notYet")}</p>
            {onRecheck ? <Button title={t("pay.recheck")} variant="secondary" size="md" onClick={onRecheck} /> : null}
          </div>
        ) : null}

        {access.purchasable ? (
          <div className="flex w-full max-w-[360px] flex-col gap-2">
            <Button title={t("pay.button")} icon={CreditCard} onClick={pay} loading={paying} disabled={checking} />
            <span className="t-small text-ink-3">{t("pay.methods")}</span>
          </div>
        ) : null}

        {error ? <p className="t-small text-danger">{error}</p> : null}
      </Card>
    </FadeIn>
  );
}
