"use client";

import { ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Avatar } from "@/components/app/avatar";
import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Button, FadeIn } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";
import type { ChildRecord } from "@/lib/app/api";
import { GENDERS } from "@/lib/app/screening";

const YEARS_BACK = 12;

/** Brauzerlar uz-UZ uchun oy nomlarini to'g'ri chiqarmaydi — qo'lda */
const MONTHS: Record<"uz" | "ru", string[]> = {
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
};

function FieldLabel({ children }: { children: string }) {
  return <span className="t-small-bold mt-2 text-[14.5px]">{children}</span>;
}

function ChildScreen({ edit, initial }: { edit: string | null; initial: ChildRecord | null }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: YEARS_BACK + 1 }, (_, i) => now - i);
  }, []);

  // Tahrirlashda joriy ma'lumotlar bilan to'ldiramiz
  const [name, setName] = useState(initial?.name ?? "");
  const [birthYear, setBirthYear] = useState<number | null>(initial?.birthYear ?? null);
  const [birthMonth, setBirthMonth] = useState<number | null>(initial?.birthMonth ?? null);
  const [gender, setGender] = useState<string | null>(initial?.gender ?? null);

  const now = new Date();
  // Kelajakdagi oyni tanlab bo'lmaydi (joriy yil uchun)
  const monthDisabled = (m: number) => birthYear === now.getFullYear() && m > now.getMonth() + 1;
  const canContinue = name.trim().length > 0 && birthYear !== null && birthMonth !== null && !monthDisabled(birthMonth) && gender !== null;

  const onContinue = () => {
    if (!canContinue) return;
    const params = new URLSearchParams({
      name: name.trim(),
      birthYear: String(birthYear),
      birthMonth: String(birthMonth),
      gender: gender!,
      ...(edit ? { edit: "1" } : {}),
    });
    router.push(`/start/avatar?${params}`);
  };

  return (
    <StartScaffold
      back={!!edit}
      step={t("child.step")}
      footer={<Button title={t("child.next")} onClick={onContinue} disabled={!canContinue} icon={ArrowRight} />}
    >
      <FadeIn className="flex flex-col gap-2">
        <h1 className="t-title">{t("child.title")}</h1>
        <p className="t-body text-ink-2">{t("child.subtitle")}</p>
      </FadeIn>

      <FadeIn delay={80} className="flex flex-col gap-2">
        <FieldLabel>{t("child.name")}</FieldLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onContinue()}
          placeholder={t("child.namePlaceholder")}
          autoCapitalize="words"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          className="rounded-[18px] border-[1.5px] border-line bg-element px-4 py-[15px] text-[16.5px] font-semibold text-ink outline-none placeholder:text-ink-3 focus:border-tint"
        />
      </FadeIn>

      <FadeIn delay={140} className="flex flex-col gap-2">
        <FieldLabel>{t("child.birthYear")}</FieldLabel>
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {years.map((y) => {
            const selected = birthYear === y;
            const age = new Date().getFullYear() - y;
            return (
              <button
                key={y}
                onClick={() => setBirthYear(y)}
                aria-pressed={selected}
                className="flex w-[84px] shrink-0 flex-col items-center gap-0.5 rounded-[18px] border-[1.5px] py-3 transition-transform active:scale-[0.97] sm:w-auto"
                style={{ background: selected ? "var(--tint)" : "var(--element)", borderColor: selected ? "var(--tint)" : "var(--border)" }}
              >
                <span className="t-heading tabular-nums" style={{ color: selected ? "#fff" : "var(--text)" }}>
                  {y}
                </span>
                <span className="text-xs font-medium" style={{ color: selected ? "rgba(255,255,255,0.8)" : "var(--text-tertiary)" }}>
                  {age < 1 ? t("child.ageUnder1") : t("child.age").replace("{n}", String(age))}
                </span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      <FadeIn delay={170} className="flex flex-col gap-2">
        <FieldLabel>{t("child.birthMonth")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {MONTHS[locale].map((label, i) => {
            const m = i + 1;
            const selected = birthMonth === m;
            const disabled = monthDisabled(m);
            return (
              <button
                key={m}
                onClick={() => setBirthMonth(m)}
                disabled={disabled}
                aria-pressed={selected}
                className="t-small-bold rounded-[14px] border-[1.5px] py-2.5 text-[14px] transition-transform active:scale-[0.97] disabled:opacity-35"
                style={{
                  background: selected ? "var(--tint)" : "var(--element)",
                  borderColor: selected ? "var(--tint)" : "var(--border)",
                  color: selected ? "#fff" : "var(--text)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FadeIn>

      <FadeIn delay={200} className="flex flex-col gap-2">
        <FieldLabel>{t("child.gender")}</FieldLabel>
        <div className="flex gap-4">
          {GENDERS.map((g) => {
            const selected = gender === g;
            return (
              <button
                key={g}
                onClick={() => setGender(g)}
                aria-pressed={selected}
                className="flex flex-1 flex-col items-center gap-2 rounded-[24px] border-[1.5px] py-[18px] transition-transform active:scale-[0.97]"
                style={{ background: selected ? "var(--tint-soft)" : "var(--element)", borderColor: selected ? "var(--tint)" : "var(--border)" }}
              >
                <Avatar id={g === "Qiz" ? "girl-1" : "boy-1"} size={72} animated={selected} />
                <span className="t-heading" style={{ color: selected ? "var(--tint)" : "var(--text)" }}>
                  {t(`gender.${g}` as TranslationKey)}
                </span>
              </button>
            );
          })}
        </div>
      </FadeIn>
    </StartScaffold>
  );
}

function ChildRoute() {
  const edit = useSearchParams().get("edit");
  const { child, loaded } = useProfile();
  if (!loaded) return null;
  return <ChildScreen edit={edit} initial={edit ? child : null} />;
}

export default function ChildPage() {
  return (
    <Suspense>
      <ChildRoute />
    </Suspense>
  );
}
