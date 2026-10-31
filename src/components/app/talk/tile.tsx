"use client";

import { motion } from "framer-motion";
import { EyeOff, Mic } from "lucide-react";
import { useState } from "react";

import type { AacCardSize } from "@/lib/app/aac-store";
import type { AacWordType } from "@/lib/app/api";

/** Ilovadagi karta: server kartasi yoki ota-ona qo'shgan karta, yozilgan ovozi bilan. */
export type BoardCard = {
  id: string;
  categoryId: string;
  title: string;
  speak: string;
  emoji: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  recordingUrl: string | null;
  wordType: AacWordType;
  core: boolean;
  custom: boolean;
};

/** Fitzgerald kaliti (AAC dagi xalqaro standart): so'z turiga qarab karta rangi. */
export const WORD_COLORS: Record<AacWordType, string> = {
  pronoun: "#EAB308",
  verb: "#16A34A",
  descriptor: "#2563EB",
  noun: "#EA580C",
  social: "#DB2777",
  question: "#7C3AED",
  negation: "#DC2626",
  misc: "#64748B",
};

export const WORD_TYPES = Object.keys(WORD_COLORS) as AacWordType[];

/** Rang foni — yorug' va qorong'i mavzuda ham o'qiladigan yumshoq tus. */
export const softBg = (color: string) => `color-mix(in srgb, ${color} 14%, var(--element, #fff))`;

const EMOJI_SIZE: Record<AacCardSize, string> = { sm: "text-[34px]", md: "text-[46px] sm:text-[52px]", lg: "text-[64px] sm:text-[72px]" };
const LABEL_SIZE: Record<AacCardSize, string> = { sm: "text-[11.5px]", md: "text-[14.5px]", lg: "text-[17px]" };

export function CardPicture({ card, className }: { card: Pick<BoardCard, "emoji" | "imageUrl" | "title">; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (card.imageUrl && !broken)
    // eslint-disable-next-line @next/next/no-img-element -- admin yoki ota-ona yuklagan rasm
    return <img src={card.imageUrl} alt="" draggable={false} className="h-full w-full rounded-[12px] object-cover" onError={() => setBroken(true)} />;
  return (
    <span aria-hidden className={`leading-none ${className ?? ""}`}>
      {card.emoji || card.title.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Muloqot kartasi: katta rasm, pastda so'z, chetida so'z turi rangi. */
export function AacTile({
  card,
  size,
  showLabel,
  active,
  hidden,
  editing,
  onPress,
}: {
  card: BoardCard;
  size: AacCardSize;
  showLabel: boolean;
  active?: boolean;
  hidden?: boolean;
  editing?: boolean;
  onPress: () => void;
}) {
  const color = WORD_COLORS[card.wordType];
  return (
    <motion.button
      type="button"
      onClick={onPress}
      whileTap={{ scale: 0.94 }}
      animate={active ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      aria-label={card.title}
      className={`relative flex aspect-square w-full select-none flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] border-[3px] p-1.5 shadow-card ${
        hidden ? "opacity-40" : ""
      }`}
      style={{ borderColor: active ? color : `color-mix(in srgb, ${color} 55%, transparent)`, background: softBg(color) }}
    >
      <span className={`flex min-h-0 w-full flex-1 items-center justify-center ${EMOJI_SIZE[size]}`}>
        <CardPicture card={card} />
      </span>
      {showLabel && <span className={`line-clamp-2 w-full text-center font-bold leading-tight text-ink ${LABEL_SIZE[size]}`}>{card.title}</span>}
      {editing && (card.recordingUrl || hidden) ? (
        <span className="absolute right-1.5 top-1.5 flex gap-1">
          {card.recordingUrl ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--exercises)] text-white">
              <Mic className="h-3.5 w-3.5" />
            </span>
          ) : null}
          {hidden ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-3 text-white">
              <EyeOff className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </span>
      ) : null}
    </motion.button>
  );
}
