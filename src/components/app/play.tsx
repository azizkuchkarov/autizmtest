"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Clock, Flame, Lightbulb, Pause, Play, RefreshCw, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { Button, Card, FadeIn, OptionChip, Skeleton } from "@/components/app/ui";
import { useHydrated } from "@/lib/app/local-store";
import {
  childAge,
  dayKey,
  PLAY_ACTIVITIES,
  PLAY_RULES,
  PLAY_SECONDS,
  PLAY_SKILLS,
  playSummary,
  SKILL_COLORS,
  WEEKDAYS,
  type PlayActivity,
  type PlayRating,
  type PlaySkill,
} from "@/lib/app/play-activities";
import { nextTodayPlay, recordPlay, useChildPlay } from "@/lib/app/play-store";
import type { TranslationKey } from "@/lib/app-i18n";

const soft = (color: string) => `color-mix(in srgb, ${color} 14%, var(--element, #fff))`;

function usePlay() {
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const data = useChildPlay(childKey);
  const age = childAge(child?.birthYear);
  return { childKey, data, age, summary: playSummary(data, age) };
}

function SkillChip({ skill }: { skill: PlaySkill }) {
  const { t } = useLocale();
  const color = SKILL_COLORS[skill];
  return (
    <span className="t-small-bold inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[12.5px]" style={{ color, background: soft(color) }}>
      {t(`play.skill.${skill}` as TranslationKey)}
    </span>
  );
}

function Emoji({ activity, size }: { activity: PlayActivity; size: number }) {
  const color = SKILL_COLORS[activity.skill];
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[18px]"
      style={{ width: size, height: size, fontSize: size * 0.52, background: soft(color), borderRadius: size * 0.3 }}
    >
      {activity.emoji}
    </span>
  );
}

/** Oxirgi 7 kun: bajarilgan kunlar yashil. */
function WeekDots({ week }: { week: { day: string; done: boolean }[] }) {
  const todayKey = dayKey();
  const { locale } = useLocale();
  return (
    <div className="flex items-center gap-1.5">
      {week.map(({ day, done }) => {
        const [y, m, d] = day.split("-").map(Number);
        const today = day === todayKey;
        return (
          <span key={day} className="flex flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${done ? "border-[var(--exercises)] bg-[var(--exercises)] text-white" : today ? "border-[var(--exercises)]" : "border-line"}`}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
            </span>
            <span className={`text-[10.5px] font-semibold ${today ? "text-ink" : "text-ink-3"}`}>{WEEKDAYS[locale][new Date(y, m - 1, d).getDay()]}</span>
          </span>
        );
      })}
    </div>
  );
}

function Streak({ n }: { n: number }) {
  const { t } = useLocale();
  if (n < 2) return null;
  return (
    <span className="t-small-bold inline-flex items-center gap-1 rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[12.5px] text-[var(--warning)]">
      <Flame className="h-3.5 w-3.5" /> {t("play.streak").replace("{n}", String(n))}
    </span>
  );
}

/* ------------------------------ Bugungi o'yin ------------------------------ */

/** Bosh sahifa va Mashqlar bo'limidagi kunlik o'yin kartasi. */
export function TodayPlayCard({ showAll = true }: { showAll?: boolean }) {
  const { t, locale } = useLocale();
  const hydrated = useHydrated();
  const { childKey, summary } = usePlay();

  // Sana va natijalar faqat brauzerda ma'lum — serverda joy egallab turamiz
  if (!hydrated) return <Skeleton height={236} />;

  const a = summary.today;
  const text = a[locale];
  const done = summary.doneToday.length > 0;

  return (
    <Card className="!gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="t-caption text-[var(--exercises)]">{t("play.title")}</span>
        <Streak n={summary.streak} />
      </div>
      <Link href={`/exercises/play/${a.id}`} className="group flex items-center gap-4">
        <Emoji activity={a} size={64} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-heading text-[17px] group-hover:text-tint">{text.title}</span>
          <span className="t-small line-clamp-2 text-ink-2">{text.goal}</span>
          <span className="flex items-center gap-2">
            <SkillChip skill={a.skill} />
            <span className="t-small inline-flex items-center gap-1 text-ink-3">
              <Clock className="h-3.5 w-3.5" /> {t("play.minutes")}
            </span>
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <WeekDots week={summary.week} />
        {done ? (
          <span className="t-small-bold inline-flex items-center gap-1.5 text-[var(--success)]">
            <Check className="h-4 w-4" strokeWidth={3} /> {t("play.doneToday")}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button title={t("play.start")} icon={Play} size="md" href={`/exercises/play/${a.id}`} className="flex-1" />
        {!done && (
          <Button title={t("play.another")} icon={RefreshCw} size="md" variant="secondary" onClick={() => nextTodayPlay(childKey)} className="!w-auto whitespace-nowrap" />
        )}
        {showAll && (
          <Button title={t("play.all")} size="md" variant="secondary" href="/exercises/play" className={done ? "flex-1 whitespace-nowrap !px-3" : "!w-auto whitespace-nowrap max-sm:hidden"} />
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ Ro'yxat ------------------------------ */

export function PlayList() {
  const { t, locale } = useLocale();
  const hydrated = useHydrated();
  const { summary, age } = usePlay();
  const [skill, setSkill] = useState<PlaySkill | null>(null);

  // Bolaning yoshiga moslari oldinda
  const list = PLAY_ACTIVITIES.filter((a) => !skill || a.skill === skill).sort((x, y) => Number(x.minAge > age + 0.5) - Number(y.minAge > age + 0.5));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 pt-1">
        <h1 className="t-title">{t("play.title")}</h1>
        <p className="t-body text-ink-2">{t("play.subtitle")}</p>
      </div>

      <TodayPlayCard showAll={false} />

      <RulesCard />

      <h2 className="t-heading mt-2">{t("play.all")}</h2>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <OptionChip label={t("play.allSkills")} selected={!skill} onClick={() => setSkill(null)} className="shrink-0" />
        {PLAY_SKILLS.map((s) => (
          <OptionChip key={s} label={t(`play.skill.${s}` as TranslationKey)} selected={skill === s} onClick={() => setSkill(s)} className="shrink-0" />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((a, i) => {
          const count = hydrated ? (summary.counts[a.id] ?? 0) : 0;
          return (
            <FadeIn key={a.id} delay={Math.min(i, 8) * 40}>
              <Card href={`/exercises/play/${a.id}`} className="!flex-row items-center !gap-4">
                <Emoji activity={a} size={56} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="t-heading text-[16px]">{a[locale].title}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <SkillChip skill={a.skill} />
                    <span className="t-small text-ink-3">{t("play.ageFrom").replace("{n}", String(a.minAge).replace(".", ","))}</span>
                    {count > 0 ? (
                      <span className="t-small-bold inline-flex items-center gap-1 text-[var(--success)]">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t("play.times").replace("{n}", String(count))}
                      </span>
                    ) : null}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-3" />
              </Card>
            </FadeIn>
          );
        })}
      </div>

      <p className="t-small px-2 pt-2 text-center text-ink-3">{t("play.note")}</p>
    </div>
  );
}

function RulesCard() {
  const { t, locale } = useLocale();
  return (
    <Card flat className="bg-[var(--exercises-soft)] !border-transparent">
      <div className="flex items-center gap-2 text-[var(--exercises)]">
        <ShieldCheck className="h-4 w-4" />
        <span className="t-small-bold">{t("play.rules")}</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {PLAY_RULES[locale].map((r, i) => (
          <li key={i} className="t-small flex gap-2 text-ink-2">
            <span className="t-small-bold w-4 shrink-0 text-[var(--exercises)]">{i + 1}</span>
            {r}
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ------------------------------ Mashq ------------------------------ */

const RATINGS: { id: PlayRating; emoji: string; label: TranslationKey }[] = [
  { id: "great", emoji: "😊", label: "play.rating.great" },
  { id: "ok", emoji: "🙂", label: "play.rating.ok" },
  { id: "hard", emoji: "😣", label: "play.rating.hard" },
];

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** 5 daqiqalik taymer: boshlash, pauza, tugatish; vaqt tugasa yoki "Tugatdik" bosilsa — baholash. */
function PlayTimer({ activity }: { activity: PlayActivity }) {
  const { t } = useLocale();
  const { childKey } = usePlay();
  const [stage, setStage] = useState<"idle" | "running" | "paused" | "rate" | "saved">("idle");
  const [left, setLeft] = useState(PLAY_SECONDS);
  const [rating, setRating] = useState<PlayRating | null>(null);
  const endsAt = useRef(0);

  useEffect(() => {
    if (stage !== "running") return;
    const id = setInterval(() => {
      const rest = Math.max(0, (endsAt.current - Date.now()) / 1000);
      setLeft(rest);
      if (rest <= 0) {
        navigator.vibrate?.(300);
        setStage("rate");
      }
    }, 250);
    return () => clearInterval(id);
  }, [stage]);

  const run = () => {
    endsAt.current = Date.now() + left * 1000;
    setStage("running");
  };

  const rate = (r: PlayRating) => {
    recordPlay(childKey, activity.id, r);
    setRating(r);
    setStage("saved");
  };

  const pct = ((PLAY_SECONDS - left) / PLAY_SECONDS) * 100;

  return (
    <Card className="!gap-3 border-[var(--exercises)]/30">
      <AnimatePresence mode="wait" initial={false}>
        {stage === "idle" ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button title={t("play.timerStart")} icon={Play} onClick={run} />
          </motion.div>
        ) : stage === "running" || stage === "paused" ? (
          <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="t-number !text-[40px] !leading-none tabular-nums" aria-live="off">
                {mmss(left)}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[var(--exercises)] transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex gap-2">
              {stage === "running" ? (
                <Button title={t("play.timerPause")} icon={Pause} size="md" variant="secondary" onClick={() => setStage("paused")} />
              ) : (
                <Button title={t("play.timerResume")} icon={Play} size="md" variant="secondary" onClick={run} />
              )}
              <Button title={t("play.finish")} icon={Check} size="md" onClick={() => setStage("rate")} />
            </div>
          </motion.div>
        ) : stage === "rate" ? (
          <motion.div key="rate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            {left <= 0 ? <span className="t-small-bold text-[var(--exercises)]">{t("play.timeUp")}</span> : null}
            <span className="t-heading">{t("play.howWasIt")}</span>
            <div className="grid grid-cols-3 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => rate(r.id)}
                  className="flex flex-col items-center gap-1 rounded-[18px] border border-line bg-element px-2 py-3 transition-transform hover:bg-muted active:scale-[0.97]"
                >
                  <span className="text-[30px] leading-none" aria-hidden>
                    {r.emoji}
                  </span>
                  <span className="t-small-bold text-center text-[13px]">{t(r.label)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="saved" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 py-2 text-center">
            <span className="text-[44px] leading-none" aria-hidden>
              🎉
            </span>
            <span className="t-heading">{t("play.saved")}</span>
            {rating === "hard" ? <span className="t-small text-ink-2">{t("play.hardHint")}</span> : null}
            <div className="mt-2 w-full">
              <Button title={t("play.all")} size="md" variant="secondary" href="/exercises/play" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="t-heading text-[16px]">{title}</h2>
      {children}
    </section>
  );
}

export function PlayDetail({ activity }: { activity: PlayActivity }) {
  const { t, locale } = useLocale();
  const text = activity[locale];

  return (
    <div className="flex flex-col gap-5">
      <FadeIn className="flex items-center gap-4">
        <Emoji activity={activity} size={84} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <SkillChip skill={activity.skill} />
            <span className="t-small inline-flex items-center gap-1 text-ink-3">
              <Clock className="h-3.5 w-3.5" /> {t("play.minutes")}
            </span>
          </div>
          <h1 className="t-title !text-[26px] !leading-[32px]">{text.title}</h1>
        </div>
      </FadeIn>

      <p className="t-body text-ink-2">{text.goal}</p>

      <PlayTimer key={activity.id} activity={activity} />

      <Section title={t("play.materials")}>
        <ul className="flex flex-col gap-1.5">
          {text.materials.map((m) => (
            <li key={m} className="t-body flex gap-2">
              <span className="text-[var(--exercises)]">•</span>
              {m}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("play.steps")}>
        <ol className="flex flex-col gap-3">
          {text.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="t-small-bold flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--exercises)] text-white">{i + 1}</span>
              <span className="t-body pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Card flat className="bg-muted/60">
        <div className="flex items-center gap-2 text-tint">
          <Lightbulb className="h-4 w-4" />
          <span className="t-small-bold">{t("play.tip")}</span>
        </div>
        <p className="t-small text-ink-2">{text.tip}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card flat>
          <div className="flex items-center gap-2 text-[var(--warning)]">
            <TrendingDown className="h-4 w-4" />
            <span className="t-small-bold">{t("play.easier")}</span>
          </div>
          <p className="t-small text-ink-2">{text.easier}</p>
        </Card>
        <Card flat>
          <div className="flex items-center gap-2 text-[var(--success)]">
            <TrendingUp className="h-4 w-4" />
            <span className="t-small-bold">{t("play.harder")}</span>
          </div>
          <p className="t-small text-ink-2">{text.harder}</p>
        </Card>
      </div>

      <RulesCard />
      <p className="t-small px-2 text-center text-ink-3">{t("play.note")}</p>
    </div>
  );
}
