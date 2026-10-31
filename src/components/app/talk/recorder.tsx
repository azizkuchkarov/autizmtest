"use client";

import { Mic, Play, RotateCcw, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/app/providers";

/** Bitta yozuvning eng uzun vaqti — karta uchun qisqa so'z yoki gap yetarli. */
const MAX_MS = 6000;

function pickMime() {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m));
}

/**
 * Ota-ona ovozini yozish: bosiladi → gapiriladi → to'xtatiladi → tinglanadi → saqlanadi.
 * `existingUrl` — oldin yozilgan ovoz (bo'lsa tinglash va o'chirish mumkin).
 */
export function VoiceRecorder({
  existingUrl,
  onSave,
  onDelete,
  autoSave,
}: {
  existingUrl: string | null;
  onSave: (blob: Blob) => Promise<void> | void;
  onDelete?: () => void;
  /** Yozib bo'lingach darhol saqlash (ketma-ket yozish rejimi uchun) */
  autoSave?: boolean;
}) {
  const { t } = useLocale();
  const [state, setState] = useState<"idle" | "recording" | "preview">("idle");
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      recorder.current?.stream.getTracks().forEach((tr) => tr.stop());
      player.current?.pause();
    },
    [],
  );

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview.url)), [preview]);

  const play = (url: string) => {
    player.current ??= new Audio();
    player.current.src = url;
    player.current.play().catch(() => {});
  };

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (autoSave) {
          await onSave(blob);
          setState("idle");
          return;
        }
        setPreview({ blob, url: URL.createObjectURL(blob) });
        setState("preview");
      };
      recorder.current = rec;
      rec.start();
      setState("recording");
      timer.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_MS);
    } catch {
      setError(t("talk.micDenied"));
      setState("idle");
    }
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const save = async () => {
    if (!preview) return;
    await onSave(preview.blob);
    setPreview(null);
    setState("idle");
  };

  const btn = "t-small-bold flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 text-[14.5px] active:scale-[0.97]";

  return (
    <div className="flex flex-col gap-2">
      {state === "recording" ? (
        <button type="button" onClick={stop} className={`${btn} bg-[var(--centers)] text-white`}>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          {t("talk.recording")}
          <Square className="ml-1 h-4 w-4" fill="currentColor" />
        </button>
      ) : state === "preview" && preview ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => play(preview.url)} className={`${btn} border border-line bg-element`}>
            <Play className="h-4 w-4" /> {t("talk.play")}
          </button>
          <button type="button" onClick={start} className={`${btn} border border-line bg-element`}>
            <RotateCcw className="h-4 w-4" /> {t("talk.redo")}
          </button>
          <button type="button" onClick={save} className={`${btn} bg-primary-gradient text-white`}>
            {t("common.save")}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={start} className={`${btn} bg-primary-gradient text-white`}>
            <Mic className="h-4 w-4" /> {existingUrl ? t("talk.redo") : t("talk.record")}
          </button>
          {existingUrl ? (
            <>
              <button type="button" onClick={() => play(existingUrl)} className={`${btn} max-w-[130px] border border-line bg-element`}>
                <Play className="h-4 w-4" /> {t("talk.play")}
              </button>
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  aria-label={t("talk.deleteRecording")}
                  className={`${btn} max-w-[52px] border border-line bg-element text-[var(--centers)]`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      )}
      {error ? <p className="t-small text-[var(--centers)]">{error}</p> : null}
    </div>
  );
}
