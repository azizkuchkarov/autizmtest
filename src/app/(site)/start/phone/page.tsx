"use client";

import { CheckCircle2, Lock, MessageSquare, Send, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { accent, Button, FadeIn, IconBadge } from "@/components/app/ui";
import { requestOtp, type OtpChannel } from "@/lib/app/api";

/** 901234567 → "90 123 45 67" */
function formatPhoneDigits(digits: string) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

export default function PhonePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const a = accent("test");
  const [digits, setDigits] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState<OtpChannel | null>(null);
  const [error, setError] = useState("");

  const valid = digits.length === 9;

  const onSubmit = async (channel: OtpChannel) => {
    if (!valid || loading) return;
    setLoading(channel);
    setError("");
    const phone = `+998${digits}`;
    try {
      const res = await requestOtp(phone, channel, locale);
      const params = new URLSearchParams({
        phone,
        channel,
        ...(res.devCode ? { devCode: res.devCode } : {}),
        ...(res.link ? { link: res.link } : {}),
        ...(res.sent === false ? { sent: "0" } : {}),
      });
      router.push(`/start/verify?${params}`);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Network error" ? e.message : t("common.offline"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <StartScaffold
      back={false}
      footer={
        <div className="flex flex-col gap-2">
          <Button
            title={t("phone.sendTelegram")}
            onClick={() => onSubmit("telegram")}
            disabled={!valid || loading === "sms"}
            loading={loading === "telegram"}
            icon={Send}
          />
          <Button
            title={t("phone.sendSms")}
            variant="secondary"
            onClick={() => onSubmit("sms")}
            disabled={!valid || loading === "telegram"}
            loading={loading === "sms"}
            icon={MessageSquare}
          />
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit("telegram");
        }}
        className="contents"
      >
        <FadeIn className="mt-6 flex flex-col gap-4">
          <IconBadge icon={Smartphone} color={a.fg} background={a.soft} size={64} />
          <h1 className="t-title">{t("phone.title")}</h1>
          <p className="t-body text-ink-2">{t("phone.subtitle")}</p>
        </FadeIn>

        <FadeIn delay={100} className="mt-2 flex flex-col gap-2">
          <label
            className="flex h-16 items-center rounded-[18px] border-[1.5px] bg-element pr-4"
            style={{ borderColor: error ? "var(--danger)" : focused ? "var(--tint)" : "var(--border)" }}
          >
            <span className="flex h-[60%] items-center gap-2 border-r border-line px-4">
              <span className="text-xl">🇺🇿</span>
              <span className="t-heading text-[19px]">+998</span>
            </span>
            <input
              value={formatPhoneDigits(digits)}
              onChange={(e) => {
                setError("");
                setDigits(e.target.value.replace(/\D/g, "").slice(0, 9));
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="90 123 45 67"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              maxLength={12}
              aria-label={t("phone.title")}
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-[21px] font-bold tracking-wide text-ink tabular-nums outline-none placeholder:text-ink-3"
            />
            {valid ? <CheckCircle2 className="h-[22px] w-[22px] text-success" /> : null}
          </label>
          {error ? (
            <p className="t-small text-danger">{error}</p>
          ) : (
            <p className="t-small flex items-center gap-1.5 text-ink-3">
              <Lock className="h-3 w-3" />
              {t("phone.privacy")}
            </p>
          )}
        </FadeIn>
      </form>
    </StartScaffold>
  );
}
