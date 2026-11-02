/*
 * Progress bo'limi uchun hisob-kitoblar: skrining dinamikasi, ovozli mashqlar, "Bugungi 5 daqiqa" va rasmli muloqot.
 * Hammasi sof funksiyalar — ma'lumot qurilmadagi store'lardan keladi.
 */
import type { AacDayLog } from "@/lib/app/aac-store";
import type { DiaryEntry } from "@/lib/app/api";
import { sleepHours } from "@/lib/app/diary";
import { THRESHOLDS, type SkillsResult } from "@/lib/screening-v3/score";
import { SKILL_SECTIONS } from "@/lib/screening-v3/skills";
import { assessmentTier, nextScreeningDate, type StoredAssessment } from "@/lib/app/history";
import { dayKey, lastDays, PLAY_ACTIVITIES, PLAY_SKILLS, type ChildPlay, type PlayRating, type PlaySkill } from "@/lib/app/play-activities";
import { riskTier, type RiskTier } from "@/lib/app/screening";
import { levelMastery, SOUND_LEVELS, type SoundLevel, type SoundLogEntry, type SoundResult } from "@/lib/app/sound-progress";

/** Ikki test orasidagi shu chegaradan kichik farq "o'zgarmadi" deb hisoblanadi. */
export const SAME_THRESHOLD = 3;

export type Trend = "better" | "same" | "worse";

/** Skrining ballida pasayish — yaxshi (belgilar kamaygan). */
export function scoreTrend(delta: number): Trend {
  if (delta <= -SAME_THRESHOLD) return "better";
  if (delta >= SAME_THRESHOLD) return "worse";
  return "same";
}

/** Faollik ko'rsatkichlarida o'sish — yaxshi. */
export function activityTrend(current: number, previous: number): Trend {
  if (current === previous || (previous === 0 && current === 0)) return "same";
  return current > previous ? "better" : "worse";
}

/* --------------------------------- Skrining --------------------------------- */

export type ScreeningPoint = {
  id: string;
  date: Date;
  score: number;
  tier: RiskTier;
  blocks: Record<string, number>;
  /** 3 — yangi test (bo'limlar), 2 — eski test (A/B/C sohalari) */
  version: 2 | 3;
  /** Test paytidagi aniq yosh (eski testlarda yo'q) */
  ageMonths: number | null;
};

/** Bo'lim holati: yangi testda bo'lim chegaralari, eski testda umumiy chegaralar. */
function domainTier(score: number, version: 2 | 3): RiskTier {
  if (version === 2) return riskTier(score);
  if (score >= THRESHOLDS.high) return "high";
  return score >= THRESHOLDS.moderate ? "moderate" : "low";
}

/** Ikki test orasidagi o'zgarish: daraja o'zgargan bo'lsa daraja bo'yicha, aks holda ball bo'yicha. */
export function pointTrend(prev: { score: number; tier: RiskTier }, cur: { score: number; tier: RiskTier }): Trend {
  const rank = { low: 0, moderate: 1, high: 2 };
  if (rank[cur.tier] !== rank[prev.tier]) return rank[cur.tier] < rank[prev.tier] ? 'better' : 'worse';
  return scoreTrend(cur.score - prev.score);
}

export function screeningProgress(assessments: StoredAssessment[], now = new Date()) {
  const points: ScreeningPoint[] = [...assessments]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((a) => ({
      id: a.id,
      date: new Date(a.createdAt),
      score: Math.round(a.result.totalScore),
      tier: assessmentTier(a),
      blocks: Object.fromEntries(a.result.blocks.map((b) => [b.blockId, Math.round(b.score)])),
      version: (a.result as { version?: number }).version === 3 ? (3 as const) : (2 as const),
      ageMonths: (a.result as { ageMonths?: number }).ageMonths ?? null,
    }));

  const first = points[0] ?? null;
  const latest = points.at(-1) ?? null;
  const previous = points.length > 1 ? points.at(-2)! : null;

  // Bo'limlar oldingi test bilan solishtiriladi — faqat bir xil versiyadagi testlar orasida (eski va yangi testning bo'limlari har xil)
  const base = latest ? ([...points].reverse().find((p) => p.id !== latest.id && p.version === latest.version) ?? latest) : null;
  const compared = !!latest && !!base && base.id !== latest.id;
  const domains = latest
    ? Object.keys(latest.blocks)
        .filter((id) => latest.version === 2 || id !== "history")
        .map((id) => {
          const from = base!.blocks[id] ?? latest.blocks[id];
          const to = latest.blocks[id];
          return { id, from, to, delta: to - from, trend: scoreTrend(to - from), tier: domainTier(to, latest.version), fromTier: domainTier(from, latest.version) };
        })
        // Eng ko'p e'tibor talab qiladigani tepada
        .sort((a, b) => b.to - a.to)
    : [];

  // Keyingi test: natija sahifasidagi qoida bilan bir xil (past daraja — 6 oy, o'rta va yuqori — 3 oy)
  const nextTest = latest ? new Date(nextScreeningDate(latest.date.toISOString(), latest.tier)) : null;
  const daysLeft = nextTest ? Math.ceil((nextTest.getTime() - now.getTime()) / 86400000) : null;
  const retestProgress =
    latest && nextTest ? Math.min(100, Math.max(0, ((now.getTime() - latest.date.getTime()) / (nextTest.getTime() - latest.date.getTime())) * 100)) : 0;

  return {
    points,
    first,
    latest,
    previous,
    /** Oxirgi test oldingisiga nisbatan */
    delta: latest && previous ? latest.score - previous.score : null,
    /** Oxirgi test oldingisiga nisbatan: kamaydi, o'zgarmadi yoki ko'paydi */
    trend: latest && previous ? pointTrend(previous, latest) : null,
    domains,
    /** Bo'limlar solishtirildimi (oxirgi test bilan bir xil versiyadagi oldingi test bor) */
    compared,
    nextTest,
    daysLeft,
    /** Oxirgi testdan keyingi testgacha o'tgan vaqt, % */
    retestProgress,
    retestDue: nextTest ? nextTest <= now : false,
  };
}

/* ------------------------------ Haftalar va kunlar ------------------------------ */

function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** Oxirgi n hafta (dushanbadan boshlanadi), eskisidan joriysigacha. */
export function lastWeeks(n: number, now = new Date()) {
  const start = mondayOf(now);
  return Array.from({ length: n }, (_, i) => {
    const from = new Date(start);
    from.setDate(from.getDate() - 7 * (n - 1 - i));
    const days = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(from);
      d.setDate(d.getDate() + j);
      return dayKey(d);
    });
    return { start: from, days: new Set(days) };
  });
}

/** [joriy 30 kun, oldingi 30 kun] kunlari */
function twoPeriods(now = new Date()) {
  const sixty = lastDays(60, now);
  return [new Set(sixty.slice(0, 30)), new Set(sixty.slice(30))] as const;
}

/* ------------------------------ Ovozli mashqlar ------------------------------ */

type SoundProgressMap = Record<string, Partial<Record<SoundLevel, SoundResult>>>;

export function soundProgress(log: SoundLogEntry[], progress: SoundProgressMap, cardIds: string[], now = new Date()) {
  const levels = SOUND_LEVELS.map((level) => ({ level, mastery: levelMastery(progress, cardIds, level) }));

  const weeks = lastWeeks(6, now).map((w) => {
    const entries = log.filter((e) => w.days.has(e.day) && e.level > 1);
    return {
      start: w.start,
      ok: entries.filter((e) => e.result === "ok").length,
      help: entries.filter((e) => e.result === "help").length,
      miss: entries.filter((e) => e.result === "miss").length,
    };
  });

  // Mustaqillik: 2–4-darajadagi javoblarda "o'zi topdi" ulushi (1-daraja — faqat tanishish)
  const [cur, prev] = twoPeriods(now);
  const rate = (days: Set<string>) => {
    const answers = log.filter((e) => days.has(e.day) && e.level > 1);
    return answers.length ? Math.round((answers.filter((e) => e.result === "ok").length / answers.length) * 100) : null;
  };

  return {
    levels,
    weeks,
    independence: rate(cur),
    independencePrev: rate(prev),
    answers30: log.filter((e) => cur.has(e.day)).length,
    total: log.length,
  };
}

/* ---------------------------- Bugungi 5 daqiqa ---------------------------- */

const SKILL_OF = new Map(PLAY_ACTIVITIES.map((a) => [a.id, a.skill]));

export function playProgress(data: ChildPlay | undefined, now = new Date()) {
  const entries = data?.entries ?? [];
  const doneDays = new Set(entries.map((e) => e.day));
  const today = dayKey(now);

  let streak = 0;
  const back = lastDays(366, now);
  for (let i = doneDays.has(today) ? 0 : 1; i < back.length && doneDays.has(back[i]); i++) streak++;

  const [cur, prev] = twoPeriods(now);
  const recent = entries.filter((e) => cur.has(e.day));

  const ratings: Record<PlayRating, number> = { great: 0, ok: 0, hard: 0 };
  recent.forEach((e) => ratings[e.rating]++);

  const skills = PLAY_SKILLS.map((skill) => ({ skill, count: recent.filter((e) => SKILL_OF.get(e.id) === skill).length })).sort(
    (a, b) => b.count - a.count,
  ) as { skill: PlaySkill; count: number }[];

  // Kalendar: oxirgi 5 hafta, dushanbadan
  const calendar = lastWeeks(5, now).map((w) =>
    [...w.days].map((day) => ({ day, done: doneDays.has(day), future: day > today, count: entries.filter((e) => e.day === day).length })),
  );

  return {
    streak,
    total: entries.length,
    activeDays: [...cur].filter((d) => doneDays.has(d)).length,
    activeDaysPrev: [...prev].filter((d) => doneDays.has(d)).length,
    sessions30: recent.length,
    ratings,
    skills,
    calendar,
  };
}

/* ---------------------------- Rasmli muloqot ---------------------------- */

export function aacProgress(days: Record<string, AacDayLog>, now = new Date()) {
  const [cur, prev] = twoPeriods(now);
  const sum = (set: Set<string>, pick: (d: AacDayLog) => number) => [...set].reduce((n, k) => n + (days[k] ? pick(days[k]) : 0), 0);

  const cards: Record<string, number> = {};
  cur.forEach((k) => Object.entries(days[k]?.cards ?? {}).forEach(([id, n]) => (cards[id] = (cards[id] ?? 0) + n)));

  const sentences = sum(cur, (d) => d.sentences);
  const sentencesPrev = sum(prev, (d) => d.sentences);
  const avg = (s: number, w: number) => (s ? Math.round((w / s) * 10) / 10 : 0);

  return {
    taps: sum(cur, (d) => d.taps),
    tapsPrev: sum(prev, (d) => d.taps),
    uniqueWords: Object.keys(cards).length,
    sentences,
    sentencesPrev,
    avgLength: avg(sentences, sum(cur, (d) => d.sentenceWords)),
    avgLengthPrev: avg(sentencesPrev, sum(prev, (d) => d.sentenceWords)),
    /** Oxirgi 14 kun, eskisidan bugungacha */
    daily: lastDays(14, now)
      .reverse()
      .map((day) => ({ day, taps: days[day]?.taps ?? 0 })),
    top: Object.entries(cards)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id, count]) => ({ id, count })),
    everUsed: Object.keys(days).length > 0,
  };
}

/* -------------------------------- Kundalik -------------------------------- */

export function diaryProgress(entries: DiaryEntry[], now = new Date()) {
  const byDay = new Map(entries.map((e) => [e.date, e]));
  const days14 = lastDays(14, now).reverse();
  const [cur] = twoPeriods(now);
  const week = lastDays(14, now);

  const avg = (list: (number | null)[]) => {
    const xs = list.filter((x): x is number => x !== null);
    return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
  };
  const sleepOf = (day: string) => {
    const e = byDay.get(day);
    return e ? sleepHours(e.bedTime, e.wakeTime) : null;
  };

  // Uyqu va qiyin paytlar bog'liqligi: kamida 7 kunlik ma'lumot bo'lsa
  const paired = entries
    .map((e) => ({ sleep: sleepHours(e.bedTime, e.wakeTime), melt: e.meltdowns }))
    .filter((p): p is { sleep: number; melt: 0 | 1 | 2 } => p.sleep !== null && p.melt !== null);
  let insight: { threshold: number; ratio: number } | null = null;
  let insightChecked = false;
  if (paired.length >= 7) {
    insightChecked = true;
    const sorted = paired.map((p) => p.sleep).sort((a, b) => a - b);
    const threshold = Math.round(sorted[Math.floor(sorted.length / 2)] * 2) / 2;
    const rate = (list: typeof paired) => (list.length ? list.filter((p) => p.melt > 0).length / list.length : 0);
    const short = paired.filter((p) => p.sleep < threshold);
    const long = paired.filter((p) => p.sleep >= threshold);
    const rs = rate(short);
    const rl = rate(long);
    if (short.length >= 2 && long.length >= 2 && rl > 0 && rs / rl >= 1.5) insight = { threshold, ratio: Math.round((rs / rl) * 10) / 10 };
  }

  return {
    loggedDays: [...cur].filter((d) => byDay.has(d)).length,
    avgSleep: avg(week.slice(0, 7).map(sleepOf)),
    avgSleepPrev: avg(week.slice(7).map(sleepOf)),
    meltDays: [...cur].filter((d) => (byDay.get(d)?.meltdowns ?? 0) > 0).length,
    daily: days14.map((day) => {
      const e = byDay.get(day);
      return { day, sleep: sleepOf(day), mood: e?.mood ?? null, meltdowns: e?.meltdowns ?? null, logged: !!e };
    }),
    insight,
    insightChecked,
    total: entries.length,
  };
}

/* --------------------------- Oylik ko'nikmalar testi --------------------------- */

/**
 * Ikki ko'nikmalar testi orasidagi o'zgarish va shu davrda bajarilgan mashqlar soni:
 * "5 daqiqa" mashqlari ko'nikma bo'yicha, "Tushunish" — ovozli mashqlar bo'yicha.
 */
export function skillsComparison(
  from: { createdAt: string; result: SkillsResult } | undefined,
  to: { createdAt: string; result: SkillsResult },
  play: ChildPlay | undefined,
  soundLog: SoundLogEntry[],
) {
  const fromDay = from ? dayKey(new Date(from.createdAt)) : "";
  const toDay = dayKey(new Date(to.createdAt));
  const inRange = (day: string) => (!from || day > fromDay) && day <= toDay;
  const playIn = (play?.entries ?? []).filter((e) => inRange(e.day));

  return SKILL_SECTIONS.map((s) => {
    const cur = to.result.sections.find((x) => x.id === s.id)?.score ?? null;
    const prev = from?.result.sections.find((x) => x.id === s.id)?.score ?? null;
    const practiced =
      s.id === "understanding" ? soundLog.filter((e) => inRange(e.day)).length : playIn.filter((e) => SKILL_OF.get(e.id) === s.id).length;
    return { id: s.id, cur, prev, delta: cur !== null && prev !== null ? cur - prev : null, practiced };
  });
}
