"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import Link from "next/link";

import { useLocale, useProfile } from "@/components/app/providers";
import { assessmentTier } from "@/components/app/result-summary";
import { Button, HeroCard, Pill } from "@/components/app/ui";
import { useAacLog } from "@/lib/app/aac-store";
import type { StoredAssessment } from "@/lib/app/history";
import { currentWeek, dayKey, WEEKDAYS } from "@/lib/app/play-activities";
import { useChildPlay } from "@/lib/app/play-store";
import { activityTrend, playProgress } from "@/lib/app/progress";
import { useSkillsHistory } from "@/lib/app/skills-store";
import { useSoundLog } from "@/lib/app/sound-progress";

const LEVEL_DOT = { low: "🟢", moderate: "🟠", high: "🔴" } as const;
const LEVEL_KEY = { low: "result.levelLow", moderate: "result.levelModerate", high: "result.levelHigh" } as const;

/** Oq chiziqli kichik grafik: ko'nikmalar testi balli (0–100) vaqt bo'yicha. */
function Sparkline({ values }: { values: number[] }) {
  const w = 300;
  const h = 64;
  const x = (i: number) => (values.length === 1 ? w / 2 : 6 + (i / (values.length - 1)) * (w - 12));
  const y = (v: number) => h - 6 - (v / 100) * (h - 12);
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full" aria-hidden>
      <path d={`${path}L${x(values.length - 1)},${h}L${x(0)},${h}Z`} fill="rgba(255,255,255,0.14)" />
      <path d={path} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4.5 : 3} fill="#fff" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Oxirgi 7 kun: har kuni nechta turdagi mashg'ulot bajarilgan (5 daqiqa, ovozli mashq, muloqot). */
function WeekBars({ days }: { days: { label: string; value: number; today: boolean }[] }) {
  const max = Math.max(3, ...days.map((d) => d.value));
  return (
    <div className="flex h-16 items-end gap-2">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-12 w-full items-end justify-center">
            <span
              className="w-full max-w-[22px] rounded-t-[4px]"
              style={{ height: `${Math.max(8, (d.value / max) * 100)}%`, background: d.value ? "#fff" : "rgba(255,255,255,0.22)" }}
            />
          </div>
          <span className={`text-[10.5px] font-semibold ${d.today ? "text-white" : "text-white/60"}`}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[14px] bg-white/[0.12] px-3 py-2.5">
      <span className="truncate text-[11.5px] font-semibold text-white/70">{label}</span>
      <span className="truncate text-[15px] font-bold text-white">{value}</span>
    </div>
  );
}

/**
 * Bosh sahifa: test topshirilgandan keyin "Skrining testi" o'rniga rivojlanish ko'rinadi —
 * ko'nikmalar testi balli va dinamikasi (yoki oxirgi 7 kun faolligi) hamda asosiy ko'rsatkichlar.
 */
export function HomeProgressHero({ last }: { last: StoredAssessment }) {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const skills = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const soundLog = useSoundLog(childKey);
  const aacLog = useAacLog(childKey);

  const daily = playProgress(play);
  const latest = skills.at(-1);
  const prev = skills.length > 1 ? skills.at(-2) : undefined;
  const delta = latest && prev ? latest.result.total - prev.result.total : null;
  const trend = latest && prev ? activityTrend(latest.result.total, prev.result.total) : null;
  const tier = assessmentTier(last);

  const today = dayKey();
  const week = currentWeek()
    .map((day) => {
      const d = new Date(`${day}T12:00:00`);
      const value =
        (play?.entries.some((e) => e.day === day) ? 1 : 0) + (soundLog.some((e) => e.day === day) ? 1 : 0) + ((aacLog[day]?.taps ?? 0) > 0 ? 1 : 0);
      return { label: WEEKDAYS[locale][d.getDay()], value, today: day === today };
    });

  const TrendIcon = trend === "better" ? ArrowUpRight : trend === "worse" ? ArrowDownRight : Minus;

  return (
    <HeroCard className="flex flex-col gap-4 md:p-8">
      <span className="absolute -right-5 -top-8 h-40 w-40 rounded-full bg-white/[0.08]" />
      <div className="flex items-center justify-between gap-3">
        <Pill label={t("home.progressBadge")} color="#FFFFFF" background="rgba(255,255,255,0.18)" />
        <TrendingUp className="relative h-5 w-5 text-white/80" />
      </div>

      <div className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-white/75">{latest ? t("home.skillsScore") : t("home.progressTitle")}</span>
          {latest ? (
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-[52px] font-extrabold leading-none tracking-tight">{latest.result.total}</span>
              <span className="pb-1.5 text-[15px] font-semibold text-white/70">/ 100</span>
              {delta !== null && (
                <span className="mb-1.5 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[13px] font-bold text-[#312E81]">
                  <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.8} />
                  {delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "0"}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[15px] font-medium leading-snug text-white/90">{t("home.noSkillsYet")}</p>
          )}
          {delta !== null ? <span className="text-[12.5px] text-white/65">{t("home.vsPrev")}</span> : null}
          {latest ? <span className="text-[12.5px] text-white/65">{t("home.skillsHint")}</span> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-white/70">{skills.length >= 2 ? t("home.trend") : t("home.week")}</span>
          {skills.length >= 2 ? <Sparkline values={skills.slice(-8).map((r) => r.result.total)} /> : <WeekBars days={week} />}
        </div>
      </div>

      <div className="relative flex gap-2">
        <Stat label={t("home.statScreening")} value={`${LEVEL_DOT[tier]} ${t(LEVEL_KEY[tier])}`} />
        <Stat label={t("home.statPractice")} value={`${daily.activeDays} ${t("home.daysUnit")}`} />
        <Stat label={t("home.statStreak")} value={`${daily.streak} ${t("home.daysUnit")}`} />
      </div>

      <div className="relative flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1 md:max-w-[260px]">
          <Button title={t("home.details")} variant="light" href="/progress" icon={ArrowRight} />
        </div>
        {!latest ? (
          <Link href="/skills" className="flex h-14 items-center rounded-[18px] border border-white/40 px-5 text-[15.5px] font-bold text-white hover:bg-white/10">
            {t("home.takeSkills")}
          </Link>
        ) : null}
      </div>
    </HeroCard>
  );
}
