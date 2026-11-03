"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight, Ear, RefreshCw, HandHelping, Hourglass, Lightbulb, Lock, Play, RotateCcw, Volume1, Volume2, WifiOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { WeekDots } from "@/components/app/play";
import { useLocale, useProfile } from "@/components/app/providers";
import { accent as accentOf, Button, Card, EmptyState, FadeIn, ProgressBar, SectionHeader, Skeleton } from "@/components/app/ui";
import { fetchSoundSets, type SoundCard, type SoundSet } from "@/lib/app/api";
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
  useSoundLog,
} from "@/lib/app/sound-progress";
import { currentWeek, dayKey } from "@/lib/app/play-activities";
import type { TranslationKey } from "@/lib/app-i18n";

const A = accentOf("lessons");

/** Bir mashqdagi savollar soni: bola charchamasligi uchun qisqa. */
const ROUNDS_PER_SESSION = 8;

const LEVEL_TEXT: Record<SoundLevel, { title: TranslationKey; body: TranslationKey }> = {
  1: { title: "sounds.level1", body: "sounds.level1Body" },
  2: { title: "sounds.level2", body: "sounds.level2Body" },
  3: { title: "sounds.level3", body: "sounds.level3Body" },
  4: { title: "sounds.level4", body: "sounds.level4Body" },
};

/** Bolaning natijalari shu kalit bo'yicha saqlanadi. */
export function useChildKey() {
  return useProfile().child?.id ?? "default";
}

/** Sozlamalar bo'yicha ko'rinadigan ovozlar (keskin tovushlar standart holatda yashirin). */
export function useVisibleCards(set: SoundSet | null) {
  const { showLoud } = useSoundSettings();
  return set?.cards.filter((c) => showLoud || !c.loud) ?? [];
}

/* --------------------------------- Rasm --------------------------------- */

/** Ovoz rasmi: rasm bo'lsa rasm, bo'lmasa emoji, u ham bo'lmasa bosh harf. */
export function SoundVisual({ item, size }: { item: Pick<SoundCard, "title" | "imageUrl" | "emoji">; size: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: A.soft,
      }}
    >
      {item.imageUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin kiritgan tashqi rasm
        <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span aria-hidden style={{ fontSize: size * 0.55, lineHeight: 1, color: A.fg }} className="font-bold">
          {item.emoji || item.title.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/* ------------------------------ To'plamlar ------------------------------ */

/** Darslar → Ovozli: to'plamlar ro'yxati. */
/** Mashqlar bo'limidagi kunlik ovozli mashq kartasi: "Bugungi 5 daqiqa" bilan bir xil ko'rinish. */
export function TodaySoundsCard() {
  const { t, locale } = useLocale();
  const a = accentOf("lessons");
  const { child } = useProfile();
  const log = useSoundLog(child?.id ?? "default");
  const [sets, setSets] = useState<SoundSet[] | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchSoundSets(locale).then(
      (res) => setSets(res.sets),
      () => setSets([]),
    );
  }, [locale]);

  if (!sets) return <Skeleton height={236} />;
  if (sets.length === 0) return null;

  const today = dayKey();
  const set = sets[(new Date().getDate() + offset) % sets.length];
  const done = log.some((e) => e.day === today);
  const week = currentWeek().map((day) => ({ day, done: log.some((e) => e.day === day) }));
  const href = `/lessons/sounds/${set.id}`;

  return (
    <Card className="!gap-4">
      <span className="t-caption" style={{ color: a.fg }}>
        {t("exercises.soundsTitle")}
      </span>
      <Link href={href} className="group flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-[32px]" style={{ background: a.soft }}>
          {set.emoji ?? "🎧"}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="t-heading text-[17px] group-hover:text-tint">{set.title}</span>
          {set.description ? <span className="t-small line-clamp-2 text-ink-2">{set.description}</span> : null}
          <span className="t-small text-ink-3">{t("exercises.soundsCards").replace("{n}", String(set.cards.length))}</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <WeekDots week={week} />
        {done ? (
          <span className="t-small-bold inline-flex items-center gap-1.5 text-[var(--success)]">
            <Check className="h-4 w-4" strokeWidth={3} /> {t("play.doneToday")}
          </span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button title={t("play.start")} icon={Play} size="md" href={href} className="flex-1" />
        {sets.length > 1 && !done ? (
          <Button title={t("play.another")} icon={RefreshCw} size="md" variant="secondary" onClick={() => setOffset((n) => n + 1)} className="flex-1" />
        ) : (
          <Button title={t("play.all")} size="md" variant="secondary" href="/lessons/sounds" className="flex-1" />
        )}
      </div>
    </Card>
  );
}

export function SoundSetList() {
  const { t, locale } = useLocale();
  const [sets, setSets] = useState<SoundSet[] | null>(null);
  const [error, setError] = useState(false);
  const { showLoud } = useSoundSettings();

  const load = useCallback(() => {
    setError(false);
    fetchSoundSets(locale).then(
      (res) => setSets(res.sets),
      () => setError(true),
    );
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    fetchSoundSets(locale).then(
      (res) => !cancelled && setSets(res.sets),
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (error && !sets)
    return <EmptyState icon={WifiOff} title={t("common.offlineTitle")} body={t("common.offline")} actionTitle={t("common.retry")} onAction={load} />;

  if (!sets)
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={96} />
        ))}
      </div>
    );

  if (sets.length === 0) return <EmptyState icon={Ear} title={t("sounds.emptyTitle")} body={t("sounds.empty")} color={A.fg} background={A.soft} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sets.map((s, i) => (
        <FadeIn key={s.id} delay={60 * i}>
          <Link
            href={`/lessons/sounds/${s.id}`}
            className="group flex items-center gap-4 rounded-[22px] border border-line bg-element p-3 shadow-card transition-transform active:scale-[0.98] hover:border-tint/40"
          >
            <SoundVisual item={s} size={72} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="t-heading line-clamp-2 text-[16px]">{s.title}</span>
              {s.description ? <span className="t-small line-clamp-2 text-ink-2">{s.description}</span> : null}
              <span className="t-small text-ink-3">
                {s.cards.filter((c) => showLoud || !c.loud).length} {t("sounds.count")}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>
      ))}
    </div>
  );
}

/* ------------------------------- Darajalar ------------------------------- */

/** To'plam ichida: 4 ta murakkablik darajasi, sozlamalar va maslahat. */
export function LevelPicker({ set, onPick }: { set: SoundSet; onPick: (level: SoundLevel) => void }) {
  const { t } = useLocale();
  const cards = useVisibleCards(set);
  const progress = useSoundProgress(useChildKey());
  const ids = cards.map((c) => c.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <SoundVisual item={set} size={80} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="t-title !text-[24px] !leading-[30px]">{set.title}</h1>
          <span className="t-small text-ink-2">{set.description ?? `${cards.length} ${t("sounds.count")}`}</span>
        </div>
      </div>

      <SectionHeader title={t("sounds.chooseLevel")} />
      <div className="-mt-2 grid gap-3 sm:grid-cols-2">
        {SOUND_LEVELS.map((level, i) => {
          const need = LEVEL_OPTIONS[level];
          const locked = cards.length < need;
          const mastery = levelMastery(progress, ids, level);
          return (
            <FadeIn key={level} delay={60 * i} className="h-full">
              <Card onClick={locked ? undefined : () => onPick(level)} className={`h-full w-full ${locked ? "opacity-55" : ""}`}>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[18px] font-extrabold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${A.gradient.join(", ")})`,
                    }}
                  >
                    {locked ? <Lock className="h-5 w-5" /> : level}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="t-caption" style={{ color: A.fg }}>
                      {t("sounds.levelN").replace("{n}", String(level))}
                    </span>
                    <span className="t-heading text-[16px]">{t(LEVEL_TEXT[level].title)}</span>
                  </div>
                </div>
                <p className="t-small text-ink-2">{locked ? t("sounds.needMore").replace("{n}", String(need)) : t(LEVEL_TEXT[level].body)}</p>
                {!locked && (
                  <div className="flex items-center gap-3">
                    <ProgressBar value={mastery} color={A.fg} height={6} />
                    <span className="t-small shrink-0 text-ink-3">{t("sounds.progress").replace("{n}", String(mastery))}</span>
                  </div>
                )}
              </Card>
            </FadeIn>
          );
        })}
      </div>

      <SoundSettingsCard />

      <Card flat className="bg-muted/60">
        <div className="flex items-center gap-2" style={{ color: A.fg }}>
          <Lightbulb className="h-4 w-4" />
          <span className="t-small-bold">{t("sounds.tipTitle")}</span>
        </div>
        <p className="t-small text-ink-2">{t("sounds.tip")}</p>
      </Card>
    </div>
  );
}

function SoundSettingsCard() {
  const { t } = useLocale();
  const { volume, showLoud } = useSoundSettings();
  return (
    <Card flat>
      <label className="flex items-center gap-3">
        <Volume1 className="h-5 w-5 shrink-0 text-ink-3" />
        <span className="t-small-bold w-32 shrink-0">{t("sounds.volume")}</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => updateSoundSettings({ volume: Number(e.target.value) })}
          className="w-full"
          style={{ accentColor: "var(--lessons)" }}
        />
        <Volume2 className="h-5 w-5 shrink-0 text-ink-3" />
      </label>
      <label className="mt-1 flex items-start gap-3">
        <input
          type="checkbox"
          checked={showLoud}
          onChange={(e) => updateSoundSettings({ showLoud: e.target.checked })}
          className="mt-1 h-4 w-4"
          style={{ accentColor: "var(--lessons)" }}
        />
        <span className="flex flex-col">
          <span className="t-small-bold">{t("sounds.showLoud")}</span>
          <span className="t-small text-ink-3">{t("sounds.loudHint")}</span>
        </span>
      </label>
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

/** Bitta audio element: ota-ona bosgandagina chiqadi, balandlik sozlamadan olinadi. */
function useSoundPlayer(volume: number) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  useEffect(
    () => () => {
      audio.current?.pause();
    },
    [],
  );

  const play = useCallback(
    (url: string) => {
      if (!audio.current) {
        audio.current = new Audio();
        audio.current.onended = () => setPlaying(false);
        audio.current.onpause = () => setPlaying(false);
        audio.current.onplay = () => setPlaying(true);
      }
      const el = audio.current;
      el.pause();
      el.src = url;
      el.volume = volume;
      el.currentTime = 0;
      el.play().catch(() => setPlaying(false));
    },
    [volume],
  );

  const stop = useCallback(() => audio.current?.pause(), []);

  return { play, stop, playing };
}

function PlayButton({ playing, onClick, label }: { playing: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="relative flex h-28 w-28 items-center justify-center rounded-full text-white active:scale-95">
      {playing && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: A.fg }}
          initial={{ opacity: 0.35, scale: 1 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <span
        className="relative flex h-28 w-28 items-center justify-center rounded-full shadow-[0_10px_24px_rgb(249_115_22/0.35)]"
        style={{
          background: `linear-gradient(135deg, ${A.gradient.join(", ")})`,
        }}
      >
        {playing ? <Volume2 className="h-12 w-12" /> : <Play className="ml-1.5 h-12 w-12" fill="currentColor" strokeWidth={0} />}
      </span>
    </button>
  );
}

/** Variant tugmasi (2 va 3-daraja). */
function OptionTile({ card, state, onClick }: { card: SoundCard; state: "idle" | "correct" | "wrong" | "hint"; onClick: () => void }) {
  const border = state === "correct" ? "border-[var(--exercises)]" : state === "hint" ? "border-[var(--lessons)]" : "border-line";
  return (
    <motion.button
      onClick={onClick}
      disabled={state === "wrong"}
      animate={state === "hint" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={state === "hint" ? { duration: 1, repeat: Infinity } : undefined}
      className={`flex flex-col items-center gap-2 rounded-[22px] border-[2.5px] bg-element p-3 shadow-card transition-opacity ${border} ${
        state === "wrong" ? "opacity-30" : "hover:border-tint/40"
      }`}
    >
      <SoundVisual item={card} size={112} />
      <span className="t-small-bold text-[15px]">{card.title}</span>
    </motion.button>
  );
}

type Tally = Record<SoundResult, number>;

/** 4 darajali mashq: 1 — tanishish, 2/3 — 2 yoki 4 ta rasmdan tanlash, 4 — faqat ovoz. */
export function SoundGame({ cards, level, onExit }: { cards: SoundCard[]; level: SoundLevel; onExit: () => void }) {
  const { t } = useLocale();
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
      setSolved(true);
      record(wrong.length === 0 ? "ok" : "help");
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
      <FadeIn className="flex flex-col items-center gap-4 py-6 text-center">
        <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-[64px] leading-none" aria-hidden>
          🌟
        </motion.span>
        <h2 className="t-title !text-[26px]">{t("sounds.doneTitle")}</h2>
        <p className="t-body max-w-[340px] text-ink-2">{t("sounds.doneBody")}</p>
        {level > 1 && (
          <div className="grid w-full max-w-[380px] grid-cols-3 gap-2">
            {(
              [
                ["ok", "sounds.markIndependent", "var(--exercises)"],
                ["help", "sounds.markPrompted", "var(--lessons)"],
                ["miss", "sounds.markNotYet", "var(--text-tertiary)"],
              ] as const
            ).map(([key, label, color]) => (
              <Card key={key} flat className="items-center !gap-0 !p-3">
                <span className="text-[26px] font-extrabold" style={{ color }}>
                  {tally[key]}
                </span>
                <span className="t-small text-ink-2">{t(label)}</span>
              </Card>
            ))}
          </div>
        )}
        <div className="flex w-full max-w-[380px] flex-col gap-2">
          <Button title={t("sounds.again")} icon={RotateCcw} onClick={restart} />
          <Button title={t("sounds.backToLevels")} variant="secondary" onClick={onExit} />
        </div>
      </FadeIn>
    );
  }

  const progressHeader = (
    <div className="flex items-center gap-3">
      <span className="t-small-bold shrink-0" style={{ color: A.fg }}>
        {t("sounds.levelN").replace("{n}", String(level))} · {t(LEVEL_TEXT[level].title)}
      </span>
      <ProgressBar value={(index / rounds.length) * 100} color={A.fg} height={6} />
      <span className="t-small shrink-0 text-ink-3">
        {index + 1} / {rounds.length}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {progressHeader}
      <motion.div
        key={`${index}-${rounds.length}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-6"
      >
        {level === 1 && (
          <>
            <SoundVisual item={round.card} size={200} />
            <h2 className="t-title !text-[28px]">{round.card.title}</h2>
            <PlayButton
              playing={playing}
              label={t("sounds.play")}
              onClick={() => {
                play(round.card.audioUrl);
                if (!solved) {
                  setSolved(true);
                  recordSoundResult(childKey, round.card.id, 1, "ok");
                }
              }}
            />
            <div className="w-full max-w-[380px]">
              <Button title={t("sounds.next")} onClick={next} disabled={!solved} />
            </div>
          </>
        )}

        {(level === 2 || level === 3) && (
          <>
            <h2 className="t-title !text-[24px]">{t("sounds.whoIsIt")}</h2>
            <PlayButton playing={playing} label={t("sounds.play")} onClick={() => play(round.card.audioUrl)} />
            <div className="grid w-full max-w-[520px] grid-cols-2 gap-3">
              {round.options.map((card) => {
                const isAnswer = card.id === round.card.id;
                const state = wrong.includes(card.id) ? "wrong" : isAnswer && solved ? "correct" : isAnswer && wrong.length > 0 ? "hint" : "idle";
                return <OptionTile key={card.id} card={card} state={state} onClick={() => choose(card)} />;
              })}
            </div>
            <div className="min-h-[24px] text-center">
              {solved ? (
                <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="t-heading" style={{ color: "var(--exercises)" }}>
                  {t("sounds.great")} 🎉
                </motion.p>
              ) : wrong.length > 0 ? (
                <p className="t-small text-ink-2">{t("sounds.hint").replace("{name}", round.card.title)}</p>
              ) : null}
            </div>
            <div className="w-full max-w-[380px]">
              <Button title={t("sounds.next")} onClick={next} disabled={!solved} />
            </div>
          </>
        )}

        {level === 4 && (
          <>
            <h2 className="t-title !text-[24px]">{t("sounds.whoIsIt")}</h2>
            <PlayButton playing={playing} label={t("sounds.play")} onClick={() => play(round.card.audioUrl)} />
            {revealed ? (
              <FadeIn className="flex flex-col items-center gap-2">
                <SoundVisual item={round.card} size={150} />
                <span className="t-heading">{t("sounds.thisIs").replace("{name}", round.card.title)}</span>
              </FadeIn>
            ) : (
              <span
                className="flex h-[150px] w-[150px] items-center justify-center rounded-[40px] border-2 border-dashed text-[64px] font-extrabold"
                style={{ borderColor: A.fg, color: A.fg, background: A.soft }}
                aria-hidden
              >
                ?
              </span>
            )}
            <div className="flex w-full max-w-[420px] flex-col gap-2">
              {!revealed ? (
                <Button title={t("sounds.reveal")} variant="secondary" onClick={() => setRevealed(true)} />
              ) : (
                <p className="t-small text-center text-ink-2">{t("sounds.markHint")}</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <MarkButton icon={Check} label={t("sounds.markIndependent")} color="var(--exercises)" onClick={() => mark("ok")} />
                <MarkButton icon={HandHelping} label={t("sounds.markPrompted")} color="var(--lessons)" onClick={() => mark("help")} />
                <MarkButton icon={Hourglass} label={t("sounds.markNotYet")} color="var(--text-tertiary)" onClick={() => mark("miss")} />
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function MarkButton({ icon: Icon, label, color, onClick }: { icon: typeof Check; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-[18px] border border-line bg-element px-2 py-3 shadow-card active:scale-95 hover:bg-muted"
    >
      <Icon className="h-6 w-6" style={{ color }} />
      <span className="t-small-bold text-center text-[13px] leading-tight">{label}</span>
    </button>
  );
}
