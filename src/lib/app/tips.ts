"use client";

import { useEffect, useState } from "react";

import type { TranslationKey } from "@/lib/app-i18n";

const TIP_COUNT = 30;
const KEY = "autizm_tip_index_v1";

/** Maslahat: sahifaga har kirganda navbatdagisi; 30 tasi tugagach boshidan boshlanadi. */
export function useTip(): TranslationKey | null {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    let value = 0;
    try {
      const raw = localStorage.getItem(KEY);
      value = raw === null ? 0 : (Number(raw) + 1) % TIP_COUNT;
      localStorage.setItem(KEY, String(value));
    } catch {
      value = Math.floor(Math.random() * TIP_COUNT);
    }
    setIndex(value);
  }, []);

  return index === null ? null : (`home.tip${index + 1}` as TranslationKey);
}
