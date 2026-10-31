import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { AddCardDialog, CardEditor, RecordWizard, SettingsSheet } from '@/components/talk/dialogs';
import { AacTile, CardPicture, useSoftBg, WORD_COLORS, type BoardCard } from '@/components/talk/tile';
import { Card, EmptyState, PressableScale, Screen, Skeleton, sym, useCardShadow, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useTheme } from '@/hooks/use-theme';
import { speak, stopSpeech, useTtsAvailable, type Utterance } from '@/lib/aac-speech';
import { logAacSentence, logAacTap, toggleHiddenCard, useAacLocalData, useAacSettings, type AacCardSize } from '@/lib/aac-store';
import { fetchAac, type AacCategory } from '@/lib/api';
import { haptics } from '@/lib/haptics';

/** Telefonda bir qatordagi kartalar soni. */
const COLUMNS: Record<AacCardSize, number> = { sm: 4, md: 3, lg: 2 };
const GAP = 10;

/** Gap qatoridagi kartalar soni chegarasi. */
const MAX_SENTENCE = 12;

/** Ota-ona rejimiga kirish uchun bosib turish vaqti. */
const HOLD_MS = 2000;

const utter = (c: BoardCard): Utterance => ({ text: c.speak, recordingUrl: c.recordingUrl, audioUrl: c.audioUrl });

/** Ota-ona rejimiga kirish: bola tasodifan sozlamalarni o'zgartirmasligi uchun 2 soniya bosib turiladi. */
function HoldButton({ label, onComplete }: { label: string; onComplete: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const fill = useSharedValue(0);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  // Tugma barmoq ko'tarilgach yo'qoladi: bosib turgan paytda o'chsa, keyingi bosish yutilib ketadi
  const unlocked = useRef(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${t('talk.holdToUnlock')}`}
      accessibilityHint={t('talk.holdToUnlock')}
      delayLongPress={HOLD_MS}
      onPressIn={() => {
        fill.value = withTiming(1, { duration: HOLD_MS });
      }}
      onPressOut={() => {
        fill.value = withTiming(0, { duration: 150 });
        if (unlocked.current) {
          unlocked.current = false;
          onComplete();
        }
      }}
      onLongPress={() => {
        haptics.success();
        unlocked.current = true;
      }}
      style={[styles.hold, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.tintSoft }, fillStyle]} />
      <SymbolView name={sym('lock.fill', 'lock')} size={15} tintColor={theme.textSecondary} />
      <ThemedText type="smallBold" themeColor="textSecondary" style={{ fontSize: 13.5 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function ToolButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale onPress={onPress} style={[styles.tool, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <SymbolView name={icon} size={16} tintColor={theme.tint} />
      <ThemedText type="smallBold" style={{ fontSize: 13.5 }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

function StripButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled: boolean }) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.stripBtn, { backgroundColor: theme.backgroundMuted }, disabled && { opacity: 0.4 }]}>
      <SymbolView name={icon} size={20} tintColor={theme.textSecondary} />
    </PressableScale>
  );
}

export function TalkBoard() {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const softBg = useSoftBg();
  const childKey = useProfile().child?.id ?? 'default';
  const settings = useAacSettings();
  const local = useAacLocalData(childKey, locale);
  const tts = useTtsAvailable(locale);

  const [categories, setCategories] = useState<AacCategory[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sentence, setSentence] = useState<{ key: number; card: BoardCard }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [silent, setSilent] = useState(false);
  const [parentMode, setParentMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'settings' | 'add' | 'wizard' | null>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const seq = useRef(0);
  const flash = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sayId = useRef(0);
  const strip = useRef<ComponentRef<typeof ScrollView>>(null);

  const load = useCallback(() => {
    setError(false);
    fetchAac(locale).then(
      (res) => setCategories(res.categories),
      () => setError(true),
    );
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    fetchAac(locale).then(
      (res) => !cancelled && setCategories(res.categories),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
      stopSpeech();
    };
  }, [locale]);

  useEffect(() => () => void (flash.current && clearTimeout(flash.current)), []);

  /* ----------------------------- Kartalarni yig'ish ----------------------------- */

  const hidden = new Set(settings.hidden[childKey] ?? []);
  const toBoard = (c: AacCategory['cards'][number], categoryId: string): BoardCard => ({
    ...c,
    categoryId,
    recordingUrl: local.recordings[c.id] ?? null,
    custom: false,
  });
  const customFor = (categoryId: string): BoardCard[] =>
    local.custom
      .filter((c) => c.categoryId === categoryId)
      .map((c) => ({
        id: c.id,
        categoryId,
        title: c.title,
        speak: c.title,
        emoji: null,
        imageUrl: c.imageUrl,
        audioUrl: null,
        recordingUrl: c.audioUrl,
        wordType: c.wordType,
        core: false,
        custom: true,
      }));
  const visible = (cards: BoardCard[]) => (parentMode ? cards : cards.filter((c) => !hidden.has(c.id)));

  const coreCategory = categories?.find((c) => c.cards.some((card) => card.core));
  const tabs = categories?.filter((c) => c !== coreCategory) ?? [];
  const current = tabs.find((c) => c.id === selected) ?? tabs[0];
  const coreCards = coreCategory ? visible([...coreCategory.cards.map((c) => toBoard(c, coreCategory.id)), ...customFor(coreCategory.id)]) : [];
  const gridCards = current ? visible([...current.cards.map((c) => toBoard(c, current.id)), ...customFor(current.id)]) : [];
  const recordedCount = Object.keys(local.recordings).length + local.custom.filter((c) => c.audio).length;
  const needsVoice = local.loaded && tts === false && recordedCount === 0 && !categories?.some((c) => c.cards.some((card) => card.audioUrl));

  /* -------------------------------- Harakatlar -------------------------------- */

  const say = async (parts: Utterance[]) => {
    const id = ++sayId.current;
    const ok = await speak(parts, locale, settings.rate);
    // Tez-tez bosilganda faqat oxirgi bosish natijasi ko'rsatiladi
    if (id === sayId.current) setSilent(!ok);
  };

  const press = (card: BoardCard) => {
    if (parentMode) {
      setEditingId(card.id);
      return;
    }
    logAacTap(childKey, card.id);
    if (flash.current) clearTimeout(flash.current);
    setActiveId(card.id);
    flash.current = setTimeout(() => setActiveId(null), 600);
    if (settings.buildSentence) setSentence((prev) => (prev.length >= MAX_SENTENCE ? prev : [...prev, { key: seq.current++, card }]));
    if (settings.speakOnTap) say([utter(card)]);
  };

  // Bitta karta — to'liq gap ("Hojatxonaga boraman"), bir nechta — kartalardagi so'zlar ketma-ket
  const speakSentence = () => {
    if (!sentence.length) return;
    if (!parentMode) logAacSentence(childKey, sentence.length);
    say(sentence.length === 1 ? [utter(sentence[0].card)] : sentence.map((s) => ({ ...utter(s.card), text: s.card.title })));
  };

  /* --------------------------------- Ko'rinish --------------------------------- */

  if (error && !categories)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('wifi.slash', 'wifi_off')} title={t('common.offlineTitle')} body={t('common.offline')} actionTitle={t('common.retry')} onAction={load} />
      </View>
    );

  if (!categories)
    return (
      <Screen>
        <Skeleton height={72} />
        <Skeleton height={96} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} height={110} width="31%" />
          ))}
        </View>
      </Screen>
    );

  if (tabs.length === 0 && coreCards.length === 0)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('speaker.wave.2.fill', 'volume_up')} title={t('talk.emptyTitle')} body={t('talk.empty')} />
      </View>
    );

  // Muharrir kartani har renderda yangidan oladi — yangi yozilgan ovoz darhol ko'rinadi
  const editing = [...coreCards, ...gridCards].find((c) => c.id === editingId) ?? null;
  const editingHidden = editing ? hidden.has(editing.id) : false;

  const columns = COLUMNS[settings.size];
  const tileWidth = gridWidth ? Math.floor((gridWidth - GAP * (columns - 1)) / columns) : 0;
  // Gap qatori ekran tepasida yopishib turadi: undan oldingi bloklar soni
  const stickyIndex = 1 + (parentMode ? 1 : 0) + (needsVoice ? 1 : 0);

  return (
    <>
      <Screen stickyHeaderIndices={settings.buildSentence ? [stickyIndex] : undefined} keyboardShouldPersistTaps="handled">
        {/* Sarlavha va ota-ona rejimi */}
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
            {t('talk.subtitle')}
          </ThemedText>
          {!parentMode && <HoldButton label={t('talk.parent')} onComplete={() => setParentMode(true)} />}
        </View>

        {parentMode && (
          <Card flat tone="tintSoft" style={{ gap: 12, borderColor: theme.tint }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" themeColor="tint">
                  {t('talk.parentMode')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('talk.editHint')}
                </ThemedText>
              </View>
              <PressableScale onPress={() => setParentMode(false)} style={[styles.doneBtn, { backgroundColor: theme.tint }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  {t('talk.done')}
                </ThemedText>
              </PressableScale>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <ToolButton icon={sym('mic.fill', 'mic')} label={t('talk.recordAll')} onPress={() => setDialog('wizard')} />
              <ToolButton icon={sym('plus', 'add')} label={t('talk.addCard')} onPress={() => setDialog('add')} />
              <ToolButton icon={sym('slider.horizontal.3', 'tune')} label={t('talk.settings')} onPress={() => setDialog('settings')} />
            </View>
          </Card>
        )}

        {needsVoice && (
          <Card flat tone="warningSoft" style={{ gap: 8, borderColor: theme.warning }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SymbolView name={sym('speaker.slash.fill', 'volume_off')} size={18} tintColor={theme.warning} />
              <ThemedText type="smallBold" style={{ color: theme.warning, flex: 1 }}>
                {t('talk.noVoiceTitle')}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('talk.noVoiceBody')}
            </ThemedText>
            <PressableScale
              onPress={() => {
                setParentMode(true);
                setDialog('wizard');
              }}
              style={[styles.doneBtn, { backgroundColor: theme.warning, alignSelf: 'flex-start', flexDirection: 'row', gap: 8 }]}>
              <SymbolView name={sym('mic.fill', 'mic')} size={15} tintColor="#FFFFFF" />
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                {t('talk.recordAll')}
              </ThemedText>
            </PressableScale>
          </Card>
        )}

        {/* Gap qatori */}
        {settings.buildSentence && (
          <View style={{ backgroundColor: theme.background, paddingVertical: 6, marginHorizontal: -20, paddingHorizontal: 20 }}>
            <View style={[styles.strip, shadow, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <ScrollView
                ref={strip}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                onContentSizeChange={() => strip.current?.scrollToEnd({ animated: true })}>
                <Pressable accessibilityRole="button" accessibilityLabel={t('talk.speak')} onPress={speakSentence} style={styles.stripItems}>
                  {sentence.length === 0 ? (
                    <ThemedText type="small" themeColor="textTertiary" style={{ paddingHorizontal: 8, maxWidth: 220 }}>
                      {t('talk.sentenceHint')}
                    </ThemedText>
                  ) : (
                    sentence.map(({ key, card }) => {
                      const color = WORD_COLORS[card.wordType];
                      return (
                        <Animated.View
                          key={key}
                          entering={ZoomIn.duration(180)}
                          exiting={ZoomOut.duration(150)}
                          style={[styles.chip, { borderColor: color, backgroundColor: softBg(color) }]}>
                          <View style={styles.chipPicture}>
                            <CardPicture card={card} size={24} radius={8} />
                          </View>
                          <ThemedText numberOfLines={1} style={{ fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center', width: '100%' }}>
                            {card.title}
                          </ThemedText>
                        </Animated.View>
                      );
                    })
                  )}
                </Pressable>
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StripButton
                  icon={sym('delete.left', 'backspace')}
                  label={t('talk.backspace')}
                  disabled={sentence.length === 0}
                  onPress={() => setSentence((prev) => prev.slice(0, -1))}
                />
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t('talk.speak')}
                  disabled={sentence.length === 0}
                  onPress={speakSentence}
                  style={[styles.speakBtn, { backgroundColor: theme.tint }, sentence.length === 0 && { opacity: 0.4 }]}>
                  <SymbolView name={sym('speaker.wave.2.fill', 'volume_up')} size={22} tintColor="#FFFFFF" />
                  <ThemedText style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 13, fontWeight: '700' }}>{t('talk.speak')}</ThemedText>
                </PressableScale>
              </View>
            </View>
            {silent && !parentMode ? (
              <ThemedText type="small" style={{ color: theme.warning, marginTop: 4, paddingHorizontal: 8 }}>
                {t('talk.noVoiceTitle')}
              </ThemedText>
            ) : null}
          </View>
        )}

        {/* Asosiy so'zlar — doim ko'rinadi */}
        {coreCards.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}>
            {coreCards.map((card) => (
              <AacTile
                key={card.id}
                card={card}
                size="sm"
                showLabel={settings.showLabels}
                active={activeId === card.id}
                hidden={hidden.has(card.id)}
                editing={parentMode}
                onPress={() => press(card)}
                style={{ width: 92 }}
              />
            ))}
          </ScrollView>
        )}

        {/* Bo'limlar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {tabs.map((c) => {
            const on = c.id === current?.id;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  haptics.select();
                  setSelected(c.id);
                }}
                style={[styles.tab, { borderColor: on ? theme.tint : theme.border, backgroundColor: on ? theme.tintSoft : theme.backgroundElement }]}>
                <ThemedText type="smallBold" style={{ fontSize: 14.5, color: on ? theme.tint : theme.text }}>
                  {c.emoji ? `${c.emoji} ` : ''}
                  {c.title}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Kartalar */}
        <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
          {tileWidth > 0 &&
            gridCards.map((card) => (
              <AacTile
                key={card.id}
                card={card}
                size={settings.size}
                showLabel={settings.showLabels}
                active={activeId === card.id}
                hidden={hidden.has(card.id)}
                editing={parentMode}
                onPress={() => press(card)}
                style={{ width: tileWidth }}
              />
            ))}
          {tileWidth > 0 && parentMode && current && (
            <PressableScale onPress={() => setDialog('add')} style={[styles.addTile, { width: tileWidth, borderColor: theme.border }]}>
              <SymbolView name={sym('plus', 'add')} size={28} tintColor={theme.textTertiary} />
              <ThemedText type="smallBold" themeColor="textTertiary" style={{ fontSize: 13, textAlign: 'center' }}>
                {t('talk.addCard')}
              </ThemedText>
            </PressableScale>
          )}
        </View>

        <Card flat tone="backgroundMuted" style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SymbolView name={sym('lightbulb.fill', 'lightbulb')} size={16} tintColor={theme.tint} />
            <ThemedText type="smallBold" themeColor="tint">
              {t('talk.tipTitle')}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {t('talk.tip')}
          </ThemedText>
        </Card>
      </Screen>

      <CardEditor
        card={editing}
        hidden={editingHidden}
        childKey={childKey}
        onToggleHidden={() => editing && toggleHiddenCard(childKey, editing.id)}
        onClose={() => setEditingId(null)}
      />
      {current && <AddCardDialog open={dialog === 'add'} categoryId={current.id} childKey={childKey} onClose={() => setDialog(null)} />}
      <RecordWizard open={dialog === 'wizard'} cards={[...coreCards, ...gridCards]} childKey={childKey} onClose={() => setDialog(null)} />
      <SettingsSheet open={dialog === 'settings'} settings={settings} onClose={() => setDialog(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  hold: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    overflow: 'hidden',
  },
  doneBtn: { borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    borderWidth: 2,
    borderRadius: 20,
    padding: 8,
  },
  stripItems: { flexGrow: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipPicture: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8 },
  stripBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  speakBtn: { height: 64, minWidth: 64, borderRadius: 16, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tab: { borderWidth: 1.5, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  addTile: {
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
