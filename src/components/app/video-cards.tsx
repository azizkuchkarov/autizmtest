"use client";

import { Clock, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { ACCENT_GRADIENT, accent as accentOf, gradient, Skeleton, SectionHeader, type AccentName } from "@/components/app/ui";
import type { ContentKind, Video } from "@/lib/app/api";
import { useContent } from "@/hooks/use-content";

function useDuration(sec: number | null) {
  const { t } = useLocale();
  if (!sec) return null;
  return `${Math.max(1, Math.round(sec / 60))} ${t("common.minutes")}`;
}

/** Muqova: rasm bo'lsa rasm, bo'lmasa bo'lim gradienti va ikonka. */
function Thumbnail({ video, accent, iconSize }: { video: Video; accent: AccentName; iconSize: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <>
      <span className="absolute inset-0" style={{ background: gradient(ACCENT_GRADIENT[accent]) }} />
      {video.thumbnailUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- tashqi CDN muqovasi
        <img src={video.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : null}
      <span
        className="relative flex items-center justify-center rounded-full border-[1.5px] border-white/60 bg-[rgb(14_19_48/0.45)] text-white transition-transform group-hover:scale-110"
        style={{ width: iconSize, height: iconSize }}
      >
        <Play fill="currentColor" strokeWidth={0} style={{ width: iconSize * 0.42, height: iconSize * 0.42, marginLeft: iconSize * 0.05 }} />
      </span>
    </>
  );
}

/** Karuseldagi va tavsiyalardagi katta kartochka. */
export function VideoTile({ video, accent, width, wide }: { video: Video; accent: AccentName; width?: number; wide?: boolean }) {
  const duration = useDuration(video.durationSec);
  return (
    <Link
      href={`/video/${video.id}`}
      className={`group flex shrink-0 flex-col overflow-hidden rounded-[24px] border border-line bg-element shadow-card transition-transform active:scale-[0.97] hover:-translate-y-0.5 ${wide ? "md:flex-row" : ""}`}
      style={{ width }}
    >
      <span className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden ${wide ? "md:aspect-video md:w-[58%] md:shrink-0" : ""}`}>
        <Thumbnail video={video} accent={accent} iconSize={44} />
        {duration ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-[rgb(14_19_48/0.7)] px-2 py-[3px] text-[11.5px] font-bold text-white">{duration}</span>
        ) : null}
      </span>
      <span className={`flex flex-col gap-0.5 p-4 ${wide ? "md:justify-center md:gap-2 md:p-6" : ""}`}>
        <span className={`t-heading line-clamp-2 text-[15.5px] ${wide ? "md:text-[20px] md:leading-[27px]" : ""}`}>{video.title}</span>
        {video.description ? <span className="t-small line-clamp-2 text-ink-2">{video.description}</span> : null}
      </span>
    </Link>
  );
}

/** Ro'yxat qatori ko'rinishidagi kartochka. */
export function VideoRow({ video, accent, index }: { video: Video; accent: AccentName; index?: number }) {
  const duration = useDuration(video.durationSec);
  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex items-center gap-4 rounded-[18px] border border-line bg-element p-2.5 shadow-card transition-transform active:scale-[0.98] hover:border-tint/40"
    >
      <span className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[12px]">
        <Thumbnail video={video} accent={accent} iconSize={30} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {index !== undefined ? (
          <span className="t-caption" style={{ color: accentOf(accent).fg }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
        <span className="t-small-bold line-clamp-2 text-[14.5px]">{video.title}</span>
        {duration ? (
          <span className="t-small flex items-center gap-1 text-ink-3">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** Bosh sahifadagi gorizontal video karusel. Videolar bo'lmasa yoki ulanib bo'lmasa ko'rsatilmaydi. */
export function VideoCarousel({ kind, title, accent, seeAllHref }: { kind: ContentKind; title: string; accent: AccentName; seeAllHref: string }) {
  const { t } = useLocale();
  const { categories, error, videos } = useContent(kind);

  if (error || (categories && videos.length === 0)) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title={title} action={t("common.seeAll")} href={seeAllHref} />
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {!categories
          ? [0, 1, 2].map((i) => (
              <div key={i} className="flex w-[240px] shrink-0 flex-col gap-2">
                <Skeleton height={150} />
                <Skeleton height={16} width="80%" radius={8} />
              </div>
            ))
          : videos.slice(0, 8).map((v) => (
              <div key={v.id} className="snap-start">
                <VideoTile video={v} accent={accent} width={240} />
              </div>
            ))}
      </div>
    </div>
  );
}
