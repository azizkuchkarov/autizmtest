import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { VoiceRecorder } from '@/components/talk/recorder';
import { CardPicture, useSoftBg, WORD_COLORS, WORD_TYPES, type BoardCard } from '@/components/talk/tile';
import { Button, ProgressBar, Segmented, sym, type IconName } from '@/components/ui';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import {
  deleteCustomCard,
  deleteRecording,
  saveCustomCard,
  saveRecording,
  setCustomCardAudio,
  updateAacSettings,
  type AacCardSize,
  type AacSettings,
} from '@/lib/aac-store';
import type { AacWordType } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

/* ---------------------------------- Oyna ---------------------------------- */

/** Pastdan chiqadigan oyna (iOS da tizimning sheet ko'rinishi). */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.backgroundElement }}>
        <View style={styles.sheetHeader}>
          <ThemedText type="heading" numberOfLines={1} style={{ flex: 1 }}>
            {title}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={onClose}
            hitSlop={10}
            style={[styles.close, { backgroundColor: theme.backgroundMuted }]}>
            <SymbolView name={sym('xmark', 'close')} size={14} tintColor={theme.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingTop: 4, gap: Spacing.three, paddingBottom: insets.bottom + 32 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, paddingVertical: 4 }}>
      <ThemedText type="smallBold" style={{ fontSize: 15, flex: 1 }}>
        {label}
      </ThemedText>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.tint }} />
    </View>
  );
}

function BigPicture({ card, size }: { card: Pick<BoardCard, 'emoji' | 'imageUrl' | 'title' | 'wordType'>; size: number }) {
  const softBg = useSoftBg();
  const color = WORD_COLORS[card.wordType];
  return (
    <View style={[styles.bigPicture, { width: size, height: size, borderRadius: size * 0.19, borderColor: color, backgroundColor: softBg(color) }]}>
      <CardPicture card={card} size={size * 0.54} radius={size * 0.15} />
    </View>
  );
}

/* ------------------------------ Karta muharriri ------------------------------ */

/** Ota-ona rejimida kartani bosganda: ovoz yozish, bolaga ko'rsatish/yashirish, o'z kartasini o'chirish. */
export function CardEditor({
  card,
  hidden,
  childKey,
  onToggleHidden,
  onClose,
}: {
  card: BoardCard | null;
  hidden: boolean;
  childKey: string;
  onToggleHidden: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const color = card ? WORD_COLORS[card.wordType] : '#000000';
  // Tizim Alert'i ochiq sheet ustida chiqmaydi — o'chirish shu yerda ikkinchi bosish bilan tasdiqlanadi
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirming = !!card && confirmId === card.id;

  const saveVoice = (uri: string) => {
    if (!card) return;
    // O'z kartasining ovozi kartaning o'zida, server kartasiniki esa alohida yozuvlarda saqlanadi
    if (card.custom) setCustomCardAudio(card.id, uri);
    else saveRecording(childKey, locale, card.id, uri);
  };

  const remove = () => {
    if (!card) return;
    if (!confirming) {
      setConfirmId(card.id);
      return;
    }
    deleteCustomCard(card.id);
    setConfirmId(null);
    onClose();
  };

  return (
    <Sheet open={!!card} title={card?.title ?? ''} onClose={onClose}>
      {card && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <BigPicture card={card} size={96} />
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="small" style={{ color }}>
                {t(`talk.type.${card.wordType}` as TranslationKey)}
              </ThemedText>
              <ThemedText type="body">“{card.speak}”</ThemedText>
              <ThemedText type="small" themeColor="textTertiary">
                {card.recordingUrl ? `🎙 ${t('talk.hasRecording')}` : t('talk.noRecording')}
              </ThemedText>
            </View>
          </View>

          <VoiceRecorder
            key={card.id}
            existingUrl={card.recordingUrl}
            onSave={saveVoice}
            onDelete={card.custom ? undefined : () => deleteRecording(childKey, locale, card.id)}
          />

          <Button
            title={hidden ? t('talk.show') : t('talk.hide')}
            icon={hidden ? sym('eye', 'visibility') : sym('eye.slash', 'visibility_off')}
            variant="secondary"
            size="md"
            onPress={onToggleHidden}
          />
          {card.custom && (
            <View style={{ gap: 8 }}>
              {confirming ? (
                <ThemedText type="small" style={{ color: theme.danger, textAlign: 'center' }}>
                  {t('talk.deleteCardConfirm')}
                </ThemedText>
              ) : null}
              <Button title={t('talk.deleteCard')} icon={sym('trash', 'delete')} variant={confirming ? 'secondary' : 'ghost'} size="md" onPress={remove} />
            </View>
          )}
          <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            {t('talk.localNote')}
          </ThemedText>
        </>
      )}
    </Sheet>
  );
}

/* ------------------------------ Yangi karta ------------------------------ */

/** Rasm tanlash yoki suratga olish: kvadrat qilib qirqiladi va siqiladi — qurilma xotirasini tejash uchun. */
async function pickImage(source: 'camera' | 'gallery'): Promise<string | null | 'denied'> {
  // Galereya tizim tanlagichi orqali ochiladi — unga ruxsat so'rash shart emas, kameraga esa kerak
  if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return 'denied';
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return res.canceled ? null : (res.assets[0]?.uri ?? null);
}

function PhotoSource({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.photoSource, { borderColor: theme.border, backgroundColor: theme.backgroundElement }, pressed && { opacity: 0.6 }]}>
      <SymbolView name={icon} size={16} tintColor={theme.tint} />
      <ThemedText type="smallBold" numberOfLines={1} style={{ fontSize: 13.5 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Ota-ona o'z kartasini qo'shadi: oila a'zosining surati, sevimli o'yinchoq va h.k. */
export function AddCardDialog({ open, categoryId, childKey, onClose }: { open: boolean; categoryId: string; childKey: string; onClose: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const softBg = useSoftBg();
  const [title, setTitle] = useState('');
  const [wordType, setWordType] = useState<AacWordType>('noun');
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const close = () => {
    setPhotoError(false);
    setTitle('');
    setWordType('noun');
    setImage(null);
    setAudio(null);
    onClose();
  };

  const choose = async (source: 'camera' | 'gallery') => {
    setPhotoError(false);
    try {
      const uri = await pickImage(source);
      if (uri === 'denied') setPhotoError(true);
      else if (uri) setImage(uri);
    } catch {
      setPhotoError(true);
    }
  };

  const save = () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      saveCustomCard({ childKey, categoryId, title: title.trim(), wordType, imageUri: image, audioUri: audio });
    } finally {
      setSaving(false);
    }
    close();
  };

  const color = WORD_COLORS[wordType];

  return (
    <Sheet open={open} title={t('talk.addCard')} onClose={close}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('talk.choosePhoto')}
          onPress={() => choose('gallery')}
          style={[styles.photo, { borderColor: color, backgroundColor: softBg(color) }]}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <>
              <SymbolView name={sym('camera.fill', 'photo_camera')} size={26} tintColor={theme.textTertiary} />
              <ThemedText type="small" themeColor="textTertiary" style={{ fontSize: 11, fontWeight: '600' }}>
                {t('talk.photo')}
              </ThemedText>
            </>
          )}
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="smallBold">{t('talk.cardName')}</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('talk.cardNamePlaceholder')}
            placeholderTextColor={theme.textTertiary}
            maxLength={60}
            returnKeyType="done"
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PhotoSource icon={sym('camera', 'photo_camera')} label={t('talk.camera')} onPress={() => choose('camera')} />
        <PhotoSource icon={sym('photo.on.rectangle', 'photo_library')} label={t('talk.gallery')} onPress={() => choose('gallery')} />
      </View>
      {photoError ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {t('talk.photoDenied')}
        </ThemedText>
      ) : null}

      <View style={{ gap: 8 }}>
        <ThemedText type="smallBold">{t('talk.wordType')}</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WORD_TYPES.map((w) => {
            const on = wordType === w;
            return (
              <Pressable
                key={w}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setWordType(w)}
                style={[styles.typeChip, { borderColor: WORD_COLORS[w], backgroundColor: on ? WORD_COLORS[w] : softBg(WORD_COLORS[w]) }]}>
                <ThemedText type="smallBold" style={{ fontSize: 13, color: on ? '#FFFFFF' : theme.text }}>
                  {t(`talk.type.${w}` as TranslationKey)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <ThemedText type="smallBold">{t('talk.record')}</ThemedText>
        <VoiceRecorder existingUrl={null} onSave={(uri) => setAudio(uri)} />
        {audio ? (
          <ThemedText type="small" themeColor="success">
            ✓ {t('talk.hasRecording')}
          </ThemedText>
        ) : null}
      </View>

      <Button title={t('common.save')} onPress={save} loading={saving} disabled={!title.trim()} />
      <ThemedText type="small" themeColor="textTertiary" style={{ textAlign: 'center' }}>
        {t('talk.localNote')}
      </ThemedText>
    </Sheet>
  );
}

/* ---------------------------- Ketma-ket yozish ---------------------------- */

/** Bo'limdagi kartalarga birma-bir ovoz yozish: ota-ona 5 daqiqada butun bo'limni o'z ovozi bilan to'ldiradi. */
export function RecordWizard({ open, cards, childKey, onClose }: { open: boolean; cards: BoardCard[]; childKey: string; onClose: () => void }) {
  const { t, locale } = useLocale();
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, cards.length - 1));
  const card = cards[i];
  const recorded = cards.filter((c) => c.recordingUrl).length;

  const save = (uri: string) => {
    if (!card) return;
    if (card.custom) setCustomCardAudio(card.id, uri);
    else saveRecording(childKey, locale, card.id, uri);
    if (i < cards.length - 1) setIndex(i + 1);
  };

  return (
    <Sheet
      open={open}
      title={t('talk.recordAll')}
      onClose={() => {
        setIndex(0);
        onClose();
      }}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('talk.recordWizardHint')}
      </ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={cards.length ? (recorded / cards.length) * 100 : 0} color={theme.success} height={6} />
        </View>
        <ThemedText type="small" themeColor="textTertiary">
          {t('talk.recorded').replace('{n}', String(recorded)).replace('{total}', String(cards.length))}
        </ThemedText>
      </View>
      {card && (
        <>
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
            <BigPicture card={card} size={128} />
            <ThemedText type="title" style={{ fontSize: 26, lineHeight: 32, textAlign: 'center' }}>
              “{card.speak}”
            </ThemedText>
            {card.recordingUrl ? (
              <ThemedText type="small" themeColor="success">
                ✓ {t('talk.hasRecording')}
              </ThemedText>
            ) : null}
          </View>
          <VoiceRecorder key={card.id} existingUrl={card.recordingUrl} onSave={save} autoSave />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button title={t('talk.prev')} icon={sym('chevron.left', 'chevron_left')} variant="secondary" size="md" disabled={i === 0} onPress={() => setIndex(i - 1)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={t('talk.next')}
                icon={sym('chevron.right', 'chevron_right')}
                variant="secondary"
                size="md"
                disabled={i >= cards.length - 1}
                onPress={() => setIndex(i + 1)}
              />
            </View>
          </View>
        </>
      )}
    </Sheet>
  );
}

/* -------------------------------- Sozlamalar -------------------------------- */

const RATE_MIN = 0.5;
const RATE_MAX = 1.3;

export function SettingsSheet({ open, settings, onClose }: { open: boolean; settings: AacSettings; onClose: () => void }) {
  const { t } = useLocale();
  const theme = useTheme();
  const sizes: { value: AacCardSize; label: string }[] = [
    { value: 'sm', label: t('talk.sizeSm') },
    { value: 'md', label: t('talk.sizeMd') },
    { value: 'lg', label: t('talk.sizeLg') },
  ];
  const setRate = (delta: number) =>
    updateAacSettings({ rate: Math.max(RATE_MIN, Math.min(RATE_MAX, Number((settings.rate + delta).toFixed(1)))) });

  return (
    <Sheet open={open} title={t('talk.settings')} onClose={onClose}>
      <View style={{ gap: 8 }}>
        <ThemedText type="smallBold" style={{ fontSize: 15 }}>
          {t('talk.size')}
        </ThemedText>
        <Segmented options={sizes} value={settings.size} onChange={(v) => updateAacSettings({ size: v })} />
      </View>
      <Toggle label={t('talk.showLabels')} value={settings.showLabels} onChange={(v) => updateAacSettings({ showLabels: v })} />
      <Toggle label={t('talk.speakOnTap')} value={settings.speakOnTap} onChange={(v) => updateAacSettings({ speakOnTap: v })} />
      <Toggle label={t('talk.buildSentence')} value={settings.buildSentence} onChange={(v) => updateAacSettings({ buildSentence: v })} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <ThemedText type="smallBold" style={{ fontSize: 15, flex: 1 }}>
          {t('talk.rate')} · {settings.rate.toFixed(1)}×
        </ThemedText>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={t('talk.rate')}
          accessibilityValue={{ text: `${settings.rate.toFixed(1)}×` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => setRate(e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)}
          style={[styles.stepper, { backgroundColor: theme.backgroundMuted }]}>
          <Pressable onPress={() => setRate(-0.1)} disabled={settings.rate <= RATE_MIN} style={[styles.stepBtn, settings.rate <= RATE_MIN && { opacity: 0.35 }]}>
            <SymbolView name={sym('minus', 'remove')} size={16} tintColor={theme.text} />
          </Pressable>
          <Pressable onPress={() => setRate(0.1)} disabled={settings.rate >= RATE_MAX} style={[styles.stepBtn, settings.rate >= RATE_MAX && { opacity: 0.35 }]}>
            <SymbolView name={sym('plus', 'add')} size={16} tintColor={theme.text} />
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bigPicture: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  input: {
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  photoSource: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
  },
  typeChip: { borderWidth: 2, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  stepper: { flexDirection: 'row', borderRadius: Radius.pill, padding: 3, gap: 2 },
  stepBtn: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
});
