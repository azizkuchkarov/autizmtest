"use client";

import { CheckCircle2, Clock, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale, useProfile } from "@/components/app/providers";
import { sectionLook } from "@/components/app/lesson-sections";
import { accent, Button, Card, EmptyState, FadeIn, Pill, Screen, SectionHeader, Skeleton } from "@/components/app/ui";
import { VideoRow } from "@/components/app/video-cards";
import { useContent } from "@/hooks/use-content";
import { fetchVideo, type Video } from "@/lib/app/api";
import { domainStyle } from "@/lib/app/domains";
import { markVideoWatched } from "@/lib/app/video-log";
import { buildSections, flushVideoProgress, getVideoState, recordPosition, useVideoProgress } from "@/lib/app/video-progress";

function DomainPill({ id }: { id: string }) {
  const { t } = useLocale();
  const style = domainStyle(id);
  const a = accent(style.accent);
  return <Pill label={t(style.title)} color={a.fg} background={a.soft} />;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLocale();
  const childKey = useProfile().child?.id ?? "default";
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState(false);
  const progress = useVideoProgress();
  const { categories, professions } = useContent("lesson");
  const lastSent = useRef(0);

  // To'xtagan joy saqlanadi; oxirigacha ko'rilganda "Ko'rildi" belgisi va "Bugungi reja" bajariladi
  const save = (position: number, duration: number) => {
    if (recordPosition(id, position, duration > 0 ? duration : video?.durationSec ?? null)) {
      markVideoWatched(childKey);
      flushVideoProgress();
    }
  };

  useEffect(() => () => void flushVideoProgress(), []);

  useEffect(() => {
    let cancelled = false;
    fetchVideo(id, locale)
      .then((res) => !cancelled && setVideo(res.video))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  const load = useCallback(() => {
    setError(false);
    fetchVideo(id, locale)
      .then((res) => setVideo(res.video))
      .catch(() => setError(true));
  }, [id, locale]);

  if (error)
    return (
      <Screen>
        <BackHeader />
        <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={load} />
      </Screen>
    );

  if (!video)
    return (
      <Screen>
        <BackHeader />
        <Skeleton height={210} radius={24} className="aspect-video !h-auto" />
        <Skeleton height={28} width="70%" radius={8} />
        <Skeleton height={80} />
      </Screen>
    );

  const done = !!progress[video.id]?.done;
  // Keyingi dars — shu bo'limdagi tartib bo'yicha
  const section = categories ? buildSections(professions, categories, progress).find((sec) => sec.videos.some((v) => v.id === video.id)) : undefined;
  const list = section?.videos ?? [];
  const next = list.slice(list.findIndex((v) => v.id === video.id) + 1).find((v) => !progress[v.id]?.done) ?? null;
  const upNext = list.slice(list.findIndex((v) => v.id === video.id) + 1).filter((v) => !progress[v.id]?.done && (!done || v.id !== next?.id)).slice(0, 3);
  const look = sectionLook(section?.slug ?? "");
  const green = accent("exercises");

  const minutes = video.durationSec ? Math.max(1, Math.round(video.durationSec / 60)) : null;

  return (
    <Screen className="md:max-w-[900px]">
      <BackHeader />
      <div className="overflow-hidden rounded-[24px] bg-black shadow-card">
        <video
          key={video.videoUrl}
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={(e) => {
            const start = getVideoState(video.id)?.pos ?? 0;
            if (start > 0) e.currentTarget.currentTime = start;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            // Har 3 soniyada: pleyer soniyasiga bir necha marta chaqiradi
            if (v.currentTime > 0 && Math.abs(v.currentTime - lastSent.current) >= 3) {
              lastSent.current = v.currentTime;
              save(v.currentTime, v.duration);
            }
          }}
          onPause={(e) => {
            save(e.currentTarget.currentTime, e.currentTarget.duration);
            flushVideoProgress();
          }}
          onEnded={(e) => save(e.currentTarget.duration, e.currentTarget.duration)}
          className="aspect-video w-full"
        />
      </div>
      {done ? (
        <FadeIn>
          <div className="flex flex-col gap-3 rounded-[20px] p-4" style={{ background: green.soft }}>
            <span className="t-heading flex items-center gap-2 text-[17px]" style={{ color: green.fg }}>
              <CheckCircle2 className="h-6 w-6" />
              {t("video.doneTitle")}
            </span>
            {next ? (
              <Button title={`${t("video.next")}: ${next.title}`} size="md" href={`/video/${next.id}`} />
            ) : section ? (
              <Button title={t("video.backToSection")} size="md" variant="secondary" href={`/section/${section.slug}`} />
            ) : null}
          </div>
        </FadeIn>
      ) : null}
      <FadeIn className="flex flex-col gap-4">
        <h1 className="t-title !text-[25px] !leading-[31px] md:!text-[30px] md:!leading-[36px]">{video.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {minutes ? (
            <span className="t-small mr-2 flex items-center gap-1 text-ink-2">
              <Clock className="h-3.5 w-3.5" />
              {minutes} {t("common.minutes")}
            </span>
          ) : null}
          {video.domains.map((d) => (
            <DomainPill key={d} id={d} />
          ))}
        </div>
        {video.description ? (
          <Card>
            <p className="t-body whitespace-pre-line">{video.description}</p>
          </Card>
        ) : null}
      </FadeIn>
      {upNext.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <SectionHeader title={t("video.upNext")} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {upNext.map((v) => (
              <VideoRow key={v.id} video={v} accent={look.accent} />
            ))}
          </div>
        </div>
      ) : null}
    </Screen>
  );
}
