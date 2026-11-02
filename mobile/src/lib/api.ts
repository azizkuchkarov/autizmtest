import type { Locale } from '@/shared/lib/locale';

/** Backend manzili. Lokal ishlab chiqishda .env da EXPO_PUBLIC_API_URL=http://localhost:3000 qiling. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://autizmtest.uz').replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 20000;

/** Sessiya tokeni: SessionProvider o'rnatadi, har bir so'rovga qo'shiladi. */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

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
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init?.headers,
      },
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.error ?? `HTTP ${res.status}`, res.status);
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(e instanceof Error ? e.message : 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

/** URL nisbiy bo'lsa (/uploads/...) backend manzilini qo'shadi. Sxemasi borlari (https:, file:) o'zgarmaydi. */
export function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/* --------------------------------- Auth --------------------------------- */

export type ChildRecord = {
  id: string;
  name: string;
  birthYear: number;
  /** Tug'ilgan oy (1–12). Eski profillarda bo'lmasligi mumkin — skrining oldidan so'raladi */
  birthMonth?: number | null;
  gender: string;
  avatar: string;
  /** Kunlik mashg'ulot vaqti "HH:MM" — 15 daqiqa oldin eslatiladi */
  practiceTime?: string | null;
  /** Ertalabki kundalik eslatmasi "HH:MM" */
  diaryTime?: string | null;
  remindersOn?: boolean;
};

export type ChildInput = Omit<ChildRecord, 'id'>;

export type OtpChannel = 'sms' | 'telegram';

/** Kirish kodi: SMS yoki Telegram bot. Telegram'da raqam hali bog'lanmagan bo'lsa sent=false — botni link orqali ochish kerak. */
export function requestOtp(phone: string, channel: OtpChannel, locale: Locale) {
  return request<{ ok: boolean; devCode?: string; sent?: boolean; link?: string }>('/api/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone, channel, locale }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<{ ok: boolean; token: string; user: { id: string; phone: string } }>('/api/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code, flow: 'mobile' }),
  });
}

export function fetchMe() {
  return request<{ user: { id: string; phone: string; guideSeen?: boolean }; children: ChildRecord[] }>('/api/mobile/me');
}

export function setGuideSeen(guideSeen: boolean) {
  return request<{ ok: boolean }>('/api/mobile/me', { method: 'PATCH', body: JSON.stringify({ guideSeen }) });
}

export function createChild(input: ChildInput) {
  return request<{ child: ChildRecord }>('/api/mobile/children', { method: 'POST', body: JSON.stringify(input) });
}

export function updateChild(id: string, input: Partial<ChildInput>) {
  return request<{ child: ChildRecord }>(`/api/mobile/children/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAccount() {
  return request<{ ok: boolean }>('/api/mobile/me', { method: 'DELETE' });
}

export function logoutSession() {
  return request<{ ok: boolean }>('/api/mobile/logout', { method: 'POST' });
}

/** Push token: kirganda va til o'zgarganda saqlanadi, chiqishdan oldin o'chiriladi. */
export function savePushToken(token: string, platform: 'ios' | 'android', locale: Locale) {
  return request<{ ok: boolean }>('/api/mobile/push-token', { method: 'PUT', body: JSON.stringify({ token, platform, locale }) });
}

export function deletePushToken(token: string) {
  return request<{ ok: boolean }>('/api/mobile/push-token', { method: 'DELETE', body: JSON.stringify({ token }) });
}

/* ----------------------------- Assessments ----------------------------- */

export type CreateAssessmentInput = {
  testType: 'screening';
  ageGroup: string;
  answers: Record<string, 0 | 1 | 2 | 3>;
  childGender?: string;
  phone?: string;
};

export function createAssessment(input: CreateAssessmentInput) {
  return request<{ assessmentId: string }>('/api/assessments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type CreateAssessmentV3Input = {
  testType: 'screening' | 'skills';
  ageMonths: number;
  answers: Record<string, 0 | 1 | 2 | 3 | -1>;
  followUps?: Record<string, boolean[]>;
  childId?: string;
  childGender?: string;
  phone?: string;
};

/** Skrining v3 va oylik ko'nikmalar testi: natija serverda qayta hisoblanadi va bolaga bog'lanadi. */
export function createAssessmentV3(input: CreateAssessmentV3Input) {
  return request<{ assessmentId: string; scoring: unknown }>('/api/assessments/v3', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Bolaning serverdagi tarixi (hozircha faqat ko'nikmalar testi natijalari ishlatiladi). */
export function fetchActivity(childId: string) {
  return request<{ skills?: { id: string; createdAt: string; scoring: unknown }[] }>(
    `/api/mobile/children/${encodeURIComponent(childId)}/activity`,
  );
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
  return request<{ ok: boolean; status: 'ready' | 'failed' | 'pending'; payload?: AiSummaryPayload; error?: string }>(
    `/api/assessments/${assessmentId}/ai-summary`,
    { method: 'POST', body: JSON.stringify({ locale }) },
    90000,
  );
}

/* ------------------------------- Content ------------------------------- */

export type ContentKind = 'lesson' | 'exercise';

export type Video = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  /** Skrining sohalari (A, B, C) — natijaga qarab tavsiya qilish uchun */
  domains: string[];
  ageGroups: string[];
};

/** Video yo'nalishi: autizm, logoped, sensor integratsiya va h.k. */
export type Profession = {
  id: string;
  slug: string;
  title: string;
};

/** Mavzu: bir yoki bir nechta video */
export type ContentCategory = {
  id: string;
  slug: string;
  /** Yo'nalish slug'i (Profession.slug) */
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

export function fetchVideoProgress() {
  return request<{ items: { videoId: string; positionSec: number; completed: boolean }[] }>('/api/mobile/video-progress');
}

export function saveVideoProgress(items: { videoId: string; positionSec: number; completed: boolean }[]) {
  return request<{ ok: boolean }>('/api/mobile/video-progress', { method: 'POST', body: JSON.stringify({ items }) });
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
  return request<{ items: AbaCenter[] }>('/api/aba-centers');
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

/* ---------------------------- Rasmli muloqot ---------------------------- */

/** Fitzgerald kaliti bo'yicha so'z turi — karta rangini belgilaydi. */
export type AacWordType = 'pronoun' | 'verb' | 'descriptor' | 'noun' | 'social' | 'question' | 'negation' | 'misc';

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
  breakfast: 'full' | 'little' | 'none' | null;
  appetite: 'good' | 'normal' | 'poor' | null;
  meltdowns: DiaryLevel | null;
  selfHarm: boolean | null;
  repetitive: 'low' | 'mid' | 'high' | null;
  eyeContact: 'good' | 'some' | 'none' | null;
  requests: 'words' | 'gestures' | 'none' | null;
  sick: boolean | null;
  constipation: boolean | null;
  medicine: boolean | null;
  note: string | null;
  updatedAt?: string;
};

export function fetchDiary(childId: string, from?: string) {
  return request<{ entries: DiaryEntry[] }>(`/api/mobile/children/${encodeURIComponent(childId)}/diary${from ? `?from=${from}` : ''}`);
}

export function saveDiary(childId: string, entry: DiaryEntry) {
  return request<{ entry: DiaryEntry }>(`/api/mobile/children/${encodeURIComponent(childId)}/diary`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
}
