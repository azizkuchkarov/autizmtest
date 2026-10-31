import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, View, type GestureResponderEvent } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, PressableScale, ProgressBar, SectionHeader, Skeleton, sym, useCardShadow, type IconName } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { absoluteUrl, fetchSoundSets, type SoundCard, type SoundSet } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import type { TranslationKey } from '@/lib/i18n';
import {
  LEVEL_OPTIONS,
  levelMastery,
  recordSoundResult,
  SOUND_LEVELS,
  updateSoundSettings,
  useSoundProgress,
  useSoundSettings,
  type SoundLevel,
  type SoundResult,
} from '@/lib/sound-progress';

/** Bir mashqdagi savollar soni: bola charchamasligi uchun qisqa. */
const ROUNDS_PER_SESSION = 8;

const LEVEL_TEXT: Record<SoundLevel, { title: TranslationKey; body: TranslationKey }> = {
  1: { title: 'sounds.level1', body: 'sounds.level1Body' },
  2: { title: 'sounds.level2', body: 'sounds.level2Body' },
  3: { title: 'sounds.level3', body: 'sounds.level3Body' },
  4: { title: 'sounds.level4', body: 'sounds.level4Body' },
};

const OK_COLOR = '#16A34A';

/** Bolaning natijalari shu kalit bo'yicha saqlanadi. */
function useChildKey() {
  return useProfile().child?.id ?? 'default';
}

/** Sozlamalar bo'yicha ko'rinadigan ovozlar (keskin tovushlar standart holatda yashirin). */
export function useVisibleCards(set: SoundSet | null) {
  const { showLoud } = useSoundSettings();
  return set?.cards.filter((c) => showLoud || !c.loud) ?? [];
}

/* --------------------------------- Rasm --------------------------------- */

/** Ovoz rasmi: rasm bo'lsa rasm, bo'lmasa emoji, u ham bo'lmasa bosh harf. */
export function SoundVisual({ item, size }: { item: Pick<SoundCard, 'title' | 'imageUrl' | 'emoji'>; size: number }) {
  const a = useAccent('lessons');
  const [broken, setBroken] = useState(false);
  const uri = absoluteUrl(item.imageUrl);
  return (
    <View style={[styles.visual, { width: size, height: size, borderRadius: size * 0.26, backgroundColor: a.soft }]}>
      {uri && !broken ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} onError={() => setBroken(true)} />
      ) : (
        <ThemedText style={{ fontSize: size * 0.55, lineHeight: size * 0.7, color: a.fg, fontWeight: '700' }}>
          {item.emoji || item.title.slice(0, 1).toUpperCase()}
        </ThemedText>
      )}
    </View>
  );
}

/* ------------------------------ To'plamlar ------------------------------ */

/** Darslar → Ovozli: to'plamlar ro'yxati. */
export function SoundSetList() {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const shadow = useCardShadow();
  const a = useAccent('lessons');
  const [sets, setSets] = useState<SoundSet[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    return fetchSoundSets(locale).then(
      (res) => setSets(res.sets),
      () => setError(true),
    );
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !sets)
    return (
      <EmptyState icon={sym('wifi.slash', 'wifi_off')} title={t('common.offlineTitle')} body={t('common.offline')} actionTitle={t('common.retry')} onAction={load} />
    );

  if (!sets)
    return (
      <View style={{ gap: Spacing.three }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={96} />
        ))}
      </View>
    );

  if (sets.length === 0)
    return <EmptyState icon={sym('ear', 'hearing')} title={t('sounds.emptyTitle')} body={t('sounds.empty')} color={a.fg} background={a.soft} />;

  return (
    <View style={{ gap: Spacing.three }}>
      {sets.map((s, i) => (
        <Animated.View key={s.id} entering={FadeInDown.delay(60 * i).duration(400)}>
          <PressableScale
            onPress={() => router.push(`/sounds/${s.id}`)}
            style={[styles.setRow, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <SoundVisual item={s} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="heading" numberOfLines={2} style={{ fontSize: 16 }}>
                {s.title}
              </ThemedText>
              {s.description ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  {s.description}
                </ThemedText>
              ) : null}
              <ThemedText type="small" themeColor="textTertiary">
                {s.cards.length} {t('sounds.count')}
              </ThemedText>
            </View>
            <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />
          </PressableScale>
        </Animated.View>
      ))}
    </View>
  );
}

/* ------------------------------- Darajalar ------------------------------- */

/** To'plam ichida: 4 ta murakkablik darajasi, sozlamalar va maslahat. */
export function LevelPicker({ set, onPick }: { set: SoundSet; onPick: (level: SoundLevel) => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const a = useAccent('lessons');
  const cards = useVisibleCards(set);
  const progress = useSoundProgress(useChildKey());
  const ids = cards.map((c) => c.id);

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <SoundVisual item={set} size={80} />
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30 }}>
            {set.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {set.description ?? `${cards.length} ${t('sounds.count')}`}
          </ThemedText>
        </View>
      </View>

      <SectionHeader title={t('sounds.chooseLevel')} />
      {SOUND_LEVELS.map((level, i) => {
        const need = LEVEL_OPTIONS[level];
        const locked = cards.length < need;
        const mastery = levelMastery(progress, ids, level);
        return (
          <Animated.View key={level} entering={FadeInDown.delay(60 * i).duration(400)} style={locked && { opacity: 0.55 }}>
            <Card onPress={locked ? undefined : () => onPick(level)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <LinearGradient colors={a.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelBadge}>
                  {locked ? (
                    <SymbolView name={sym('lock.fill', 'lock')} size={18} tintColor="#FFFFFF" />
                  ) : (
                    <ThemedText type="heading" style={{ color: '#FFFFFF', fontSize: 18 }}>
                      {level}
                    </ThemedText>
                  )}
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <ThemedText type="caption" style={{ color: a.fg }}>
                    {t('sounds.levelN').replace('{n}', String(level))}
                  </ThemedText>
                  <ThemedText type="heading" style={{ fontSize: 16 }}>
                    {t(LEVEL_TEXT[level].title)}
                  </ThemedText>
                </View>
                {!locked && <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} />}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {locked ? t('sounds.needMore').replace('{n}', String(need)) : t(LEVEL_TEXT[level].body)}
              </ThemedText>
              {!locked && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar value={mastery} color={a.fg} height={6} />
                  </View>
                  <ThemedText type="small" themeColor="textTertiary">
                    {t('sounds.progress').replace('{n}', String(mastery))}
                  </ThemedText>
                </View>
              )}
            </Card>
          </Animated.View>
        );
      })}

      <SoundSettingsCard />

      <Card flat tone="backgroundMuted">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <SymbolView name={sym('lightbulb.fill', 'lightbulb')} size={16} tintColor={a.fg} />
          <ThemedText type="smallBold" style={{ color: a.fg }}>
            {t('sounds.tipTitle')}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {t('sounds.tip')}
        </ThemedText>
      </Card>
    </View>
  );
}

const MIN_VOLUME = 0.1;

/** Ovoz balandligi: 0.1–1, 0.05 qadam bilan (web dagi range bilan bir xil). */
function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const theme = useTheme();
  const a = useAccent('lessons');
  const width = useRef(0);
  const pct = ((value - MIN_VOLUME) / (1 - MIN_VOLUME)) * 100;

  const pick = (e: GestureResponderEvent) => {
    if (!width.current) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / width.current));
    const next = Math.round((MIN_VOLUME + ratio * (1 - MIN_VOLUME)) / 0.05) * 0.05;
    const clamped = Math.max(MIN_VOLUME, Math.min(1, Number(next.toFixed(2))));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 10, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) =>
        onChange(Math.max(MIN_VOLUME, Math.min(1, Number((value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)).toFixed(2)))))
      }
      onLayout={(e) => (width.current = e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={pick}
      onResponderMove={pick}
      style={styles.sliderHit}>
      <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: theme.backgroundMuted }]}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: a.fg }} />
      </View>
      <View pointerEvents="none" style={[styles.sliderThumb, { left: `${pct}%`, borderColor: a.fg, backgroundColor: theme.backgroundElement }]} />
    </View>
  );
}

function SoundSettingsCard() {
  const { t } = useLocale();
  const theme = useTheme();
  const a = useAccent('lessons');
  const { volume, showLoud } = useSoundSettings();
  return (
    <Card flat>
      <ThemedText type="smallBold">{t('sounds.volume')}</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <SymbolView name={sym('speaker.wave.1.fill', 'volume_down')} size={18} tintColor={theme.textTertiary} />
        <View style={{ flex: 1 }}>
          <VolumeSlider value={volume} onChange={(v) => updateSoundSettings({ volume: v })} />
        </View>
        <SymbolView name={sym('speaker.wave.3.fill', 'volume_up')} size={18} tintColor={theme.textTertiary} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.one }}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{t('sounds.showLoud')}</ThemedText>
          <ThemedText type="small" themeColor="textTertiary">
            {t('sounds.loudHint')}
          </ThemedText>
        </View>
        <Switch value={showLoud} onValueChange={(v) => updateSoundSettings({ showLoud: v })} trackColor={{ true: a.fg }} />
      </View>
    </Card>
  );
}

/* --------------------------------- O'yin --------------------------------- */

type Round = { card: SoundCard; options: SoundCard[] };

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 1-darajada tartib bilan tanishtiramiz, qolganlarida aralashtirib, variantlarni shu to'plamdan olamiz. */
function makeRounds(cards: SoundCard[], level: SoundLevel): Round[] {
  const deck = (level === 1 ? cards : shuffle(cards)).slice(0, ROUNDS_PER_SESSION);
  return deck.map((card) => {
    const distractors = shuffle(cards.filter((c) => c.id !== card.id)).slice(0, LEVEL_OPTIONS[level] - 1);
    return { card, options: shuffle([card, ...distractors]) };
  });
}

/** Bitta pleyer: ota-ona bosgandagina chiqadi, balandlik sozlamadan olinadi. */
function useSoundPlayer(volume: number) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const current = useRef<string | null>(null);

  useEffect(() => {
    // Telefon "jim" rejimida bo'lsa ham mashq ovozi eshitilsin
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  const play = useCallback(
    (url: string) => {
      const uri = absoluteUrl(url);
      if (!uri) return;
      if (current.current !== uri) {
        player.replace({ uri });
        current.current = uri;
      } else {
        player.seekTo(0).catch(() => {});
      }
      player.volume = volume;
      player.play();
    },
    [player, volume],
  );

  const stop = useCallback(() => player.pause(), [player]);

  return { play, stop, playing: status.playing };
}

function PlayButton({ playing, onPress, label }: { playing: boolean; onPress: () => void; label: string }) {
  const a = useAccent('lessons');
  const ring = useSharedValue(0);

  useEffect(() => {
    ring.value = playing ? withRepeat(withTiming(1, { duration: 1200 }), -1, false) : withTiming(0, { duration: 150 });
  }, [playing, ring]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: playing ? 0.35 * (1 - ring.value) : 0,
    transform: [{ scale: 1 + 0.45 * ring.value }],
  }));

  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.94} style={styles.playWrap}>
      <Animated.View style={[styles.playRing, { backgroundColor: a.fg }, ringStyle]} />
      <LinearGradient colors={a.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.play, { shadowColor: '#F97316' }]}>
        <SymbolView
          name={playing ? sym('speaker.wave.2.fill', 'volume_up') : sym('play.fill', 'play_arrow')}
          size={48}
          tintColor="#FFFFFF"
          style={!playing && { marginLeft: 6 }}
        />
      </LinearGradient>
    </PressableScale>
  );
}

type TileState = 'idle' | 'correct' | 'wrong' | 'hint';

/** Variant tugmasi (2 va 3-daraja). */
function OptionTile({ card, state, onPress }: { card: SoundCard; state: TileState; onPress: () => void }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const a = useAccent('lessons');
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    pulse.value =
      state === 'hint' ? withRepeat(withSequence(withTiming(1.05, { duration: 500 }), withTiming(1, { duration: 500 })), -1) : withTiming(1);
    opacity.value = withTiming(state === 'wrong' ? 0.3 : 1, { duration: 250 });
  }, [state, pulse, opacity]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: opacity.value }));
  const borderColor = state === 'correct' ? OK_COLOR : state === 'hint' ? a.fg : theme.border;

  return (
    <Animated.View style={[{ flex: 1 }, animated]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={card.title}
        disabled={state === 'wrong'}
        onPress={onPress}
        style={[styles.option, shadow, { backgroundColor: theme.backgroundElement, borderColor }]}>
        <SoundVisual item={card} size={112} />
        <ThemedText type="smallBold" numberOfLines={1} style={{ fontSize: 15 }}>
          {card.title}
        </ThemedText>
      </PressableScale>
    </Animated.View>
  );
}

function MarkButton({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) {
  const theme = useTheme();
  const shadow = useCardShadow();
  return (
    <PressableScale onPress={onPress} style={[styles.mark, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <SymbolView name={icon} size={24} tintColor={color} />
      <ThemedText type="smallBold" style={{ fontSize: 13, lineHeight: 16, textAlign: 'center' }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

type Tally = Record<SoundResult, number>;

/** 4 darajali mashq: 1 — tanishish, 2/3 — 2 yoki 4 ta rasmdan tanlash, 4 — faqat ovoz. */
export function SoundGame({ cards, level, onExit }: { cards: SoundCard[]; level: SoundLevel; onExit: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const a = useAccent('lessons');
  const childKey = useChildKey();
  const { volume } = useSoundSettings();
  const { play, stop, playing } = useSoundPlayer(volume);

  const [rounds, setRounds] = useState(() => makeRounds(cards, level));
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Tally>({ ok: 0, help: 0, miss: 0 });

  // Tugagandan keyin ham oxirgi savol: React Compiler `round.card` ni early return dan oldin o'qiydi
  const round = rounds[Math.min(index, rounds.length - 1)];
  const done = index >= rounds.length;

  const record = (result: SoundResult) => {
    recordSoundResult(childKey, round.card.id, level, result);
    setTally((prev) => ({ ...prev, [result]: prev[result] + 1 }));
  };

  const next = () => {
    stop();
    setWrong([]);
    setSolved(false);
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setRounds(makeRounds(cards, level));
    setTally({ ok: 0, help: 0, miss: 0 });
    setWrong([]);
    setSolved(false);
    setRevealed(false);
    setIndex(0);
  };

  /** Xato javobda o'sha variant o'chadi, to'g'risi yonadi va ovoz qayta chiqadi — xatosiz o'rgatish. */
  const choose = (card: SoundCard) => {
    if (solved) return;
    if (card.id === round.card.id) {
      haptics.success();
      setSolved(true);
      record(wrong.length === 0 ? 'ok' : 'help');
    } else {
      setWrong((prev) => [...prev, card.id]);
      play(round.card.audioUrl);
    }
  };

  const mark = (result: SoundResult) => {
    record(result);
    next();
  };

  if (done) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four }}>
        <Animated.Text entering={ZoomIn.springify()} style={{ fontSize: 64, lineHeight: 76 }}>
          🌟
        </Animated.Text>
        <ThemedText type="title" style={{ fontSize: 26, textAlign: 'center' }}>
          {t('sounds.doneTitle')}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', maxWidth: 340 }}>
          {t('sounds.doneBody')}
        </ThemedText>
        {level > 1 && (
          <View style={{ flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' }}>
            {(
              [
                ['ok', 'sounds.markIndependent', OK_COLOR],
                ['help', 'sounds.markPrompted', a.fg],
                ['miss', 'sounds.markNotYet', theme.textTertiary],
              ] as const
            ).map(([key, label, color]) => (
              <Card key={key} flat style={{ flex: 1, alignItems: 'center', gap: 0, padding: Spacing.three }}>
                <ThemedText type="title" style={{ fontSize: 26, lineHeight: 32, color }}>
                  {tally[key]}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  {t(label)}
                </ThemedText>
              </Card>
            ))}
          </View>
        )}
        <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
          <Button title={t('sounds.again')} icon={sym('arrow.counterclockwise', 'replay')} onPress={restart} />
          <Button title={t('sounds.backToLevels')} variant="secondary" onPress={onExit} />
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={{ gap: Spacing.four }}>
      <View style={{ gap: Spacing.two }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <ThemedText type="smallBold" numberOfLines={1} style={{ flex: 1, color: a.fg }}>
            {t('sounds.levelN').replace('{n}', String(level))} · {t(LEVEL_TEXT[level].title)}
          </ThemedText>
          <ThemedText type="small" themeColor="textTertiary">
            {index + 1} / {rounds.length}
          </ThemedText>
        </View>
        <ProgressBar value={(index / rounds.length) * 100} color={a.fg} height={6} />
      </View>

      <Animated.View key={`${index}-${rounds.length}`} entering={FadeInDown.duration(250)} style={{ alignItems: 'center', gap: Spacing.four }}>
        {level === 1 && (
          <>
            <SoundVisual item={round.card} size={200} />
            <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34, textAlign: 'center' }}>
              {round.card.title}
            </ThemedText>
            <PlayButton
              playing={playing}
              label={t('sounds.play')}
              onPress={() => {
                play(round.card.audioUrl);
                if (!solved) {
                  setSolved(true);
                  recordSoundResult(childKey, round.card.id, 1, 'ok');
                }
              }}
            />
            <View style={{ alignSelf: 'stretch' }}>
              <Button title={t('sounds.next')} onPress={next} disabled={!solved} />
            </View>
          </>
        )}

        {(level === 2 || level === 3) && (
          <>
            <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>
              {t('sounds.whoIsIt')}
            </ThemedText>
            <PlayButton playing={playing} label={t('sounds.play')} onPress={() => play(round.card.audioUrl)} />
            <View style={{ alignSelf: 'stretch', gap: Spacing.three }}>
              {chunk(round.options, 2).map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', gap: Spacing.three }}>
                  {row.map((card) => {
                    const isAnswer = card.id === round.card.id;
                    const state: TileState = wrong.includes(card.id)
                      ? 'wrong'
                      : isAnswer && solved
                        ? 'correct'
                        : isAnswer && wrong.length > 0
                          ? 'hint'
                          : 'idle';
                    return <OptionTile key={card.id} card={card} state={state} onPress={() => choose(card)} />;
                  })}
                </View>
              ))}
            </View>
            <View style={{ minHeight: 24, alignItems: 'center' }}>
              {solved ? (
                <Animated.View entering={ZoomIn.duration(250)}>
                  <ThemedText type="heading" style={{ color: OK_COLOR }}>
                    {t('sounds.great')} 🎉
                  </ThemedText>
                </Animated.View>
              ) : wrong.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  {t('sounds.hint').replace('{name}', round.card.title)}
                </ThemedText>
              ) : null}
            </View>
            <View style={{ alignSelf: 'stretch' }}>
              <Button title={t('sounds.next')} onPress={next} disabled={!solved} />
            </View>
          </>
        )}

        {level === 4 && (
          <>
            <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>
              {t('sounds.whoIsIt')}
            </ThemedText>
            <PlayButton playing={playing} label={t('sounds.play')} onPress={() => play(round.card.audioUrl)} />
            {revealed ? (
              <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', gap: Spacing.two }}>
                <SoundVisual item={round.card} size={150} />
                <ThemedText type="heading">{t('sounds.thisIs').replace('{name}', round.card.title)}</ThemedText>
              </Animated.View>
            ) : (
              <View style={[styles.mystery, { borderColor: a.fg, backgroundColor: a.soft }]}>
                <ThemedText style={{ fontSize: 64, lineHeight: 76, fontWeight: '800', color: a.fg }}>?</ThemedText>
              </View>
            )}
            <View style={{ alignSelf: 'stretch', gap: Spacing.two }}>
              {!revealed ? (
                <Button title={t('sounds.reveal')} variant="secondary" onPress={() => setRevealed(true)} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  {t('sounds.markHint')}
                </ThemedText>
              )}
              <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                <MarkButton icon={sym('checkmark', 'check')} label={t('sounds.markIndependent')} color={OK_COLOR} onPress={() => mark('ok')} />
                <MarkButton icon={sym('hand.raised.fill', 'pan_tool')} label={t('sounds.markPrompted')} color={a.fg} onPress={() => mark('help')} />
                <MarkButton icon={sym('hourglass', 'hourglass_empty')} label={t('sounds.markNotYet')} color={theme.textTertiary} onPress={() => mark('miss')} />
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const styles = StyleSheet.create({
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderHit: {
    height: 32,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    borderWidth: 2.5,
  },
  playWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  play: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  option: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2.5,
  },
  mark: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mystery: {
    width: 150,
    height: 150,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
