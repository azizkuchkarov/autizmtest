"use client";

import { ChevronRight, Hand, HeartHandshake, MessagesSquare, MonitorPlay, Play, Puzzle, RefreshCw, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { useLocale } from "@/components/app/providers";
import { ACCENT_GRADIENT, accent as accentOf, EmptyState, FadeIn, gradient, PageHeader, ProgressBar, Screen, SectionHeader, Skeleton, type AccentName } from "@/components/app/ui";
import { useContent } from "@/hooks/use-content";
import type { Video } from "@/lib/app/api";
import { buildSections, syncVideoProgress, useVideoProgress, type VideoSection } from "@/lib/app/video-progress";

/** Har bir bo'limning o'z rangi va belgisi: ota-ona bo'limni ko'rinishidan taniydi. */
const SECTION_LOOK: Record<string, { accent: AccentName; icon: LucideIcon }> = {
  autism: { accent: "test", icon: Puzzle },
  speech: { accent: "lessons", icon: MessagesSquare },
  sensory: { accent: "exercises", icon: Hand },
  psychology: { accent: "centers", icon: HeartHandshake },
};
const DEFAULT_LOOK = { accent: "test" as AccentName, icon: MonitorPlay };

export function sectionLook(slug: string) {
  return SECTION_LOOK[slug] ?? DEFAULT_LOOK;
}

/** Eng muhim harakat: to'xtagan yoki navbatdagi dars. */
export function ContinueCard({ video, accent, started }: { video: Video; accent: AccentName; started: boolean }) {
  const { t } = useLocale();
  return (
    <Link
      href={`/video/${video.id}`}
      className="flex items-center gap-4 rounded-[24px] p-3.5 shadow-card transition-transform active:scale-[0.99]"
      style={{ background: gradient(ACCENT_GRADIENT[accent]) }}
    >
      <span className="relative flex h-[72px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/20">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tashqi CDN muqovasi
          <img src={video.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <span className="relative flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white" style={{ color: accentOf(accent).fg }}>
          <Play className="ml-0.5 h-[18px] w-[18px]" fill="currentColor" strokeWidth={0} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] font-bold text-white/80">{started ? t("lessons.continue") : t("lessons.startFirst")}</span>
        <span className="t-heading line-clamp-2 text-[16.5px] leading-[21px] !text-white">{video.title}</span>
      </span>
    </Link>
  );
}

function SectionCard({ section, index }: { section: VideoSection; index: number }) {
  const { t } = useLocale();
  const look = sectionLook(section.slug);
  const a = accentOf(look.accent);
  const Icon = look.icon;
  const total = section.videos.length;
  const allDone = section.done === total;
  const color = allDone ? accentOf("exercises").fg : a.fg;
  return (
    <FadeIn delay={60 * index}>
      <Link href={`/section/${section.slug}`} className="flex flex-col gap-3.5 rounded-[24px] border border-line bg-element p-[18px] shadow-card transition-transform active:scale-[0.99]">
        <span className="flex items-center gap-3.5">
          <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[17px] text-white" style={{ background: gradient(ACCENT_GRADIENT[look.accent]) }}>
            <Icon className="h-[26px] w-[26px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="t-heading text-[19px]">{section.title}</span>
            <span className="t-small text-ink-2">
              {t("lessons.sectionMeta").replace("{n}", String(total)).replace("{m}", String(Math.max(1, Math.round(section.totalSec / 60))))}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
        </span>
        <span className="flex flex-col gap-1.5">
          <ProgressBar value={(section.done / total) * 100} color={color} height={7} />
          <span className={`text-[12.5px] font-bold ${section.done > 0 ? "" : "text-ink-3"}`} style={section.done > 0 ? { color } : undefined}>
            {t("lessons.watchedOf").replace("{done}", String(section.done)).replace("{total}", String(total))}
          </span>
        </span>
      </Link>
    </FadeIn>
  );
}

/** Darslar: avval "Davom ettirish", keyin yo'nalishlar bo'yicha bo'limlar. */
export function LessonSections({ tabs }: { tabs?: ReactNode }) {
  const { t } = useLocale();
  const { categories, professions, error, reload } = useContent("lesson");
  const progress = useVideoProgress();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    syncVideoProgress();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), syncVideoProgress()]);
    setRefreshing(false);
  };

  const sections = categories ? buildSections(professions, categories, progress) : [];
  const current = sections.find((s) => s.next && (progress[s.next.id]?.pos ?? 0) > 0) ?? sections.find((s) => s.next);
  const anyStarted = sections.some((s) => s.done > 0) || !!(current?.next && progress[current.next.id]?.pos);
  const lessons = accentOf("lessons");

  return (
    <Screen>
      <PageHeader
        title={t("lessons.title")}
        subtitle={t("lessons.subtitle")}
        right={
          categories ? (
            <button onClick={onRefresh} aria-label={t("common.retry")} className="mt-2 hidden rounded-full p-2 text-ink-3 hover:bg-muted md:block">
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          ) : null
        }
      />
      {tabs}
      {error && !categories ? (
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={reload} />
      ) : !categories ? (
        <div className="flex flex-col gap-4">
          <Skeleton height={100} />
          <Skeleton height={124} />
          <Skeleton height={124} />
        </div>
      ) : sections.length === 0 ? (
        <EmptyState icon={MonitorPlay} title={t("content.emptyTitle")} body={t("content.empty")} color={lessons.fg} background={lessons.soft} />
      ) : (
        <>
          {current?.next ? <ContinueCard video={current.next} accent={sectionLook(current.slug).accent} started={anyStarted} /> : null}
          <SectionHeader title={t("lessons.choose")} />
          <div className="grid gap-3.5 md:grid-cols-2">
            {sections.map((section, i) => (
              <SectionCard key={section.slug} section={section} index={i} />
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
