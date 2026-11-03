"use client";

import { ArrowRight, CalendarClock, Ear, HandHeart, Info, Lightbulb, MessagesSquare, NotebookPen, Stethoscope, TrendingUp, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { ActivityBadge, BarList, CalendarHeat, ChangeRow, ColumnChart, Legend, Meter, ShareBar, TrendBadge } from "@/components/app/progress/charts";
import { ScreeningDynamics } from "@/components/app/progress/screening-dynamics";
import { useLocale, useProfile } from "@/components/app/providers";
import { riskColors, useFormatDate } from "@/components/app/result-summary";
import { CardPicture } from "@/components/app/talk/tile";
import { Button, Card, FadeIn, HeroCard, PageHeader, Pill, Skeleton } from "@/components/app/ui";
import { useAacLocalData, useAacLog } from "@/lib/app/aac-store";
import { fetchAac, fetchSoundSets, type AacCard } from "@/lib/app/api";
import { domainStyle } from "@/lib/app/domains";
import { useDiary } from "@/lib/app/diary";
import { listAssessments, useAssessmentsVersion, type StoredAssessment } from "@/lib/app/history";
import { WEEKDAYS } from "@/lib/app/play-activities";
import { useChildPlay } from "@/lib/app/play-store";
import { nextSkillsDue, useSkillsHistory } from "@/lib/app/skills-store";
import { SKILL_SECTIONS } from "@/lib/screening-v3/skills";
import { aacProgress, activityTrend, diaryProgress, playProgress, scoreTrend, screeningProgress, skillsComparison, soundProgress, type Trend } from "@/lib/app/progress";
import { useSoundLog, useSoundProgress, useSoundSettings, type SoundLevel } from "@/lib/app/sound-progress";
import type { TranslationKey } from "@/lib/app-i18n";

const TREND_LABEL: Record<Trend, TranslationKey> = { better: "progress.better", same: "progress.same", worse: "progress.worse" };
const LEVEL_TITLE: Record<SoundLevel, TranslationKey> = { 1: "sounds.level1", 2: "sounds.level2", 3: "sounds.level3", 4: "sounds.level4" };

/** Ishorali farq: +5 / −3 */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");
const shortDate = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;

/* --------------------------------- Qismlar --------------------------------- */

function Section({ id, icon: Icon, title, color, children }: { id: string; icon: LucideIcon; title: string; color: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[12px]" style={{ background: `var(--${color}-soft)`, color: `var(--${color})` }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="t-heading text-[19px]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Empty({ title, body, cta, href }: { title: string; body?: string; cta: string; href: string }) {
  return (
    <Card flat className="items-start !gap-2">
      <span className="t-small-bold text-[15px]">{title}</span>
      {body ? <p className="t-small text-ink-2">{body}</p> : null}
      <div className="mt-1 w-full sm:w-auto">
        <Button title={cta} href={href} size="md" variant="ghost" className="sm:!w-auto" />
      </div>
    </Card>
  );
}

function Kpi({
  href,
  icon: Icon,
  color,
  label,
  value,
  badge,
  caption,
  className,
}: {
  href: string;
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  badge?: ReactNode;
  caption: string;
  className?: string;
}) {
  return (
    <a href={href} className={`${className ?? ""} flex flex-col gap-2 rounded-[22px] border border-line bg-element p-4 shadow-card transition-transform active:scale-[0.98] hover:border-tint/40`}>
      <span className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px]" style={{ background: `var(--${color}-soft)`, color: `var(--${color})` }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="t-small-bold line-clamp-2 text-[13px] leading-tight text-ink-2">{label}</span>
      </span>
      <span className="text-[30px] font-bold leading-none tracking-tight text-ink">{value}</span>
      {badge ?? <span className="h-[22px]" />}
      <span className="t-small text-[12px] leading-snug text-ink-3">{caption}</span>
    </a>
  );
}

const MOOD_EMOJI: Record<number, string> = { 1: "😣", 2: "🙁", 3: "😐", 4: "🙂", 5: "😄" };
/** Qiyin paytlar darajasi — bitta tusning tartibli shkalasi (yo'q → ko'p). */
const MELT_COLOR = { 0: "var(--viz-miss)", 1: "var(--viz-help)", 2: "var(--viz-ok)" } as const;

type StripDay = { day: string; logged: boolean; mood: number | null; meltdowns: 0 | 1 | 2 | null };

/** 14 kunlik qator: har bir kun — katak, ostida sana. Yozilmagan kun — punktir. */
function DayStrip({ days, render, fill }: { days: StripDay[]; render?: (d: StripDay) => ReactNode; fill?: (d: StripDay) => string | null }) {
  return (
    <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
      {days.map((d) => {
        const bg = fill?.(d) ?? null;
        return (
          <div key={d.day} className="flex flex-col items-center gap-1">
            <span
              title={d.day.split("-").reverse().join(".")}
              className="flex aspect-square w-full items-center justify-center rounded-[6px]"
              style={{ background: bg ?? (d.logged ? "var(--muted)" : "transparent"), border: d.logged ? undefined : "1px dashed var(--border)" }}
            >
              {render?.(d)}
            </span>
            <span className="text-[10px] tabular-nums text-ink-3">{Number(d.day.slice(8))}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Sahifa ---------------------------------- */

export function ProgressView() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  const childKey = child?.id ?? "default";
  const formatDate = useFormatDate();

  const [assessments, setAssessments] = useState<StoredAssessment[] | null>(null);
  const [soundCards, setSoundCards] = useState<{ id: string; loud: boolean }[] | null>(null);
  const [aacCards, setAacCards] = useState<Map<string, AacCard>>(new Map());

  const soundLog = useSoundLog(childKey);
  const soundMap = useSoundProgress(childKey);
  const { showLoud } = useSoundSettings();
  const play = useChildPlay(childKey);
  const aacLog = useAacLog(childKey);
  const aacLocal = useAacLocalData(childKey, locale);
  const diary = useDiary(child?.id);
  const skillsHistory = useSkillsHistory(childKey);

  useEffect(() => {
    let cancelled = false;
    fetchSoundSets(locale).then(
      (res) => !cancelled && setSoundCards(res.sets.flatMap((s) => s.cards)),
      () => !cancelled && setSoundCards([]),
    );
    fetchAac(locale).then(
      (res) => !cancelled && setAacCards(new Map(res.categories.flatMap((c) => c.cards).map((c) => [c.id, c]))),
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const assessmentsVersion = useAssessmentsVersion();
  useEffect(() => {
    let cancelled = false;
    listAssessments().then((list) => !cancelled && setAssessments(list));
    return () => {
      cancelled = true;
    };
  }, [assessmentsVersion]);

  if (!assessments || !soundCards)
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={150} />
          ))}
        </div>
        <Skeleton height={300} />
        <Skeleton height={240} />
      </div>
    );

  const screening = screeningProgress(assessments);
  const sounds = soundProgress(
    soundLog,
    soundMap,
    soundCards.filter((c) => showLoud || !c.loud).map((c) => c.id),
  );
  const daily = playProgress(play);
  const talk = aacProgress(aacLog);
  const notes = diaryProgress(diary.entries ?? []);
  const skillsLatest = skillsHistory.at(-1);
  const skillsRows = skillsLatest ? skillsComparison(skillsHistory.length > 1 ? skillsHistory[0] : undefined, skillsLatest, play, soundLog) : [];
  const skillsDue = nextSkillsDue(skillsHistory);

  const tiers = { low: t("result.levelLow"), moderate: t("result.levelModerate"), high: t("result.levelHigh") };
  const outcome = [
    { key: "ok", color: "var(--viz-ok)", label: t("sounds.markIndependent") },
    { key: "help", color: "var(--viz-help)", label: t("sounds.markPrompted") },
    { key: "miss", color: "var(--viz-miss)", label: t("sounds.markNotYet") },
  ] as const;
  const weekdays = [...WEEKDAYS[locale].slice(1), WEEKDAYS[locale][0]];
  const customTitles = new Map(aacLocal.custom.map((c) => [c.id, { title: c.title, imageUrl: c.imageUrl }]));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("progress.title")} subtitle={child?.name ? t("progress.subtitle").replace("{name}", child.name) : t("progress.subtitleDefault")} />

      {/* ------------------------------- Test ------------------------------- */}
      <HeroCard className="flex flex-col gap-4 md:p-8">
        <h2 className="t-subtitle !text-[21px] !leading-[27px]">{t("test.heroTitle")}</h2>
        <p className="t-small text-white/80">
          {screening.latest && screening.nextTest
            ? t("test.lastNext").replace("{last}", formatDate(screening.latest.date.toISOString())).replace("{next}", formatDate(screening.nextTest.toISOString()))
            : t("home.heroMeta")}
        </p>
        <div className="md:max-w-[280px]">
          <Button title={t("progress.takeTest")} variant="light" href="/screening" icon={ArrowRight} />
        </div>
        <Link href="/test" className="t-small-bold text-center text-white hover:underline md:text-left">
          {t("progress.testAbout")} →
        </Link>
      </HeroCard>

      {/* ------------------------------ Skrining ------------------------------ */}
      <Section id="screening" icon={Stethoscope} title={t("progress.screeningTitle")} color="test">
        {!screening.latest ? (
          <Empty title={t("progress.noTests")} body={t("progress.noTestsBody")} cta={t("progress.takeTest")} href="/screening" />
        ) : (
          <ScreeningDynamics screening={screening} tiers={tiers} domainName={(id) => t(domainStyle(id).title)} shortDate={shortDate} />
        )}
      </Section>

      {/* --------------------------- Ko'nikmalar dinamikasi --------------------------- */}
      <Section id="skills" icon={TrendingUp} title={t("progress.monthly")} color="exercises">
        {!skillsLatest ? (
          <Empty title={t("progress.noSkills")} body={t("progress.noSkillsBody")} cta={t("sk.start")} href="/skills" />
        ) : (
          <Card className="!gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="t-small text-ink-3">{skillsHistory.length > 1 ? t("progress.monthlyHint") : t("sk.first")}</span>
              <span
                className="t-small-bold flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]"
                style={{ background: skillsDue.due ? "var(--warning-soft)" : "var(--muted)", color: skillsDue.due ? "var(--warning)" : "var(--text-secondary)" }}
              >
                <CalendarClock className="h-4 w-4" />
                {skillsDue.due ? t("sk.due") : t("sk.nextDate").replace("{date}", formatDate(skillsDue.date.toISOString()))}
              </span>
            </div>
            {skillsRows.map((r) => {
              if (r.cur === null) return null;
              const meta = SKILL_SECTIONS.find((x) => x.id === r.id)!;
              const from = r.prev ?? r.cur;
              const trend = activityTrend(r.cur, from);
              return (
                <ChangeRow
                  key={r.id}
                  label={`${meta.emoji} ${meta.title[locale]}`}
                  from={from}
                  to={r.cur}
                  badge={
                    <span className="flex items-center gap-2">
                      {skillsHistory.length > 1 ? <span className="t-small text-ink-3">{t("sk.practiced").replace("{n}", String(r.practiced))}</span> : null}
                      {r.prev !== null ? <ActivityBadge trend={trend} value={signed(r.cur - r.prev)} label="" /> : null}
                    </span>
                  }
                />
              );
            })}
            <div className="flex flex-wrap gap-2">
              {skillsDue.due ? <Button title={t("sk.start")} href="/skills" size="md" className="sm:!w-auto" /> : null}
              <Button title={t("sk.resultTitle")} href={`/progress/skills/${skillsLatest.id}`} size="md" variant="secondary" className="sm:!w-auto" />
            </div>
          </Card>
        )}
      </Section>

      {/* -------------------------- Umumiy ko'rinish -------------------------- */}
      <h2 className="t-heading text-[18px]">{t("progress.overview")}</h2>
      <FadeIn className="-mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          href="#diary"
          icon={NotebookPen}
          color="test"
          label={t("progress.kpiDiary")}
          value={notes.avgSleep !== null ? `${notes.avgSleep} ${t("progress.hoursUnit")}` : "—"}
          badge={
            notes.avgSleep !== null && notes.avgSleepPrev !== null ? (
              <ActivityBadge
                trend={activityTrend(notes.avgSleep, notes.avgSleepPrev)}
                value={signed(Math.round((notes.avgSleep - notes.avgSleepPrev) * 10) / 10)}
                label={t(TREND_LABEL[activityTrend(notes.avgSleep, notes.avgSleepPrev)])}
              />
            ) : undefined
          }
          caption={`${notes.loggedDays} ${t("progress.diaryDays")}`}
        />
        <Kpi
          href="#sounds"
          icon={Ear}
          color="lessons"
          label={t("progress.kpiSounds")}
          value={sounds.independence !== null ? `${sounds.independence}%` : "—"}
          badge={
            sounds.independence !== null && sounds.independencePrev !== null ? (
              <ActivityBadge
                trend={activityTrend(sounds.independence, sounds.independencePrev)}
                value={signed(sounds.independence - sounds.independencePrev)}
                label={t(TREND_LABEL[activityTrend(sounds.independence, sounds.independencePrev)])}
              />
            ) : undefined
          }
          caption={sounds.independence !== null ? t("progress.independent") : t("progress.noData")}
        />
        <Kpi
          href="#play"
          icon={HandHeart}
          color="exercises"
          label={t("progress.kpiPlay")}
          value={`${daily.activeDays}/30`}
          badge={
            daily.total > 0 ? (
              <ActivityBadge
                trend={activityTrend(daily.activeDays, daily.activeDaysPrev)}
                value={signed(daily.activeDays - daily.activeDaysPrev)}
                label={t(TREND_LABEL[activityTrend(daily.activeDays, daily.activeDaysPrev)])}
              />
            ) : undefined
          }
          caption={t("progress.activeDays")}
        />
        <Kpi
          href="#talk"
          icon={MessagesSquare}
          color="centers"
          label={t("progress.kpiTalk")}
          value={String(talk.taps)}
          badge={
            talk.everUsed ? (
              <ActivityBadge trend={activityTrend(talk.taps, talk.tapsPrev)} value={signed(talk.taps - talk.tapsPrev)} label={t(TREND_LABEL[activityTrend(talk.taps, talk.tapsPrev)])} />
            ) : undefined
          }
          caption={t("progress.tapsUnit")}
        />
      </FadeIn>

      {/* -------------------------------- Kundalik -------------------------------- */}
      <Section id="diary" icon={NotebookPen} title={t("progress.diaryTitle")} color="test">
        {notes.total === 0 ? (
          <Empty title={t("progress.noDiary")} body={t("progress.noDiaryBody")} cta={t("progress.startDiary")} href="/diary" />
        ) : (
          <>
            <Card className="!gap-4">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    [notes.avgSleep !== null ? `${notes.avgSleep}` : "—", `${t("progress.hoursUnit")} · ${t("progress.avgSleep")}`],
                    [String(notes.meltDays), t("progress.meltDays")],
                    [String(notes.loggedDays), t("progress.diaryDays")],
                  ] as const
                ).map(([v, label]) => (
                  <div key={label} className="flex flex-col gap-0.5 rounded-[16px] bg-muted/70 p-3">
                    <span className="text-[24px] font-bold leading-none">{v}</span>
                    <span className="t-small text-[12px] leading-snug text-ink-3">{label}</span>
                  </div>
                ))}
              </div>
              {notes.insight ? (
                <p className="t-small flex items-start gap-2 rounded-[14px] bg-[var(--warning-soft)] p-3 text-ink">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" />
                  {t("progress.insightSleep").replace("{h}", String(notes.insight.threshold)).replace("{x}", String(notes.insight.ratio))}
                </p>
              ) : notes.insightChecked ? (
                <p className="t-small flex items-start gap-2 text-ink-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("progress.insightSleepNone")}
                </p>
              ) : null}
              {!diary.today ? (
                <div className="sm:max-w-[280px]">
                  <Button title={t("progress.fillToday")} href="/diary" size="md" variant="ghost" />
                </div>
              ) : null}
            </Card>
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="!gap-3">
                <span className="t-small-bold text-[15px]">{t("progress.sleepChart")}</span>
                <ColumnChart
                  columns={notes.daily.map((d) => ({
                    key: d.day,
                    label: d.day.slice(8),
                    title: formatDate(d.day),
                    segments: [{ key: "sleep", value: d.sleep ?? 0, color: "var(--viz-1)", label: t("progress.hoursUnit") }],
                  }))}
                />
              </Card>
              <Card className="!gap-4">
                <div className="flex flex-col gap-2">
                  <span className="t-small-bold text-[15px]">{t("progress.moodChart")}</span>
                  <DayStrip days={notes.daily} render={(d) => (d.mood ? <span className="text-[18px] leading-none">{MOOD_EMOJI[d.mood]}</span> : null)} />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="t-small-bold text-[15px]">{t("progress.meltChart")}</span>
                  <DayStrip
                    days={notes.daily}
                    fill={(d) => (d.meltdowns === null ? null : MELT_COLOR[d.meltdowns])}
                  />
                  <Legend items={([0, 1, 2] as const).map((l) => ({ color: MELT_COLOR[l], label: t(`diary.melt${l}` as TranslationKey) }))} />
                </div>
              </Card>
            </div>
          </>
        )}
      </Section>

      {/* --------------------------- Ovozli mashqlar --------------------------- */}
      <Section id="sounds" icon={Ear} title={t("progress.kpiSounds")} color="lessons">
        {sounds.total === 0 ? (
          <Empty title={t("progress.noSounds")} cta={t("progress.startSounds")} href="/exercises" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="!gap-4">
              <div className="flex flex-col">
                <span className="t-small-bold text-[15px]">{t("progress.levelsTitle")}</span>
                <span className="t-small text-ink-3">{t("progress.levelsHint")}</span>
              </div>
              {sounds.levels.map((l) => (
                <Meter key={l.level} value={l.mastery} label={`${t("sounds.levelN").replace("{n}", String(l.level))} · ${t(LEVEL_TITLE[l.level])}`} />
              ))}
            </Card>
            <Card className="!gap-3">
              <span className="t-small-bold text-[15px]">{t("progress.weeklyAnswers")}</span>
              <Legend items={outcome.map((o) => ({ color: o.color, label: o.label }))} />
              <ColumnChart
                height={200}
                columns={sounds.weeks.map((w) => ({
                  key: w.start.toISOString(),
                  label: shortDate(w.start),
                  title: formatDate(w.start.toISOString()),
                  segments: outcome.map((o) => ({ key: o.key, value: w[o.key], color: o.color, label: o.label })),
                }))}
              />
            </Card>
          </div>
        )}
      </Section>

      {/* --------------------------- Bugungi 5 daqiqa --------------------------- */}
      <Section id="play" icon={HandHeart} title={t("progress.kpiPlay")} color="exercises">
        {daily.total === 0 ? (
          <Empty title={t("progress.noPlay")} cta={t("progress.startPlay")} href="/exercises" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="!gap-4">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    [daily.streak, "progress.streak"],
                    [daily.sessions30, "progress.sessions"],
                    [daily.total, "progress.totalSessions"],
                  ] as const
                ).map(([v, label]) => (
                  <div key={label} className="flex flex-col gap-0.5 rounded-[16px] bg-muted/70 p-3">
                    <span className="text-[24px] font-bold leading-none">{v}</span>
                    <span className="t-small text-[12px] leading-snug text-ink-3">{t(label)}</span>
                  </div>
                ))}
              </div>
              <span className="t-small-bold text-[15px]">{t("progress.calendarTitle")}</span>
              <CalendarHeat weeks={daily.calendar} weekdays={weekdays} doneLabel={t("progress.done")} notDoneLabel={t("progress.notDone")} />
            </Card>
            <Card className="!gap-4">
              <span className="t-small-bold text-[15px]">{t("progress.ratingsTitle")}</span>
              {daily.sessions30 > 0 ? (
                <ShareBar
                  parts={[
                    { key: "great", value: daily.ratings.great, color: "var(--viz-ok)", label: t("play.rating.great") },
                    { key: "ok", value: daily.ratings.ok, color: "var(--viz-help)", label: t("play.rating.ok") },
                    { key: "hard", value: daily.ratings.hard, color: "var(--viz-miss)", label: t("play.rating.hard") },
                  ]}
                />
              ) : (
                <span className="t-small text-ink-3">{t("progress.noData")}</span>
              )}
              <span className="t-small-bold text-[15px]">{t("progress.skillsTitle")}</span>
              <BarList
                items={daily.skills.filter((s) => s.count > 0).map((s) => ({ key: s.skill, label: t(`play.skill.${s.skill}` as TranslationKey), value: s.count }))}
              />
            </Card>
          </div>
        )}
      </Section>

      {/* ---------------------------- Rasmli muloqot ---------------------------- */}
      <Section id="talk" icon={MessagesSquare} title={t("progress.kpiTalk")} color="centers">
        {!talk.everUsed ? (
          <Empty title={t("progress.noTalk")} cta={t("progress.startTalk")} href="/talk" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(
                [
                  [String(talk.taps), "progress.taps", activityTrend(talk.taps, talk.tapsPrev), talk.taps - talk.tapsPrev],
                  [String(talk.uniqueWords), "progress.uniqueWords", null, 0],
                  [String(talk.sentences), "progress.sentences", activityTrend(talk.sentences, talk.sentencesPrev), talk.sentences - talk.sentencesPrev],
                  [
                    `${talk.avgLength} ${t("progress.wordsUnit")}`,
                    "progress.avgLength",
                    activityTrend(talk.avgLength, talk.avgLengthPrev),
                    Math.round((talk.avgLength - talk.avgLengthPrev) * 10) / 10,
                  ],
                ] as const
              ).map(([value, label, trend, delta]) => (
                <Card key={label} flat className="!gap-1.5 !p-4">
                  <span className="t-small text-[12.5px] text-ink-3">{t(label)}</span>
                  <span className="text-[24px] font-bold leading-none">{value}</span>
                  {trend ? <ActivityBadge trend={trend} value={signed(delta)} label="" /> : <span className="t-small text-[12px] text-ink-3">{t("progress.period30")}</span>}
                </Card>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="!gap-3">
                <span className="t-small-bold text-[15px]">{t("progress.dailyTaps")}</span>
                <ColumnChart
                  columns={talk.daily.map((d) => ({
                    key: d.day,
                    label: d.day.slice(8),
                    title: formatDate(d.day),
                    segments: [{ key: "taps", value: d.taps, color: "var(--viz-1)", label: t("progress.taps") }],
                  }))}
                />
              </Card>
              <Card className="!gap-3">
                <span className="t-small-bold text-[15px]">{t("progress.topWords")}</span>
                {talk.top.length === 0 ? (
                  <span className="t-small text-ink-3">{t("progress.noData")}</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {talk.top.map(({ id, count }) => {
                      const card = aacCards.get(id);
                      const custom = customTitles.get(id);
                      const title = card?.title ?? custom?.title ?? "—";
                      return (
                        <span key={id} className="flex items-center gap-2 rounded-[14px] border border-line bg-app py-1.5 pl-1.5 pr-3">
                          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-muted text-[20px]">
                            <CardPicture card={{ title, emoji: card?.emoji ?? null, imageUrl: card?.imageUrl ?? custom?.imageUrl ?? null }} />
                          </span>
                          <span className="t-small-bold text-[13.5px]">{title}</span>
                          <span className="t-small tabular-nums text-ink-3">×{count}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </Section>

      <div className="flex flex-col gap-1 border-t border-line pt-4">
        <p className="t-small text-ink-3">{t("progress.disclaimer")}</p>
        <p className="t-small text-ink-3">{t("progress.localNote")}</p>
      </div>
    </div>
  );
}
