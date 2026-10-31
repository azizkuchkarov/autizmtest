import { Platform } from 'react-native';

/**
 * Dizayn tizimi. Asosiy rang — saytdagi indigo; aksent ranglar logotipdagi pazl
 * bo'laklaridan (ko'k, sariq, qizil, yashil) olingan va bo'limlarni ajratadi.
 */
export const Colors = {
  light: {
    text: '#0E1330',
    textSecondary: '#5B6178',
    textTertiary: '#9097AD',
    background: '#F5F6FB',
    backgroundElement: '#FFFFFF',
    backgroundMuted: '#ECEEF6',
    backgroundSelected: '#EEF0FF',
    border: '#E4E7F1',
    tint: '#4F46E5',
    tintSoft: '#EEF0FF',
    onTint: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#E9F9EF',
    warning: '#D97706',
    warningSoft: '#FFF6E5',
    danger: '#E11D48',
    dangerSoft: '#FFECF0',
    shadow: '#1E1B4B',
  },
  dark: {
    text: '#F3F4FA',
    textSecondary: '#A3A9C2',
    textTertiary: '#6B7190',
    background: '#0A0C18',
    backgroundElement: '#141729',
    backgroundMuted: '#1C2036',
    backgroundSelected: '#23244A',
    border: '#252A42',
    tint: '#8B87FF',
    tintSoft: '#23244A',
    onTint: '#FFFFFF',
    success: '#4ADE80',
    successSoft: '#0F2A1B',
    warning: '#FBBF24',
    warningSoft: '#2E2209',
    danger: '#FB7185',
    dangerSoft: '#2E0F18',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Bo'lim aksentlari: test — ko'k, darslar — sariq, mashqlar — yashil, markazlar — qizil. */
export const Accents = {
  test: { fg: '#3B6CF6', soft: '#E8EFFF', softDark: '#17224A', gradient: ['#4F46E5', '#3B82F6'] },
  lessons: { fg: '#E58A00', soft: '#FFF3DC', softDark: '#33240A', gradient: ['#F59E0B', '#F97316'] },
  exercises: { fg: '#16A34A', soft: '#E3F8EA', softDark: '#0E2A19', gradient: ['#10B981', '#22C55E'] },
  centers: { fg: '#E11D48', soft: '#FFE8EE', softDark: '#33101B', gradient: ['#F43F5E', '#EC4899'] },
} as const;

export type AccentName = keyof typeof Accents;

/**
 * Grafik ranglari (saytdagi --viz-* bilan bir xil): bitta seriya — ko'k; "o'zi / yordam bilan / hali emas" —
 * ko'kning tartibli shkalasi (qorong'i mavzuda teskari, eng muhimi eng yorqin); zonalar — yashil / sariq / qizil.
 */
export const Viz = {
  light: { one: '#2a78d6', ok: '#184f95', help: '#3987e5', miss: '#86b6ef', grid: '#e8eaf2', axis: '#c9cddc', good: '#0ca30c', warn: '#fab219', bad: '#d03b3b' },
  dark: { one: '#3987e5', ok: '#9ec5f4', help: '#3987e5', miss: '#184f95', grid: '#22263c', axis: '#353a55', good: '#0ca30c', warn: '#fab219', bad: '#d03b3b' },
} as const;

export const HeroGradient = {
  light: ['#4338CA', '#6D28D9', '#7C3AED'] as const,
  dark: ['#312E81', '#4C1D95', '#5B21B6'] as const,
};

export const FontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 720;
