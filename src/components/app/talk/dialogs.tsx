"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Eye, EyeOff, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLocale } from "@/components/app/providers";
import { CardPicture, softBg, WORD_COLORS, WORD_TYPES, type BoardCard } from "@/components/app/talk/tile";
import { VoiceRecorder } from "@/components/app/talk/recorder";
import { Button, ProgressBar } from "@/components/app/ui";
import { deleteCustomCard, deleteRecording, saveCustomCard, saveRecording, setCustomCardAudio, updateAacSettings, type AacCardSize, type AacSettings } from "@/lib/app/aac-store";
import type { AacWordType } from "@/lib/app/api";
import type { TranslationKey } from "@/lib/app-i18n";

/* ---------------------------------- Oyna ---------------------------------- */

/** Telefonda pastdan chiqadigan, kompyuterda o'rtadagi oyna. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(10_12_24/0.45)] md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90dvh] w-full max-w-[520px] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-element p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-card md:rounded-[28px]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="t-heading">{title}</h2>
              <button type="button" onClick={onClose} aria-label="×" className="rounded-full p-2 text-ink-3 hover:bg-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span className="flex flex-col">
        <span className="t-small-bold text-[15px]">{label}</span>
        {hint ? <span className="t-small text-ink-3">{hint}</span> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0" style={{ accentColor: "var(--tint)" }} />
    </label>
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
  const color = card ? WORD_COLORS[card.wordType] : "#000";

  const saveVoice = async (blob: Blob) => {
    if (!card) return;
    // O'z kartasining ovozi kartaning o'zida, server kartasiniki esa alohida yozuvlarda saqlanadi
    if (card.custom) await setCustomCardAudio(card.id, blob);
    else await saveRecording(childKey, locale, card.id, blob);
  };

  return (
    <Sheet open={!!card} title={card?.title ?? ""} onClose={onClose}>
      {card && (
        <>
          <div className="flex items-center gap-4">
            <span
              className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border-[3px] text-[52px]"
              style={{ borderColor: color, background: softBg(color) }}
            >
              <CardPicture card={card} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="t-small" style={{ color }}>
                {t(`talk.type.${card.wordType}` as TranslationKey)}
              </span>
              <span className="t-body">“{card.speak}”</span>
              <span className="t-small text-ink-3">{card.recordingUrl ? `🎙 ${t("talk.hasRecording")}` : t("talk.noRecording")}</span>
            </div>
          </div>

          <VoiceRecorder
            key={card.id}
            existingUrl={card.recordingUrl}
            onSave={saveVoice}
            onDelete={card.custom ? undefined : () => deleteRecording(childKey, locale, card.id)}
          />

          <Button
            title={hidden ? t("talk.show") : t("talk.hide")}
            icon={hidden ? Eye : EyeOff}
            variant="secondary"
            size="md"
            onClick={onToggleHidden}
          />
          {card.custom && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm(t("talk.deleteCardConfirm"))) return;
                await deleteCustomCard(card.id);
                onClose();
              }}
              className="t-small-bold flex items-center justify-center gap-2 py-2 text-[var(--danger)] hover:underline"
            >
              <Trash2 className="h-4 w-4" /> {t("talk.deleteCard")}
            </button>
          )}
          <p className="t-small text-center text-ink-3">{t("talk.localNote")}</p>
        </>
      )}
    </Sheet>
  );
}

/* ------------------------------ Yangi karta ------------------------------ */

/** Rasmni 512 px gacha kichraytiradi — qurilma xotirasini tejash uchun. */
async function resizeImage(file: File, max = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85));
}

/** Ota-ona o'z kartasini qo'shadi: oila a'zosining surati, sevimli o'yinchoq va h.k. */
export function AddCardDialog({ open, categoryId, childKey, onClose }: { open: boolean; categoryId: string; childKey: string; onClose: () => void }) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");
  const [wordType, setWordType] = useState<AacWordType>("noun");
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (image && URL.revokeObjectURL(image.url)), [image]);

  const reset = () => {
    setTitle("");
    setWordType("noun");
    setImage(null);
    setAudio(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    const blob = await resizeImage(file).catch(() => file);
    setImage({ blob, url: URL.createObjectURL(blob) });
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await saveCustomCard({
      id: `custom-${crypto.randomUUID()}`,
      childKey,
      categoryId,
      title: title.trim(),
      wordType,
      image: image?.blob ?? null,
      audio,
      createdAt: Date.now(),
    });
    setSaving(false);
    close();
  };

  const color = WORD_COLORS[wordType];

  return (
    <Sheet open={open} title={t("talk.addCard")} onClose={close}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] border-[3px] border-dashed text-ink-3"
          style={{ borderColor: color, background: softBg(color) }}
          aria-label={t("talk.choosePhoto")}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- ota-ona tanlagan rasm
            <img src={image.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <Camera className="h-7 w-7" />
              <span className="text-[11px] font-semibold">{t("talk.photo")}</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-small-bold">{t("talk.cardName")}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("talk.cardNamePlaceholder")}
            maxLength={60}
            className="h-12 rounded-[14px] border border-line bg-app px-3 text-[16px] outline-none focus:border-tint"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="t-small-bold">{t("talk.wordType")}</span>
        <div className="flex flex-wrap gap-2">
          {WORD_TYPES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWordType(w)}
              className="t-small-bold rounded-full border-2 px-3 py-1.5 text-[13px]"
              style={{
                borderColor: WORD_COLORS[w],
                background: wordType === w ? WORD_COLORS[w] : softBg(WORD_COLORS[w]),
                color: wordType === w ? "#fff" : "var(--text)",
              }}
            >
              {t(`talk.type.${w}` as TranslationKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="t-small-bold">{t("talk.record")}</span>
        <VoiceRecorder existingUrl={null} onSave={(b) => setAudio(b)} />
        {audio ? <span className="t-small text-[var(--success)]">✓ {t("talk.hasRecording")}</span> : null}
      </div>

      <Button title={t("common.save")} onClick={save} loading={saving} disabled={!title.trim()} />
      <p className="t-small text-center text-ink-3">{t("talk.localNote")}</p>
    </Sheet>
  );
}

/* ---------------------------- Ketma-ket yozish ---------------------------- */

/** Bo'limdagi kartalarga birma-bir ovoz yozish: ota-ona 5 daqiqada butun bo'limni o'z ovozi bilan to'ldiradi. */
export function RecordWizard({ open, cards, childKey, onClose }: { open: boolean; cards: BoardCard[]; childKey: string; onClose: () => void }) {
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);
  const i = Math.min(index, Math.max(0, cards.length - 1));
  const card = cards[i];
  const recorded = cards.filter((c) => c.recordingUrl).length;
  const color = card ? WORD_COLORS[card.wordType] : "#000";

  const save = async (blob: Blob) => {
    if (!card) return;
    if (card.custom) await setCustomCardAudio(card.id, blob);
    else await saveRecording(childKey, locale, card.id, blob);
    if (i < cards.length - 1) setIndex(i + 1);
  };

  return (
    <Sheet
      open={open}
      title={t("talk.recordAll")}
      onClose={() => {
        setIndex(0);
        onClose();
      }}
    >
      <p className="t-small text-ink-2">{t("talk.recordWizardHint")}</p>
      <div className="flex items-center gap-3">
        <ProgressBar value={cards.length ? (recorded / cards.length) * 100 : 0} color="var(--success)" height={6} />
        <span className="t-small shrink-0 text-ink-3">{t("talk.recorded").replace("{n}", String(recorded)).replace("{total}", String(cards.length))}</span>
      </div>
      {card && (
        <>
          <div className="flex flex-col items-center gap-2 py-2">
            <span
              className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[24px] border-[3px] text-[72px]"
              style={{ borderColor: color, background: softBg(color) }}
            >
              <CardPicture card={card} />
            </span>
            <span className="t-title !text-[26px]">“{card.speak}”</span>
            {card.recordingUrl ? <span className="t-small text-[var(--success)]">✓ {t("talk.hasRecording")}</span> : null}
          </div>
          <VoiceRecorder key={card.id} existingUrl={card.recordingUrl} onSave={save} autoSave />
          <div className="flex gap-2">
            <Button title={t("talk.prev")} icon={ChevronLeft} variant="secondary" size="md" disabled={i === 0} onClick={() => setIndex(i - 1)} />
            <Button title={t("talk.next")} icon={ChevronRight} variant="secondary" size="md" disabled={i >= cards.length - 1} onClick={() => setIndex(i + 1)} />
          </div>
        </>
      )}
    </Sheet>
  );
}

/* -------------------------------- Sozlamalar -------------------------------- */

export function SettingsSheet({ open, settings, onClose }: { open: boolean; settings: AacSettings; onClose: () => void }) {
  const { t } = useLocale();
  const sizes: { id: AacCardSize; label: TranslationKey }[] = [
    { id: "sm", label: "talk.sizeSm" },
    { id: "md", label: "talk.sizeMd" },
    { id: "lg", label: "talk.sizeLg" },
  ];
  return (
    <Sheet open={open} title={t("talk.settings")} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <span className="t-small-bold text-[15px]">{t("talk.size")}</span>
        <div className="flex gap-1 rounded-[16px] bg-muted p-1">
          {sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => updateAacSettings({ size: s.id })}
              className={`t-small-bold h-10 flex-1 rounded-[12px] text-[14px] ${settings.size === s.id ? "bg-element shadow-card" : "text-ink-2"}`}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
      </div>
      <Toggle label={t("talk.showLabels")} checked={settings.showLabels} onChange={(v) => updateAacSettings({ showLabels: v })} />
      <Toggle label={t("talk.speakOnTap")} checked={settings.speakOnTap} onChange={(v) => updateAacSettings({ speakOnTap: v })} />
      <Toggle label={t("talk.buildSentence")} checked={settings.buildSentence} onChange={(v) => updateAacSettings({ buildSentence: v })} />
      <label className="flex flex-col gap-2">
        <span className="t-small-bold text-[15px]">
          {t("talk.rate")} · {settings.rate.toFixed(1)}×
        </span>
        <input
          type="range"
          min={0.5}
          max={1.3}
          step={0.1}
          value={settings.rate}
          onChange={(e) => updateAacSettings({ rate: Number(e.target.value) })}
          style={{ accentColor: "var(--tint)" }}
        />
      </label>
    </Sheet>
  );
}
