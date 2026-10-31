"use client";

import { Check, Moon, Sun, WifiOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { Button, Card, EmptyState, PageHeader, Screen, Segmented, Skeleton } from "@/components/app/ui";
import type { DiaryEntry } from "@/lib/app/api";
import { emptyDiary, sleepHours, useDiary } from "@/lib/app/diary";
import { dayKey, lastDays } from "@/lib/app/play-activities";
import type { TranslationKey } from "@/lib/app-i18n";

type Option<T> = { value: T; label: TranslationKey; emoji?: string };

/** Bitta tanlov guruhi; tanlangan variantni qayta bosish tanlovni bekor qiladi. */
function Choice<T extends string | number | boolean>({ label, options, value, onChange }: { label?: TranslationKey; options: Option<T>[]; value: T | null; onChange: (v: T | null) => void }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-2">
      {label ? <span className="t-small-bold text-[14px] text-ink-2">{t(label)}</span> : null}
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? null : o.value)}
              className={`t-small-bold flex items-center gap-1.5 rounded-[14px] border-[1.5px] px-3.5 py-2.5 text-[14.5px] active:scale-[0.97] ${
                on ? "border-tint bg-tint-soft text-tint" : "border-line bg-element text-ink hover:bg-muted"
              }`}
            >
              {o.emoji ? <span aria-hidden>{o.emoji}</span> : null}
              {t(o.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({ emoji, title, children }: { emoji: string; title: TranslationKey; children: ReactNode }) {
  const { t } = useLocale();
  return (
    <Card className="!gap-4">
      <span className="t-heading flex items-center gap-2 text-[17px]">
        <span aria-hidden>{emoji}</span>
        {t(title)}
      </span>
      {children}
    </Card>
  );
}

function TimeField({ icon: Icon, label, value, onChange }: { icon: typeof Sun; label: TranslationKey; value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useLocale();
  return (
    <label className="flex flex-1 flex-col gap-1.5 rounded-[16px] border-[1.5px] border-line bg-app p-3 focus-within:border-tint">
      <span className="t-small-bold flex items-center gap-1.5 text-[13px] text-ink-2">
        <Icon className="h-4 w-4" />
        {t(label)}
      </span>
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="bg-transparent text-[20px] font-bold tabular-nums text-ink outline-none"
      />
    </label>
  );
}

const MOODS: Option<number>[] = [
  { value: 1, label: "diary.mood1", emoji: "😣" },
  { value: 2, label: "diary.mood2", emoji: "🙁" },
  { value: 3, label: "diary.mood3", emoji: "😐" },
  { value: 4, label: "diary.mood4", emoji: "🙂" },
  { value: 5, label: "diary.mood5", emoji: "😄" },
];

/** Bir kunlik forma: mavjud yozuv bo'lsa u bilan to'ldiriladi. */
function DiaryForm({ date, initial, onSave }: { date: string; initial: DiaryEntry; onSave: (e: DiaryEntry) => Promise<void> }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [d, setD] = useState<DiaryEntry>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const set = <K extends keyof DiaryEntry>(key: K) => (value: DiaryEntry[K]) => setD((prev) => ({ ...prev, [key]: value }));
  const hours = sleepHours(d.bedTime, d.wakeTime);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      await onSave({ ...d, date, note: d.note?.trim() || null });
      router.push("/");
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <>
      <Section emoji="😴" title="diary.sleep">
        <div className="flex gap-3">
          <TimeField icon={Moon} label="diary.bedTime" value={d.bedTime} onChange={set("bedTime")} />
          <TimeField icon={Sun} label="diary.wakeTime" value={d.wakeTime} onChange={set("wakeTime")} />
        </div>
        {hours !== null ? <span className="t-small-bold -mt-1 text-tint">{t("diary.sleepHours").replace("{h}", String(hours))}</span> : null}
        <Choice
          label="diary.nightWakings"
          value={d.nightWakings}
          onChange={set("nightWakings")}
          options={[
            { value: 0, label: "diary.wake0" },
            { value: 1, label: "diary.wake1" },
            { value: 2, label: "diary.wake2" },
          ]}
        />
      </Section>

      <Section emoji="🙂" title="diary.mood">
        <div className="grid grid-cols-5 gap-2" role="radiogroup">
          {MOODS.map((m) => {
            const on = d.mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={t(m.label)}
                onClick={() => set("mood")(on ? null : m.value)}
                className={`flex flex-col items-center gap-1 rounded-[16px] border-[1.5px] py-2.5 active:scale-[0.96] ${on ? "border-tint bg-tint-soft" : "border-line bg-element"}`}
              >
                <span className="text-[30px] leading-none" aria-hidden>
                  {m.emoji}
                </span>
                <span className={`text-center text-[11px] font-semibold leading-tight ${on ? "text-tint" : "text-ink-3"}`}>{t(m.label)}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section emoji="🍽️" title="diary.food">
        <Choice
          label="diary.breakfast"
          value={d.breakfast}
          onChange={set("breakfast")}
          options={[
            { value: "full", label: "diary.full" },
            { value: "little", label: "diary.little" },
            { value: "none", label: "diary.none" },
          ]}
        />
        <Choice
          label="diary.appetite"
          value={d.appetite}
          onChange={set("appetite")}
          options={[
            { value: "good", label: "diary.good" },
            { value: "normal", label: "diary.normal" },
            { value: "poor", label: "diary.poor" },
          ]}
        />
      </Section>

      <Section emoji="🧩" title="diary.behavior">
        <Choice
          label="diary.meltdowns"
          value={d.meltdowns}
          onChange={set("meltdowns")}
          options={[
            { value: 0, label: "diary.melt0" },
            { value: 1, label: "diary.melt1" },
            { value: 2, label: "diary.melt2" },
          ]}
        />
        <Choice
          label="diary.repetitive"
          value={d.repetitive}
          onChange={set("repetitive")}
          options={[
            { value: "low", label: "diary.low" },
            { value: "mid", label: "diary.mid" },
            { value: "high", label: "diary.high" },
          ]}
        />
        <Choice
          label="diary.selfHarm"
          value={d.selfHarm}
          onChange={set("selfHarm")}
          options={[
            { value: false, label: "diary.no" },
            { value: true, label: "diary.yes" },
          ]}
        />
      </Section>

      <Section emoji="💬" title="diary.communication">
        <Choice
          label="diary.eyeContact"
          value={d.eyeContact}
          onChange={set("eyeContact")}
          options={[
            { value: "good", label: "diary.eyeGood" },
            { value: "some", label: "diary.eyeSome" },
            { value: "none", label: "diary.eyeNone" },
          ]}
        />
        <Choice
          label="diary.requests"
          value={d.requests}
          onChange={set("requests")}
          options={[
            { value: "words", label: "diary.reqWords" },
            { value: "gestures", label: "diary.reqGestures" },
            { value: "none", label: "diary.reqNone" },
          ]}
        />
      </Section>

      <Section emoji="🩺" title="diary.health">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["sick", "diary.sick", "🤒"],
              ["constipation", "diary.constipation", "😣"],
              ["medicine", "diary.medicine", "💊"],
            ] as const
          ).map(([key, label, emoji]) => {
            const on = d[key] === true;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                onClick={() => set(key)(on ? false : true)}
                className={`t-small-bold flex items-center gap-1.5 rounded-[14px] border-[1.5px] px-3.5 py-2.5 text-[14.5px] ${
                  on ? "border-[var(--warning)] bg-[var(--warning-soft)] text-ink" : "border-line bg-element text-ink hover:bg-muted"
                }`}
              >
                <span aria-hidden>{emoji}</span>
                {t(label)}
                {on ? <Check className="h-4 w-4 text-[var(--warning)]" /> : null}
              </button>
            );
          })}
        </div>
      </Section>

      <Section emoji="✏️" title="diary.note">
        <textarea
          value={d.note ?? ""}
          onChange={(e) => set("note")(e.target.value)}
          placeholder={t("diary.notePlaceholder")}
          rows={3}
          maxLength={2000}
          className="w-full rounded-[16px] border-[1.5px] border-line bg-app p-3 text-[15.5px] text-ink outline-none placeholder:text-ink-3 focus:border-tint"
        />
      </Section>

      <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] z-10 -mx-4 bg-gradient-to-t from-app via-app to-transparent px-4 pb-2 pt-4 sm:-mx-6 sm:px-6 md:bottom-0">
        <Button title={t("diary.save")} icon={Check} onClick={save} loading={saving} />
        {error ? <p className="t-small mt-2 text-center text-[var(--danger)]">{t("common.offline")}</p> : null}
        {initial.updatedAt ? (
          <p className="t-small mt-2 text-center text-ink-3">
            {t("diary.updated").replace(
              "{time}",
              new Date(initial.updatedAt).toLocaleTimeString(locale === "ru" ? "ru-RU" : "uz-UZ", { hour: "2-digit", minute: "2-digit" }),
            )}
          </p>
        ) : null}
      </div>
    </>
  );
}

function DiaryScreen() {
  const { t } = useLocale();
  const { child } = useProfile();
  const router = useRouter();
  const today = dayKey();
  const yesterday = lastDays(2)[1];
  const requested = useSearchParams().get("date");
  const date = requested === yesterday ? yesterday : today;
  const diary = useDiary(child?.id);

  return (
    <Screen>
      <PageHeader title={t("diary.title")} subtitle={child?.name ? `${child.name} — ${t("diary.subtitle")}` : t("diary.subtitle")} />
      <Segmented
        options={[
          { value: today, label: t("diary.today") },
          { value: yesterday, label: t("diary.yesterday") },
        ]}
        value={date}
        onChange={(v) => router.replace(v === today ? "/diary" : `/diary?date=${v}`, { scroll: false })}
      />
      {diary.error && !diary.entries ? (
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={diary.reload} />
      ) : !diary.entries ? (
        <div className="flex flex-col gap-4">
          <Skeleton height={180} />
          <Skeleton height={120} />
          <Skeleton height={180} />
        </div>
      ) : (
        <DiaryForm key={date} date={date} initial={diary.byDate(date) ?? emptyDiary(date)} onSave={diary.save} />
      )}
    </Screen>
  );
}

export default function DiaryPage() {
  return (
    <Suspense>
      <DiaryScreen />
    </Suspense>
  );
}
