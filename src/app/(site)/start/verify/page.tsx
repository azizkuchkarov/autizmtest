"use client";

import { MessageSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { accent, Button, FadeIn, IconBadge } from "@/components/app/ui";
import { requestOtp, verifyOtp } from "@/lib/app/api";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

/** +998901234567 → "+998 90 123 45 67" */
function prettyPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(3);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

function VerifyScreen() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const { t } = useLocale();
  const { signIn } = useProfile();
  const router = useRouter();
  const a = accent("exercises");
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [devCode, setDevCode] = useState(params.get("devCode") ?? "");
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (!phone) router.replace("/start/phone");
  }, [phone, router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const submit = async (value: string) => {
    if (value.length < 4 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await verifyOtp(phone, value);
      await signIn(res.user.phone);
      // Keyingi kerakli qadamni (bola profili yoki asosiy qism) ilova karkasi tanlaydi
      router.replace("/");
    } catch (e) {
      setShakeKey((k) => k + 1);
      setError(e instanceof Error && e.message !== "Network error" ? e.message : t("common.offline"));
      setCode("");
      input.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    const next = v.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setError("");
    setCode(next);
    if (next.length === CODE_LENGTH) submit(next);
  };

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    setError("");
    try {
      const res = await requestOtp(phone);
      if (res.devCode) setDevCode(res.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.offline"));
    }
  };

  return (
    <StartScaffold footer={<Button title={t("verify.confirm")} onClick={() => submit(code)} disabled={code.length < 4} loading={loading} />}>
      <FadeIn className="mt-6 flex flex-col gap-4">
        <IconBadge icon={MessageSquare} color={a.fg} background={a.soft} size={64} />
        <h1 className="t-title">{t("verify.title")}</h1>
        <p className="t-body text-ink-2">{t("verify.subtitle").replace("{phone}", prettyPhone(phone))}</p>
      </FadeIn>

      <FadeIn delay={100} className="mt-2">
        <div key={shakeKey} className={shakeKey ? "animate-shake" : undefined}>
          <label className="relative flex cursor-text justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const char = code[i] ?? "";
              const active = i === code.length && !loading;
              return (
                <span
                  key={i}
                  className="flex aspect-[0.82] max-h-[68px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] bg-element text-[26px] font-extrabold"
                  style={{ borderColor: error ? "var(--danger)" : active ? "var(--tint)" : char ? "var(--text-tertiary)" : "var(--border)" }}
                >
                  {char}
                </span>
              );
            })}
            {/* Ko'rinmas input: klaviatura va SMS'dan avtomatik to'ldirish uchun */}
            <input
              ref={input}
              value={code}
              onChange={(e) => onChange(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={CODE_LENGTH}
              aria-label={t("verify.title")}
              className="absolute inset-0 h-full w-full opacity-0"
            />
          </label>
        </div>
      </FadeIn>

      {error ? <p className="t-small text-danger">{error}</p> : null}
      {devCode ? <p className="t-small text-ink-3">{t("verify.devHint").replace("{code}", devCode)}</p> : null}

      <div className="mt-2 flex justify-between">
        {seconds > 0 ? (
          <span className="t-small-bold text-ink-3 tabular-nums">{t("verify.resendIn").replace("{s}", String(seconds))}</span>
        ) : (
          <button onClick={resend} className="t-small-bold text-tint hover:underline">
            {t("verify.resend")}
          </button>
        )}
        <button onClick={() => router.back()} className="t-small-bold text-tint hover:underline">
          {t("verify.change")}
        </button>
      </div>
    </StartScaffold>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyScreen />
    </Suspense>
  );
}
