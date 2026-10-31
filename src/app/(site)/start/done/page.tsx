"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Avatar } from "@/components/app/avatar";
import { useLocale, useProfile } from "@/components/app/providers";
import { Button, FadeIn } from "@/components/app/ui";

const COLORS = ["#3B82F6", "#FACC15", "#EF4444", "#22C55E", "#8B5CF6", "#EC4899"];

export default function DonePage() {
  const { t } = useLocale();
  const { child } = useProfile();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => {
          const size = 8 + (i % 3) * 4;
          return (
            <span
              key={i}
              className="confetti absolute top-0"
              style={{
                left: `${(i * 97) % 100}%`,
                width: size,
                height: size * (i % 2 ? 1 : 1.6),
                borderRadius: i % 3 === 0 ? size / 2 : 3,
                background: COLORS[i % COLORS.length],
                opacity: 0.6,
                animation: `confetti-fall ${2.6 + (i % 5) * 0.4}s linear ${(i % 8) * 0.18}s infinite`,
              }}
            />
          );
        })}
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[600px] flex-1 flex-col items-center justify-center gap-8 px-7 pt-8">
        <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12 }}>
          <span className="animate-bounce-soft inline-flex rounded-full bg-element p-2.5 shadow-[0_12px_24px_rgb(30_27_75/0.15)]" style={{ animationDelay: "0.4s" }}>
            <Avatar id={child?.avatar} size={190} />
          </span>
        </motion.span>
        <FadeIn delay={300} className="flex flex-col items-center gap-4 text-center">
          <h1 className="t-display">{t("done.title").replace("{name}", child?.name ?? "")} 🎉</h1>
          <p className="t-body text-[16.5px] leading-[25px] text-ink-2">{t("done.body")}</p>
        </FadeIn>
      </main>

      <FadeIn delay={600} className="relative z-10 mx-auto w-full max-w-[600px] px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
        <Button title={t("done.cta")} href="/" icon={ArrowRight} />
      </FadeIn>
    </div>
  );
}
