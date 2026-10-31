/* Brauzer uchun API klienti — mobil ilovadagi mobile/src/lib/api.ts bilan bir xil funksiyalar.
   Web sessiyasi httpOnly cookie orqali ishlaydi (token saqlanmaydi). */
import type { Locale } from "@/lib/locale";

const REQUEST_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.error ?? `HTTP ${res.status}`, res.status);
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Network error");
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------------------- Auth --------------------------------- */

export type ChildRecord = {
  id: string;
  name: string;
  birthYear: number;
  /** 1–12; eski profillarda bo'lmasligi mumkin */
  birthMonth?: number | null;
  gender: string;
  avatar: string;
  /** Kunlik mashg'ulot vaqti "HH:MM" — 15 daqiqa oldin eslatiladi */
  practiceTime?: string | null;
  /** Ertalabki kundalik eslatmasi "HH:MM" */
  diaryTime?: string | null;
  remindersOn?: boolean;
};

export type ChildInput = Omit<ChildRecord, "id">;

export type OtpChannel = "sms" | "telegram";

/** Kirish kodi: SMS yoki Telegram bot. Telegram'da raqam hali bog'lanmagan bo'lsa sent=false — botni link orqali ochish kerak. */
export function requestOtp(phone: string, channel: OtpChannel, locale: Locale) {
  return request<{ ok: boolean; devCode?: string; sent?: boolean; link?: string }>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone, channel, locale }),
  });
}

export function verifyOtp(phone: string, code: string) {
  // flow: "test" — server sessiya cookie'sini o'rnatadi
  return request<{ ok: boolean; user: { id: string; phone: string } }>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code, flow: "test" }),
  });
}

export function fetchMe() {
  return request<{ user: { id: string; phone: string; guideSeen?: boolean }; children: ChildRecord[] }>("/api/mobile/me");
}

export function setGuideSeen(guideSeen: boolean) {
  return request<{ ok: boolean }>("/api/mobile/me", { method: "PATCH", body: JSON.stringify({ guideSeen }) });
}

export function createChild(input: ChildInput) {
  return request<{ child: ChildRecord }>("/api/mobile/children", { method: "POST", body: JSON.stringify(input) });
}

export function updateChild(id: string, input: Partial<ChildInput>) {
  return request<{ child: ChildRecord }>(`/api/mobile/children/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteAccount() {
  return request<{ ok: boolean }>("/api/mobile/me", { method: "DELETE" });
}

export function logoutSession() {
  return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

/* ----------------------------- Assessments ----------------------------- */

export type CreateAssessmentInput = {
  testType: "screening";
  ageGroup: string;
  answers: Record<string, 0 | 1 | 2 | 3>;
  childGender?: string;
  phone?: string;
  /** Akkauntdagi bola — natija serverda bolaga bog'lanadi */
  childId?: string;
};

export function createAssessment(input: CreateAssessmentInput) {
  return request<{ assessmentId: string }>("/api/assessments", { method: "POST", body: JSON.stringify(input) });
}

export type AiSummaryPayload = {
  summary?: { shortConclusion?: string; whyThisLevel?: string };
  strengths?: { examples?: string[] };
  needsFocus?: { priority?: string[] };
  nextSteps?: { homePlan?: Array<{ title?: string; why?: string; how?: string[] }> };
  disclaimer?: { text?: string };
};

export function fetchAiSummary(assessmentId: string, locale: Locale) {
  // AI javobi uzoq davom etishi mumkin
  return request<{ ok: boolean; status: "ready" | "failed" | "pending"; payload?: AiSummaryPayload; error?: string }>(
    `/api/assessments/${assessmentId}/ai-summary`,
    { method: "POST", body: JSON.stringify({ locale }) },
    90000,
  );
}

/** Serverdagi natija (boshqa qurilmada topshirilgan yoki havola orqali ochilgan). */
export function fetchServerAssessment(id: string) {
  return request<{
    testType: string;
    scoring: unknown;
    aiSummary: { status: string; payload: AiSummaryPayload | null };
    aiSummaryLocale: string | null;
    completedAt: string | null;
    ageGroup: string | null;
  }>(`/api/assessments/${encodeURIComponent(id)}`);
}

/* ------------------------------- Content ------------------------------- */

export type ContentKind = "lesson" | "exercise";

export type Video = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  domains: string[];
  ageGroups: string[];
};

export type Profession = { id: string; slug: string; title: string };

export type ContentCategory = {
  id: string;
  slug: string;
  profession: string;
  title: string;
  description: string | null;
  videos: Video[];
};

export function fetchContent(kind: ContentKind, locale: Locale) {
  return request<{ professions: Profession[]; categories: ContentCategory[] }>(`/api/content?kind=${kind}&locale=${locale}`);
}

export function fetchVideo(id: string, locale: Locale) {
  return request<{ video: Video }>(`/api/content/videos/${encodeURIComponent(id)}?locale=${locale}`);
}

/* ----------------------------- ABA centers ----------------------------- */

export type AbaCenter = {
  id: string;
  region: string;
  district: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  url: string | null;
  instagram: string | null;
  note: string | null;
  imageUrl: string | null;
};

export function fetchAbaCenters() {
  return request<{ items: AbaCenter[] }>("/api/aba-centers");
}

/* ---------------------------- Ovozli darslar ---------------------------- */

export type SoundCard = {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl: string | null;
  emoji: string | null;
  loud: boolean;
};

export type SoundSet = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  imageUrl: string | null;
  cards: SoundCard[];
};

export function fetchSoundSets(locale: Locale) {
  return request<{ sets: SoundSet[] }>(`/api/content/sounds?locale=${locale}`);
}

export function fetchSoundSet(id: string, locale: Locale) {
  return request<{ set: SoundSet }>(`/api/content/sounds/${encodeURIComponent(id)}?locale=${locale}`);
}

/* --------------------------- Rasmli muloqot (AAC) --------------------------- */

/** Fitzgerald kaliti bo'yicha so'z turi — karta rangi shundan. */
export type AacWordType = "pronoun" | "verb" | "descriptor" | "noun" | "social" | "question" | "negation" | "misc";

export type AacCard = {
  id: string;
  title: string;
  /** Aytiladigan matn (masalan, "Hojatxona" → "Hojatxonaga boraman") */
  speak: string;
  emoji: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  wordType: AacWordType;
  core: boolean;
};

export type AacCategory = { id: string; slug: string; title: string; emoji: string | null; cards: AacCard[] };

export function fetchAac(locale: Locale) {
  return request<{ categories: AacCategory[] }>(`/api/content/aac?locale=${locale}`);
}

/* -------------------------------- Kundalik -------------------------------- */

export type DiaryLevel = 0 | 1 | 2;

export type DiaryEntry = {
  date: string;
  bedTime: string | null;
  wakeTime: string | null;
  nightWakings: DiaryLevel | null;
  mood: number | null;
  breakfast: "full" | "little" | "none" | null;
  appetite: "good" | "normal" | "poor" | null;
  meltdowns: DiaryLevel | null;
  selfHarm: boolean | null;
  repetitive: "low" | "mid" | "high" | null;
  eyeContact: "good" | "some" | "none" | null;
  requests: "words" | "gestures" | "none" | null;
  sick: boolean | null;
  constipation: boolean | null;
  medicine: boolean | null;
  note: string | null;
  updatedAt?: string;
};

export function fetchDiary(childId: string, from?: string) {
  return request<{ entries: DiaryEntry[] }>(`/api/mobile/children/${encodeURIComponent(childId)}/diary${from ? `?from=${from}` : ""}`);
}

export function saveDiary(childId: string, entry: DiaryEntry) {
  return request<{ entry: DiaryEntry }>(`/api/mobile/children/${encodeURIComponent(childId)}/diary`, { method: "PUT", body: JSON.stringify(entry) });
}

/* ---------------------------- Sinxronlash ---------------------------- */

export type ActivitySnapshot = {
  sound: { id: string; cardId: string | null; level: 1 | 2 | 3 | 4; result: "ok" | "help" | "miss"; day: string; at: number; snapshot: boolean }[];
  play: { id: string; activityId: string; rating: "great" | "ok" | "hard"; day: string; at: number }[];
  aac: { day: string; taps: number; sentences: number; sentenceWords: number; cards: Record<string, number> }[];
  assessments: { id: string; createdAt: string; ageGroup: string; childGender: string | null; scoring: unknown; ai: { locale: string; payload: AiSummaryPayload } | null }[];
  skills?: { id: string; createdAt: string; scoring: unknown }[];
};

export function fetchActivity(childId: string) {
  return request<ActivitySnapshot>(`/api/mobile/children/${encodeURIComponent(childId)}/activity`, undefined, 30000);
}

export function pushActivity(childId: string, body: { events: unknown[]; claimAssessments?: string[] }) {
  return request<{ ok: boolean; accepted: string[] }>(
    `/api/mobile/children/${encodeURIComponent(childId)}/activity`,
    { method: "POST", body: JSON.stringify(body) },
    30000,
  );
}

/* -------------------------- Skrining v3 va ko'nikmalar -------------------------- */

export function createAssessmentV3(input: {
  testType: "screening" | "skills";
  ageMonths: number;
  answers: Record<string, number>;
  followUps?: Record<string, boolean[]>;
  childId?: string;
  childGender?: string;
  phone?: string;
}) {
  return request<{ assessmentId: string; scoring: unknown }>("/api/assessments/v3", { method: "POST", body: JSON.stringify(input) }, 30000);
}
