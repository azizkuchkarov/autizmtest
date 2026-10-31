"use client";

import { AlertTriangle, ArrowRight, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppSplash, useOnboardingGate } from "@/components/app/app-shell";
import { useLocale, useProfile } from "@/components/app/providers";
import { Questionnaire } from "@/components/app/questionnaire";
import { Button, Card } from "@/components/app/ui";
import { useFormatDate } from "@/components/app/result-summary";
import { createAssessmentV3 } from "@/lib/app/api";
import { getAssessment, newLocalId, saveAssessment } from "@/lib/app/history";
import type { ScreeningResult } from "@/lib/app/screening";
import { BAND_LABEL, bandForMonths, itemsFor, SECTIONS } from "@/lib/screening-v3/items";
import { ageInMonths, needsFollowUp, scoreScreeningV3 } from "@/lib/screening-v3/score";

const MONTHS: Record<"uz" | "ru", string[]> = {
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
};

/** Eski profillarda tug'ilgan oy yo'q — test oldidan bir marta so'raladi. */
function MonthPrompt() {
  const { t, locale } = useLocale();
  const { child, updateChildFields } = useProfile();
  const [month, setMonth] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const disabled = (m: number) => child?.birthYear === now.getFullYear() && m > now.getMonth() + 1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-4 bg-app px-6 pt-10">
      <span className="text-[52px]" aria-hidden>
        🎂
      </span>
      <h1 className="t-title">{t("v3.monthTitle")}</h1>
      <p className="t-body text-ink-2">{t("v3.monthBody")}</p>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS[locale].map((label, i) => (
          <button
            key={label}
            disabled={disabled(i + 1)}
            onClick={() => setMonth(i + 1)}
            aria-pressed={month === i + 1}
            className="t-small-bold rounded-[14px] border-[1.5px] py-3 text-[14.5px] disabled:opacity-35"
            style={{ background: month === i + 1 ? "var(--tint)" : "var(--element)", borderColor: month === i + 1 ? "var(--tint)" : "var(--border)", color: month === i + 1 ? "#fff" : "var(--text)" }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <Button
          title={t("common.next")}
          icon={ArrowRight}
          disabled={!month}
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await updateChildFields({ birthMonth: month }).catch(() => setSaving(false));
          }}
        />
      </div>
    </div>
  );
}

/** 16 oydan kichik: skrining o'tkazilmaydi — kuzatish uchun xavf belgilari. */
function TooYoung({ months }: { months: number }) {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const at16 = new Date();
  at16.setMonth(at16.getMonth() + (16 - months));
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[600px] flex-col gap-4 bg-app px-6 pt-10">
      <CalendarClock className="h-12 w-12 text-tint" />
      <h1 className="t-title">{t("v3.youngTitle")}</h1>
      <p className="t-body text-ink-2">{t("v3.youngBody").replace("{m}", String(months)).replace("{date}", formatDate(at16.toISOString()))}</p>
      <Card className="!gap-2.5">
        {(["v3.young1", "v3.young2", "v3.young3"] as const).map((k) => (
          <p key={k} className="t-body flex items-start gap-2">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[var(--warning)]" />
            {t(k)}
          </p>
        ))}
      </Card>
      <Button title={t("common.back")} variant="secondary" href="/test" />
    </div>
  );
}

function ScreeningRun() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { child, phone } = useProfile();

  if (!child) return null;
  if (!child.birthMonth) return <MonthPrompt />;

  const months = ageInMonths(child.birthYear, child.birthMonth);
  const band = bandForMonths(months);
  if (!band) return <TooYoung months={months} />;

  const items = itemsFor(band, months);
  const minutes = Math.max(5, Math.round(items.length * 0.35));
  const age = months < 36 ? t("v3.ageMonths").replace("{m}", String(months)) : `${Math.floor(months / 12)} ${t("common.years")}`;

  return (
    <Questionnaire
      draftKey={`autizm_screening_draft_v3:${child.id}:${band}`}
      exitHref="/test"
      welcome={{
        badge: BAND_LABEL[band][locale],
        title: t("v3.welcomeTitle"),
        body: t("v3.welcomeBody").replace("{n}", String(items.length)).replace("{m}", String(minutes)).replace("{age}", age),
        tips: [t("v3.tip1"), t("v3.tip2"), t("v3.tip3")],
      }}
      sections={SECTIONS.map((s) => ({ id: s.id, emoji: s.emoji, title: s.title[locale], intro: s.intro[locale] }))}
      items={items.map((i) => ({ id: i.id, section: i.section, text: i.text[locale], example: i.example?.[locale], kind: i.kind, followUp: i.followUp?.map((f) => f[locale]) }))}
      needsFollowUp={(q, a) => {
        const item = items.find((i) => i.id === q.id);
        return !!item && needsFollowUp(item, a);
      }}
      onSubmit={async (answers, followUps) => {
        const result = scoreScreeningV3({ months, answers, followUps });
        // Natija brauzerda darhol hisoblanadi; server nusxasi akkaunt tarixi va AI xulosa uchun
        let serverId: string | null = null;
        try {
          const res = await createAssessmentV3({ testType: "screening", ageMonths: months, answers, followUps, childId: child.id, childGender: child.gender, phone: phone || undefined });
          serverId = res.assessmentId;
        } catch {
          serverId = null;
        }
        const id = newLocalId();
        await saveAssessment({ id, serverId, createdAt: new Date().toISOString(), ageGroup: result.ageGroupId, childGender: child.gender, result: result as unknown as ScreeningResult });
        const saved = await getAssessment(id);
        if (!saved && serverId) return router.replace(`/result/${serverId}`);
        if (!saved) throw new Error("not saved");
        router.replace(`/result/${id}`);
      }}
    />
  );
}

export default function ScreeningPage() {
  const ready = useOnboardingGate();
  if (!ready) return <AppSplash />;
  return <ScreeningRun />;
}
