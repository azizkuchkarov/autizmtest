/*
 * Oylik ko'nikmalar testi — mashg'ulotlar natijasini o'lchash uchun (skrining emas).
 * Bo'limlar "Bugungi 5 daqiqa" mashqlaridagi ko'nikmalar bilan bir xil (PlaySkill), shuning uchun
 * "oldin → keyin" o'zgarishini shu davrda bajarilgan mashqlar bilan solishtirish mumkin.
 * Savollar ota-ona orqali olib boriladigan erta aralashuv dasturlarining (WHO CST, JASPER, ESDM) maqsad
 * ko'nikmalari asosida o'z so'zlarimiz bilan yozilgan. Yuqori javob — yaxshi.
 */
import type { Band, Text } from "@/lib/screening-v3/items";

const L = (uz: string, ru: string): Text => ({ uz, ru });

export type SkillSectionId = "attention" | "imitation" | "turns" | "requesting" | "play" | "understanding" | "daily" | "calm";

export const SKILL_SECTIONS: { id: SkillSectionId; emoji: string; title: Text }[] = [
  { id: "attention", emoji: "👀", title: L("Diqqat", "Внимание") },
  { id: "imitation", emoji: "🪞", title: L("Taqlid", "Подражание") },
  { id: "turns", emoji: "🔄", title: L("Navbat bilan o'ynash", "Игра по очереди") },
  { id: "requesting", emoji: "🙋", title: L("So'rash va muloqot", "Просьбы и общение") },
  { id: "play", emoji: "🧸", title: L("O'yin", "Игра") },
  { id: "understanding", emoji: "👂", title: L("Tushunish", "Понимание") },
  { id: "daily", emoji: "🪥", title: L("Mustaqillik", "Самостоятельность") },
  { id: "calm", emoji: "🌿", title: L("Tinchlanish", "Саморегуляция") },
];

export type SkillItem = { id: string; section: SkillSectionId; bands: Band[]; minMonths?: number; text: Text };

const ALL: Band[] = ["toddler", "preschool", "school"];
const PS: Band[] = ["preschool", "school"];

export const SKILL_ITEMS: SkillItem[] = [
  { id: "SK_ATT_PLAY", section: "attention", bands: ALL, text: L("Siz bilan o'ynaganda bolangiz bitta o'yinga kamida 2–3 daqiqa e'tibor qarata oladimi?", "Может ли ребёнок удерживать внимание на одной игре с вами хотя бы 2–3 минуты?") },
  { id: "SK_ATT_LOOK", section: "attention", bands: ALL, text: L("Siz ko'rsatgan narsaga yoki kitobdagi rasmga siz bilan birga qaraydimi?", "Смотрит ли ребёнок вместе с вами на то, что вы показываете, или на картинку в книге?") },
  { id: "SK_ATT_NAME", section: "attention", bands: ALL, text: L("Ismini aytganingizda qilayotgan ishini to'xtatib, sizga qaraydimi?", "Когда вы называете его имя, прекращает ли он занятие и смотрит на вас?") },

  { id: "SK_IMI_ACTION", section: "imitation", bands: ALL, text: L("Oddiy harakatlarni (qarsak, qo'l silkitish, bosh irg'atish) ko'rsatganingizda takrorlaydimi?", "Повторяет ли ребёнок простые движения (хлопки, помахать рукой, кивнуть), когда вы их показываете?") },
  { id: "SK_IMI_SOUND", section: "imitation", bands: ALL, text: L("Siz aytgan tovush yoki so'zni takrorlashga harakat qiladimi?", "Пытается ли он повторить за вами звук или слово?") },
  { id: "SK_IMI_TOY", section: "imitation", bands: ALL, text: L("O'yinchoq bilan qilgan harakatingizni (mashinani yurgizish, qo'g'irchoqni ovqatlantirish) takrorlaydimi?", "Повторяет ли он ваши действия с игрушкой (катает машинку, кормит куклу)?") },

  { id: "SK_TURN_WAIT", section: "turns", bands: ALL, text: L("Navbat bilan o'ynaladigan o'yinlarda (koptok oshirish, kubik terish) navbatini kuta oladimi?", "Может ли он дождаться своей очереди в играх по очереди (катать мяч, строить из кубиков)?") },
  { id: "SK_TURN_ROUNDS", section: "turns", bands: ALL, text: L("Siz bilan ketma-ket 3–4 marta navbatma-navbat o'ynay oladimi?", "Может ли он сыграть с вами по очереди 3–4 раза подряд?") },

  { id: "SK_REQ_WANT", section: "requesting", bands: ALL, text: L("Biror narsani xohlasa, uni so'z, imo-ishora yoki kartochka bilan so'raydimi?", "Просит ли он желаемое словом, жестом или карточкой?") },
  { id: "SK_REQ_HELP", section: "requesting", bands: ALL, text: L("Yordam kerak bo'lsa (qopqoqni ochish, o'yinchoqni olib berish), yordam so'raydimi?", "Просит ли он помощи, когда она нужна (открыть крышку, достать игрушку)?") },
  { id: "SK_REQ_MORE", section: "requesting", bands: ALL, minMonths: 18, text: L("«Yana» yoki «tugadi»ni so'z yoki imo-ishora bilan o'rinli bildiradimi?", "Уместно ли он выражает «ещё» или «всё» словом или жестом?") },

  { id: "SK_PLAY_FUNC", section: "play", bands: ALL, text: L("O'yinchoqlar bilan maqsadiga mos o'ynaydimi (mashinani yurgizadi, kubikdan uy quradi)?", "Играет ли он с игрушками по назначению (катает машинку, строит дом из кубиков)?") },
  { id: "SK_PLAY_JOIN", section: "play", bands: ALL, text: L("Siz bilan birga o'ynashga qiziqadimi va o'yinni o'zi boshlaydimi?", "Интересно ли ему играть с вами, начинает ли он игру сам?") },
  { id: "SK_PLAY_PRETEND", section: "play", bands: PS, text: L("«Go'yoki» o'yinlar o'ynaydimi (qo'g'irchoqni ovqatlantirish, «do'kon» o'yini)?", "Играет ли он «понарошку» (кормит куклу, играет в «магазин»)?") },

  { id: "SK_UND_OBJECTS", section: "understanding", bands: ALL, text: L("Tanish narsalarning nomini aytsangiz (to'p, mushuk, suv), ularni ko'rsata oladimi?", "Может ли он показать знакомые предметы, когда вы их называете (мяч, кошка, вода)?") },
  { id: "SK_UND_SOUNDS", section: "understanding", bands: ALL, text: L("Kundalik tovushlarni (kuchuk, mashina, telefon) tanib, nima ekanini ko'rsatadi yoki aytadimi?", "Узнаёт ли он привычные звуки (собака, машина, телефон) и показывает или называет их источник?") },
  { id: "SK_UND_CMD", section: "understanding", bands: ALL, text: L("Ikki qismli ko'rsatmani bajaradimi (masalan, «Koptokni olib, menga ber»)?", "Выполняет ли он инструкцию из двух шагов (например, «Возьми мяч и дай мне»)?") },

  { id: "SK_DAILY_HELP", section: "daily", bands: ALL, text: L("Kundalik ishlarda (qo'l yuvish, kiyinish, ovqatlanish) o'zi bajarishga harakat qiladimi?", "Старается ли он сам выполнять повседневные дела (мыть руки, одеваться, есть)?") },
  { id: "SK_DAILY_TASK", section: "daily", bands: ALL, text: L("Oddiy topshiriqlarni bajaradimi (masalan, «O'yinchoqlarni yig'», «Tuflingni olib kel»)?", "Выполняет ли он простые поручения («Собери игрушки», «Принеси туфли»)?") },

  { id: "SK_CALM_UPSET", section: "calm", bands: ALL, text: L("Xafa bo'lsa yoki jahli chiqsa, sizning yordamingiz bilan 5–10 daqiqada tinchlanadimi?", "Успокаивается ли он с вашей помощью за 5–10 минут, если расстроен или злится?") },
  { id: "SK_CALM_CHANGE", section: "calm", bands: ALL, text: L("Kun tartibi o'zgarganda yoki «yo'q» deyilganda tez tinchlanadimi?", "Быстро ли он успокаивается при смене распорядка или когда ему говорят «нет»?") },
];

export function skillItemsFor(band: Band, months: number): SkillItem[] {
  const order = new Map(SKILL_SECTIONS.map((s, i) => [s.id, i]));
  return SKILL_ITEMS.filter((i) => i.bands.includes(band) && (i.minMonths === undefined || months >= i.minMonths)).sort(
    (a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0),
  );
}

/** Qayta baholash oralig'i: 4 hafta. */
export const SKILLS_INTERVAL_DAYS = 28;
