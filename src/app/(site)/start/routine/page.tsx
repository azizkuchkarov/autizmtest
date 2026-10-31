"use client";

import { ArrowRight, Bell, BellOff, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Button, FadeIn } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";

const PRACTICE_SLOTS: { time: string; emoji: string; label: TranslationKey }[] = [
  { time: "10:00", emoji: "🌅", label: "routine.morning" },
  { time: "13:30", emoji: "☀️", label: "routine.noon" },
  { time: "17:00", emoji: "🌇", label: "routine.afternoon" },
  { time: "19:30", emoji: "🌙", label: "routine.evening" },
];

const DIARY_SLOTS = ["07:30", "08:30", "09:30"];

function FieldLabel({ children }: { children: string }) {
  return <span className="t-small-bold mt-2 text-[14.5px]">{children}</span>;
}

/** Brauzer bildirishnomalariga ruxsat holati. */
function usePermission() {
  return useSyncExternalStore(
    () => () => {},
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "default",
  );
}

function TimeChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-1 rounded-[18px] border-[1.5px] px-2 py-3 transition-transform active:scale-[0.97]"
      style={{ background: selected ? "var(--tint-soft)" : "var(--element)", borderColor: selected ? "var(--tint)" : "var(--border)" }}
    >
      {children}
    </button>
  );
}

/** Mashg'ulot vaqti: ota-ona kunning qaysi qismida shug'ullanishini tanlaydi — 15 daqiqa oldin eslatiladi. */
function RoutineScreen({ edit }: { edit: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const { child, updateChildFields } = useProfile();
  const [practice, setPractice] = useState(child?.practiceTime ?? "");
  const [diary, setDiary] = useState(child?.diaryTime ?? "08:30");
  const [reminders, setReminders] = useState(child?.remindersOn ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const permission = usePermission();
  const [, force] = useState(0);

  const customPractice = !!practice && !PRACTICE_SLOTS.some((s) => s.time === practice);
  const customDiary = !DIARY_SLOTS.includes(diary);

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    await Notification.requestPermission();
    force((n) => n + 1);
  };

  const save = async () => {
    if (!practice) return;
    setSaving(true);
    setError("");
    try {
      await updateChildFields({ practiceTime: practice, diaryTime: diary, remindersOn: reminders });
      router.replace(edit ? "/profile" : "/start/done");
    } catch {
      setError(t("common.offline"));
      setSaving(false);
    }
  };

  return (
    <StartScaffold
      back={edit}
      step={edit ? undefined : t("routine.step")}
      footer={<Button title={edit ? t("routine.save") : t("routine.next")} onClick={save} disabled={!practice} loading={saving} icon={edit ? Check : ArrowRight} />}
    >
      <FadeIn className="flex flex-col gap-2">
        <h1 className="t-title">{t("routine.title")}</h1>
        <p className="t-body text-ink-2">{t("routine.body")}</p>
      </FadeIn>

      <FadeIn delay={80} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PRACTICE_SLOTS.map((s) => (
          <TimeChip key={s.time} selected={practice === s.time} onClick={() => setPractice(s.time)}>
            <span className="text-[28px] leading-none" aria-hidden>
              {s.emoji}
            </span>
            <span className="t-small-bold text-[14px]">{t(s.label)}</span>
            <span className="t-small tabular-nums text-ink-3">{s.time}</span>
          </TimeChip>
        ))}
      </FadeIn>

      <FadeIn delay={120} className="flex items-center justify-between gap-3 rounded-[18px] border-[1.5px] border-line bg-element px-4 py-3" style={customPractice ? { borderColor: "var(--tint)" } : undefined}>
        <span className="t-small-bold text-[14.5px]">{t("routine.custom")}</span>
        <input
          type="time"
          value={practice}
          onChange={(e) => setPractice(e.target.value)}
          aria-label={t("routine.practiceAt")}
          className="rounded-[12px] border border-line bg-app px-3 py-2 text-[16px] font-semibold tabular-nums text-ink outline-none focus:border-tint"
        />
      </FadeIn>

      <FadeIn delay={160} className="flex flex-col gap-2">
        <FieldLabel>{t("routine.diaryTitle")}</FieldLabel>
        <p className="t-small -mt-1 text-ink-3">{t("routine.diaryBody")}</p>
        <div className="grid grid-cols-4 gap-2">
          {DIARY_SLOTS.map((time) => (
            <TimeChip key={time} selected={diary === time} onClick={() => setDiary(time)}>
              <span className="t-small-bold tabular-nums text-[15px]">{time}</span>
            </TimeChip>
          ))}
          <label
            className="flex items-center justify-center rounded-[18px] border-[1.5px] px-1"
            style={{ background: customDiary ? "var(--tint-soft)" : "var(--element)", borderColor: customDiary ? "var(--tint)" : "var(--border)" }}
          >
            <input
              type="time"
              value={diary}
              onChange={(e) => e.target.value && setDiary(e.target.value)}
              aria-label={t("routine.diaryTitle")}
              className="w-full bg-transparent text-center text-[14px] font-semibold tabular-nums text-ink outline-none"
            />
          </label>
        </div>
      </FadeIn>

      <FadeIn delay={200} className="flex flex-col gap-3 rounded-[24px] border border-line bg-element p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-tint-soft text-tint">
              {reminders ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </span>
            <span className="flex flex-col">
              <span className="t-small-bold text-[15px]">{t("routine.reminders")}</span>
              <span className="t-small text-ink-3">{t("routine.remindersHint")}</span>
            </span>
          </span>
          <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} className="h-5 w-5 shrink-0" style={{ accentColor: "var(--tint)" }} />
        </label>
        {reminders && permission !== "unsupported" && (
          <div className="flex flex-col gap-1.5 border-t border-line pt-3">
            {permission === "granted" ? (
              <span className="t-small-bold flex items-center gap-1.5 text-[var(--success)]">
                <Check className="h-4 w-4" /> {t("routine.allowed")}
              </span>
            ) : permission === "denied" ? (
              <span className="t-small text-[var(--warning)]">{t("routine.denied")}</span>
            ) : (
              <button type="button" onClick={askPermission} className="t-small-bold w-fit rounded-full bg-tint-soft px-4 py-2 text-tint">
                {t("routine.allowBrowser")}
              </button>
            )}
            <span className="t-small text-ink-3">{t("routine.browserNote")}</span>
          </div>
        )}
      </FadeIn>
      {error ? <p className="t-small text-[var(--danger)]">{error}</p> : null}
    </StartScaffold>
  );
}

function RoutineRoute() {
  const edit = !!useSearchParams().get("edit");
  const { loaded, child } = useProfile();
  if (!loaded) return null;
  // Profil serverdan yangilanganda boshlang'ich qiymatlar to'g'ri tushishi uchun kalit
  return <RoutineScreen key={child?.id ?? "none"} edit={edit} />;
}

export default function RoutinePage() {
  return (
    <Suspense>
      <RoutineRoute />
    </Suspense>
  );
}
