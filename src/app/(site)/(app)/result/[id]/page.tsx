"use client";

import { AlertCircle, AlertTriangle, ArrowRightCircle, CheckCircle2, HandHeart, MonitorPlay, Stethoscope, type LucideIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale } from "@/components/app/providers";
import { assessmentTier, LevelBadge, riskColors, useAssessmentAge, useFormatDate } from "@/components/app/result-summary";
import { accent, Card, EmptyState, FadeIn, IconBadge, ListRow, ProgressBar, Screen, SectionHeader, Spinner } from "@/components/app/ui";
import { ResultV3, ResultV3Details, v3WeakDomains } from "@/components/app/result-v3";
import { VideoTile } from "@/components/app/video-cards";
import { fetchAiSummary, fetchContent, fetchServerAssessment, type AiSummaryPayload, type Video } from "@/lib/app/api";
import { domainStyle } from "@/lib/app/domains";
import { SHOW_CENTERS } from "@/lib/app/features";
import { getAssessment, saveAssessment, type StoredAssessment } from "@/lib/app/history";
import { getTestConfig, isAgeGroup, riskTier, weakDomains, type RiskTier, type ScreeningResult } from "@/lib/app/screening";
import { isScreeningV3 } from "@/lib/screening-v3/score";

/** Kalit sozlanmagan paytda server eski versiyada saqlagan soxta xulosa — ota-onaga ko'rsatilmaydi. */
function isPlaceholderAi(payload: AiSummaryPayload | null | undefined) {
  return payload?.summary?.shortConclusion === "AI xulosa sozlamasi topilmadi.";
}

const LEVEL_KEY: Record<RiskTier, "result.levelLow" | "result.levelModerate" | "result.levelHigh"> = {
  low: "result.levelLow",
  moderate: "result.levelModerate",
  high: "result.levelHigh",
};

function DomainRow({ id, title, score }: { id: string; title: string; score: number }) {
  const { t } = useLocale();
  const style = domainStyle(id);
  const a = accent(style.accent);
  const colors = riskColors(riskTier(score));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <IconBadge icon={style.icon} color={a.fg} background={a.soft} size={40} />
        <h3 className="t-heading line-clamp-2 flex-1 text-[15px]">{title}</h3>
        <span className="t-small-bold" style={{ color: colors.fg }}>
          {t(LEVEL_KEY[riskTier(score)])}
        </span>
      </div>
      <ProgressBar value={score} color={colors.fg} />
    </div>
  );
}

function BulletList({ items, icon: Icon, color }: { items: string[]; icon: LucideIcon; color: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <Icon className="mt-[3px] h-4 w-4 shrink-0" style={{ color }} />
          <span className="t-body flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AiSummary({ payload }: { payload: AiSummaryPayload }) {
  const { t } = useLocale();
  const tint = accent("test");
  return (
    <div className="flex flex-col gap-6">
      {payload.summary?.shortConclusion ? <p className="t-default">{payload.summary.shortConclusion}</p> : null}
      {payload.summary?.whyThisLevel ? <p className="t-body text-ink-2">{payload.summary.whyThisLevel}</p> : null}
      {payload.strengths?.examples?.length ? (
        <div className="flex flex-col gap-2">
          <span className="t-caption text-success">{t("result.aiStrengths")}</span>
          <BulletList items={payload.strengths.examples} icon={CheckCircle2} color="var(--success)" />
        </div>
      ) : null}
      {payload.needsFocus?.priority?.length ? (
        <div className="flex flex-col gap-2">
          <span className="t-caption text-warning">{t("result.aiFocus")}</span>
          <BulletList items={payload.needsFocus.priority} icon={AlertCircle} color="var(--warning)" />
        </div>
      ) : null}
      {payload.nextSteps?.homePlan?.length ? (
        <div className="flex flex-col gap-4">
          <span className="t-caption" style={{ color: tint.fg }}>
            {t("result.aiPlan")}
          </span>
          {payload.nextSteps.homePlan.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl bg-muted p-3.5">
              <div className="flex items-center gap-2">
                <span className="t-small-bold flex h-[26px] w-[26px] items-center justify-center rounded-full text-white" style={{ background: tint.fg }}>
                  {i + 1}
                </span>
                <h4 className="t-heading flex-1 text-[15.5px]">{p.title}</h4>
              </div>
              {p.why ? <p className="t-small text-ink-2">{p.why}</p> : null}
              {p.how?.length ? <BulletList items={p.how} icon={ArrowRightCircle} color={tint.fg} /> : null}
            </div>
          ))}
        </div>
      ) : null}
      {payload.disclaimer?.text ? <p className="t-small text-ink-3">{payload.disclaimer.text}</p> : null}
    </div>
  );
}

/** Brauzerda topilmasa — serverdan (havola orqali ochilgan natija). */
async function loadAssessment(id: string): Promise<StoredAssessment | null> {
  const local = await getAssessment(id);
  if (local) return local;
  try {
    const res = await fetchServerAssessment(id);
    if (res.testType !== "screening" || !isAgeGroup(res.ageGroup) || !res.scoring) return null;
    return {
      id,
      serverId: id,
      createdAt: res.completedAt ?? new Date().toISOString(),
      ageGroup: res.ageGroup,
      childGender: "",
      result: res.scoring as ScreeningResult,
      ai: res.aiSummary?.status === "ready" && res.aiSummary.payload && res.aiSummaryLocale ? { locale: res.aiSummaryLocale, payload: res.aiSummary.payload } : undefined,
    };
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const formatDate = useFormatDate();
  const ageOf = useAssessmentAge();
  const centers = accent("centers");
  const lessons = accent("lessons");
  const exercises = accent("exercises");
  const [item, setItem] = useState<StoredAssessment | null | undefined>(undefined);
  /** AI xulosa olinmagan til (yuklanish holati shundan kelib chiqadi) */
  const [aiFailedLocale, setAiFailedLocale] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<Video[]>([]);

  useEffect(() => {
    loadAssessment(id).then(setItem);
  }, [id]);

  // AI xulosa: tanlangan tilda keshlangan bo'lmasa serverdan so'raladi
  useEffect(() => {
    if (!item?.serverId) return;
    if (item.ai?.locale === locale && !isPlaceholderAi(item.ai.payload)) return;
    let cancelled = false;
    fetchAiSummary(item.serverId, locale)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === "ready" && res.payload && !isPlaceholderAi(res.payload)) {
          const next = { ...item, ai: { locale, payload: res.payload } };
          setItem(next);
          if (await getAssessment(item.id)) await saveAssessment(next);
        } else {
          setAiFailedLocale(locale);
        }
      })
      .catch(() => !cancelled && setAiFailedLocale(locale));
    return () => {
      cancelled = true;
    };
  }, [item, locale]);

  // Zaif sohalarga mos uy mashqlari
  useEffect(() => {
    if (!item) return;
    const weak = isScreeningV3(item.result) ? v3WeakDomains(item.result) : weakDomains(item.result);
    fetchContent("lesson", locale)
      .then(({ categories }) => {
        const videos = categories.flatMap((c) => c.videos);
        const matches = videos.filter(
          (v) => (v.domains.length === 0 || v.domains.some((d) => weak.includes(d))) && (v.ageGroups.length === 0 || v.ageGroups.includes(item.ageGroup)),
        );
        setRecommended(matches.slice(0, 6));
      })
      .catch(() => setRecommended([]));
  }, [item, locale]);

  // Soha nomlari va savol matnlari tanlangan tilda
  const config = useMemo(() => (item ? getTestConfig(item.ageGroup, locale) : null), [item, locale]);
  const domainTitle = (blockId: string, fallback: string) => config?.domains.find((d) => d.id === blockId)?.title ?? fallback;
  const questionText = (qid: string, fallback: string) => config?.questions.find((q) => q.id === qid)?.text ?? fallback;

  if (item === undefined)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  if (item === null)
    return (
      <Screen>
        <BackHeader />
        <EmptyState icon={AlertTriangle} title={t("common.error")} />
      </Screen>
    );

  const tier = assessmentTier(item);
  const colors = riskColors(tier);
  const v3 = isScreeningV3(item.result) ? item.result : null;

  return (
    <Screen>
      <BackHeader title={t("result.title")} />

      {v3 ? <ResultV3 result={v3} createdAt={item.createdAt} age={ageOf(item)} /> : null}
      {!v3 && (
        <>

      <FadeIn>
        <Card className="items-center !gap-4 !py-8 text-center">
          <span className="t-small text-ink-3">
            {formatDate(item.createdAt)} · {ageOf(item)}
          </span>
          <LevelBadge tier={tier} size={88} />
          <h2 className="t-subtitle" style={{ color: colors.fg }}>
            {t(`result.${tier}`)}
          </h2>
          <p className="t-body max-w-[520px] px-2">{t(`result.${tier}Body`)}</p>
        </Card>
      </FadeIn>

      <SectionHeader title={t("result.domains")} />
      <FadeIn delay={100}>
        <Card className="!gap-6">
          {item.result.blocks.map((b) => (
            <DomainRow key={b.blockId} id={b.blockId} title={domainTitle(b.blockId, b.title)} score={b.score} />
          ))}
        </Card>
      </FadeIn>

      {item.result.redFlagCount > 0 && (
        <FadeIn delay={160}>
          <Card flat className="!border-0 !bg-danger-soft">
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-[18px] w-[18px]" />
              <h3 className="t-heading flex-1">
                {t("result.redFlags")} · {item.result.redFlagCount}
              </h3>
            </div>
            <p className="t-small text-ink-2">{t("result.redFlagsBody")}</p>
            {item.result.redFlags.map((f) => (
              <p key={f.questionId} className="t-body">
                • {questionText(f.questionId, f.text)}
              </p>
            ))}
          </Card>
        </FadeIn>
      )}

        </>
      )}

      {/* AI xulosa: tayyor bo'lsa yoki tayyorlanayotgan bo'lsa ko'rsatiladi; ishlamasa bo'lim umuman chiqmaydi */}
      {item.serverId && aiFailedLocale !== locale && (
        <>
          <SectionHeader title={t("result.ai")} />
          <Card>
            {item.ai?.locale === locale && !isPlaceholderAi(item.ai.payload) ? (
              <AiSummary payload={item.ai.payload} />
            ) : (
              <div className="flex items-center gap-4">
                <Spinner />
                <p className="t-body text-ink-2">{t("result.aiLoading")}</p>
              </div>
            )}
          </Card>
        </>
      )}

      {recommended.length > 0 && (
        <>
          <SectionHeader title={t("result.recommended")} />
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
            {recommended.map((v) => (
              <VideoTile key={v.id} video={v} accent="exercises" width={240} />
            ))}
          </div>
        </>
      )}

      {v3 ? <ResultV3Details result={v3} /> : null}

      {!v3 && (
        <>
      <SectionHeader title={t("result.nextSteps")} />
      <Card className="!gap-0 overflow-hidden !p-0">
        <ListRow
          icon={Stethoscope}
          iconColor={centers.fg}
          iconBackground={centers.soft}
          title={t("result.stepSpecialist")}
          subtitle={t("result.stepSpecialistBody")}
          href={SHOW_CENTERS ? "/centers" : undefined}
        />
        <ListRow icon={MonitorPlay} iconColor={lessons.fg} iconBackground={lessons.soft} title={t("result.stepLearn")} subtitle={t("result.stepLearnBody")} href="/lessons" />
        <ListRow
          icon={HandHeart}
          iconColor={exercises.fg}
          iconBackground={exercises.soft}
          title={t("result.stepPractice")}
          subtitle={t("result.stepPracticeBody")}
          href="/exercises"
          last
        />
      </Card>
        </>
      )}

      <p className="t-small mt-2 text-center text-ink-3">{t("home.disclaimer")}</p>
    </Screen>
  );
}
