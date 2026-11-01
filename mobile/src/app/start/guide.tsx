import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StartScaffold } from '@/components/start-scaffold';
import { ThemedText } from '@/components/themed-text';
import { Button, sym, useCardShadow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';

/** "Qachon" belgisi: qadamning qisqa jadvali. */
function When({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.when, { backgroundColor: theme.tintSoft }]}>
      <SymbolView name={sym('calendar', 'calendar_month')} size={15} tintColor={theme.tint} style={{ marginTop: 2 }} />
      <ThemedText type="smallBold" style={{ flex: 1, color: theme.tint }}>
        {children}
      </ThemedText>
    </View>
  );
}

/** Kun tartibi qatori: vaqt — nima qilinadi. */
function RoutineRow({ time, emoji, text }: { time: string; emoji: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.routine, { backgroundColor: theme.backgroundMuted }]}>
      <ThemedText style={{ fontSize: 20, lineHeight: 26 }}>{emoji}</ThemedText>
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" style={{ color: theme.tint, fontVariant: ['tabular-nums'] }}>
          {time}
        </ThemedText>
        <ThemedText type="small">{text}</ThemedText>
      </View>
    </View>
  );
}

/** Bitta qadam: emoji, sarlavha, izoh va qo'shimcha qism. Chapdagi chiziq qadamlarni bog'laydi. */
function Step({ emoji, title, body, last, children }: { emoji: string; title: string; body: string; last?: boolean; children?: ReactNode }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={[styles.stepIcon, shadow, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</ThemedText>
        </View>
        {!last && <View style={{ width: 2, flex: 1, marginVertical: 4, backgroundColor: theme.border }} />}
      </View>
      <View style={{ flex: 1, gap: Spacing.two, paddingBottom: last ? 0 : Spacing.four }}>
        <ThemedText type="heading" style={{ fontSize: 17 }}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 14.5, lineHeight: 21 }}>
          {body}
        </ThemedText>
        {children}
      </View>
    </View>
  );
}

/** Ota-onalar uchun qo'llanma: ilovadan qanday va qachon foydalanish — bitta sahifada, oddiy tilda. */
export default function GuideScreen() {
  const { again } = useLocalSearchParams<{ again?: string }>();
  const { t } = useLocale();
  const theme = useTheme();
  const { child, markGuideSeen } = useProfile();
  const [finishing, setFinishing] = useState(false);

  const practice = child?.practiceTime ?? '17:00';
  const diary = child?.diaryTime ?? '08:30';

  const finish = async () => {
    setFinishing(true);
    await markGuideSeen();
    if (again && router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <StartScaffold back={!!again} footer={<Button title={t('guide.start')} icon={sym('sparkles', 'auto_awesome')} loading={finishing} onPress={finish} />}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: Spacing.two }}>
        <ThemedText type="title">{t('guide.s1Title')} 👋</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {t('guide.s1Body')}
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginTop: Spacing.two }}>
        <Step emoji="📝" title={t('guide.s2Title')} body={t('guide.s2Body')}>
          <When>{t('guide.s2When')}</When>
        </Step>
        <Step emoji="🎬" title={t('guide.s3Title')} body={t('guide.s3Body')}>
          <When>{t('guide.s3When')}</When>
        </Step>
        <Step emoji="☀️" title={t('guide.s4Title')} body={t('guide.s4Body')}>
          <RoutineRow time={diary} emoji="📔" text={t('guide.s4Diary')} />
          <RoutineRow time={practice} emoji="🧸" text={t('guide.s4Practice')} />
          <RoutineRow time={t('guide.s4Anytime')} emoji="🎧" text={t('guide.s4Free')} />
        </Step>
        <Step emoji="📈" title={t('guide.s5Title')} body={t('guide.s5Body')} last>
          <When>{t('guide.s5Week')}</When>
          <When>{t('guide.s5Month')}</When>
        </Step>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[styles.alertCard, { backgroundColor: theme.dangerSoft }]}>
        <ThemedText type="heading" style={{ fontSize: 16.5 }}>
          🩺 {t('guide.s6Title')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('guide.s6Body')}
        </ThemedText>
        {(['guide.s6a', 'guide.s6b', 'guide.s6c', 'guide.s6d'] as const).map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={[styles.bullet, { backgroundColor: theme.danger }]} />
            <ThemedText type="small" style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }}>
              {t(k)}
            </ThemedText>
          </View>
        ))}
      </Animated.View>

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center', paddingBottom: Spacing.two }}>
        {t('guide.s7Body')}
      </ThemedText>
    </StartScaffold>
  );
}

const styles = StyleSheet.create({
  when: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  routine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three + 2,
    marginTop: Spacing.two,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
});
