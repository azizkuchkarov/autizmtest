// Lokal test uchun: LOCAL_VIDEO_DIR dagi videolarni yo'nalish → mavzu → video ko'rinishida bazaga yozadi.
// Ishga tushirish: node --env-file=.env prisma/seed-local-videos.mjs
// Qayta ishga tushirsa bo'ladi: mavzular slug bo'yicha yangilanadi, ichidagi videolar qayta yaratiladi.
import { open, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VIDEO_DIR = process.env.LOCAL_VIDEO_DIR;
if (!VIDEO_DIR) {
  console.error("LOCAL_VIDEO_DIR .env da ko'rsatilmagan");
  process.exit(1);
}

const PROFESSIONS = [
  { slug: "autism", titleUz: "Autizm", titleRu: "Аутизм" },
  { slug: "speech", titleUz: "Logoped", titleRu: "Логопед" },
  { slug: "sensory", titleUz: "Sensor integratsiya", titleRu: "Сенсорная интеграция" },
  { slug: "psychology", titleUz: "Psixolog", titleRu: "Психолог" },
  { slug: "defectology", titleUz: "Defektolog", titleRu: "Дефектолог" },
];

/** Test mavzulari: nomlar fayl nomlaridan taxminiy — admin paneldan tahrirlanadi. */
const TOPICS = [
  {
    slug: "autizm-kirish",
    profession: "autism",
    kind: "lesson",
    titleUz: "Kirish: autizm nima?",
    titleRu: "Введение: что такое аутизм?",
    descriptionUz: "Autizm haqida asosiy tushunchalar",
    descriptionRu: "Основные понятия об аутизме",
    videos: [
      { file: "Kirish 1 (1).mp4", titleUz: "Kirish — 1-qism", titleRu: "Введение — часть 1" },
      { file: "Kirish 2.mp4", titleUz: "Kirish — 2-qism", titleRu: "Введение — часть 2" },
    ],
  },
  {
    slug: "autizm-asosiy",
    profession: "autism",
    kind: "lesson",
    titleUz: "Asosiy dars",
    titleRu: "Основной урок",
    descriptionUz: "Ota-onalar uchun asosiy ma'lumotlar",
    descriptionRu: "Основная информация для родителей",
    videos: [
      { file: "Glavniy 1.mp4", titleUz: "Asosiy dars — 1-qism", titleRu: "Основной урок — часть 1" },
      { file: "Glavniy 2.mp4", titleUz: "Asosiy dars — 2-qism", titleRu: "Основной урок — часть 2" },
    ],
  },
  {
    slug: "autizm-bloklar",
    profession: "autism",
    kind: "lesson",
    titleUz: "Bloklar bo'yicha darslar",
    titleRu: "Уроки по блокам",
    descriptionUz: "Skrining bloklari bo'yicha batafsil tushuntirish",
    descriptionRu: "Подробное объяснение по блокам скрининга",
    videos: [
      { file: "1-blok.mp4", titleUz: "1-blok", titleRu: "Блок 1", domains: ["A"] },
      { file: "2-blok.mp4", titleUz: "2-blok", titleRu: "Блок 2", domains: ["B"] },
      { file: "3-blok.mp4", titleUz: "3-blok", titleRu: "Блок 3", domains: ["C"] },
      { file: "6-blok.mp4", titleUz: "6-blok", titleRu: "Блок 6" },
      { file: "7-blok.mp4", titleUz: "7-blok", titleRu: "Блок 7" },
    ],
  },
  {
    slug: "autizm-uyda-mashqlar",
    profession: "autism",
    kind: "exercise",
    titleUz: "Uyda mashqlar",
    titleRu: "Упражнения дома",
    descriptionUz: "Har kuni bajariladigan oddiy mashqlar",
    descriptionRu: "Простые ежедневные упражнения",
    videos: [
      { file: "0.mp4", titleUz: "1-mashq", titleRu: "Упражнение 1" },
      { file: "000.mp4", titleUz: "2-mashq", titleRu: "Упражнение 2" },
      { file: "0000.mp4", titleUz: "3-mashq", titleRu: "Упражнение 3" },
      { file: "00000.mp4", titleUz: "4-mashq", titleRu: "Упражнение 4" },
    ],
  },
  {
    slug: "logoped-nutq",
    profession: "speech",
    kind: "lesson",
    titleUz: "Nutqni rivojlantirish",
    titleRu: "Развитие речи",
    descriptionUz: "Logoped maslahatlari",
    descriptionRu: "Советы логопеда",
    videos: [
      { file: "Muslima1.mp4", titleUz: "Nutq — 1-dars", titleRu: "Речь — урок 1", domains: ["B"] },
      { file: "Muslima2.mp4", titleUz: "Nutq — 2-dars", titleRu: "Речь — урок 2", domains: ["B"] },
    ],
  },
  {
    slug: "sensor-oyinlar",
    profession: "sensory",
    kind: "exercise",
    titleUz: "Sensor o'yinlar",
    titleRu: "Сенсорные игры",
    descriptionUz: "Sensor integratsiya mashqlari",
    descriptionRu: "Упражнения по сенсорной интеграции",
    videos: [{ file: "Sevinch.mp4", titleUz: "Sensor mashqlar", titleRu: "Сенсорные упражнения", domains: ["C"] }],
  },
  {
    slug: "psixolog-ota-onalar",
    profession: "psychology",
    kind: "lesson",
    titleUz: "Ota-onalar uchun maslahat",
    titleRu: "Советы для родителей",
    descriptionUz: "Psixolog bilan suhbat",
    descriptionRu: "Беседа с психологом",
    videos: [{ file: "Manzura Opa.mp4", titleUz: "Psixolog maslahati", titleRu: "Совет психолога" }],
  },
];

/** MP4 faylining davomiyligini (soniya) moov/mvhd sarlavhasidan o'qiydi; topilmasa null. */
async function mp4DurationSec(file) {
  const fh = await open(file, "r");
  try {
    const { size } = await fh.stat();
    const read = async (pos, len) => {
      const buf = Buffer.alloc(len);
      await fh.read(buf, 0, len, pos);
      return buf;
    };
    const findBox = async (start, end, type) => {
      let pos = start;
      while (pos + 8 <= end) {
        const h = await read(pos, 16);
        let boxSize = h.readUInt32BE(0);
        let header = 8;
        if (boxSize === 1) {
          boxSize = Number(h.readBigUInt64BE(8));
          header = 16;
        } else if (boxSize === 0) boxSize = end - pos;
        if (boxSize < header) return null;
        if (h.toString("latin1", 4, 8) === type) return { start: pos + header, end: pos + boxSize };
        pos += boxSize;
      }
      return null;
    };
    const moov = await findBox(0, size, "moov");
    if (!moov) return null;
    const mvhd = await findBox(moov.start, moov.end, "mvhd");
    if (!mvhd) return null;
    const b = await read(mvhd.start, 32);
    const [timescale, duration] =
      b[0] === 1 ? [b.readUInt32BE(20), Number(b.readBigUInt64BE(24))] : [b.readUInt32BE(12), b.readUInt32BE(16)];
    return timescale ? Math.round(duration / timescale) : null;
  } finally {
    await fh.close();
  }
}

const mediaUrl = (file) => `/api/media/local/${encodeURIComponent(file)}`;

async function main() {
  const professionIds = {};
  for (const [order, p] of PROFESSIONS.entries()) {
    const row = await prisma.profession.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, order },
    });
    professionIds[p.slug] = row.id;
  }

  const orderByKind = {};
  for (const t of TOPICS) {
    const { videos, profession, ...topic } = t;
    const order = (orderByKind[t.kind] = (orderByKind[t.kind] ?? -1) + 1);
    const data = { ...topic, order, professionId: professionIds[profession] };
    const category = await prisma.contentCategory.upsert({ where: { slug: t.slug }, update: data, create: data });

    await prisma.video.deleteMany({ where: { categoryId: category.id } });
    for (const [i, v] of videos.entries()) {
      const file = path.join(VIDEO_DIR, v.file);
      if (!(await stat(file).catch(() => null))) {
        console.warn(`  ! topilmadi: ${v.file}`);
        continue;
      }
      await prisma.video.create({
        data: {
          categoryId: category.id,
          titleUz: v.titleUz,
          titleRu: v.titleRu,
          videoUrl: mediaUrl(v.file),
          durationSec: await mp4DurationSec(file),
          ageGroups: [],
          domains: v.domains ?? [],
          order: i + 1,
        },
      });
    }
    console.log(`✓ ${t.profession} / ${t.titleUz}: ${videos.length} ta video`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
