"use client";

import { Clock, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BackHeader } from "@/components/app/app-shell";
import { useLocale, useProfile } from "@/components/app/providers";
import { accent, Card, EmptyState, FadeIn, Pill, Screen, Skeleton } from "@/components/app/ui";
import { fetchVideo, type Video } from "@/lib/app/api";
import { domainStyle } from "@/lib/app/domains";
import { markVideoWatched } from "@/lib/app/video-log";

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
          onPlay={() => markVideoWatched(childKey)}
          className="aspect-video w-full"
        />
      </div>
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
    </Screen>
  );
}
