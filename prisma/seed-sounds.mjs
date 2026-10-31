// Ovozli darslar uchun boshlang'ich to'plamlar: Uy hayvonlari, Yovvoyi hayvonlar, Qushlar, Transport, Uydagi va odam tovushlari.
// Ishga tushirish: node --env-file=.env prisma/seed-sounds.mjs
// Ovoz fayllari LOCAL_VIDEO_DIR/sounds/<fayl>.mp3 (yoki .m4a/.ogg/.wav) da bo'lsa, ovoz faol bo'ladi;
// fayl topilmasa ovoz yopiq holda yaratiladi — keyin admin paneldan manzilini kiritib yoqiladi.
// Qayta ishga tushirsa bo'ladi: to'plamlar slug bo'yicha yangilanadi, ichidagi ovozlar qayta yaratiladi.
// Ovozlarning manbasi va litsenziyasi (Wikimedia Commons, Public domain / CC0): prisma/sound-sources.json
import { stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SOUND_DIR = process.env.LOCAL_VIDEO_DIR ? path.join(process.env.LOCAL_VIDEO_DIR, "sounds") : null;
const EXTENSIONS = [".mp3", ".m4a", ".ogg", ".wav"];

/** [fayl nomi, o'zbekcha, ruscha, emoji, keskin tovushmi] */
const SETS = [
  {
    slug: "uy-hayvonlari",
    emoji: "🐶",
    titleUz: "Uy hayvonlari",
    titleRu: "Домашние животные",
    descriptionUz: "Kuchuk, mushuk, sigir va boshqa uy hayvonlari",
    descriptionRu: "Собака, кошка, корова и другие домашние животные",
    cards: [
      ["dog", "Kuchuk", "Собака", "🐶"],
      ["cat", "Mushuk", "Кошка", "🐱"],
      ["cow", "Sigir", "Корова", "🐮"],
      ["sheep", "Qo'y", "Овца", "🐑"],
      ["goat", "Echki", "Коза", "🐐"],
      ["horse", "Ot", "Лошадь", "🐴"],
      ["rooster", "Xo'roz", "Петух", "🐓"],
      ["hen", "Tovuq", "Курица", "🐔"],
      ["duck", "O'rdak", "Утка", "🦆"],
      ["donkey", "Eshak", "Осёл", "🫏"],
    ],
  },
  {
    slug: "yovvoyi-hayvonlar",
    emoji: "🦁",
    titleUz: "Yovvoyi hayvonlar",
    titleRu: "Дикие животные",
    descriptionUz: "Sher, fil, maymun va boshqalar",
    descriptionRu: "Лев, слон, обезьяна и другие",
    cards: [
      ["lion", "Sher", "Лев", "🦁", true],
      ["elephant", "Fil", "Слон", "🐘"],
      ["monkey", "Maymun", "Обезьяна", "🐒"],
      ["wolf", "Bo'ri", "Волк", "🐺"],
      ["bear", "Ayiq", "Медведь", "🐻"],
      ["frog", "Qurbaqa", "Лягушка", "🐸"],
    ],
  },
  {
    slug: "qushlar",
    emoji: "🐦",
    titleUz: "Qushlar",
    titleRu: "Птицы",
    descriptionUz: "Chumchuq, kaptar, boyqush va qarg'a",
    descriptionRu: "Воробей, голубь, сова и ворона",
    cards: [
      ["sparrow", "Chumchuq", "Воробей", "🐦"],
      ["pigeon", "Kaptar", "Голубь", "🕊️"],
      ["owl", "Boyqush", "Сова", "🦉"],
      ["crow", "Qarg'a", "Ворона", "🐦‍⬛"],
    ],
  },
  {
    slug: "transport",
    emoji: "🚗",
    titleUz: "Transport",
    titleRu: "Транспорт",
    descriptionUz: "Mashina, poyezd, samolyot va boshqalar",
    descriptionRu: "Машина, поезд, самолёт и другие",
    cards: [
      ["car-horn", "Mashina", "Машина", "🚗"],
      ["train", "Poyezd", "Поезд", "🚂"],
      ["airplane", "Samolyot", "Самолёт", "✈️"],
      ["bus", "Avtobus", "Автобус", "🚌"],
      ["bicycle-bell", "Velosiped", "Велосипед", "🚲"],
      ["ambulance", "Tez yordam", "Скорая помощь", "🚑", true],
      ["helicopter", "Vertolyot", "Вертолёт", "🚁", true],
    ],
  },
  {
    slug: "uydagi-tovushlar",
    emoji: "🏠",
    titleUz: "Uydagi tovushlar",
    titleRu: "Звуки дома",
    descriptionUz: "Eshik, telefon, suv va boshqa kundalik tovushlar",
    descriptionRu: "Дверь, телефон, вода и другие бытовые звуки",
    cards: [
      ["door-knock", "Eshik taqillashi", "Стук в дверь", "🚪"],
      ["phone", "Telefon", "Телефон", "📱"],
      ["water", "Suv", "Вода", "🚰"],
      ["clock", "Soat", "Часы", "⏰"],
      ["kettle", "Choynak", "Чайник", "🫖"],
      ["vacuum", "Changyutgich", "Пылесос", "🧹", true],
    ],
  },
  {
    slug: "odam-tovushlari",
    emoji: "🙂",
    titleUz: "Odam tovushlari",
    titleRu: "Звуки человека",
    descriptionUz: "Kulgi, yig'i, yo'tal, qarsak",
    descriptionRu: "Смех, плач, кашель, хлопки",
    cards: [
      ["laugh", "Kulgi", "Смех", "😄"],
      ["cry", "Yig'i", "Плач", "😢"],
      ["cough", "Yo'tal", "Кашель", "😷"],
      ["sneeze", "Aksirish", "Чихание", "🤧"],
      ["clap", "Qarsak", "Хлопки", "👏"],
    ],
  },
];

/** Fayl bor bo'lsa uning nomini, bo'lmasa null qaytaradi. */
async function findFile(name) {
  if (!SOUND_DIR) return null;
  for (const ext of EXTENSIONS) {
    const info = await stat(path.join(SOUND_DIR, name + ext)).catch(() => null);
    if (info?.isFile()) return name + ext;
  }
  return null;
}

let found = 0;
let missing = 0;

for (const [order, { cards, ...data }] of SETS.entries()) {
  const set = await prisma.soundSet.upsert({
    where: { slug: data.slug },
    create: { ...data, order },
    update: { ...data, order },
  });
  await prisma.soundCard.deleteMany({ where: { setId: set.id } });

  for (const [i, [name, titleUz, titleRu, emoji, loud = false]] of cards.entries()) {
    const file = await findFile(name);
    if (file) found++;
    else missing++;
    await prisma.soundCard.create({
      data: {
        setId: set.id,
        titleUz,
        titleRu,
        emoji,
        loud,
        audioUrl: `/api/media/local/sounds/${encodeURIComponent(file ?? `${name}.mp3`)}`,
        order: i + 1,
        active: Boolean(file),
      },
    });
  }
  console.log(`✓ ${data.titleUz}: ${cards.length} ta ovoz`);
}

console.log(`\nFayli topilgan (faol): ${found}, topilmagan (yopiq): ${missing}`);
if (missing) console.log(`Ovoz fayllarini ${SOUND_DIR ?? "LOCAL_VIDEO_DIR/sounds"} ga qo'yib, skriptni qayta ishga tushiring.`);
await prisma.$disconnect();
