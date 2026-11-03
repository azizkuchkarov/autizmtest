"use client";

import { Check, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

import { useLocale, useProfile } from "@/components/app/providers";
import { Card, ProgressBar } from "@/components/app/ui";
import { useAacLog } from "@/lib/app/aac-store";
import { useDiary } from "@/lib/app/diary";
import { planProgress, useExercisePlans } from "@/lib/app/exercises";
import { currentWeek, dayKey, WEEKDAYS } from "@/lib/app/play-activities";
import { useChildPlay } from "@/lib/app/play-store";
import { nextSkillsDue, useSkillsHistory } from "@/lib/app/skills-store";
import { useSoundLog } from "@/lib/app/sound-progress";
import { useVideoDays } from "@/lib/app/video-log";
import type { TranslationKey } from "@/lib/app-i18n";

const WEEK_MINT = "#5EEAD4";

type PlanItem = { id: string; emoji: string; title: TranslationKey; hint?: string; time?: string | null; href: string; done: boolean };

/** Bugun nima qilinishi kerak va nima bajarildi — qo'llanmadagi kun tartibi asosida. */
export function useTodayPlan(): PlanItem[] {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const today = dayKey();
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const skills = useSkillsHistory(childKey);
  const { plans } = useExercisePlans(child?.id, locale);
  const skillsDue = nextSkillsDue(skills);
  const skillsDoneToday = skills.some((r) => dayKey(new Date(r.createdAt)) === today);

  const plan: PlanItem[] = [
    { id: "diary", emoji: "📔", title: "today.diary", hint: t("today.diaryHint"), time: child?.diaryTime, href: "/diary", done: !!diary.today },
    {
      id: "play",
      emoji: "🧸",
      title: "today.play",
      time: child?.practiceTime,
      href: "/exercises",
      done: !!play?.entries.some((e) => e.day === today),
    },
    { id: "video", emoji: "🎬", title: "today.video", hint: t("today.videoHint"), href: "/lessons", done: videoDays.includes(today) },
    {
      id: "practice",
      emoji: "🎧",
      title: "today.practice",
      hint: t("today.practiceHint"),
      href: "/exercises",
      done: soundLog.some((e) => e.day === today) || (aacLog[today]?.taps ?? 0) > 0,
    },
  ];
  // Video mashqlar — ota-ona qo'shgan bo'lsa
  const activePlans = (plans ?? []).filter((p) => !p.completedAt);
  if (activePlans.length > 0) {
    const left = activePlans.filter((p) => !planProgress(p).doneToday).length;
    plan.push({
      id: "exercises",
      emoji: "🎯",
      title: "today.videoExercises",
      hint: left > 0 ? t("today.videoExercisesHint").replace("{n}", String(left)) : undefined,
      href: "/exercises",
      done: left === 0,
    });
  }
  // Oylik ko'nikmalar testi — faqat vaqti kelganda (birinchi marta va keyin har 4 haftada)
  if (child && (skillsDue.due || skillsDoneToday))
    plan.push({ id: "skills", emoji: "📈", title: "today.skills", hint: t("today.skillsHint"), href: "/skills", done: skillsDoneToday });
  return plan;
}

/** Hafta bo'yicha: har kuni nechta asosiy vazifa bajarilgani (Dushanbadan boshlanadi). */
export function WeekSchedule() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const { plans } = useExercisePlans(child?.id, locale);
  const today = dayKey();
  const days = currentWeek().map((day) => {
    const [y, m, dd] = day.split("-").map(Number);
    // Video mashq shu kuni faol bo'lsagina vazifa sifatida hisoblanadi
    const dayPlans = (plans ?? []).filter((p) => p.createdAt.slice(0, 10) <= day && (!p.completedAt || p.completedAt.slice(0, 10) >= day));
    const tasks = [
      !!diary.byDate(day),
      !!play?.entries.some((e) => e.day === day),
      videoDays.includes(day),
      soundLog.some((e) => e.day === day) || (aacLog[day]?.taps ?? 0) > 0,
      ...(dayPlans.length > 0 ? [dayPlans.every((p) => (p.log[day] ?? 0) >= p.repsPerDay)] : []),
    ];
    const count = tasks.filter(Boolean).length;
    return { day, count, total: tasks.length, label: WEEKDAYS[locale][new Date(y, m - 1, dd).getDay()], isToday: day === today, future: day > today };
  });
  const active = days.filter((d) => d.count > 0).length;
  const totalTasks = days.reduce((n, d) => n + d.total, 0);
  const doneTasks = days.reduce((n, d) => n + d.count, 0);
  const message = active === 0 ? "today.weekMsg0" : active === 7 ? "today.weekMsg3" : active >= 3 ? "today.weekMsg2" : "today.weekMsg1";

  return (
    <div className="relative flex flex-col gap-[18px] overflow-hidden rounded-[24px] p-5 shadow-card" style={{ background: "linear-gradient(135deg, #1E1B4B, #312E81, #4338CA)" }}>
      <span className="absolute -right-12 -top-[70px] h-[190px] w-[190px] rounded-full bg-[rgb(129_140_248/0.22)]" />
      <div className="relative flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-[3px]">
          <span className="text-[13px] font-bold text-white/70">{t("today.week")}</span>
          <span className="t-subtitle tabular-nums !text-[24px] !leading-[30px] text-white">{t("today.weekDays").replace("{n}", String(active))}</span>
          <span className="t-small font-semibold" style={{ color: WEEK_MINT }}>
            {t(message)}
          </span>
        </div>
        <WeekRing value={doneTasks / totalTasks} />
      </div>
      <div className="relative flex gap-1.5">
        {days.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-[7px]">
            <span
              className={`flex w-full max-w-10 flex-col gap-[3px] rounded-[13px] border-[1.5px] p-1 ${d.isToday ? "border-white/75 bg-white/[0.16]" : "border-transparent bg-white/[0.07]"} ${d.future ? "opacity-60" : ""}`}
            >
              {Array.from({ length: d.total }, (_, i) => d.total - 1 - i).map((slot) => (
                <span key={slot} className="block h-[11px] rounded-[5px]" style={{ background: slot < d.count ? WEEK_MINT : "rgba(255,255,255,0.1)" }} />
              ))}
            </span>
            <span className={`text-[12px] ${d.isToday ? "font-bold text-white" : "font-medium text-white/60"}`}>{d.label}</span>
          </div>
        ))}
      </div>
      <span className="relative text-[12.5px] text-white/60">{t("today.weekTasks").replace("{n}", String(doneTasks)).replace("{total}", String(totalTasks))}</span>
    </div>
  );
}

/** Hafta natijasi halqada: bajarilgan vazifalar ulushi. */
function WeekRing({ value }: { value: number }) {
  const size = 68;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={WEEK_MINT} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c * value} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="text-[15px] font-bold tabular-nums text-white">{Math.round(value * 100)}%</span>
    </span>
  );
}

export function TodayPlan() {
  const { t } = useLocale();
  const items = useTodayPlan();
  const done = items.filter((i) => i.done).length;
  const all = done === items.length;

  return (
    <Card className="!gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="t-heading text-[18px]">{t("today.title")}</span>
        <span className="t-small-bold tabular-nums text-ink-2">{t("today.progress").replace("{n}", String(done)).replace("{total}", String(items.length))}</span>
      </div>
      <ProgressBar value={(done / items.length) * 100} color={all ? "var(--success)" : "var(--tint)"} height={6} />
      {all ? <p className="t-small-bold text-[var(--success)]">🎉 {t("today.allDone")}</p> : null}
      <div className="-mx-1 flex flex-col">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="group flex items-center gap-3 rounded-[16px] px-1 py-2 hover:bg-muted/60">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${item.done ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-line"}`}
            >
              {item.done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
            </span>
            <span className="text-[22px] leading-none" aria-hidden>
              {item.emoji}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`t-small-bold text-[15px] ${item.done ? "text-ink-3 line-through" : "text-ink"}`}>{t(item.title)}</span>
              {item.hint && !item.done ? <span className="t-small text-ink-3">{item.hint}</span> : null}
            </span>
            {item.time ? (
              <span className="t-small-bold flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 tabular-nums text-ink-2">
                <Clock className="h-3.5 w-3.5" />
                {item.time}
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
