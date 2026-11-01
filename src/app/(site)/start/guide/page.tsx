"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { StartScaffold } from "@/components/app/start-scaffold";
import { Button, FadeIn } from "@/components/app/ui";

/** "Qachon" belgisi: qadamning qisqa jadvali. */
function When({ children }: { children: ReactNode }) {
  return (
    <div className="t-small-bold flex items-start gap-2 rounded-[12px] bg-tint-soft px-3 py-2.5 text-tint">
      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
    </div>
  );
}

/** Kun tartibi qatori: vaqt — nima qilinadi. */
function RoutineRow({ time, emoji, text }: { time: string; emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-muted px-3 py-2.5">
      <span className="text-[20px]" aria-hidden>
        {emoji}
      </span>
      <div className="flex flex-1 flex-col">
        <span className="t-small-bold tabular-nums text-tint">{time}</span>
        <span className="t-small">{text}</span>
      </div>
    </div>
  );
}

/** Bitta qadam: emoji, sarlavha, izoh va qo'shimcha qism. Chapdagi chiziq qadamlarni bog'laydi. */
function Step({ emoji, title, body, last, children }: { emoji: string; title: string; body: string; last?: boolean; children?: ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[15px] bg-element text-[22px] shadow-card" aria-hidden>
          {emoji}
        </span>
        {!last && <span className="my-1 w-0.5 flex-1 bg-line" />}
      </div>
      <div className={`flex flex-1 flex-col gap-2 ${last ? "" : "pb-6"}`}>
        <h2 className="t-heading text-[17px]">{title}</h2>
        <p className="t-small text-[14.5px] leading-[21px] text-ink-2">{body}</p>
        {children}
      </div>
    </div>
  );
}

/** Ota-onalar uchun qo'llanma: ilovadan qanday va qachon foydalanish — bitta sahifada, oddiy tilda. */
function GuideScreen({ again }: { again: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const { child, markGuideSeen } = useProfile();
  const [finishing, setFinishing] = useState(false);

  const practice = child?.practiceTime ?? "17:00";
  const diary = child?.diaryTime ?? "08:30";

  const finish = async () => {
    setFinishing(true);
    await markGuideSeen();
    router.replace(again ? "/profile" : "/");
  };

  return (
    <StartScaffold back={again} footer={<Button title={t("guide.start")} icon={Sparkles} loading={finishing} onClick={finish} />}>
      <FadeIn className="flex flex-col gap-2">
        <h1 className="t-title">{t("guide.s1Title")} 👋</h1>
        <p className="t-body text-ink-2">{t("guide.s1Body")}</p>
      </FadeIn>

      <FadeIn delay={80} className="mt-2">
        <Step emoji="📝" title={t("guide.s2Title")} body={t("guide.s2Body")}>
          <When>{t("guide.s2When")}</When>
        </Step>
        <Step emoji="🎬" title={t("guide.s3Title")} body={t("guide.s3Body")}>
          <When>{t("guide.s3When")}</When>
        </Step>
        <Step emoji="☀️" title={t("guide.s4Title")} body={t("guide.s4Body")}>
          <RoutineRow time={diary} emoji="📔" text={t("guide.s4Diary")} />
          <RoutineRow time={practice} emoji="🧸" text={t("guide.s4Practice")} />
          <RoutineRow time={t("guide.s4Anytime")} emoji="🎧" text={t("guide.s4Free")} />
        </Step>
        <Step emoji="📈" title={t("guide.s5Title")} body={t("guide.s5Body")} last>
          <When>{t("guide.s5Week")}</When>
          <When>{t("guide.s5Month")}</When>
        </Step>
      </FadeIn>

      <FadeIn delay={160} className="mt-2 flex flex-col gap-2 rounded-[18px] bg-[var(--danger-soft)] p-[18px]">
        <h2 className="t-heading text-[16.5px]">🩺 {t("guide.s6Title")}</h2>
        <p className="t-small text-ink-2">{t("guide.s6Body")}</p>
        <ul className="flex flex-col gap-2">
          {(["guide.s6a", "guide.s6b", "guide.s6c", "guide.s6d"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-[var(--danger)]" />
              <span className="t-small flex-1 text-[14.5px] leading-[21px]">{t(k)}</span>
            </li>
          ))}
        </ul>
      </FadeIn>

      <p className="t-small pb-2 text-center text-ink-3">{t("guide.s7Body")}</p>
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
