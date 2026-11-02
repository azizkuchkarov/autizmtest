"use client";

import { WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { ContinueCard, sectionLook } from "@/components/app/lesson-sections";
import { useLocale } from "@/components/app/providers";
import { accent, Card, EmptyState, FadeIn, ProgressBar, Screen, SectionHeader, Skeleton } from "@/components/app/ui";
import { VideoRow } from "@/components/app/video-cards";
import { useContent } from "@/hooks/use-content";
import { buildSections, syncVideoProgress, useVideoProgress } from "@/lib/app/video-progress";

/** Bo'lim ichi: nechtasi ko'rilgani, navbatdagi dars va mavzular bo'yicha videolar. */
export default function SectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLocale();
  const { categories, professions, error, reload } = useContent("lesson");
  const progress = useVideoProgress();

  useEffect(() => {
    syncVideoProgress();
  }, []);

  const section = categories ? buildSections(professions, categories, progress).find((s) => s.slug === slug) : undefined;
  const look = sectionLook(slug);

  if (error && !categories)
    return (
      <Screen>
        <BackHeader />
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={reload} />
      </Screen>
    );

  if (!section)
    return (
      <Screen>
        <BackHeader />
        <Skeleton height={100} />
        <Skeleton height={84} />
        <Skeleton height={84} />
      </Screen>
    );

  const total = section.videos.length;
  if (total === 0) {
    const a = accent(look.accent);
    return (
      <Screen>
        <BackHeader title={section.title} />
        <EmptyState icon={look.icon} title={t("content.emptyTitle")} body={t("content.empty")} color={a.fg} background={a.soft} />
      </Screen>
    );
  }

  const allDone = section.done === total;
  const color = allDone ? accent("exercises").fg : accent(look.accent).fg;

  return (
    <Screen>
      <BackHeader title={section.title} />
      <Card>
        <div className="flex flex-col gap-2">
          <h2 className="t-heading text-[17px]" style={allDone ? { color } : undefined}>
            {allDone ? t("lessons.allDone") : t("lessons.watchedOf").replace("{done}", String(section.done)).replace("{total}", String(total))}
          </h2>
          <ProgressBar value={(section.done / total) * 100} color={color} />
          {allDone ? <p className="t-small text-ink-2">{t("lessons.allDoneBody")}</p> : null}
        </div>
      </Card>
      {section.next ? <ContinueCard video={section.next} accent={look.accent} started={section.done > 0 || (progress[section.next.id]?.pos ?? 0) > 0} /> : null}
      {section.categories.map((category, ci) => (
        <FadeIn key={category.id} delay={70 * ci} className="flex flex-col gap-2.5">
          <SectionHeader title={category.title} />
          {category.description ? <p className="t-small -mt-1 text-ink-2">{category.description}</p> : null}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {category.videos.map((video, i) => (
              <VideoRow key={video.id} video={video} accent={look.accent} index={i} />
            ))}
          </div>
        </FadeIn>
      ))}
    </Screen>
  );
}
