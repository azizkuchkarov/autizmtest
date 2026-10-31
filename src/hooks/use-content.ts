"use client";

import { useCallback, useEffect, useState } from "react";

import { useLocale } from "@/components/app/providers";
import { fetchContent, type ContentCategory, type ContentKind, type Profession } from "@/lib/app/api";

type State = { categories: ContentCategory[] | null; professions: Profession[]; error: boolean };

/** Yo'nalishlar, mavzular va videolarni yuklaydi: null — yuklanmoqda, error — ulanib bo'lmadi. */
export function useContent(kind: ContentKind) {
  const { locale } = useLocale();
  const [state, setState] = useState<State>({ categories: null, professions: [], error: false });

  const load = useCallback(
    () =>
      fetchContent(kind, locale).then(
        (data) => ({ categories: data.categories.filter((c) => c.videos.length > 0), professions: data.professions ?? [], error: false }),
        () => null,
      ),
    [kind, locale],
  );

  const apply = (next: State | null) => setState((prev) => next ?? { ...prev, error: true });

  useEffect(() => {
    let cancelled = false;
    load().then((next) => !cancelled && apply(next));
    return () => {
      cancelled = true;
    };
  }, [load]);

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, error: false }));
    apply(await load());
  }, [load]);

  return { ...state, reload, videos: state.categories?.flatMap((c) => c.videos) ?? [] };
}
