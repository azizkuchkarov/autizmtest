import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PressableScale, sym, type IconName } from '@/components/ui';
import { Accents, Radius } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { playUrl, stopSpeech } from '@/lib/aac-speech';

/** Bitta yozuvning eng uzun vaqti — karta uchun qisqa so'z yoki gap yetarli. */
const MAX_MS = 6000;

const RECORD_COLOR = Accents.centers.fg;

/** Yozish tugagach ijro yana karnaydan baland chiqishi uchun (iOS yozish rejimida trubkaga o'tkazadi). */
const playbackMode = () => setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});

function RecBtn({
  icon,
  label,
  onPress,
  primary,
  danger,
  maxWidth,
}: {
  icon?: IconName;
  label?: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  maxWidth?: number;
}) {
  const theme = useTheme();
  const fg = primary ? '#FFFFFF' : danger ? RECORD_COLOR : theme.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.97}
      style={[
        styles.btn,
        { maxWidth },
        primary ? { backgroundColor: theme.tint } : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border },
      ]}>
      {icon ? <SymbolView name={icon} size={16} tintColor={fg} /> : null}
      {label && !(maxWidth && maxWidth <= 60) ? (
        <ThemedText type="smallBold" style={{ color: fg, fontSize: 14.5 }} numberOfLines={1}>
          {label}
        </ThemedText>
      ) : null}
    </PressableScale>
  );
}

/**
 * Ota-ona ovozini yozish: bosiladi → gapiriladi → to'xtatiladi → tinglanadi → saqlanadi.
 * `existingUrl` — oldin yozilgan ovoz (bo'lsa tinglash va o'chirish mumkin).
 */
export function VoiceRecorder({
  existingUrl,
  onSave,
  onDelete,
  autoSave,
}: {
  existingUrl: string | null;
  onSave: (uri: string) => Promise<void> | void;
  onDelete?: () => void;
  /** Yozib bo'lingach darhol saqlash (ketma-ket yozish rejimi uchun) */
  autoSave?: boolean;
}) {
  const { t } = useLocale();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopping = useRef(false);
  const blink = useSharedValue(1);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  useEffect(() => {
    blink.value = state === 'recording' ? withRepeat(withTiming(0.2, { duration: 500 }), -1, true) : 1;
  }, [state, blink]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      try {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      } catch {
        // Yozuvchi allaqachon bo'shatilgan
      }
      playbackMode();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat yopilganda
    [],
  );

  const play = (uri: string) => {
    stopSpeech();
    playUrl(uri);
  };

  const stop = async () => {
    if (stopping.current) return;
    stopping.current = true;
    if (timer.current) clearTimeout(timer.current);
    try {
      await recorder.stop();
    } catch {
      // Yozuv allaqachon to'xtagan
    }
    await playbackMode();
    stopping.current = false;
    const uri = recorder.uri;
    if (!uri) {
      setState('idle');
      return;
    }
    if (autoSave) {
      await onSave(uri);
      setState('idle');
      return;
    }
    setPreview(uri);
    setState('preview');
  };

  const start = async () => {
    setError('');
    stopSpeech();
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) throw new Error('denied');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
      timer.current = setTimeout(stop, MAX_MS);
    } catch {
      await playbackMode();
      setError(t('talk.micDenied'));
      setState('idle');
    }
  };

  const save = async () => {
    if (!preview) return;
    await onSave(preview);
    setPreview(null);
    setState('idle');
  };

  return (
    <View style={{ gap: 8 }}>
      {state === 'recording' ? (
        <PressableScale accessibilityRole="button" onPress={stop} style={[styles.btn, { backgroundColor: RECORD_COLOR }]}>
          <Animated.View style={[styles.dot, blinkStyle]} />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 14.5 }}>
            {t('talk.recording')}
          </ThemedText>
          <SymbolView name={sym('stop.fill', 'stop')} size={16} tintColor="#FFFFFF" />
        </PressableScale>
      ) : state === 'preview' && preview ? (
        <View style={styles.row}>
          <RecBtn icon={sym('play.fill', 'play_arrow')} label={t('talk.play')} onPress={() => play(preview)} />
          <RecBtn icon={sym('arrow.counterclockwise', 'replay')} label={t('talk.redo')} onPress={start} />
          <RecBtn label={t('common.save')} onPress={save} primary />
        </View>
      ) : (
        <View style={styles.row}>
          <RecBtn icon={sym('mic.fill', 'mic')} label={existingUrl ? t('talk.redo') : t('talk.record')} onPress={start} primary />
          {existingUrl ? (
            <>
              <RecBtn icon={sym('play.fill', 'play_arrow')} label={t('talk.play')} onPress={() => play(existingUrl)} maxWidth={130} />
              {onDelete ? <RecBtn icon={sym('trash', 'delete')} label={t('talk.deleteRecording')} onPress={onDelete} danger maxWidth={52} /> : null}
            </>
          ) : null}
        </View>
      )}
      {error ? (
        <ThemedText type="small" style={{ color: RECORD_COLOR }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
});
