"use client";

import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, HelpCircle, Lightbulb, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { useLocale } from "@/components/app/providers";
import { Button, ConfirmDialog, IconButton, Spinner } from "@/components/app/ui";
import { FREQ_SCALE, UNKNOWN_LABEL, YESNO_SCALE, type FreqAnswer } from "@/lib/screening-v3/items";

/* Ota-ona so'rovnomasi: skrining v3 va oylik ko'nikmalar testi uchun umumiy oqim. */

export type QItem = {
  id: string;
  section: string;
  text: string;
  example?: string;
  kind?: "freq" | "yesno";
  followUp?: string[];
};
export type QSection = { id: string; emoji: string; title: string; intro?: string };
export type QAnswers = Record<string, FreqAnswer>;
export type QFollowUps = Record<string, boolean[]>;

type Draft = { answers: QAnswers; followUps: QFollowUps; cursor: string; savedAt: number };
type Step =
  | { key: string; type: "welcome" }
  | { key: string; type: "section"; section: QSection; index: number }
  | { key: string; type: "item"; item: QItem; section: QSection; number: number }
  | { key: string; type: "follow"; item: QItem; section: QSection }
  | { key: string; type: "review" };

const AUTO_ADVANCE_MS = 260;
/** Qoralama shuncha kundan eski bo'lsa — taklif qilinmaydi */
const DRAFT_DAYS = 14;

function readDraft(key: string): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(key) ?? "null") as Draft | null;
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
  exitHref,
}: {
  items: QItem[];
  sections: QSection[];
  welcome: { title: string; body: string; tips: string[]; badge?: string };
  draftKey: string;
  needsFollowUp?: (item: QItem, answer: FreqAnswer | undefined) => boolean;
  onSubmit: (answers: QAnswers, followUps: QFollowUps) => Promise<void>;
  exitHref: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [answers, setAnswers] = useState<QAnswers>({});
  const [followUps, setFollowUps] = useState<QFollowUps>({});
  const [cursor, setCursor] = useState("welcome");
  const [resume, setResume] = useState<Draft | null>(null);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** Javobdan keyin biroz kutib o'tiladigan qadam: { from — javob berilgan qadam, to — keyingisi } */
  const [advance, setAdvance] = useState<{ from: string; to: string } | null>(null);
  const finishing = useRef(false);

  // Oldin to'xtatilgan test bo'lsa — davom ettirishni taklif qilamiz
  useEffect(() => {
    setResume(readDraft(draftKey));
  }, [draftKey]);

  // Har bir javobdan keyin qoralama saqlanadi
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers, followUps, cursor, savedAt: Date.now() } satisfies Draft));
    } catch {}
  }, [answers, followUps, cursor, draftKey]);

  /* ------------------------------ Qadamlar ------------------------------ */

  const steps: Step[] = [{ key: "welcome", type: "welcome" }];
  let number = 0;
  sections.forEach((section, index) => {
    const sectionItems = items.filter((i) => i.section === section.id);
    if (sectionItems.length === 0) return;
    steps.push({ key: `section:${section.id}`, type: "section", section, index: index + 1 });
    for (const item of sectionItems) {
      number++;
      steps.push({ key: `item:${item.id}`, type: "item", item, section, number });
      if (needsFollowUp?.(item, answers[item.id])) steps.push({ key: `follow:${item.id}`, type: "follow", item, section });
    }
  });
  steps.push({ key: "review", type: "review" });

  const at = Math.max(0, steps.findIndex((s) => s.key === cursor));
  const step = steps[at];
  const total = items.length;
  const answered = items.filter((i) => answers[i.id] !== undefined).length;
  const unknown = items.filter((i) => answers[i.id] === -1).length;
  const visibleSections = sections.filter((s) => items.some((i) => i.section === s.id));

  const go = useCallback((key: string) => {
    setShowHelp(false);
    setCursor(key);
  }, []);
  const next = () => {
    if (returnToReview && step.type !== "item") {
      setReturnToReview(false);
      return go("review");
    }
    go(steps[Math.min(steps.length - 1, at + 1)].key);
  };
  const back = () => go(steps[Math.max(0, at - 1)].key);

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
    setAnswers((prev) => ({ ...prev, [item.id]: value }));
    // Javob o'zgarsa, eski aniqlashtirish javoblari endi to'g'ri emas
    setFollowUps((prev) => {
      if (!(item.id in prev)) return prev;
      const { [item.id]: _drop, ...rest } = prev;
      void _drop;
      return rest;
    });
    // Keyingi qadam shu javob bo'yicha: aniqlashtirish kerak bo'lsa — u, ko'rib chiqishdan kelingan bo'lsa — qaytish
    const from = `item:${item.id}`;
    const needs = !!needsFollowUp?.(item, value);
    let to: string;
    if (needs) to = `follow:${item.id}`;
    else if (returnToReview) {
      to = "review";
      setReturnToReview(false);
    } else {
      const i = steps.findIndex((x) => x.key === from);
      const after = steps[i + 1]?.type === "follow" ? steps[i + 2] : steps[i + 1];
      to = after?.key ?? from;
    }
    setAdvance({ from, to });
  };

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setSubmitting(true);
    try {
      await onSubmit(answers, followUps);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
    } catch {
      finishing.current = false;
      setSubmitting(false);
      window.alert(t("common.error"));
    }
  };

  const optionsFor = (item: QItem) => (item.kind === "yesno" ? YESNO_SCALE : FREQ_SCALE);
  const labelOf = (item: QItem, a: FreqAnswer | undefined) =>
    a === undefined ? t("v3.noAnswer") : a === -1 ? UNKNOWN_LABEL[locale] : (optionsFor(item).find((o) => o.value === a)?.label[locale] ?? "");

  if (submitting)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-app">
        <Spinner className="h-9 w-9" />
        <span className="t-heading">{t("run.calculating")}</span>
      </div>
    );

  const canNext =
    step.type === "welcome" ||
    step.type === "section" ||
    (step.type === "item" && answers[step.item.id] !== undefined) ||
    (step.type === "follow" && (followUps[step.item.id]?.filter((x) => x !== undefined).length ?? 0) === (step.item.followUp?.length ?? 0));

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <header className="sticky top-0 z-10 bg-app/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-3 px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <IconButton icon={X} label={t("run.leave")} onClick={() => (answered > 0 ? setLeaveOpen(true) : router.push(exitHref))} />
          <span className="t-small-bold flex-1 text-center tabular-nums text-ink-2">
            {answered}/{total}
          </span>
          <span className="w-11" />
        </div>
        <div className="mx-auto flex w-full max-w-[680px] gap-1.5 px-5 pb-2">
          {visibleSections.map((s) => {
            const list = items.filter((i) => i.section === s.id);
            const done = list.filter((i) => answers[i.id] !== undefined).length;
            return (
              <div key={s.id} className="h-1.5 overflow-hidden rounded-full bg-muted" style={{ flex: list.length }}>
                <div className="h-full rounded-full bg-tint transition-[width] duration-300" style={{ width: `${(done / list.length) * 100}%` }} />
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-8 pt-4">
        {resume ? (
          <div className="flex flex-col items-center gap-4 pt-10 text-center">
            <span className="text-[56px]" aria-hidden>
              📝
            </span>
            <h1 className="t-title">{t("v3.resumeTitle")}</h1>
            <p className="t-body text-ink-2">{t("v3.resumeBody").replace("{n}", String(Object.keys(resume.answers).length))}</p>
            <div className="mt-2 flex w-full max-w-[360px] flex-col gap-2">
              <Button
                title={t("v3.resume")}
                onClick={() => {
                  setAnswers(resume.answers);
                  setFollowUps(resume.followUps ?? {});
                  setCursor(resume.cursor);
                  setResume(null);
                }}
              />
              <Button
                title={t("v3.restart")}
                variant="secondary"
                onClick={() => {
                  try {
                    localStorage.removeItem(draftKey);
                  } catch {}
                  setResume(null);
                }}
              />
            </div>
          </div>
        ) : (
          // Faqat kirish animatsiyasi: chiqish animatsiyasi to'xtab qolsa keyingi savol ko'rinmay qolmasligi uchun
          <motion.div
              key={step.key}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {step.type === "welcome" && (
                <>
                  {welcome.badge ? <span className="t-small-bold w-fit rounded-full bg-tint-soft px-3 py-1.5 text-tint">{welcome.badge}</span> : null}
                  <h1 className="t-title">{welcome.title}</h1>
                  <p className="t-body text-[16.5px] text-ink-2">{welcome.body}</p>
                  <ul className="flex flex-col gap-2.5">
                    {welcome.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-3 rounded-[18px] bg-element p-3.5 shadow-card">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-tint" />
                        <span className="t-body text-[15.5px]">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {step.type === "section" && (
                <div className="flex flex-col items-center gap-3 pt-6 text-center">
                  <span className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-element text-[52px] shadow-card" aria-hidden>
                    {step.section.emoji}
                  </span>
                  <span className="t-caption text-tint">
                    {t("v3.section")} {step.index}
                  </span>
                  <h1 className="t-title">{step.section.title}</h1>
                  {step.section.intro ? <p className="t-body max-w-[520px] text-ink-2">{step.section.intro}</p> : null}
                  <span className="t-small-bold mt-1 rounded-full bg-tint-soft px-3.5 py-1.5 text-tint">
                    {t("run.introHint").replace("{count}", String(items.filter((i) => i.section === step.section.id).length))}
                  </span>
                </div>
              )}

              {step.type === "item" && (
                <>
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{step.section.emoji}</span>
                    <span className="t-caption flex-1 truncate text-tint">{step.section.title}</span>
                    <span className="t-small-bold text-ink-3">
                      {step.number}/{total}
                    </span>
                  </div>
                  <h1 className="t-subtitle !text-[21px] !leading-[29px] md:!text-[23px] md:!leading-[31px]">{step.item.text}</h1>
                  {step.item.example ? (
                    <button onClick={() => setShowHelp((v) => !v)} className="rounded-[18px] bg-muted p-3.5 text-left" aria-expanded={showHelp}>
                      <span className="flex items-center gap-2 text-tint">
                        <HelpCircle className="h-4 w-4" />
                        <span className="t-small-bold flex-1">{t("run.help")}</span>
                      </span>
                      {showHelp ? <span className="t-body mt-2 block">{step.item.example}</span> : null}
                    </button>
                  ) : null}
                  <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={step.item.text}>
                    {optionsFor(step.item).map((opt) => (
                      <AnswerButton key={opt.value} selected={answers[step.item.id] === opt.value} onClick={() => choose(step.item, opt.value)}>
                        {opt.label[locale]}
                      </AnswerButton>
                    ))}
                    <button
                      role="radio"
                      aria-checked={answers[step.item.id] === -1}
                      onClick={() => choose(step.item, -1)}
                      className={`t-small-bold rounded-[16px] border-[1.5px] border-dashed px-4 py-3 text-[14.5px] ${
                        answers[step.item.id] === -1 ? "border-tint bg-tint-soft text-tint" : "border-line text-ink-2 hover:bg-muted"
                      }`}
                    >
                      {UNKNOWN_LABEL[locale]}
                    </button>
                  </div>
                </>
              )}

              {step.type === "follow" && (
                <>
                  <span className="t-caption text-tint">{t("v3.followTitle")}</span>
                  <h1 className="t-heading text-[18px] text-ink-2">{step.item.text}</h1>
                  <p className="t-body text-ink-2">{t("v3.followBody")}</p>
                  {step.item.followUp?.map((prompt, i) => {
                    const value = followUps[step.item.id]?.[i];
                    return (
                      <div key={i} className="flex flex-col gap-2.5 rounded-[20px] bg-element p-4 shadow-card">
                        <span className="t-body text-[16px]">{prompt}</span>
                        <div className="grid grid-cols-2 gap-2">
                          {([true, false] as const).map((v) => (
                            <AnswerButton
                              key={String(v)}
                              compact
                              selected={value === v}
                              onClick={() =>
                                setFollowUps((prev) => {
                                  const list = [...(prev[step.item.id] ?? [])];
                                  list[i] = v;
                                  return { ...prev, [step.item.id]: list };
                                })
                              }
                            >
                              {v ? t("v3.yes") : t("v3.no")}
                            </AnswerButton>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {step.type === "review" && (
                <>
                  <h1 className="t-title">{t("v3.reviewTitle")}</h1>
                  <p className="t-body text-ink-2">{t("v3.reviewBody")}</p>
                  {unknown / Math.max(1, total) > 0.3 ? (
                    <p className="t-small rounded-[14px] bg-[var(--warning-soft)] p-3 text-ink">{t("v3.unknownWarn").replace("{n}", String(unknown))}</p>
                  ) : null}
                  {visibleSections.map((s) => (
                    <div key={s.id} className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-element">
                      <span className="t-small-bold flex items-center gap-2 bg-muted/60 px-4 py-2.5">
                        <span aria-hidden>{s.emoji}</span>
                        {s.title}
                      </span>
                      {items
                        .filter((i) => i.section === s.id)
                        .map((i) => (
                          <button
                            key={i.id}
                            onClick={() => {
                              setReturnToReview(true);
                              go(`item:${i.id}`);
                            }}
                            className="flex items-start gap-3 border-t border-line px-4 py-3 text-left hover:bg-muted/50"
                          >
                            <span className="t-small flex-1 text-ink">{i.text}</span>
                            <span className={`t-small-bold shrink-0 text-right ${answers[i.id] === undefined ? "text-[var(--danger)]" : answers[i.id] === -1 ? "text-ink-3" : "text-tint"}`}>
                              {labelOf(i, answers[i.id])}
                              {followUps[i.id]?.length ? <span className="block text-[11px] font-semibold text-ink-3">{t("v3.followAnswered")}</span> : null}
                            </span>
                            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                          </button>
                        ))}
                    </div>
                  ))}
                </>
              )}
            </motion.div>
        )}
      </main>

      {!resume && (
        <footer className="sticky bottom-0 border-t border-line bg-app/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[680px] items-center gap-4 px-5 pb-[max(8px,env(safe-area-inset-bottom))] pt-4">
            {at > 0 ? <IconButton icon={ChevronLeft} label={t("common.back")} onClick={back} /> : null}
            <div className="flex-1">
              {step.type === "review" ? (
                <Button title={t("v3.submit")} icon={Sparkles} onClick={finish} disabled={answered < total} />
              ) : (
                <Button title={step.type === "welcome" || step.type === "section" ? t("common.start") : t("common.next")} onClick={next} disabled={!canNext} />
              )}
            </div>
          </div>
        </footer>
      )}

      <ConfirmDialog
        open={leaveOpen}
        title={t("run.leaveTitle")}
        body={t("run.leaveBody")}
        confirmLabel={t("run.leave")}
        cancelLabel={t("run.stay")}
        destructive
        onConfirm={() => {
          setLeaveOpen(false);
          router.push(exitHref);
        }}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}

function AnswerButton({ selected, onClick, children, compact }: { selected: boolean; onClick: () => void; children: ReactNode; compact?: boolean }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[18px] border-[1.5px] px-4 text-left transition-transform active:scale-[0.98] ${compact ? "justify-center py-3" : "py-[16px]"}`}
      style={{ background: selected ? "var(--tint-soft)" : "var(--element)", borderColor: selected ? "var(--tint)" : "var(--border)" }}
    >
      <span className={`t-default ${compact ? "text-[15.5px] font-semibold" : "flex-1 text-[16.5px]"}`}>{children}</span>
      {!compact && (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-white"
          style={{ borderColor: selected ? "var(--tint)" : "var(--border)", background: selected ? "var(--tint)" : "transparent" }}
        >
          {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : null}
        </span>
      )}
    </button>
  );
}
