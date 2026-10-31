"use client";

import { HandHeart, MonitorPlay, RefreshCw, WifiOff } from "lucide-react";
import { useState, type ReactNode } from "react";

import { useLocale } from "@/components/app/providers";
import { VideoRow, VideoTile } from "@/components/app/video-cards";
import { accent as accentOf, EmptyState, FadeIn, OptionChip, PageHeader, Screen, SectionHeader, Skeleton, type AccentName } from "@/components/app/ui";
import type { ContentKind } from "@/lib/app/api";
import { useContent } from "@/hooks/use-content";

/** Darslar va Mashqlar sahifalari: yo'nalish filtri, tavsiya etilgan video va mavzular bo'yicha ro'yxat. */
export function ContentList({
  kind,
  accent,
  title,
  subtitle,
  extra,
}: {
  kind: ContentKind;
  accent: AccentName;
  title: string;
  subtitle: string;
  /** Sarlavha ostidagi qo'shimcha blok (Darslar: video/ovozli tanlovi, Mashqlar: muloqot kartalari) */
  extra?: ReactNode;
}) {
  const { t } = useLocale();
  const a = accentOf(accent);
  const { categories, professions, error, reload } = useContent(kind);
  const [refreshing, setRefreshing] = useState(false);
  /** Tanlangan yo'nalish slug'i: null — barchasi */
  const [profession, setProfession] = useState<string | null>(null);

  const activeProfession = professions.some((p) => p.slug === profession) ? profession : null;
  const visible = categories?.filter((c) => !activeProfession || c.profession === activeProfession) ?? [];
  const featured = visible[0]?.videos[0];
  const total = visible.reduce((n, c) => n + c.videos.length, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <Screen>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={
          categories ? (
            <button onClick={onRefresh} aria-label={t("common.retry")} className="mt-2 hidden rounded-full p-2 text-ink-3 hover:bg-muted hover:text-ink md:block">
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          ) : null
        }
      />
      {extra}

      {error && !categories ? (
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={reload} />
      ) : !categories ? (
        <div className="flex flex-col gap-4">
          <Skeleton height={220} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </div>
      ) : total === 0 && !activeProfession ? (
        <EmptyState icon={kind === "lesson" ? MonitorPlay : HandHeart} title={t("content.emptyTitle")} body={t("content.empty")} color={a.fg} background={a.soft} />
      ) : (
        <>
          {professions.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:flex-wrap sm:px-6" role="radiogroup">
              <OptionChip label={t("content.all")} selected={activeProfession === null} onClick={() => setProfession(null)} />
              {professions.map((p) => (
                <OptionChip key={p.id} label={p.title} selected={activeProfession === p.slug} onClick={() => setProfession(p.slug)} />
              ))}
            </div>
          )}

          {featured && (
            <FadeIn key={`featured-${activeProfession}`} className="flex flex-col gap-2">
              <span className="t-caption" style={{ color: a.fg }}>
                {t("content.featured")}
              </span>
              <VideoTile video={featured} accent={accent} wide />
            </FadeIn>
          )}

          {visible.map((category, ci) => (
            <FadeIn key={`${category.id}-${activeProfession}`} delay={80 * (ci + 1)} className="flex flex-col gap-2.5">
              <SectionHeader title={category.title} />
              <p className="t-small -mt-1 text-ink-2">
                {category.description ? `${category.description} · ` : ""}
                {category.videos.length} {t("common.videos")}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {category.videos.map((video, i) => (
                  <VideoRow key={video.id} video={video} accent={accent} index={i} />
                ))}
              </div>
            </FadeIn>
          ))}
        </>
      )}
    </Screen>
  );
}
