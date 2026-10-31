import AsyncStorage from '@react-native-async-storage/async-storage';
import { SymbolView } from 'expo-symbols';
import { router, Stack, usePreventRemove, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button, IconButton, PressableScale, sym, useCardShadow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';
import { FREQ_SCALE, UNKNOWN_LABEL, YESNO_SCALE, type FreqAnswer } from '@/shared/lib/screening-v3/items';

/* Ota-ona so'rovnomasi: skrining v3 va oylik ko'nikmalar testi uchun umumiy oqim (web: components/app/questionnaire.tsx). */

export type QItem = {
  id: string;
  section: string;
  text: string;
  example?: string;
  kind?: 'freq' | 'yesno';
  followUp?: string[];
};
export type QSection = { id: string; emoji: string; title: string; intro?: string };
export type QAnswers = Record<string, FreqAnswer>;
export type QFollowUps = Record<string, boolean[]>;

type Draft = { answers: QAnswers; followUps: QFollowUps; cursor: string; savedAt: number };
type Step =
  | { key: string; type: 'welcome' }
  | { key: string; type: 'section'; section: QSection; index: number }
  | { key: string; type: 'item'; item: QItem; section: QSection; number: number }
  | { key: string; type: 'follow'; item: QItem; section: QSection }
  | { key: string; type: 'review' };

const AUTO_ADVANCE_MS = 260;
/** Qoralama shuncha kundan eski bo'lsa — taklif qilinmaydi */
const DRAFT_DAYS = 14;

async function readDraft(key: string): Promise<Draft | null> {
  try {
    const d = JSON.parse((await AsyncStorage.getItem(key)) ?? 'null') as Draft | null;
    return d && Date.now() - d.savedAt < DRAFT_DAYS * 86400000 && Object.keys(d.answers).length > 0 ? d : null;
  } catch {
    return null;
  }
}

export function Questionnaire({
  items,
  sections,
  welcome,
  draftKey,
  needsFollowUp,
  onSubmit,
}: {
  items: QItem[];
  sections: QSection[];
  welcome: { title: string; body: string; tips: string[]; badge?: string };
  draftKey: string;
  needsFollowUp?: (item: QItem, answer: FreqAnswer | undefined) => boolean;
  /** Natijani saqlaydi va ochiladigan sahifani qaytaradi */
  onSubmit: (answers: QAnswers, followUps: QFollowUps) => Promise<Href>;
}) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<QAnswers>({});
  const [followUps, setFollowUps] = useState<QFollowUps>({});
  const [cursor, setCursor] = useState('welcome');
  /** undefined — qoralama hali o'qilmoqda */
  const [resume, setResume] = useState<Draft | null | undefined>(undefined);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Javobdan keyin biroz kutib o'tiladigan qadam: { from — javob berilgan qadam, to — keyingisi } */
  const [advance, setAdvance] = useState<{ from: string; to: string } | null>(null);
  const finishing = useRef(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Oldin to'xtatilgan test bo'lsa — davom ettirishni taklif qilamiz
  useEffect(() => {
    let cancelled = false;
    readDraft(draftKey).then((d) => !cancelled && setResume(d));
    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  // Har bir javobdan keyin qoralama saqlanadi
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    AsyncStorage.setItem(draftKey, JSON.stringify({ answers, followUps, cursor, savedAt: Date.now() } satisfies Draft)).catch(() => {});
  }, [answers, followUps, cursor, draftKey]);

  /* ------------------------------ Qadamlar ------------------------------ */

  const steps: Step[] = [{ key: 'welcome', type: 'welcome' }];
  let number = 0;
  sections.forEach((section, index) => {
    const sectionItems = items.filter((i) => i.section === section.id);
    if (sectionItems.length === 0) return;
    steps.push({ key: `section:${section.id}`, type: 'section', section, index: index + 1 });
    for (const item of sectionItems) {
      number++;
      steps.push({ key: `item:${item.id}`, type: 'item', item, section, number });
      if (needsFollowUp?.(item, answers[item.id])) steps.push({ key: `follow:${item.id}`, type: 'follow', item, section });
    }
  });
  steps.push({ key: 'review', type: 'review' });

  const at = Math.max(0, steps.findIndex((s) => s.key === cursor));
  const step = steps[at];
  const total = items.length;
  const answered = items.filter((i) => answers[i.id] !== undefined).length;
  const unknown = items.filter((i) => answers[i.id] === -1).length;
  const visibleSections = sections.filter((s) => items.some((i) => i.section === s.id));

  const disablePrevention = usePreventRemove(answered > 0 && !submitting, ({ repeat }) => {
    Alert.alert(t('run.leaveTitle'), t('run.leaveBody'), [
      { text: t('run.stay'), style: 'cancel' },
      { text: t('run.leave'), style: 'destructive', onPress: repeat },
    ]);
  });

  const go = (key: string) => {
    setShowHelp(false);
    setCursor(key);
  };
  const next = () => {
    if (returnToReview && step.type !== 'item') {
      setReturnToReview(false);
      return go('review');
    }
    go(steps[Math.min(steps.length - 1, at + 1)].key);
  };
  const back = () => go(steps[Math.max(0, at - 1)].key);

  // Har bir yangi qadam tepadan ko'rsatiladi
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [cursor]);

  useEffect(() => {
    if (!advance) return;
    const timer = setTimeout(() => {
      setAdvance(null);
      setShowHelp(false);
      setCursor((c) => (c === advance.from ? advance.to : c));
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [advance]);

  const choose = (item: QItem, value: FreqAnswer) => {
    haptics.select();
    setAnswers((prev) => ({ ...prev, [item.id]: value }));
    // Javob o'zgarsa, eski aniqlashtirish javoblari endi to'g'ri emas
    setFollowUps((prev) => {
      if (!(item.id in prev)) return prev;
      const rest = { ...prev };
      delete rest[item.id];
      return rest;
    });
    // Keyingi qadam shu javob bo'yicha: aniqlashtirish kerak bo'lsa — u, ko'rib chiqishdan kelingan bo'lsa — qaytish
    const from = `item:${item.id}`;
    const needs = !!needsFollowUp?.(item, value);
    let to: string;
    if (needs) to = `follow:${item.id}`;
    else if (returnToReview) {
      to = 'review';
      setReturnToReview(false);
    } else {
      const i = steps.findIndex((x) => x.key === from);
      const after = steps[i + 1]?.type === 'follow' ? steps[i + 2] : steps[i + 1];
      to = after?.key ?? from;
    }
    setAdvance({ from, to });
  };

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setSubmitting(true);
    try {
      const href = await onSubmit(answers, followUps);
      await AsyncStorage.removeItem(draftKey).catch(() => {});
      haptics.success();
      disablePrevention();
      router.replace(href);
    } catch {
      finishing.current = false;
      setSubmitting(false);
      Alert.alert(t('common.error'));
    }
  };

  const optionsFor = (item: QItem) => (item.kind === 'yesno' ? YESNO_SCALE : FREQ_SCALE);
  const labelOf = (item: QItem, a: FreqAnswer | undefined) =>
    a === undefined ? t('v3.noAnswer') : a === -1 ? UNKNOWN_LABEL[locale] : (optionsFor(item).find((o) => o.value === a)?.label[locale] ?? '');

  if (submitting || resume === undefined)
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        {submitting ? <ThemedText type="heading">{t('run.calculating')}</ThemedText> : null}
      </View>
    );

  const canNext =
    step.type === 'welcome' ||
    step.type === 'section' ||
    (step.type === 'item' && answers[step.item.id] !== undefined) ||
    (step.type === 'follow' && (followUps[step.item.id]?.filter((x) => x !== undefined && x !== null).length ?? 0) === (step.item.followUp?.length ?? 0));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
              {answered}/{total}
            </ThemedText>
          ),
        }}
      />
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: Spacing.two }}>
        {visibleSections.map((s) => {
          const list = items.filter((i) => i.section === s.id);
          const done = list.filter((i) => answers[i.id] !== undefined).length;
          return (
            <View key={s.id} style={{ flex: list.length, height: 6, borderRadius: 3, backgroundColor: theme.backgroundMuted, overflow: 'hidden' }}>
              <View style={{ width: `${(done / list.length) * 100}%`, height: '100%', backgroundColor: theme.tint, borderRadius: 3 }} />
            </View>
          );
        })}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {resume ? (
          <View style={{ alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.five }}>
            <ThemedText style={{ fontSize: 56, lineHeight: 66 }}>📝</ThemedText>
            <ThemedText type="title" style={{ textAlign: 'center' }}>
              {t('v3.resumeTitle')}
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              {t('v3.resumeBody').replace('{n}', String(Object.keys(resume.answers).length))}
            </ThemedText>
            <View style={{ alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.two }}>
              <Button
                title={t('v3.resume')}
                onPress={() => {
                  setAnswers(resume.answers);
                  setFollowUps(resume.followUps ?? {});
                  setCursor(resume.cursor);
                  setResume(null);
                }}
              />
              <Button
                title={t('v3.restart')}
                variant="secondary"
                onPress={() => {
                  AsyncStorage.removeItem(draftKey).catch(() => {});
                  setResume(null);
                }}
              />
            </View>
          </View>
        ) : (
          // Faqat kirish animatsiyasi: chiqish animatsiyasi to'xtab qolsa keyingi savol ko'rinmay qolmasligi uchun
          <Animated.View key={step.key} entering={FadeInRight.duration(220)} style={{ gap: Spacing.three }}>
            {step.type === 'welcome' && (
              <>
                {welcome.badge ? (
                  <View style={[styles.pill, { backgroundColor: theme.tintSoft }]}>
                    <ThemedText type="smallBold" themeColor="tint">
                      {welcome.badge}
                    </ThemedText>
                  </View>
                ) : null}
                <ThemedText type="title">{welcome.title}</ThemedText>
                <ThemedText type="body" themeColor="textSecondary" style={{ fontSize: 16.5 }}>
                  {welcome.body}
                </ThemedText>
                <View style={{ gap: 10 }}>
                  {welcome.tips.map((tip) => (
                    <View key={tip} style={[styles.tip, { backgroundColor: theme.backgroundElement }, shadow]}>
                      <SymbolView name={sym('lightbulb', 'lightbulb')} size={18} tintColor={theme.tint} style={{ marginTop: 2 }} />
                      <ThemedText type="body" style={{ flex: 1, fontSize: 15.5 }}>
                        {tip}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </>
            )}

            {step.type === 'section' && (
              <View style={{ alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.four }}>
                <View style={[styles.sectionEmoji, { backgroundColor: theme.backgroundElement }, shadow]}>
                  <ThemedText style={{ fontSize: 52, lineHeight: 62 }}>{step.section.emoji}</ThemedText>
                </View>
                <ThemedText type="caption" themeColor="tint">
                  {t('v3.section')} {step.index}
                </ThemedText>
                <ThemedText type="title" style={{ textAlign: 'center' }}>
                  {step.section.title}
                </ThemedText>
                {step.section.intro ? (
                  <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                    {step.section.intro}
                  </ThemedText>
                ) : null}
                <View style={[styles.pill, { backgroundColor: theme.tintSoft, alignSelf: 'center' }]}>
                  <ThemedText type="smallBold" themeColor="tint">
                    {t('run.introHint').replace('{count}', String(items.filter((i) => i.section === step.section.id).length))}
                  </ThemedText>
                </View>
              </View>
            )}

            {step.type === 'item' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <ThemedText>{step.section.emoji}</ThemedText>
                  <ThemedText type="caption" themeColor="tint" style={{ flex: 1 }} numberOfLines={1}>
                    {step.section.title}
                  </ThemedText>
                  <ThemedText type="smallBold" themeColor="textTertiary">
                    {step.number}/{total}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" style={{ fontSize: 21, lineHeight: 29 }}>
                  {step.item.text}
                </ThemedText>
                {step.item.example ? (
                  <Pressable
                    onPress={() => {
                      haptics.tap();
                      setShowHelp((v) => !v);
                    }}
                    accessibilityState={{ expanded: showHelp }}
                    style={[styles.help, { backgroundColor: theme.backgroundMuted }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                      <SymbolView name={sym('questionmark.circle', 'help')} size={16} tintColor={theme.tint} />
                      <ThemedText type="smallBold" themeColor="tint" style={{ flex: 1 }}>
                        {t('run.help')}
                      </ThemedText>
                      <SymbolView name={sym(showHelp ? 'chevron.up' : 'chevron.down', showHelp ? 'expand_less' : 'expand_more')} size={14} tintColor={theme.tint} />
                    </View>
                    {showHelp ? (
                      <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: Spacing.two }}>
                        <ThemedText type="body">{step.item.example}</ThemedText>
                      </Animated.View>
                    ) : null}
                  </Pressable>
                ) : null}
                <View style={{ gap: 10 }} accessibilityRole="radiogroup">
                  {optionsFor(step.item).map((opt) => (
                    <AnswerButton key={opt.value} selected={answers[step.item.id] === opt.value} onPress={() => choose(step.item, opt.value)}>
                      {opt.label[locale]}
                    </AnswerButton>
                  ))}
                  <PressableScale
                    haptic={false}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: answers[step.item.id] === -1 }}
                    onPress={() => choose(step.item, -1)}
                    style={[
                      styles.unknown,
                      answers[step.item.id] === -1
                        ? { borderColor: theme.tint, backgroundColor: theme.tintSoft }
                        : { borderColor: theme.border },
                    ]}>
                    <ThemedText type="smallBold" style={{ fontSize: 14.5, textAlign: 'center', color: answers[step.item.id] === -1 ? theme.tint : theme.textSecondary }}>
                      {UNKNOWN_LABEL[locale]}
                    </ThemedText>
                  </PressableScale>
                </View>
              </>
            )}

            {step.type === 'follow' && (
              <>
                <ThemedText type="caption" themeColor="tint">
                  {t('v3.followTitle')}
                </ThemedText>
                <ThemedText type="heading" themeColor="textSecondary" style={{ fontSize: 18 }}>
                  {step.item.text}
                </ThemedText>
                <ThemedText type="body" themeColor="textSecondary">
                  {t('v3.followBody')}
                </ThemedText>
                {step.item.followUp?.map((prompt, i) => {
                  const value = followUps[step.item.id]?.[i];
                  return (
                    <View key={i} style={[styles.followCard, { backgroundColor: theme.backgroundElement }, shadow]}>
                      <ThemedText type="body" style={{ fontSize: 16 }}>
                        {prompt}
                      </ThemedText>
                      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                        {([true, false] as const).map((v) => (
                          <View key={String(v)} style={{ flex: 1 }}>
                            <AnswerButton
                              compact
                              selected={value === v}
                              onPress={() => {
                                haptics.select();
                                setFollowUps((prev) => {
                                  const list = [...(prev[step.item.id] ?? [])];
                                  list[i] = v;
                                  return { ...prev, [step.item.id]: list };
                                });
                              }}>
                              {v ? t('v3.yes') : t('v3.no')}
                            </AnswerButton>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {step.type === 'review' && (
              <>
                <ThemedText type="title">{t('v3.reviewTitle')}</ThemedText>
                <ThemedText type="body" themeColor="textSecondary">
                  {t('v3.reviewBody')}
                </ThemedText>
                {unknown / Math.max(1, total) > 0.3 ? (
                  <View style={[styles.warn, { backgroundColor: theme.warningSoft }]}>
                    <ThemedText type="small">{t('v3.unknownWarn').replace('{n}', String(unknown))}</ThemedText>
                  </View>
                ) : null}
                {visibleSections.map((s) => (
                  <View key={s.id} style={[styles.reviewCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.reviewHead, { backgroundColor: theme.backgroundMuted }]}>
                      <ThemedText type="smallBold">
                        {s.emoji} {s.title}
                      </ThemedText>
                    </View>
                    {items
                      .filter((i) => i.section === s.id)
                      .map((i) => {
                        const a = answers[i.id];
                        return (
                          <Pressable
                            key={i.id}
                            accessibilityRole="button"
                            onPress={() => {
                              setReturnToReview(true);
                              go(`item:${i.id}`);
                            }}
                            style={({ pressed }) => [styles.reviewRow, { borderTopColor: theme.border }, pressed && { backgroundColor: theme.backgroundMuted }]}>
                            <ThemedText type="small" style={{ flex: 1 }}>
                              {i.text}
                            </ThemedText>
                            <View style={{ maxWidth: '38%', alignItems: 'flex-end' }}>
                              <ThemedText
                                type="smallBold"
                                style={{ textAlign: 'right', color: a === undefined ? theme.danger : a === -1 ? theme.textTertiary : theme.tint }}>
                                {labelOf(i, a)}
                              </ThemedText>
                              {followUps[i.id]?.length ? (
                                <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 11, textAlign: 'right' }}>
                                  {t('v3.followAnswered')}
                                </ThemedText>
                              ) : null}
                            </View>
                            <SymbolView name={sym('chevron.right', 'chevron_right')} size={13} tintColor={theme.textTertiary} style={{ marginTop: 3 }} />
                          </Pressable>
                        );
                      })}
                  </View>
                ))}
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {!resume && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, borderTopColor: theme.border, backgroundColor: theme.background }]}>
          {at > 0 ? <IconButton icon={sym('chevron.left', 'chevron_left')} label={t('common.back')} onPress={back} /> : null}
          <View style={{ flex: 1 }}>
            {step.type === 'review' ? (
              <Button title={t('v3.submit')} icon={sym('sparkles', 'auto_awesome')} onPress={finish} disabled={answered < total} />
            ) : (
              <Button
                title={step.type === 'welcome' || step.type === 'section' ? t('common.start') : t('common.next')}
                onPress={next}
                disabled={!canNext}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function AnswerButton({ selected, onPress, children, compact }: { selected: boolean; onPress: () => void; children: ReactNode; compact?: boolean }) {
  const theme = useTheme();
  return (
    <PressableScale
      haptic={false}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        compact && { justifyContent: 'center', paddingVertical: 12 },
        { backgroundColor: selected ? theme.tintSoft : theme.backgroundElement, borderColor: selected ? theme.tint : theme.border },
      ]}>
      <ThemedText type="default" style={compact ? { fontSize: 15.5, fontWeight: '600' } : { flex: 1, fontSize: 16.5 }}>
        {children}
      </ThemedText>
      {!compact && (
        <View style={[styles.radio, { borderColor: selected ? theme.tint : theme.border, backgroundColor: selected ? theme.tint : 'transparent' }]}>
          {selected ? <SymbolView name={sym('checkmark', 'check')} size={13} tintColor="#fff" weight="bold" /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: 18,
    padding: 14,
  },
  sectionEmoji: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unknown: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  help: {
    borderRadius: Radius.md,
    padding: 14,
  },
  followCard: {
    gap: 10,
    borderRadius: 20,
    padding: Spacing.three,
  },
  warn: {
    borderRadius: 14,
    padding: 12,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  reviewHead: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
