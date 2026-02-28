/** Sayt tili: default o'zbek */
export type Locale = "uz" | "ru";

export const DEFAULT_LOCALE: Locale = "uz";

export const LOCALE_STORAGE_KEY = "autizm_locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "ru" || stored === "uz") return stored;
  } catch {}
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}
