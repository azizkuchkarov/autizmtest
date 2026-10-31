"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Delete, Lightbulb, Lock, Mic, Plus, Settings2, Trash2, Volume2, VolumeX, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { AddCardDialog, CardEditor, RecordWizard, SettingsSheet } from "@/components/app/talk/dialogs";
import { AacTile, CardPicture, softBg, WORD_COLORS, type BoardCard } from "@/components/app/talk/tile";
import { Card, EmptyState, Skeleton } from "@/components/app/ui";
import { speak, stopSpeech, useTtsAvailable, type Utterance } from "@/lib/app/aac-speech";
import { logAacSentence, logAacTap, toggleHiddenCard, useAacLocalData, useAacSettings, type AacCardSize } from "@/lib/app/aac-store";
import { fetchAac, type AacCategory } from "@/lib/app/api";

const GRID: Record<AacCardSize, string> = {
  sm: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8",
  md: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
  lg: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

/** Gap qatoridagi kartalar soni chegarasi. */
const MAX_SENTENCE = 12;

const utter = (c: BoardCard): Utterance => ({ text: c.speak, recordingUrl: c.recordingUrl, audioUrl: c.audioUrl });

/** Ota-ona rejimiga kirish: bola tasodifan sozlamalarni o'zgartirmasligi uchun 2 soniya bosib turiladi. */
function HoldButton({ label, onComplete }: { label: string; onComplete: () => void }) {
  const { t } = useLocale();
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setHolding(false);
  };
  const begin = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onComplete();
    }, 2000);
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <button
      type="button"
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      title={t("talk.holdToUnlock")}
      aria-label={`${label}. ${t("talk.holdToUnlock")}`}
      className="relative flex h-10 shrink-0 select-none items-center gap-1.5 overflow-hidden rounded-full border border-line bg-element px-3.5 text-ink-2"
    >
      <span
        className="absolute inset-y-0 left-0 bg-tint-soft"
        style={{ width: holding ? "100%" : "0%", transition: holding ? "width 2s linear" : "width 0.15s" }}
      />
      <Lock className="relative h-4 w-4" />
      <span className="t-small-bold relative text-[13.5px]">{label}</span>
    </button>
  );
}

export function TalkBoard() {
  const { t, locale } = useLocale();
  const childKey = useProfile().child?.id ?? "default";
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
  const [dialog, setDialog] = useState<"settings" | "add" | "wizard" | null>(null);
  const seq = useRef(0);
  const flash = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /* ----------------------------- Kartalarni yig'ish ----------------------------- */

  const hidden = new Set(settings.hidden[childKey] ?? []);
  const toBoard = (c: AacCategory["cards"][number], categoryId: string): BoardCard => ({
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

  const sayId = useRef(0);
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
    if (sentence.length === 0) return;
    if (!parentMode) logAacSentence(childKey, sentence.length);
    say(sentence.length === 1 ? [utter(sentence[0].card)] : sentence.map((s) => ({ ...utter(s.card), text: s.card.title })));
  };

  /* --------------------------------- Ko'rinish --------------------------------- */

  if (error && !categories)
    return <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={load} />;

  if (!categories)
    return (
      <div className="flex flex-col gap-3">
        <Skeleton height={72} />
        <Skeleton height={96} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} height={120} />
          ))}
        </div>
      </div>
    );

  if (tabs.length === 0 && coreCards.length === 0) return <EmptyState icon={Volume2} title={t("talk.emptyTitle")} body={t("talk.empty")} />;

  // Muharrir kartani har renderda yangidan oladi — yangi yozilgan ovoz darhol ko'rinadi
  const editing = [...coreCards, ...gridCards].find((c) => c.id === editingId) ?? null;
  const editingHidden = editing ? hidden.has(editing.id) : false;

  return (
    <div className="flex flex-col gap-4">
      {/* Sarlavha va ota-ona rejimi */}
      <div className="flex items-start justify-between gap-3 pt-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="t-title">{t("talk.title")}</h1>
          <p className="t-small text-ink-2">{t("talk.subtitle")}</p>
        </div>
        {!parentMode && <HoldButton label={t("talk.parent")} onComplete={() => setParentMode(true)} />}
      </div>

      {parentMode && (
        <Card flat className="!gap-3 border-tint/40 bg-tint-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="t-small-bold text-tint">{t("talk.parentMode")}</span>
              <span className="t-small text-ink-2">{t("talk.editHint")}</span>
            </div>
            <button type="button" onClick={() => setParentMode(false)} className="t-small-bold rounded-full bg-tint px-4 py-2 text-white">
              {t("talk.done")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolButton icon={Mic} label={t("talk.recordAll")} onClick={() => setDialog("wizard")} />
            <ToolButton icon={Plus} label={t("talk.addCard")} onClick={() => setDialog("add")} />
            <ToolButton icon={Settings2} label={t("talk.settings")} onClick={() => setDialog("settings")} />
          </div>
        </Card>
      )}

      {needsVoice && (
        <Card flat className="!gap-2 border-[var(--warning)]/40 bg-[var(--warning-soft)]">
          <div className="flex items-center gap-2 text-[var(--warning)]">
            <VolumeX className="h-5 w-5" />
            <span className="t-small-bold">{t("talk.noVoiceTitle")}</span>
          </div>
          <p className="t-small text-ink-2">{t("talk.noVoiceBody")}</p>
          <button
            type="button"
            onClick={() => {
              setParentMode(true);
              setDialog("wizard");
            }}
            className="t-small-bold flex w-fit items-center gap-2 rounded-full bg-[var(--warning)] px-4 py-2 text-white"
          >
            <Mic className="h-4 w-4" /> {t("talk.recordAll")}
          </button>
        </Card>
      )}

      {/* Gap qatori */}
      {settings.buildSentence && (
        <div className="sticky top-0 z-20 -mx-4 bg-app/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 md:top-16">
          <div className="flex items-stretch gap-2 rounded-[20px] border-2 border-line bg-element p-2 shadow-card">
            <button
              type="button"
              onClick={speakSentence}
              className="no-scrollbar flex min-h-[64px] min-w-0 flex-1 items-center gap-1.5 overflow-x-auto text-left"
              aria-label={t("talk.speak")}
            >
              {sentence.length === 0 ? (
                <span className="t-small px-2 text-ink-3">{t("talk.sentenceHint")}</span>
              ) : (
                <AnimatePresence initial={false}>
                  {sentence.map(({ key, card }) => (
                    <motion.span
                      key={key}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      className="flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[12px] border-2 p-0.5"
                      style={{ borderColor: WORD_COLORS[card.wordType], background: softBg(WORD_COLORS[card.wordType]) }}
                    >
                      <span className="flex min-h-0 flex-1 items-center justify-center text-[26px]">
                        <CardPicture card={card} />
                      </span>
                      <span className="line-clamp-1 w-full text-center text-[10px] font-bold leading-tight text-ink">{card.title}</span>
                    </motion.span>
                  ))}
                </AnimatePresence>
              )}
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSentence((prev) => prev.slice(0, -1))}
                disabled={sentence.length === 0}
                aria-label={t("talk.backspace")}
                className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-muted text-ink-2 disabled:opacity-40"
              >
                <Delete className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setSentence([]);
                }}
                disabled={sentence.length === 0}
                aria-label={t("talk.clear")}
                className="hidden h-12 w-12 items-center justify-center rounded-[14px] bg-muted text-ink-2 disabled:opacity-40 sm:flex"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={speakSentence}
                disabled={sentence.length === 0}
                className="flex h-[64px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-[16px] bg-primary-gradient px-3 text-white disabled:opacity-40"
              >
                <Volume2 className="h-6 w-6" />
                <span className="text-[11px] font-bold">{t("talk.speak")}</span>
              </button>
            </div>
          </div>
          {silent && !parentMode ? <p className="t-small mt-1 px-2 text-[var(--warning)]">{t("talk.noVoiceTitle")}</p> : null}
        </div>
      )}

      {/* Asosiy so'zlar — doim ko'rinadi */}
      {coreCards.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:overflow-visible lg:px-0">
          {coreCards.map((card) => (
            <div key={card.id} className="w-[92px] shrink-0 lg:w-auto">
              <AacTile
                card={card}
                size="sm"
                showLabel={settings.showLabels}
                active={activeId === card.id}
                hidden={hidden.has(card.id)}
                editing={parentMode}
                onPress={() => press(card)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bo'limlar */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6" role="tablist">
        {tabs.map((c) => {
          const on = c.id === current?.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSelected(c.id)}
              className={`t-small-bold flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2.5 text-[14.5px] ${
                on ? "border-tint bg-tint-soft text-tint" : "border-line bg-element text-ink hover:bg-muted"
              }`}
            >
              {c.emoji ? <span aria-hidden>{c.emoji}</span> : null}
              {c.title}
            </button>
          );
        })}
      </div>

      {/* Kartalar */}
      <div className={`grid gap-2.5 sm:gap-3 ${GRID[settings.size]}`}>
        {gridCards.map((card) => (
          <AacTile
            key={card.id}
            card={card}
            size={settings.size}
            showLabel={settings.showLabels}
            active={activeId === card.id}
            hidden={hidden.has(card.id)}
            editing={parentMode}
            onPress={() => press(card)}
          />
        ))}
        {parentMode && current && (
          <button
            type="button"
            onClick={() => setDialog("add")}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[18px] border-[3px] border-dashed border-line text-ink-3 hover:border-tint hover:text-tint"
          >
            <Plus className="h-8 w-8" />
            <span className="t-small-bold text-[13px]">{t("talk.addCard")}</span>
          </button>
        )}
      </div>

      <Card flat className="mt-2 bg-muted/60">
        <div className="flex items-center gap-2 text-tint">
          <Lightbulb className="h-4 w-4" />
          <span className="t-small-bold">{t("talk.tipTitle")}</span>
        </div>
        <p className="t-small text-ink-2">{t("talk.tip")}</p>
      </Card>

      <CardEditor
        card={editing}
        hidden={editingHidden}
        childKey={childKey}
        onToggleHidden={() => editing && toggleHiddenCard(childKey, editing.id)}
        onClose={() => setEditingId(null)}
      />
      {current && <AddCardDialog open={dialog === "add"} categoryId={current.id} childKey={childKey} onClose={() => setDialog(null)} />}
      <RecordWizard open={dialog === "wizard"} cards={[...coreCards, ...gridCards]} childKey={childKey} onClose={() => setDialog(null)} />
      <SettingsSheet open={dialog === "settings"} settings={settings} onClose={() => setDialog(null)} />
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick }: { icon: typeof Mic; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="t-small-bold flex items-center gap-2 rounded-full border border-line bg-element px-3.5 py-2 text-[13.5px] text-ink hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-tint" />
      {label}
    </button>
  );
}
