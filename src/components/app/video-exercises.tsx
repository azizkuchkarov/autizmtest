"use client";

import { BadgeCheck, Check, CheckCircle2, ChevronRight, Minus, MonitorPlay, Play, Plus, WifiOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { ACCENT_GRADIENT, accent, Button, Card, ConfirmDialog, EmptyState, gradient, ProgressBar, Skeleton } from "@/components/app/ui";
import type { ExercisePlan, Video } from "@/lib/app/api";
import { exerciseTotals, planProgress, planTotals, useExercisePlans, useExerciseVideos } from "@/lib/app/exercises";

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const cls = "flex h-10 w-10 items-center justify-center rounded-[13px] bg-muted text-ink disabled:opacity-40";
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="truncate text-[12.5px] text-ink-2">{label}</span>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="-" disabled={value <= min} onClick={() => onChange(value - 1)} className={cls}>
          <Minus className="h-4 w-4" strokeWidth={3} />
        </button>
        <span className="t-heading min-w-7 text-center text-[19px] tabular-nums">{value}</span>
        <button type="button" aria-label="+" disabled={value >= max} onClick={() => onChange(value + 1)} className={cls}>
          <Plus className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/** Video ostida: mutaxassis tavsiyasi va ota-ona o'z mashqlariga qo'shishi. */
export function ExerciseAddCard({ video }: { video: Video }) {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const { plans, add } = useExercisePlans(child?.id, locale);
  const [reps, setReps] = useState(video.exercise?.reps ?? 3);
  const [days, setDays] = useState(video.exercise?.days ?? 7);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  if (!video.exercise) return null;
  const green = accent("exercises");

  const plan = plans?.find((p) => p.videoId === video.id && !p.completedAt);
  if (plan) {
    const p = planProgress(plan);
    return (
      <div className="flex flex-col gap-3 rounded-[20px] p-4" style={{ background: green.soft }}>
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 shrink-0" style={{ color: green.fg }} />
          <span className="flex flex-col">
            <span className="t-heading text-[16px]" style={{ color: green.fg }}>
              {t("ex.added")}
            </span>
            <span className="t-small text-ink-2">
              {t("ex.todayCount").replace("{n}", String(p.today)).replace("{total}", String(plan.repsPerDay))} · {t("ex.dayOf").replace("{n}", String(p.currentDay)).replace("{total}", String(plan.days))}
            </span>
          </span>
        </span>
        <div className="md:max-w-[280px]">
          <Button title={t("ex.openExercises")} size="md" variant="secondary" href="/video-exercises" />
        </div>
      </div>
    );
  }

  const onAdd = async () => {
    setSaving(true);
    setError(false);
    try {
      await add(video.id, reps, days);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="!gap-4">
      <div className="flex flex-col gap-1">
        <span className="t-caption" style={{ color: green.fg }}>
          {t("ex.chip")}
        </span>
        <h2 className="t-heading text-[17px]">{t("ex.cardTitle")}</h2>
        <p className="t-small text-ink-2">{t("ex.advice").replace("{reps}", String(video.exercise.reps)).replace("{days}", String(video.exercise.days))}</p>
      </div>
      <div className="flex gap-4 md:max-w-[420px]">
        <Stepper label={t("ex.perDay")} value={reps} min={1} max={10} onChange={setReps} />
        <Stepper label={t("ex.days")} value={days} min={1} max={60} onChange={setDays} />
      </div>
      {error ? <p className="t-small text-[var(--danger,#E11D48)]">{t("common.offline")}</p> : null}
      <div className="md:max-w-[280px]">
        <Button title={t("ex.add")} size="md" loading={saving} icon={Plus} onClick={onAdd} />
      </div>
    </Card>
  );
}

function Thumb({ video }: { video: Video }) {
  return (
    <span className="relative flex h-[62px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[12px]" style={{ background: gradient(ACCENT_GRADIENT.exercises) }}>
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tashqi CDN muqovasi
        <img src={video.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <span className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[rgb(14_19_48/0.45)] text-white">
        <Play className="ml-0.5 h-3 w-3" fill="currentColor" strokeWidth={0} />
      </span>
    </span>
  );
}

function PlanCard({ plan, index, onLog, onRemove }: { plan: ExercisePlan; index: number; onLog: (delta: 1 | -1) => Promise<void>; onRemove: () => void }) {
  const { t } = useLocale();
  const green = accent("exercises").fg;
  const p = planProgress(plan);
  const totals = planTotals(plan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const log = async (delta: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await onLog(delta);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="!gap-4">
      <Link href={`/video/${plan.videoId}`} className="group flex items-center gap-4">
        <Thumb video={plan.video} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="t-heading line-clamp-2 text-[15.5px] leading-[20px] group-hover:text-tint">
            {index + 1}. {plan.video.title}
          </span>
          <span className="t-small text-ink-2">
            {t("ex.dayOf").replace("{n}", String(p.currentDay)).replace("{total}", String(plan.days))} ·{" "}
            {t("ex.planTotal").replace("{done}", String(totals.done)).replace("{total}", String(totals.total))}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: plan.repsPerDay }, (_, i) => (
            <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i < p.today ? green : "var(--muted)" }} />
          ))}
        </div>
        <span className="t-small-bold text-[13px] tabular-nums" style={{ color: p.doneToday ? green : "var(--text-secondary)" }}>
          {t("ex.todayCount").replace("{n}", String(p.today)).replace("{total}", String(plan.repsPerDay))}
        </span>
      </div>
      {error ? <p className="t-small text-[var(--danger,#E11D48)]">{t("common.offline")}</p> : null}
      {p.doneToday ? (
        <span className="t-small-bold flex items-center gap-1.5" style={{ color: green }}>
          <CheckCircle2 className="h-[18px] w-[18px]" />
          {t("ex.doneToday")}
        </span>
      ) : (
        <div className="flex gap-2">
          <Button title={t("ex.done")} size="md" loading={busy} icon={Check} onClick={() => log(1)} className="flex-1" />
          <Button title={t("ex.watch")} size="md" variant="secondary" href={`/video/${plan.videoId}`} className="flex-1 whitespace-nowrap !px-2" />
        </div>
      )}
      <div className="flex justify-between">
        {p.today > 0 ? (
          <button onClick={() => log(-1)} className="t-small-bold text-ink-2 hover:underline">
            {t("ex.undo")}
          </button>
        ) : (
          <span />
        )}
        <button onClick={onRemove} className="t-small text-ink-3 hover:underline">
          {t("ex.remove")}
        </button>
      </div>
    </Card>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[14px] bg-muted px-2.5 py-2.5">
      <span className="t-heading text-[22px] leading-7 tabular-nums" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="text-[12px] leading-[15px] text-ink-2">{label}</span>
    </span>
  );
}

/** Mashq boshlanmagan video: tavsiya va ikki tugma. */
function AvailableCard({ video, index, onStart }: { video: Video; index: number; onStart: () => Promise<void> }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const start = async () => {
    setBusy(true);
    setError(false);
    try {
      await onStart();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="!gap-4">
      <Link href={`/video/${video.id}`} className="group flex items-center gap-4">
        <Thumb video={video} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="t-heading line-clamp-2 text-[15.5px] leading-[20px] group-hover:text-tint">
            {index + 1}. {video.title}
          </span>
          {video.exercise ? (
            <span className="t-small text-ink-2">
              {t("ex.advice").replace("{reps}", String(video.exercise.reps)).replace("{days}", String(video.exercise.days))} ·{" "}
              {t("ex.perVideoTotal").replace("{n}", String(video.exercise.reps * video.exercise.days))}
            </span>
          ) : null}
        </span>
      </Link>
      {error ? <p className="t-small text-[var(--danger,#E11D48)]">{t("common.offline")}</p> : null}
      <div className="flex gap-2">
        <Button title={t("common.start")} size="md" loading={busy} icon={Plus} onClick={start} className="flex-1" />
        <Button title={t("ex.watch")} size="md" variant="secondary" href={`/video/${video.id}`} className="flex-1 whitespace-nowrap" />
      </div>
    </Card>
  );
}

/** Mashqlar sahifasidagi kirish kartasi: videolar faqat shu bosilganda ochiladi. */
export function VideoExercisesEntry() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const { plans } = useExercisePlans(child?.id, locale);
  const { videos } = useExerciseVideos(locale);
  const active = (plans ?? []).filter((p) => !p.completedAt);
  const doneToday = active.filter((p) => planProgress(p).doneToday).length;
  const totals = videos ? exerciseTotals(videos, plans ?? []) : null;
  const summary = !totals
    ? "\u00a0"
    : totals.videos === 0
      ? t("ex.entrySoon")
      : t("ex.entrySummary").replace("{n}", String(totals.videos)).replace("{m}", String(totals.total));

  return (
    <Link href="/video-exercises" className="flex items-center gap-3.5 rounded-[24px] border border-line bg-element p-4 shadow-card transition-transform active:scale-[0.99]">
      <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[17px] text-white" style={{ background: gradient(ACCENT_GRADIENT.exercises) }}>
        <MonitorPlay className="h-[26px] w-[26px]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="t-heading text-[18px]">{t("ex.videoTitle")}</span>
        <span className="t-small text-ink-2">{summary}</span>
        {active.length > 0 ? (
          <span className="text-[12.5px] font-bold" style={{ color: accent("exercises").fg }}>
            {t("ex.entryToday").replace("{n}", String(doneToday)).replace("{total}", String(active.length))}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
    </Link>
  );
}

/** Video mashqlar: admin belgilagan tartibda, har birining holati bilan. */
export function VideoExercisesList() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const { plans, log, remove, add } = useExercisePlans(child?.id, locale);
  const { videos, error, reload } = useExerciseVideos(locale);
  const [removing, setRemoving] = useState<ExercisePlan | null>(null);
  const green = accent("exercises").fg;

  if (error && !videos) return <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={reload} />;
  if (!videos || !plans)
    return (
      <>
        <Skeleton height={150} />
        <Skeleton height={150} />
      </>
    );

  // Belgisi olib tashlangan, lekin ota-ona boshlagan mashqlar ro'yxat oxirida qoladi
  const known = new Set(videos.map((v) => v.id));
  const rest = plans.filter((p) => !known.has(p.videoId)).map((p) => p.video);
  const list = [...videos, ...rest];
  const totals = exerciseTotals(videos, plans);

  if (list.length === 0) return <EmptyState icon={MonitorPlay} title={t("ex.videoTitle")} body={t("ex.listEmpty")} />;

  return (
    <>
      <p className="t-body text-ink-2">{t("ex.listSubtitle")}</p>
      <Card className="!gap-4">
        <div className="flex gap-2">
          <SummaryTile label={t("ex.statVideos")} value={totals.videos} />
          <SummaryTile label={t("ex.statTotal")} value={totals.total} />
          <SummaryTile label={t("ex.statDone")} value={totals.done} color={green} />
        </div>
        <ProgressBar value={totals.total > 0 ? (totals.done / totals.total) * 100 : 0} color={green} height={7} />
      </Card>
      {list.map((video, i) => {
        const plan = plans.find((p) => p.videoId === video.id);
        if (!plan) return <AvailableCard key={video.id} video={video} index={i} onStart={() => add(video.id, video.exercise?.reps ?? 3, video.exercise?.days ?? 7)} />;
        if (!plan.completedAt) return <PlanCard key={video.id} plan={plan} index={i} onLog={(delta) => log(plan.id, delta)} onRemove={() => setRemoving(plan)} />;
        return (
          <Card key={video.id} className="!flex-row items-center !gap-2">
            <BadgeCheck className="h-[22px] w-[22px] shrink-0" style={{ color: green }} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="t-small-bold line-clamp-2">
                {i + 1}. {plan.video.title}
              </span>
              <span className="t-small text-ink-3">{t("ex.finishedRow").replace("{days}", String(plan.days)).replace("{reps}", String(plan.repsPerDay))}</span>
            </span>
            <button onClick={() => add(plan.videoId, plan.repsPerDay, plan.days).catch(() => {})} className="t-small-bold shrink-0 text-tint hover:underline">
              {t("ex.again")}
            </button>
          </Card>
        );
      })}
      <ConfirmDialog
        open={!!removing}
        title={t("ex.remove")}
        body={t("ex.removeConfirm")}
        confirmLabel={t("ex.remove")}
        cancelLabel={t("common.back")}
        destructive
        onConfirm={() => {
          if (removing) remove(removing.id).catch(() => {});
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
