"use client";

import { AlertTriangle, CalendarClock, Dumbbell } from "lucide-react";
import { useParams } from "next/navigation";

import { BackHeader } from "@/components/app/app-shell";
import { ActivityBadge } from "@/components/app/progress/charts";
import { useLocale, useProfile } from "@/components/app/providers";
import { useFormatDate } from "@/components/app/result-summary";
import { Button, Card, EmptyState, FadeIn, ProgressBar, Screen, SectionHeader } from "@/components/app/ui";
import { useChildPlay } from "@/lib/app/play-store";
import { activityTrend, skillsComparison } from "@/lib/app/progress";
import { nextSkillsDue, useSkillsHistory } from "@/lib/app/skills-store";
import { useSoundLog } from "@/lib/app/sound-progress";
import { SKILL_SECTIONS } from "@/lib/screening-v3/skills";

const TREND = { better: "progress.better", same: "progress.same", worse: "progress.worse" } as const;
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/** Ko'nikmalar testi natijasi: har bo'lim balli, oldingi testga nisbatan o'zgarish va shu davrdagi mashqlar. */
export default function SkillsResultPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const formatDate = useFormatDate();
  const childKey = useProfile().child?.id ?? "default";
  const history = useSkillsHistory(childKey);
  const play = useChildPlay(childKey);
  const soundLog = useSoundLog(childKey);

  const index = history.findIndex((r) => r.id === id || r.serverId === id);
  const record = history[index];
  if (!record)
    return (
      <Screen>
        <BackHeader />
        <EmptyState icon={AlertTriangle} title={t("common.error")} />
      </Screen>
    );

  const prev = index > 0 ? history[index - 1] : undefined;
  const rows = skillsComparison(prev, record, play, soundLog);
  const next = nextSkillsDue(history.slice(0, index + 1));
  const scored = rows.filter((r) => r.cur !== null);
  const focus = [...scored].sort((a, b) => (a.cur ?? 0) - (b.cur ?? 0)).slice(0, 2);

  return (
    <Screen>
      <BackHeader title={t("sk.resultTitle")} />

      <FadeIn>
        <Card className="items-center !gap-2 !py-7 text-center">
          <span className="t-small text-ink-3">{formatDate(record.createdAt)}</span>
          <span className="text-[52px] font-extrabold leading-none tabular-nums text-tint">{record.result.total}</span>
          <span className="t-small text-ink-2">/ 100</span>
          {prev ? (
            <ActivityBadge
              trend={activityTrend(record.result.total, prev.result.total)}
              value={signed(record.result.total - prev.result.total)}
              label={t(TREND[activityTrend(record.result.total, prev.result.total)])}
            />
          ) : (
            <p className="t-body mt-1 max-w-[460px] text-ink-2">{t("sk.first")}</p>
          )}
        </Card>
      </FadeIn>

      <SectionHeader title={prev ? t("sk.vsPrev").replace("{date}", formatDate(prev.createdAt)) : t("r3.sections")} />
      <FadeIn delay={80}>
        <Card className="!gap-5">
          {rows.map((r) => {
            const meta = SKILL_SECTIONS.find((s) => s.id === r.id)!;
            if (r.cur === null) return null;
            return (
              <div key={r.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[20px]" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="t-heading flex-1 text-[15px]">{meta.title[locale]}</span>
                  {r.prev !== null ? <span className="t-small tabular-nums text-ink-3">{r.prev} →</span> : null}
                  <span className="t-small-bold tabular-nums">{r.cur}</span>
                  {r.delta !== null ? <ActivityBadge trend={activityTrend(r.cur, r.prev ?? r.cur)} value={signed(r.delta)} label="" /> : null}
                </div>
                <ProgressBar value={Math.max(3, r.cur)} color="var(--viz-1)" height={7} />
                {prev ? (
                  <span className="t-small flex items-center gap-1 text-ink-3">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {t("sk.practiced").replace("{n}", String(r.practiced))}
                  </span>
                ) : null}
              </div>
            );
          })}
        </Card>
      </FadeIn>

      {focus.length > 0 && (
        <Card flat className="!gap-2 bg-muted/60">
          <span className="t-heading text-[16px]">🎯 {t("sk.focus")}</span>
          <p className="t-body">{focus.map((f) => SKILL_SECTIONS.find((s) => s.id === f.id)!.title[locale]).join(", ")}</p>
          <div className="sm:max-w-[260px]">
            <Button title={t("sk.toExercises")} href="/exercises/play" size="md" variant="ghost" />
          </div>
        </Card>
      )}

      <p className="t-small flex items-center justify-center gap-1.5 text-ink-3">
        <CalendarClock className="h-4 w-4" />
        {t("sk.nextDate").replace("{date}", formatDate(next.date.toISOString()))}
      </p>
    </Screen>
  );
}
