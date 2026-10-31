import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { formatAge } from '@/lib/age';
import { assessmentTier, type StoredAssessment } from '@/lib/history';

export { assessmentTier, nextScreeningDate } from '@/lib/history';
import type { RiskTier } from '@/lib/screening';
import { isScreeningV3 } from '@/shared/lib/screening-v3/score';

export function useRiskColors(tier: RiskTier) {
  const theme = useTheme();
  if (tier === 'low') return { fg: theme.success, bg: theme.successSoft, gradient: ['#22C55E', '#10B981'] as [string, string] };
  if (tier === 'moderate') return { fg: theme.warning, bg: theme.warningSoft, gradient: ['#F59E0B', '#F97316'] as [string, string] };
  return { fg: theme.danger, bg: theme.dangerSoft, gradient: ['#F43F5E', '#E11D48'] as [string, string] };
}

export function useFormatDate() {
  const { locale } = useLocale();
  return (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Test topshirilgan paytdagi aniq yosh (eski testlarda — yosh guruhi). */
export function useAssessmentAge() {
  const { t, locale } = useLocale();
  return (item: StoredAssessment) => (isScreeningV3(item.result) ? formatAge(item.result.ageMonths, locale) : t(`age.${item.ageGroup}`));
}

const LEVEL_ICON = {
  low: sym('checkmark', 'check'),
  moderate: sym('exclamationmark', 'priority_high'),
  high: sym('exclamationmark.triangle.fill', 'warning'),
} as const;

/** Daraja belgisi: raqamsiz, faqat rang va ikonka — ota-ona raqamni noto'g'ri talqin qilmasligi uchun. */
export function LevelBadge({ tier, size = 48 }: { tier: RiskTier; size?: number }) {
  const colors = useRiskColors(tier);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <SymbolView name={LEVEL_ICON[tier]} size={size * 0.42} tintColor={colors.fg} weight="bold" />
    </View>
  );
}

/** Ro'yxatlarda ko'rsatiladigan natija qatori. */
export function ResultRow({ item, onPress }: { item: StoredAssessment; onPress: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const ageOf = useAssessmentAge();
  const tier = assessmentTier(item);
  const colors = useRiskColors(tier);
  return (
    <Card onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
      <LevelBadge tier={tier} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading" style={{ fontSize: 15.5, color: colors.fg }}>
          {t(`result.${tier}`)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDate(item.createdAt)} · {ageOf(item)}
        </ThemedText>
      </View>
      <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />
    </Card>
  );
}
