import { useCallback, useEffect, useState } from 'react';

import { useLocale } from '@/contexts/locale';
import { fetchContent, type ContentCategory, type ContentKind, type Profession } from '@/lib/api';

/** Yo'nalishlar, mavzular va videolarni yuklaydi: null — yuklanmoqda, error — ulanib bo'lmadi. */
export function useContent(kind: ContentKind) {
  const { locale } = useLocale();
  const [categories, setCategories] = useState<ContentCategory[] | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setError(false);
    try {
      const data = await fetchContent(kind, locale);
      setCategories(data.categories.filter((c) => c.videos.length > 0));
      setProfessions(data.professions ?? []);
    } catch {
      setError(true);
    }
  }, [kind, locale]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, professions, error, reload, videos: categories?.flatMap((c) => c.videos) ?? [] };
}
