import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, sym } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

const pad = (n: number) => String(n).padStart(2, '0');

function parse(value: string | null | undefined, fallback: string) {
  const [h, m] = (value || fallback).split(':').map(Number);
  return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
}

/** Soat yoki daqiqa ustuni: yuqoriga / pastga tugmalari. */
function Column({ value, onStep }: { value: number; onStep: (dir: 1 | -1) => void }) {
  const theme = useTheme();
  const arrow = (dir: 1 | -1) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.select();
        onStep(dir);
      }}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, { backgroundColor: pressed ? theme.tintSoft : theme.backgroundMuted }]}>
      <SymbolView name={dir === 1 ? sym('chevron.up', 'expand_less') : sym('chevron.down', 'expand_more')} size={20} tintColor={theme.tint} />
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: Spacing.two }}>
      {arrow(1)}
      <ThemedText type="number" style={{ fontSize: 44, lineHeight: 52, fontVariant: ['tabular-nums'] }}>
        {pad(value)}
      </ThemedText>
      {arrow(-1)}
    </View>
  );
}

/**
 * Vaqt tanlash oynasi ("HH:MM"). Daqiqalar 5 tadan o'zgaradi.
 * onClear berilsa — vaqtni o'chirish tugmasi ham chiqadi.
 */
export function TimePickerSheet({
  visible,
  title,
  value,
  fallback = '12:00',
  onClose,
  onChange,
  onClear,
}: {
  visible: boolean;
  title: string;
  value: string | null | undefined;
  fallback?: string;
  onClose: () => void;
  onChange: (time: string) => void;
  onClear?: () => void;
}) {
  const { t } = useLocale();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => parse(value, fallback));
  const [prevVisible, setPrevVisible] = useState(visible);

  // Oyna har ochilganda joriy qiymatdan boshlanadi
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setDraft(parse(value, fallback));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.cancel')} />
      <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, paddingBottom: insets.bottom + Spacing.three }]}>
        <ThemedText type="heading" style={{ textAlign: 'center' }}>
          {title}
        </ThemedText>
        <View style={styles.columns}>
          <Column value={draft.h} onStep={(d) => setDraft((p) => ({ ...p, h: (p.h + d + 24) % 24 }))} />
          <ThemedText type="number" style={{ fontSize: 44, lineHeight: 52 }}>
            :
          </ThemedText>
          <Column
            value={draft.m}
            onStep={(d) =>
              setDraft((p) => {
                // 13:32 kabi qiymatlar avval yaqin 5 ga tekislanadi
                const base = d === 1 ? Math.floor(p.m / 5) * 5 + 5 : Math.ceil(p.m / 5) * 5 - 5;
                return { ...p, m: (base + 60) % 60 };
              })
            }
          />
        </View>
        <Button
          title={t('common.save')}
          icon={sym('checkmark', 'check')}
          onPress={() => {
            onChange(`${pad(draft.h)}:${pad(draft.m)}`);
            onClose();
          }}
        />
        {onClear ? (
          <Pressable
            onPress={() => {
              onClear();
              onClose();
            }}
            style={{ alignSelf: 'center', padding: Spacing.two }}>
            <ThemedText type="smallBold" themeColor="textTertiary">
              {t('time.clear')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,12,24,0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 24,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.two,
  },
  arrow: {
    width: 64,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
