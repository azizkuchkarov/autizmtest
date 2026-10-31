"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BellRing, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useLocale, useProfile } from "@/components/app/providers";
import { useTodayPlan } from "@/components/app/today-plan";
import { dayKey } from "@/lib/app/play-activities";
import type { TranslationKey } from "@/lib/app-i18n";

/** Mashg'ulotdan necha daqiqa oldin eslatiladi. */
const LEAD_MINUTES = 15;
/** Eslatma vaqti o'tib ketgandan keyin ham shuncha daqiqa ichida sayt ochilsa — ko'rsatiladi. */
const WINDOW_MINUTES = 60;
const SHOWN_KEY = "autizm_reminders_shown_v1";

type Reminder = { id: "diary" | "practice"; at: number; title: TranslationKey; body: TranslationKey; href: string };

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function shownToday(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SHOWN_KEY) ?? "{}") as { day?: string; ids?: string[] };
    return raw.day === dayKey() ? (raw.ids ?? []) : [];
  } catch {
    return [];
  }
}

function markShown(id: string) {
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify({ day: dayKey(), ids: [...shownToday(), id] }));
  } catch {}
}

/**
 * Sayt ochiq turganda eslatmalar: ertalabki kundalik va mashg'ulotdan 15 daqiqa oldin.
 * Brauzer ruxsat bergan bo'lsa tizim bildirishnomasi ham chiqadi. Telefonda eslatmalar mobil ilova orqali keladi.
 */
export function Reminders() {
  const { t } = useLocale();
  const { child } = useProfile();
  const plan = useTodayPlan();
  const [active, setActive] = useState<Reminder | null>(null);
  const planRef = useRef(plan);
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);

  useEffect(() => {
    if (!child?.remindersOn) return;
    const list: Reminder[] = [];
    if (child.diaryTime) list.push({ id: "diary", at: minutesOf(child.diaryTime), title: "reminder.diaryTitle", body: "reminder.diaryBody", href: "/diary" });
    if (child.practiceTime)
      list.push({ id: "practice", at: minutesOf(child.practiceTime) - LEAD_MINUTES, title: "reminder.practiceTitle", body: "reminder.practiceBody", href: "/exercises" });

    const check = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const shown = shownToday();
      const doneIds = new Set(planRef.current.filter((p) => p.done).map((p) => (p.id === "play" ? "practice" : p.id)));
      const due = list.find((r) => minutes >= r.at && minutes < r.at + WINDOW_MINUTES && !shown.includes(r.id) && !doneIds.has(r.id));
      if (!due) return;
      markShown(due.id);
      setActive(due);
      const body = t(due.body).replace("{name}", child.name);
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
        try {
          new Notification(t(due.title), { body, icon: "/icon.svg", tag: `autizm-${due.id}` });
        } catch {}
      }
    };

    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [child, t]);

  return (
    <AnimatePresence>
      {active && child && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          role="status"
          className="fixed inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-50 mx-auto flex max-w-[520px] items-center gap-3 rounded-[20px] border border-line bg-element p-3.5 shadow-card md:top-20"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-tint-soft text-tint">
            <BellRing className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="t-small-bold text-[15px]">{t(active.title)}</span>
            <span className="t-small line-clamp-2 text-ink-2">{t(active.body).replace("{name}", child.name)}</span>
          </span>
          <Link href={active.href} onClick={() => setActive(null)} className="t-small-bold shrink-0 rounded-full bg-tint px-3.5 py-2 text-white">
            {t("reminder.open")}
          </Link>
          <button type="button" onClick={() => setActive(null)} aria-label={t("reminder.close")} className="shrink-0 rounded-full p-1.5 text-ink-3 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
