"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useLocale } from "@/components/app/providers";
import { softBg, WORD_COLORS } from "@/components/app/talk/tile";

const SAMPLE = [
  { emoji: "💧", color: WORD_COLORS.noun },
  { emoji: "🤲", color: WORD_COLORS.verb },
  { emoji: "😊", color: WORD_COLORS.descriptor },
  { emoji: "👩", color: WORD_COLORS.pronoun },
];

/** Bosh sahifa va Mashqlar bo'limidagi "Rasmli muloqot" kartasi. */
export function TalkPromo() {
  const { t } = useLocale();
  return (
    <Link
      href="/talk"
      className="group flex items-center gap-4 rounded-[24px] border border-line bg-element p-4 shadow-card transition-transform active:scale-[0.98] hover:border-tint/40"
    >
      <span className="grid shrink-0 grid-cols-2 gap-1.5" aria-hidden>
        {SAMPLE.map((s) => (
          <span
            key={s.emoji}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border-2 text-[19px]"
            style={{ borderColor: s.color, background: softBg(s.color) }}
          >
            {s.emoji}
          </span>
        ))}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="t-heading text-[16.5px]">{t("talk.title")}</span>
        <span className="t-small line-clamp-2 text-ink-2">{t("talk.homeBody")}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
