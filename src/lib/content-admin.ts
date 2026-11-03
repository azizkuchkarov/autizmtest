import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionAdmin } from "@/lib/admin-auth";
import { CONTENT_KINDS } from "@/lib/content";

const AGE_GROUPS = ["AGE_1_5_2", "AGE_3_4", "AGE_5_6", "AGE_7_9"] as const;
const DOMAINS = ["A", "B", "C"] as const;

const optionalText = z.string().trim().max(5000).nullish();

export const categorySchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug: faqat a-z, 0-9 va -"),
  kind: z.enum(CONTENT_KINDS),
  professionId: z.string().min(1),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  descriptionUz: optionalText,
  descriptionRu: optionalText,
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const professionSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug: faqat a-z, 0-9 va -"),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

/** Video maydonlari (tahrirlashda .partial() bilan ishlatiladi — standart qiymatlar yo'q). */
export const videoFieldsSchema = z.object({
  categoryId: z.string().uuid(),
  titleUz: z.string().trim().min(1).max(200),
  /** Bo'sh bo'lsa ilovada o'zbekchasi ko'rsatiladi */
  titleRu: z.string().trim().max(200),
  descriptionUz: optionalText,
  descriptionRu: optionalText,
  videoUrl: z.string().trim().max(1000),
  /** /api/upload/video javobi: yuklangan fayl serverda siqiladi (scripts/video-worker.mjs) */
  uploadId: z.string().regex(/^[0-9a-f-]{36}\.(mp4|mov|m4v|webm|mkv|avi)$/).optional(),
  thumbnailUrl: z.string().trim().max(1000).nullish(),
  durationSec: z.number().int().positive().nullish(),
  ageGroups: z.array(z.enum(AGE_GROUPS)).optional(),
  domains: z.array(z.enum(DOMAINS)).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  exerciseEnabled: z.boolean().optional(),
  exerciseReps: z.number().int().min(1).max(10).nullish(),
  exerciseDays: z.number().int().min(1).max(60).nullish(),
});

/** Yangi video: ruscha nom va havola ixtiyoriy (fayl yuklansa havolani server o'zi yozadi). */
export const videoSchema = videoFieldsSchema.extend({
  titleRu: videoFieldsSchema.shape.titleRu.default(""),
  videoUrl: videoFieldsSchema.shape.videoUrl.default(""),
});

/** Yuklangan video fayllar shu papkada: incoming/ (siqilishini kutayotgan), videos/, thumbs/. */
export function mediaDir() {
  const dir = process.env.LOCAL_VIDEO_DIR;
  if (!dir) throw new Error("LOCAL_VIDEO_DIR .env da belgilanmagan.");
  return dir;
}

/** Admin sessiyasini tekshiradi; yo'q bo'lsa 401 javobini qaytaradi. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
  return null;
}

export function validationError(error: z.ZodError) {
  return NextResponse.json({ error: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
}

const optionalUrl = z.string().trim().max(1000).nullish();
const optionalEmoji = z.string().trim().max(16).nullish();

export const soundSetSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug: faqat a-z, 0-9 va -"),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  descriptionUz: optionalText,
  descriptionRu: optionalText,
  emoji: optionalEmoji,
  imageUrl: optionalUrl,
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const soundCardSchema = z.object({
  setId: z.string().uuid(),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  audioUrl: z.string().trim().min(1).max(1000),
  imageUrl: optionalUrl,
  emoji: optionalEmoji,
  loud: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const AAC_WORD_TYPES = ["pronoun", "verb", "descriptor", "noun", "social", "question", "negation", "misc"] as const;

export const aacCategorySchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug: faqat a-z, 0-9 va -"),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  emoji: optionalEmoji,
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const aacCardSchema = z.object({
  categoryId: z.string().min(1),
  titleUz: z.string().trim().min(1).max(200),
  titleRu: z.string().trim().min(1).max(200),
  speakUz: z.string().trim().max(500).nullish(),
  speakRu: z.string().trim().max(500).nullish(),
  emoji: optionalEmoji,
  imageUrl: optionalUrl,
  audioUzUrl: optionalUrl,
  audioRuUrl: optionalUrl,
  wordType: z.enum(AAC_WORD_TYPES).optional(),
  core: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
