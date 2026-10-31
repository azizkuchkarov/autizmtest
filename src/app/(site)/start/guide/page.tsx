"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Button } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";

/** Qo'llanma sahifasidagi "qachon" belgisi. */
function When({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="flex items-start gap-2.5 rounded-[18px] bg-tint-soft px-4 py-3 text-tint">
      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex flex-col">
        <span className="t-caption">{t("guide.when")}</span>
        <span className="t-small-bold text-[15px] text-ink">{children}</span>
      </span>
    </div>
  );
}

/** Kun tartibi qatori: vaqt — nima qilinadi. */
function TimelineRow({ time, emoji, text, last }: { time: string; emoji: string; text: string; last?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-element text-[22px] shadow-card" aria-hidden>
          {emoji}
        </span>
        {!last && <span className="w-0.5 flex-1 bg-line" />}
      </div>
      <div className="flex flex-col pb-4 pt-1">
        <span className="t-small-bold flex items-center gap-1 tabular-nums text-tint">
          <Clock className="h-3.5 w-3.5" />
          {time}
        </span>
        <span className="t-body text-[15.5px]">{text}</span>
      </div>
    </div>
  );
}

type Slide = { emoji: string; title: TranslationKey; body: TranslationKey; extra?: ReactNode };

/** Ota-onalar uchun qo'llanma: ilovadan qanday va qachon foydalanish — oddiy tilda, 7 ta qisqa sahifa. */
function GuideScreen({ again }: { again: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const { child, markGuideSeen } = useProfile();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const practice = child?.practiceTime ?? "17:00";
  const diary = child?.diaryTime ?? "08:30";

  const slides: Slide[] = [
    { emoji: "👋", title: "guide.s1Title", body: "guide.s1Body" },
    { emoji: "📝", title: "guide.s2Title", body: "guide.s2Body", extra: <When>{t("guide.s2When")}</When> },
    { emoji: "🎬", title: "guide.s3Title", body: "guide.s3Body", extra: <When>{t("guide.s3When")}</When> },
    {
      emoji: "☀️",
      title: "guide.s4Title",
      body: "guide.s4Body",
      extra: (
        <div className="flex flex-col pt-1">
          <TimelineRow time={diary} emoji="📔" text={t("guide.s4Diary")} />
          <TimelineRow time={practice} emoji="🧸" text={t("guide.s4Practice")} />
          <TimelineRow time={t("guide.s4Anytime")} emoji="🎧" text={t("guide.s4Free")} last />
        </div>
      ),
    },
    {
      emoji: "📈",
      title: "guide.s5Title",
      body: "guide.s5Body",
      extra: (
        <div className="flex flex-col gap-2">
          <When>{t("guide.s5Week")}</When>
          <When>{t("guide.s5Month")}</When>
        </div>
      ),
    },
    {
      emoji: "🩺",
      title: "guide.s6Title",
      body: "guide.s6Body",
      extra: (
        <ul className="flex flex-col gap-2">
          {(["guide.s6a", "guide.s6b", "guide.s6c", "guide.s6d"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2.5 rounded-[16px] bg-[var(--danger-soft)] px-4 py-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--danger)]" />
              <span className="t-body text-[15px]">{t(k)}</span>
            </li>
          ))}
        </ul>
      ),
    },
    { emoji: "🎉", title: "guide.s7Title", body: "guide.s7Body" },
  ];

  const last = index === slides.length - 1;
  const slide = slides[index];

  const finish = async () => {
    setFinishing(true);
    await markGuideSeen();
    router.replace(again ? "/profile" : "/");
  };

  return (
    <StartScaffold
      back={again}
      step={`${index + 1} / ${slides.length}`}
      footer={
        <>
          <div className="mb-1 flex justify-center gap-1.5" aria-hidden>
            {slides.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 22 : 6, background: i <= index ? "var(--tint)" : "var(--border)" }} />
            ))}
          </div>
          <Button
            title={last ? t("guide.start") : t("guide.next")}
            icon={last ? Sparkles : ArrowRight}
            loading={finishing}
            onClick={() => (last ? finish() : setIndex(index + 1))}
          />
          {!last && (
            <button type="button" onClick={finish} className="t-small-bold py-1 text-ink-3 hover:text-ink">
              {t("guide.skip")}
            </button>
          )}
        </>
      }
    >
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-5 pb-4"
      >
        <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-element text-[56px] shadow-card" aria-hidden>
          {slide.emoji}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="t-title">{t(slide.title)}</h1>
          <p className="t-body text-[16.5px] leading-[25px] text-ink-2">{t(slide.body)}</p>
        </div>
        {slide.extra}
      </motion.div>
    </StartScaffold>
  );
}

function GuideRoute() {
  const again = !!useSearchParams().get("again");
  const { loaded } = useProfile();
  if (!loaded) return null;
  return <GuideScreen again={again} />;
}

export default function GuidePage() {
  return (
    <Suspense>
      <GuideRoute />
    </Suspense>
  );
}
