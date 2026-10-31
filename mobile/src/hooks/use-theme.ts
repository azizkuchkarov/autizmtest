/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Accents, Colors, Viz, type AccentName } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useIsDark() {
  return useColorScheme() === 'dark';
}

export function useTheme() {
  return Colors[useIsDark() ? 'dark' : 'light'];
}

/** Bo'lim aksenti: asosiy rang, joriy mavzuga mos yumshoq fon va gradient. */
export function useAccent(name: AccentName) {
  const dark = useIsDark();
  const a = Accents[name];
  return { fg: a.fg, soft: dark ? a.softDark : a.soft, gradient: a.gradient };
}

/** Grafik ranglari joriy mavzu uchun. */
export function useViz() {
  return Viz[useIsDark() ? 'dark' : 'light'];
}
