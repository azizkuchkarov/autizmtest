import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

export function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: Spacing.two }}>
      <ThemedText type="smallBold" style={{ fontSize: 14.5 }}>
        {children}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textTertiary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function TextField(props: React.ComponentProps<typeof TextInput> & { invalid?: boolean }) {
  const theme = useTheme();
  const { invalid, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={theme.textTertiary}
      {...rest}
      style={[
        styles.input,
        { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: invalid ? theme.danger : theme.border },
        style,
      ]}
    />
  );
}

/** Qurilmalar uz-UZ uchun oy nomlarini to'g'ri chiqarmaydi — qo'lda */
const MONTHS: Record<'uz' | 'ru', string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

/** Kelajakdagi oyni tanlab bo'lmaydi (joriy yil uchun) */
export function isFutureMonth(birthYear: number | null, month: number) {
  const now = new Date();
  return birthYear === now.getFullYear() && month > now.getMonth() + 1;
}

/** Tug'ilgan oy: 3 ustunli tanlash */
export function MonthGrid({ birthYear, value, onChange }: { birthYear: number | null; value: number | null; onChange: (month: number) => void }) {
  const { locale } = useLocale();
  const theme = useTheme();
  return (
    <View style={styles.months}>
      {MONTHS[locale].map((label, i) => {
        const m = i + 1;
        const selected = value === m;
        const disabled = isFutureMonth(birthYear, m);
        return (
          <PressableScale
            key={m}
            haptic={false}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            onPress={() => {
              haptics.select();
              onChange(m);
            }}
            style={[
              styles.month,
              { backgroundColor: selected ? theme.tint : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
              disabled && { opacity: 0.35 },
            ]}>
            <ThemedText type="smallBold" style={{ fontSize: 14, color: selected ? '#FFFFFF' : theme.text }}>
              {label}
            </ThemedText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  months: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  month: {
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 15,
    fontSize: 16.5,
    fontFamily: FontFamily.semibold,
  },
});
