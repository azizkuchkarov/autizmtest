"use client";

import { AlertCircle, AlertTriangle, Check, ChevronRight, type LucideIcon } from "lucide-react";

import { useLocale } from "@/components/app/providers";
import { Card } from "@/components/app/ui";
import { formatAge } from "@/lib/app/age";
import { assessmentTier, type StoredAssessment } from "@/lib/app/history";

export { assessmentTier, nextScreeningDate } from "@/lib/app/history";
import type { RiskTier } from "@/lib/app/screening";
import { isScreeningV3 } from "@/lib/screening-v3/score";

export function riskColors(tier: RiskTier) {
  if (tier === "low") return { fg: "var(--success)", bg: "var(--success-soft)", gradient: ["#22C55E", "#10B981"] as [string, string] };
  if (tier === "moderate") return { fg: "var(--warning)", bg: "var(--warning-soft)", gradient: ["#F59E0B", "#F97316"] as [string, string] };
  return { fg: "var(--danger)", bg: "var(--danger-soft)", gradient: ["#F43F5E", "#E11D48"] as [string, string] };
}

// Brauzerlar uz-UZ uchun oy nomlarini to'g'ri chiqarmaydi ("2026 M10 17"), shuning uchun qo'lda
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export function useFormatDate() {
  const { locale } = useLocale();
  return (iso: string) => {
    const d = new Date(iso);
    if (locale === "ru") return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
  };
}

/** Test topshirilgan paytdagi aniq yosh (eski testlarda — yosh guruhi). */
export function useAssessmentAge() {
  const { t, locale } = useLocale();
  return (item: StoredAssessment) => (isScreeningV3(item.result) ? formatAge(item.result.ageMonths, locale) : t(`age.${item.ageGroup}`));
}

const LEVEL_ICON: Record<RiskTier, LucideIcon> = { low: Check, moderate: AlertCircle, high: AlertTriangle };

/** Daraja belgisi: raqamsiz, faqat rang va ikonka — ota-ona raqamni noto'g'ri talqin qilmasligi uchun. */
export function LevelBadge({ tier, size = 48 }: { tier: RiskTier; size?: number }) {
  const colors = riskColors(tier);
  const Icon = LEVEL_ICON[tier];
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: colors.bg, color: colors.fg }}>
      <Icon style={{ width: size * 0.45, height: size * 0.45 }} strokeWidth={2.5} />
    </span>
  );
}

/** Ro'yxatlarda ko'rsatiladigan natija qatori. */
export function ResultRow({ item }: { item: StoredAssessment }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const ageOf = useAssessmentAge();
  const tier = assessmentTier(item);
  const colors = riskColors(tier);
  return (
    <Card href={`/result/${item.id}`} className="!flex-row items-center !gap-4">
      <LevelBadge tier={tier} />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="t-heading text-[15.5px]" style={{ color: colors.fg }}>
          {t(`result.${tier}`)}
        </span>
        <span className="t-small text-ink-2">
          {formatDate(item.createdAt)} · {ageOf(item)}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-ink-3" />
    </Card>
  );
}
