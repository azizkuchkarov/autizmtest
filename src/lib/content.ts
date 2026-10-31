import type { AacCard, AacCategory, ContentCategory, Profession, SoundCard, SoundSet, Video } from "@prisma/client";
import type { Locale } from "@/lib/locale";

export const CONTENT_KINDS = ["lesson", "exercise"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export function isContentKind(v: unknown): v is ContentKind {
  return typeof v === "string" && (CONTENT_KINDS as readonly string[]).includes(v);
}

export function parseLocale(v: string | null): Locale {
  return v === "ru" ? "ru" : "uz";
}

/** Mobil ilova va sayt uchun videoni tanlangan tilda qaytaradi. */
export function toPublicVideo(v: Video, locale: Locale) {
  return {
    id: v.id,
    // Ruscha matn kiritilmagan bo'lsa o'zbekchasi ko'rsatiladi
    title: (locale === "ru" && v.titleRu) || v.titleUz,
    description: (locale === "ru" && v.descriptionRu) || v.descriptionUz || null,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    durationSec: v.durationSec,
    domains: v.domains,
    ageGroups: v.ageGroups,
  };
}

export function toPublicProfession(p: Profession, locale: Locale) {
  return { id: p.id, slug: p.slug, title: locale === "ru" ? p.titleRu : p.titleUz };
}

export function toPublicCategory(c: ContentCategory & { videos: Video[]; profession: Profession }, locale: Locale) {
  return {
    id: c.id,
    slug: c.slug,
    profession: c.profession.slug,
    title: locale === "ru" ? c.titleRu : c.titleUz,
    description: (locale === "ru" ? c.descriptionRu : c.descriptionUz) ?? null,
    videos: c.videos.map((v) => toPublicVideo(v, locale)),
  };
}

/* ------------------------------ Ovozli darslar ------------------------------ */

export function toPublicSoundCard(c: SoundCard, locale: Locale) {
  return {
    id: c.id,
    title: locale === "ru" ? c.titleRu : c.titleUz,
    audioUrl: c.audioUrl,
    imageUrl: c.imageUrl,
    emoji: c.emoji,
    loud: c.loud,
  };
}

export function toPublicSoundSet(s: SoundSet & { cards: SoundCard[] }, locale: Locale) {
  return {
    id: s.id,
    slug: s.slug,
    title: locale === "ru" ? s.titleRu : s.titleUz,
    description: (locale === "ru" ? s.descriptionRu : s.descriptionUz) ?? null,
    emoji: s.emoji,
    imageUrl: s.imageUrl,
    cards: s.cards.map((c) => toPublicSoundCard(c, locale)),
  };
}

/* --------------------------- Rasmli muloqot (AAC) --------------------------- */

export function toPublicAacCard(c: AacCard, locale: Locale) {
  const title = locale === "ru" ? c.titleRu : c.titleUz;
  return {
    id: c.id,
    title,
    speak: (locale === "ru" ? c.speakRu : c.speakUz) || title,
    emoji: c.emoji,
    imageUrl: c.imageUrl,
    audioUrl: locale === "ru" ? c.audioRuUrl : c.audioUzUrl,
    wordType: c.wordType,
    core: c.core,
  };
}

export function toPublicAacCategory(c: AacCategory & { cards: AacCard[] }, locale: Locale) {
  return {
    id: c.id,
    slug: c.slug,
    title: locale === "ru" ? c.titleRu : c.titleUz,
    emoji: c.emoji,
    cards: c.cards.map((card) => toPublicAacCard(card, locale)),
  };
}
