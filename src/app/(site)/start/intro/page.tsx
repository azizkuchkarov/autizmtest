"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IntroArt } from "@/components/app/art";
import { useLocale, useProfile } from "@/components/app/providers";
import { LanguagePill } from "@/components/app/start-scaffold";
import { BrandMark, Button, Wordmark } from "@/components/app/ui";
import type { TranslationKey } from "@/lib/app-i18n";

const SLIDES: { title: TranslationKey; body: TranslationKey }[] = [
  { title: "intro.s1Title", body: "intro.s1Body" },
  { title: "intro.s2Title", body: "intro.s2Body" },
  { title: "intro.s3Title", body: "intro.s3Body" },
  { title: "intro.s4Title", body: "intro.s4Body" },
];

export default function IntroPage() {
  const { t } = useLocale();
  const { markIntroSeen } = useProfile();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const isLast = page === SLIDES.length - 1;

  const goTo = (p: number) => setPage(Math.max(0, Math.min(SLIDES.length - 1, p)));

  const finish = () => {
    markIntroSeen();
    router.replace("/");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPage((p) => Math.min(SLIDES.length - 1, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = SLIDES[page];

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <header className="mx-auto flex w-full max-w-[600px] items-center justify-between px-5 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        <span className="flex items-center gap-2">
          <BrandMark size={30} />
          <Wordmark size={19} />
        </span>
        <LanguagePill />
      </header>

      <main className="flex flex-1 items-center justify-center overflow-hidden px-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goTo(page + 1);
              else if (info.offset.x > 60) goTo(page - 1);
            }}
            className="flex max-w-[520px] cursor-grab flex-col items-center gap-6 active:cursor-grabbing"
          >
            <IntroArt variant={page as 0 | 1 | 2 | 3} />
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <h1 className="t-display !text-[31px] !leading-[38px] md:!text-[36px] md:!leading-[44px]">{t(slide.title)}</h1>
              <p className="t-body text-[16.5px] leading-[25px] text-ink-2">{t(slide.body)}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mx-auto flex w-full max-w-[600px] flex-col gap-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`${i + 1}`}
              onClick={() => goTo(i)}
              className="h-2 rounded-full transition-all"
              style={{ width: i === page ? 26 : 8, background: i === page ? "var(--tint)" : "var(--border)" }}
            />
          ))}
        </div>
        {isLast ? (
          <Button title={t("intro.begin")} onClick={finish} icon={ArrowRight} />
        ) : (
          <div className="flex items-center gap-4">
            <button onClick={finish} className="t-small-bold px-2 text-ink-2 hover:text-ink">
              {t("onboarding.skip")}
            </button>
            <div className="flex-1">
              <Button title={t("common.next")} onClick={() => goTo(page + 1)} />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
