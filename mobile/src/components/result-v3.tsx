import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LevelBadge, nextScreeningDate, useFormatDate, useRiskColors } from '@/components/result-summary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ProgressBar, SectionHeader, sym } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { SHOW_CENTERS } from '@/constants/features';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { ITEMS, SECTIONS } from '@/shared/lib/screening-v3/items';
import { THRESHOLDS, type ScreeningV3Result } from '@/shared/lib/screening-v3/score';

/** Bo'lim balli bo'yicha holat: chegaralar umumiy daraja bilan bir xil. */
function sectionTier(score: number) {
  if (score >= THRESHOLDS.high) return 'high' as const;
  if (score >= THRESHOLDS.moderate) return 'moderate' as const;
  return 'low' as const;
}

const SECTION_LABEL = { low: 'r3.secLow', moderate: 'r3.secMid', high: 'r3.secHigh' } as const;

function DomainRow({ label, score }: { label: string; score: number }) {
  const { t } = useLocale();
  const theme = useTheme();
  const tier = sectionTier(score);
  const colors = useRiskColors(tier);
  return (
    <View style={[styles.domain, { backgroundColor: theme.backgroundMuted }]}>
      <ThemedText type="smallBold" style={{ flex: 1, fontSize: 14.5 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: colors.fg }}>
        {t(SECTION_LABEL[tier])}
      </ThemedText>
    </View>
  );
}

function SectionRow({ emoji, title, score }: { emoji: string; title: string; score: number }) {
  const { t } = useLocale();
  const tier = sectionTier(score);
  const colors = useRiskColors(tier);
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <ThemedText style={{ fontSize: 22, lineHeight: 28 }}>{emoji}</ThemedText>
        <ThemedText type="heading" style={{ flex: 1, fontSize: 15 }}>
          {title}
        </ThemedText>
        <ThemedText type="smallBold" style={{ fontSize: 13, color: colors.fg }}>
          {t(SECTION_LABEL[tier])}
        </ThemedText>
      </View>
      <ProgressBar value={Math.max(4, score)} color={colors.fg} height={7} />
    </View>
  );
}

type Step = { title: string; body: string; action?: { label: string; onPress: () => void } };

/** Darajaga qarab ota-ona uchun aniq 3 qadam. */
function useNextSteps(result: ScreeningV3Result, createdAt: string): { steps: Step[]; retest: string | null } {
  const { t } = useLocale();
  const formatDate = useFormatDate();
  const specialist = { label: t('r3.stepSpecialistAction'), onPress: () => router.push('/centers') };
  const play = { label: t('r3.stepPlayAction'), onPress: () => router.navigate('/exercises') };
  const skills: Step = { title: t('r3.stepSkills'), body: t('r3.stepSkillsBody'), action: { label: t('r3.stepSkillsAction'), onPress: () => router.push('/skills/run') } };
  if (result.level === 'low') {
    return {
      steps: [
        { title: t('r3.stepCalm'), body: t('r3.stepCalmBody') },
        { title: t('r3.stepSupport'), body: t('r3.stepSupportBody'), action: play },
        { title: t('r3.stepRetest').replace('{date}', formatDate(nextScreeningDate(createdAt, result.level))), body: t('r3.stepRetestBody') },
      ],
      retest: null,
    };
  }
  const high = result.level === 'high';
  return {
    steps: [
      {
        title: t(high ? 'r3.stepSpecialistHigh' : 'r3.stepSpecialistMid'),
        body: t(high ? 'r3.stepSpecialistHighBody' : 'r3.stepSpecialistMidBody'),
        action: SHOW_CENTERS ? specialist : undefined,
      },
      { title: t('r3.stepPlay'), body: t('r3.stepPlayBody'), action: play },
      skills,
    ],
    retest: t('r3.retestOn').replace('{date}', formatDate(nextScreeningDate(createdAt, result.level))),
  };
}

/**
 * Skrining v3 natijasining yuqori qismi: daraja (raqamsiz), shoshilinch ogohlantirishlar va keyingi 3 qadam.
 * Batafsil ma'lumot — ResultV3Details (web: components/app/result-v3.tsx).
 */
export function ResultV3({ result, createdAt, age }: { result: ScreeningV3Result; createdAt: string; age: string }) {
  const { t } = useLocale();
  const theme = useTheme();
  const formatDate = useFormatDate();
  const colors = useRiskColors(result.level);
  const { steps, retest } = useNextSteps(result, createdAt);

  return (
    <>
      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three }}>
          <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            {formatDate(createdAt)} · {age}
          </ThemedText>
          <LevelBadge tier={result.level} size={88} />
          <ThemedText type="subtitle" style={{ color: colors.fg, textAlign: 'center' }}>
            {t(`result.${result.level}`)}
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', paddingHorizontal: Spacing.two }}>
            {t(`r3.${result.level}Body`)}
          </ThemedText>
        </Card>
      </Animated.View>

      {result.urgent && (
        <Card tone="dangerSoft" flat style={{ borderWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <SymbolView name={sym('exclamationmark.octagon.fill', 'report')} size={20} tintColor={theme.danger} />
            <ThemedText type="heading" style={{ color: theme.danger, flex: 1 }}>
              {t('r3.urgentTitle')}
            </ThemedText>
          </View>
          <ThemedText type="body">{t('r3.urgentBody')}</ThemedText>
          {SHOW_CENTERS ? <Button title={t('result.stepSpecialist')} size="md" onPress={() => router.push('/centers')} /> : null}
        </Card>
      )}

      {result.incomplete && (
        <View style={[styles.warn, { backgroundColor: theme.warningSoft }]}>
          <SymbolView name={sym('exclamationmark.triangle.fill', 'warning')} size={15} tintColor={theme.warning} style={{ marginTop: 2 }} />
          <ThemedText type="small" style={{ flex: 1 }}>
            {t('r3.incomplete').replace('{n}', String(result.unknownCount))}
          </ThemedText>
        </View>
      )}

      <SectionHeader title={t('r3.stepsTitle')} />
      <Animated.View entering={FadeInDown.delay(80).duration(450)}>
        <Card style={{ gap: Spacing.four }}>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: Spacing.three }}>
              <View style={[styles.stepNum, { backgroundColor: theme.tintSoft }]}>
                <ThemedText type="smallBold" style={{ color: theme.tint }}>
                  {i + 1}
                </ThemedText>
              </View>
              <View style={{ flex: 1, gap: Spacing.one }}>
                <ThemedText type="heading" style={{ fontSize: 16 }}>
                  {step.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {step.body}
                </ThemedText>
                {step.action ? (
                  <View style={{ alignSelf: 'flex-start', marginTop: Spacing.one }}>
                    <Button title={step.action.label} size="md" variant="secondary" onPress={step.action.onPress} />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
          {retest ? (
            <ThemedText type="small" themeColor="textTertiary">
              {retest}
            </ThemedText>
          ) : null}
        </Card>
      </Animated.View>
    </>
  );
}

/** Batafsil natija: bo'limlar (eng qiyinlari tepada), muhim ko'nikmalar va ball. Standart holatda yig'ilgan. */
export function ResultV3Details({ result }: { result: ScreeningV3Result }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const textOf = (id: string) => ITEMS.find((i) => i.id === id)?.text[locale] ?? id;
  const sections = result.sections.filter((s) => s.answered > 0).sort((a, b) => b.score - a.score);

  return (
    <>
      <Card onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <SymbolView name={sym('list.bullet.rectangle', 'list_alt')} size={22} tintColor={theme.tint} />
        <View style={{ flex: 1 }}>
          <ThemedText type="heading" style={{ fontSize: 16 }}>
            {t('r3.details')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('r3.detailsHint')}
          </ThemedText>
        </View>
        <SymbolView name={sym(open ? 'chevron.up' : 'chevron.down', open ? 'expand_less' : 'expand_more')} size={14} tintColor={theme.textTertiary} />
      </Card>

      {open && (
        <>
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={{ gap: Spacing.four }}>
              {result.domains.sc !== null ? <DomainRow label={t('r3.domainSc')} score={result.domains.sc} /> : null}
              {result.domains.rrb !== null ? <DomainRow label={t('r3.domainRrb')} score={result.domains.rrb} /> : null}
              {sections.map((s) => {
                const meta = SECTIONS.find((x) => x.id === s.id)!;
                return <SectionRow key={s.id} emoji={meta.emoji} title={meta.title[locale]} score={s.score} />;
              })}
            </Card>
          </Animated.View>

          <Card style={{ gap: Spacing.three }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <SymbolView name={sym('checklist', 'checklist')} size={20} tintColor={theme.tint} />
              <ThemedText type="heading" style={{ flex: 1 }}>
                {t('r3.critical')}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textTertiary" style={{ fontVariant: ['tabular-nums'] }}>
                {result.critical.total - result.critical.failed.length}/{result.critical.total}
              </ThemedText>
            </View>
            {result.critical.failed.length === 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <SymbolView name={sym('checkmark.circle.fill', 'check_circle')} size={20} tintColor={theme.success} />
                <ThemedText type="body" style={{ color: theme.success, flex: 1 }}>
                  {t('r3.criticalNone')}
                </ThemedText>
              </View>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('r3.criticalBody')}
                </ThemedText>
                {result.critical.failed.map((id) => (
                  <View key={id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two }}>
                    <View style={[styles.dot, { backgroundColor: theme.warning }]} />
                    <ThemedText type="body" style={{ flex: 1 }}>
                      {textOf(id)}
                    </ThemedText>
                  </View>
                ))}
              </>
            )}
          </Card>

          <Card style={{ gap: Spacing.two }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two }}>
              <ThemedText type="heading" style={{ flex: 1 }}>
                {t('r3.index')}
              </ThemedText>
              <ThemedText type="number" style={{ fontSize: 22 }}>
                {result.totalScore}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textTertiary">
              {t('r3.indexHint')}
            </ThemedText>
          </Card>
        </>
      )}

      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
        {t('r3.provisional')}
      </ThemedText>
    </>
  );
}

/** Videolarni tavsiya qilish uchun v3 bo'limlarini eski A/B/C sohalariga moslash. */
export function v3WeakDomains(result: ScreeningV3Result): string[] {
  const map: Record<string, string> = { social: 'A', joint: 'A', play: 'A', communication: 'B', repetitive: 'C', sameness: 'C', sensory: 'C' };
  return [...new Set(result.sections.filter((s) => s.score >= THRESHOLDS.moderate).map((s) => map[s.id]).filter(Boolean))];
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  domain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: 16,
    padding: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});
