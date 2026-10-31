// Rasmli muloqot (AAC) uchun boshlang'ich lug'at: 11 ta bo'lim, ~110 ta karta (o'zbekcha va ruscha).
// Ishga tushirish: node --env-file=.env prisma/seed-aac.mjs
// Qayta ishga tushirsa bo'ladi: kartalar doimiy id bo'yicha yangilanadi (ota-ona yozgan ovozlar yo'qolmaydi).
// Oldindan yozilgan ovoz: LOCAL_VIDEO_DIR/aac/uz/<id>.mp3 va LOCAL_VIDEO_DIR/aac/ru/<id>.mp3 bo'lsa, kartaga ulanadi.
// Rang — Fitzgerald kaliti: pronoun (odamlar) sariq, verb yashil, descriptor ko'k, noun to'q sariq,
// social pushti, question binafsha, negation qizil.
import { stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const AUDIO_DIR = process.env.LOCAL_VIDEO_DIR ? path.join(process.env.LOCAL_VIDEO_DIR, "aac") : null;

/** [kalit, o'zbekcha, ruscha, emoji, so'z turi, aytiladigan uz?, aytiladigan ru?] */
const CATEGORIES = [
  {
    slug: "asosiy",
    emoji: "💬",
    titleUz: "Asosiy so'zlar",
    titleRu: "Основные слова",
    core: true,
    cards: [
      ["me", "Men", "Я", "🙋", "pronoun"],
      ["you", "Sen", "Ты", "👉", "pronoun"],
      ["want", "Xohlayman", "Хочу", "🤲", "verb"],
      ["dont-want", "Xohlamayman", "Не хочу", "🙅", "negation"],
      ["yes", "Ha", "Да", "👍", "social"],
      ["no", "Yo'q", "Нет", "👎", "negation"],
      ["more", "Yana", "Ещё", "🔁", "descriptor"],
      ["finished", "Tugadi", "Всё", "✅", "social"],
      ["help", "Yordam bering", "Помогите", "🆘", "verb"],
      ["stop", "To'xta", "Стоп", "✋", "verb"],
      ["this", "Bu", "Это", "☝️", "pronoun"],
      ["give", "Ber", "Дай", "🫴", "verb"],
    ],
  },
  {
    slug: "ehtiyojlar",
    emoji: "🙏",
    titleUz: "Ehtiyojlar",
    titleRu: "Потребности",
    cards: [
      ["toilet", "Hojatxona", "Туалет", "🚽", "noun", "Hojatxonaga boraman", "Хочу в туалет"],
      ["hungry", "Ovqat yeyman", "Хочу есть", "🍽️", "verb"],
      ["thirsty", "Suv ichaman", "Хочу пить", "🚰", "verb"],
      ["sleepy", "Uxlagim keldi", "Хочу спать", "😴", "verb"],
      ["hurts", "Og'riyapti", "Больно", "🤕", "descriptor"],
      ["nauseous", "Ko'nglim aynayapti", "Тошнит", "🤢", "descriptor"],
      ["cold", "Sovuq", "Холодно", "🥶", "descriptor"],
      ["hot", "Issiq", "Жарко", "🥵", "descriptor"],
      ["hug", "Quchoqla", "Обними", "🤗", "verb"],
      ["rest", "Dam olaman", "Хочу отдохнуть", "🛋️", "verb"],
      ["quiet", "Jim bo'ling", "Тише, пожалуйста", "🤫", "social"],
      ["outside", "Tashqariga", "На улицу", "🌳", "noun", "Tashqariga chiqaman", "Хочу на улицу"],
    ],
  },
  {
    slug: "ovqat",
    emoji: "🍎",
    titleUz: "Ovqat",
    titleRu: "Еда",
    cards: [
      ["bread", "Non", "Хлеб", "🍞", "noun"],
      ["plov", "Osh", "Плов", "🍛", "noun"],
      ["soup", "Sho'rva", "Суп", "🍲", "noun"],
      ["porridge", "Bo'tqa", "Каша", "🥣", "noun"],
      ["egg", "Tuxum", "Яйцо", "🥚", "noun"],
      ["meat", "Go'sht", "Мясо", "🍖", "noun"],
      ["potato", "Kartoshka", "Картошка", "🥔", "noun"],
      ["apple", "Olma", "Яблоко", "🍎", "noun"],
      ["banana", "Banan", "Банан", "🍌", "noun"],
      ["grapes", "Uzum", "Виноград", "🍇", "noun"],
      ["melon", "Qovun", "Дыня", "🍈", "noun"],
      ["watermelon", "Tarvuz", "Арбуз", "🍉", "noun"],
      ["cookie", "Pechenye", "Печенье", "🍪", "noun"],
      ["candy", "Shirinlik", "Конфета", "🍬", "noun"],
      ["icecream", "Muzqaymoq", "Мороженое", "🍦", "noun"],
    ],
  },
  {
    slug: "ichimliklar",
    emoji: "🥤",
    titleUz: "Ichimliklar",
    titleRu: "Напитки",
    cards: [
      ["water", "Suv", "Вода", "💧", "noun"],
      ["milk", "Sut", "Молоко", "🥛", "noun"],
      ["tea", "Choy", "Чай", "🍵", "noun"],
      ["juice", "Sharbat", "Сок", "🧃", "noun"],
      ["compote", "Kompot", "Компот", "🍹", "noun"],
    ],
  },
  {
    slug: "his-tuygular",
    emoji: "😊",
    titleUz: "His-tuyg'ular",
    titleRu: "Чувства",
    cards: [
      ["happy", "Xursandman", "Мне весело", "😊", "descriptor"],
      ["sad", "Xafaman", "Мне грустно", "😢", "descriptor"],
      ["angry", "Jahlim chiqdi", "Я злюсь", "😠", "descriptor"],
      ["scared", "Qo'rqdim", "Мне страшно", "😨", "descriptor"],
      ["sick", "Kasalman", "Я болею", "🤒", "descriptor"],
      ["bored", "Zerikdim", "Мне скучно", "😐", "descriptor"],
      ["surprised", "Hayron qoldim", "Я удивлён", "😮", "descriptor"],
      ["calm", "Tinchman", "Я спокоен", "😌", "descriptor"],
      ["love", "Yaxshi ko'raman", "Люблю", "❤️", "verb"],
    ],
  },
  {
    slug: "oyinlar",
    emoji: "🧸",
    titleUz: "O'yinlar",
    titleRu: "Игры",
    cards: [
      ["play", "O'ynayman", "Играть", "🎲", "verb"],
      ["ball", "Koptok", "Мяч", "⚽", "noun"],
      ["toy-car", "Mashinacha", "Машинка", "🚗", "noun"],
      ["blocks", "Kubiklar", "Кубики", "🧱", "noun"],
      ["draw", "Rasm chizaman", "Рисовать", "🖍️", "verb"],
      ["book", "Kitob", "Книга", "📖", "noun"],
      ["cartoon", "Multfilm", "Мультфильм", "📺", "noun"],
      ["phone", "Telefon", "Телефон", "📱", "noun"],
      ["music", "Musiqa", "Музыка", "🎵", "noun"],
      ["bubbles", "Pufakcha", "Мыльные пузыри", "🫧", "noun"],
      ["doll", "Qo'g'irchoq", "Кукла", "🪆", "noun"],
      ["puzzle", "Pazl", "Пазл", "🧩", "noun"],
      ["bike", "Velosiped", "Велосипед", "🚲", "noun"],
    ],
  },
  {
    slug: "odamlar",
    emoji: "👨‍👩‍👧",
    titleUz: "Odamlar",
    titleRu: "Люди",
    cards: [
      ["mom", "Oyim", "Мама", "👩", "pronoun"],
      ["dad", "Dadam", "Папа", "👨", "pronoun"],
      ["grandma", "Buvim", "Бабушка", "👵", "pronoun"],
      ["grandpa", "Bobom", "Дедушка", "👴", "pronoun"],
      ["brother", "Akam", "Брат", "👦", "pronoun"],
      ["sister", "Opam", "Сестра", "👧", "pronoun"],
      ["baby", "Ukam", "Малыш", "👶", "pronoun"],
      ["teacher", "O'qituvchi", "Учитель", "🧑‍🏫", "pronoun"],
      ["friend", "Do'stim", "Друг", "🧒", "pronoun"],
      ["doctor", "Shifokor", "Врач", "🧑‍⚕️", "pronoun"],
    ],
  },
  {
    slug: "joylar",
    emoji: "🏠",
    titleUz: "Joylar",
    titleRu: "Места",
    cards: [
      ["home", "Uy", "Дом", "🏠", "noun"],
      ["kindergarten", "Bog'cha", "Детский сад", "🏫", "noun"],
      ["school", "Maktab", "Школа", "🎒", "noun"],
      ["playground", "O'yin maydoni", "Площадка", "🛝", "noun"],
      ["park", "Bog'", "Парк", "🏞️", "noun"],
      ["shop", "Do'kon", "Магазин", "🏪", "noun"],
      ["hospital", "Shifoxona", "Больница", "🏥", "noun"],
      ["bathroom", "Vanna", "Ванная", "🛁", "noun"],
      ["kitchen", "Oshxona", "Кухня", "🍳", "noun"],
      ["bed", "Yotoq", "Кровать", "🛏️", "noun"],
      ["car", "Mashina", "Машина", "🚙", "noun"],
    ],
  },
  {
    slug: "harakatlar",
    emoji: "🏃",
    titleUz: "Harakatlar",
    titleRu: "Действия",
    cards: [
      ["open", "Och", "Открой", "📂", "verb"],
      ["close", "Yop", "Закрой", "🚪", "verb"],
      ["look", "Qara", "Смотри", "👀", "verb"],
      ["listen", "Tingla", "Слушай", "👂", "verb"],
      ["sit", "O'tir", "Сядь", "🪑", "verb"],
      ["stand", "Tur", "Встань", "🧍", "verb"],
      ["go", "Boramiz", "Пойдём", "🚶", "verb"],
      ["come", "Kel", "Иди сюда", "🫳", "verb"],
      ["wash", "Yuvinaman", "Помыться", "🧼", "verb"],
      ["dress", "Kiyinaman", "Одеться", "👕", "verb"],
      ["jump", "Sakrayman", "Прыгать", "🤸", "verb"],
      ["run", "Yuguraman", "Бегать", "🏃", "verb"],
    ],
  },
  {
    slug: "muloqot",
    emoji: "👋",
    titleUz: "Muloqot",
    titleRu: "Общение",
    cards: [
      ["hello", "Salom", "Привет", "👋", "social"],
      ["bye", "Xayr", "Пока", "🤚", "social"],
      ["thanks", "Rahmat", "Спасибо", "🙏", "social"],
      ["please", "Iltimos", "Пожалуйста", "🥺", "social"],
      ["sorry", "Kechirasiz", "Извините", "😔", "social"],
      ["good", "Yaxshi", "Хорошо", "👌", "descriptor"],
      ["dont-know", "Bilmayman", "Не знаю", "🤷", "negation"],
      ["wait", "Kutib tur", "Подожди", "⏳", "verb"],
      ["my-turn", "Mening navbatim", "Моя очередь", "🙋‍♂️", "social"],
      ["your-turn", "Sening navbating", "Твоя очередь", "🫵", "social"],
    ],
  },
  {
    slug: "savollar",
    emoji: "❓",
    titleUz: "Savollar",
    titleRu: "Вопросы",
    cards: [
      ["what", "Nima?", "Что?", "❓", "question"],
      ["where", "Qayerda?", "Где?", "📍", "question"],
      ["who", "Kim?", "Кто?", "🧑", "question"],
      ["when", "Qachon?", "Когда?", "🕐", "question"],
      ["why", "Nega?", "Почему?", "🤔", "question"],
      ["can-i", "Mumkinmi?", "Можно?", "🆗", "question"],
    ],
  },
];

async function audioUrl(lang, id) {
  if (!AUDIO_DIR) return null;
  const info = await stat(path.join(AUDIO_DIR, lang, `${id}.mp3`)).catch(() => null);
  return info?.isFile() ? `/api/media/local/aac/${lang}/${id}.mp3` : null;
}

let total = 0;
let withAudio = 0;

for (const [order, { cards, core = false, ...data }] of CATEGORIES.entries()) {
  const category = await prisma.aacCategory.upsert({
    where: { slug: data.slug },
    create: { ...data, order },
    update: { ...data, order },
  });

  for (const [i, [key, titleUz, titleRu, emoji, wordType, speakUz = null, speakRu = null]] of cards.entries()) {
    const id = `aac-${key}`;
    const [audioUzUrl, audioRuUrl] = await Promise.all([audioUrl("uz", id), audioUrl("ru", id)]);
    if (audioUzUrl) withAudio++;
    const fields = { categoryId: category.id, titleUz, titleRu, speakUz, speakRu, emoji, wordType, core, order: i, audioUzUrl, audioRuUrl };
    await prisma.aacCard.upsert({ where: { id }, create: { id, ...fields }, update: fields });
    total++;
  }
  console.log(`✓ ${data.titleUz}: ${cards.length} ta karta`);
}

console.log(`\nJami: ${total} ta karta, o'zbekcha ovozi bor: ${withAudio}`);
await prisma.$disconnect();
