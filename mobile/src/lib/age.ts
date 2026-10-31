import type { Locale } from '@/shared/lib/locale';

function ruYears(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return 'год';
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'года';
  return 'лет';
}

/** Bolaning aniq yoshi: '1 yosh 6 oy', '18 oylik' yoki '5 yosh' (ru: '5 лет 10 мес.'). */
export function formatAge(months: number, locale: Locale) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (locale === 'ru') {
    if (y === 0) return `${m} мес.`;
    return m ? `${y} ${ruYears(y)} ${m} мес.` : `${y} ${ruYears(y)}`;
  }
  if (y === 0) return `${m} oylik`;
  return m ? `${y} yosh ${m} oy` : `${y} yosh`;
}
