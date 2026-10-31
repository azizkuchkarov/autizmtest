"use client";

import { Check, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

import { useLocale, useProfile } from "@/components/app/providers";
import { Card, ProgressBar } from "@/components/app/ui";
import { useAacLog } from "@/lib/app/aac-store";
import { useDiary } from "@/lib/app/diary";
import { dayKey } from "@/lib/app/play-activities";
import { useChildPlay } from "@/lib/app/play-store";
import { nextSkillsDue, useSkillsHistory } from "@/lib/app/skills-store";
import { useSoundLog } from "@/lib/app/sound-progress";
import { useVideoDays } from "@/lib/app/video-log";
import type { TranslationKey } from "@/lib/app-i18n";

type PlanItem = { id: string; emoji: string; title: TranslationKey; hint?: string; time?: string | null; href: string; done: boolean };

/** Bugun nima qilinishi kerak va nima bajarildi — qo'llanmadagi kun tartibi asosida. */
export function useTodayPlan(): PlanItem[] {
  const { t } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const today = dayKey();
  const diary = useDiary(child?.id);
  const play = useChildPlay(childKey);
  const videoDays = useVideoDays(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);
  const skills = useSkillsHistory(childKey);
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
      href: "/lessons?tab=sounds",
      done: soundLog.some((e) => e.day === today) || (aacLog[today]?.taps ?? 0) > 0,
    },
  ];
  // Oylik ko'nikmalar testi — faqat vaqti kelganda (birinchi marta va keyin har 4 haftada)
  if (child && (skillsDue.due || skillsDoneToday))
    plan.push({ id: "skills", emoji: "📈", title: "today.skills", hint: t("today.skillsHint"), href: "/skills", done: skillsDoneToday });
  return plan;
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
