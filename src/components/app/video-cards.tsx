"use client";

import { Check, CheckCircle2, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/app/providers";
import { ACCENT_GRADIENT, accent as accentOf, gradient, type AccentName } from "@/components/app/ui";
import type { Video } from "@/lib/app/api";
import { useVideoProgress, type VideoState } from "@/lib/app/video-progress";

function useDuration(sec: number | null) {
  const { t } = useLocale();
  if (!sec) return null;
  return `${Math.max(1, Math.round(sec / 60))} ${t("common.minutes")}`;
}

/** Muqova: rasm bo'lsa rasm, bo'lmasa bo'lim gradienti va ikonka. */
function Thumbnail({ video, accent, iconSize, state }: { video: Video; accent: AccentName; iconSize: number; state?: VideoState }) {
  const [broken, setBroken] = useState(false);
  const done = !!state?.done;
  const part = !done && state?.pos && video.durationSec ? Math.min(100, (state.pos / video.durationSec) * 100) : 0;
  return (
    <>
      <span className="absolute inset-0" style={{ background: gradient(ACCENT_GRADIENT[accent]) }} />
      {video.thumbnailUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- tashqi CDN muqovasi
        <img src={video.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : null}
      {done ? <span className="absolute inset-0 bg-[rgb(14_19_48/0.42)]" /> : null}
      <span
        className={`relative flex items-center justify-center rounded-full border-[1.5px] text-white ${done ? "border-white" : "border-white/60 bg-[rgb(14_19_48/0.45)]"}`}
        style={{ width: iconSize, height: iconSize, ...(done ? { background: accentOf("exercises").fg } : {}) }}
      >
        {done ? (
          <Check style={{ width: iconSize * 0.55, height: iconSize * 0.55 }} strokeWidth={3} />
        ) : (
          <Play fill="currentColor" strokeWidth={0} style={{ width: iconSize * 0.42, height: iconSize * 0.42, marginLeft: iconSize * 0.05 }} />
        )}
      </span>
      {part > 0 ? (
        <span className="absolute inset-x-0 bottom-0 h-1 bg-[rgb(14_19_48/0.45)]">
          <span className="block h-full bg-white" style={{ width: `${part}%` }} />
        </span>
      ) : null}
    </>
  );
}

/** Karuseldagi va tavsiyalardagi katta kartochka. */
export function VideoTile({ video, accent, width, wide }: { video: Video; accent: AccentName; width?: number; wide?: boolean }) {
  const duration = useDuration(video.durationSec);
  const state = useVideoProgress()[video.id];
  return (
    <Link
      href={`/video/${video.id}`}
      className={`group flex shrink-0 flex-col overflow-hidden rounded-[24px] border border-line bg-element shadow-card transition-transform active:scale-[0.97] hover:-translate-y-0.5 ${wide ? "md:flex-row" : ""}`}
      style={{ width }}
    >
      <span className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden ${wide ? "md:aspect-video md:w-[58%] md:shrink-0" : ""}`}>
        <Thumbnail video={video} accent={accent} iconSize={44} state={state} />
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
  const state = useVideoProgress()[video.id];
  return (
    <Link
      href={`/video/${video.id}`}
      className="group flex items-center gap-4 rounded-[18px] border border-line bg-element p-2.5 shadow-card transition-transform active:scale-[0.99]"
    >
      <span className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[12px]">
        <Thumbnail video={video} accent={accent} iconSize={30} state={state} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="t-small-bold line-clamp-2 text-[14.5px]">
          {index !== undefined ? `${index + 1}. ` : ""}
          {video.title}
        </span>
        <VideoStatus video={video} state={state} accent={accent} />
      </span>
    </Link>
  );
}

/** Ko'rilgan, chala qolgan yoki yangi video holati: bitta qator. */
function VideoStatus({ video, state, accent }: { video: Video; state?: VideoState; accent: AccentName }) {
  const { t } = useLocale();
  const duration = useDuration(video.durationSec);
  if (state?.done)
    return (
      <span className="flex items-center gap-1 text-[12.5px] font-bold" style={{ color: accentOf("exercises").fg }}>
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("video.watched")}
      </span>
    );
  if (state?.pos && video.durationSec)
    return (
      <span className="text-[12.5px] font-bold" style={{ color: accentOf(accent).fg }}>
        {t("video.minutesLeft").replace("{n}", String(Math.max(1, Math.round((video.durationSec - state.pos) / 60))))}
      </span>
    );
  if (!duration) return null;
  return (
    <span className="t-small flex items-center gap-1 text-ink-3">
      <Clock className="h-3 w-3" />
      {duration}
    </span>
  );
}
