/*
 * Skrining testi v3 — savollar banki.
 *
 * Tuzilma DSM-5 dagi autizm mezonlari bo'yicha (tashxis mezonlarining tuzilishi, matni emas):
 *   A. Ijtimoiy muloqot — ijtimoiy-emotsional o'zaro munosabat, imo-ishora va birgalikdagi diqqat, nutq, o'yin;
 *   B. Cheklangan va takroriy xatti-harakatlar — takroriy harakatlar, o'zgarishlarga moslashish, sezgi reaksiyalari.
 * Yoshga mos bosqichlar CDC "Learn the Signs. Act Early" (2022, davlat mulki) rivojlanish bosqichlaridan,
 * xavf belgilari AAP/AAN tavsiyalaridan (regress, 16 oyda so'z yo'qligi, 24 oyda ikki so'zli ibora yo'qligi) olingan.
 * Usullar (muhim savollar, aniqlashtiruvchi savollar, "bilmayman" javobi) xalqaro skrining amaliyotidan.
 * Barcha savollar shu loyiha uchun o'z so'zlarimiz bilan yozilgan — boshqa testlardan ko'chirilmagan.
 *
 * DIQQAT: chegaralar (score.ts) mutaxassislar bilan ilmiy tekshiruvdan o'tguncha dastlabki hisoblanadi.
 * Batafsil: docs/skrining-v3.md
 */

export type Text = { uz: string; ru: string };
const L = (uz: string, ru: string): Text => ({ uz, ru });

/** Yosh guruhi: 16–30 oy, 31–59 oy (2,5–5 yosh), 60 oy va undan katta (5–10 yosh). */
export type Band = "toddler" | "preschool" | "school";
export const BANDS: Band[] = ["toddler", "preschool", "school"];

export type SectionId = "social" | "joint" | "communication" | "play" | "repetitive" | "sameness" | "sensory" | "history";

/** Bo'limlar: birinchi to'rttasi — ijtimoiy muloqot (A), keyingi uchtasi — takroriy xatti-harakatlar (B). */
export const SECTIONS: { id: SectionId; domain: "sc" | "rrb" | "history"; emoji: string; title: Text; intro: Text }[] = [
  {
    id: "social",
    domain: "sc",
    emoji: "🤝",
    title: L("Ijtimoiy aloqa va emotsiyalar", "Социальный контакт и эмоции"),
    intro: L(
      "Bolangiz siz va boshqalar bilan qanday bog'lanadi: qarash, jilmayish, xursandchilikni bo'lishish, boshqalarning his-tuyg'ulariga javob berish.",
      "Как ребёнок взаимодействует с вами и другими: взгляд, улыбка, желание разделить радость, реакция на чувства других.",
    ),
  },
  {
    id: "joint",
    domain: "sc",
    emoji: "👉",
    title: L("Birgalikdagi diqqat va imo-ishoralar", "Совместное внимание и жесты"),
    intro: L(
      "Bolangiz sizning diqqatingizni biror narsaga qarata oladimi va siz ko'rsatgan narsaga qaraydimi. Bu — nutqdan oldin rivojlanadigan eng muhim ko'nikmalardan biri.",
      "Может ли ребёнок привлечь ваше внимание к чему-то и смотрит ли туда, куда показываете вы. Это один из важнейших навыков, развивающихся ещё до речи.",
    ),
  },
  {
    id: "communication",
    domain: "sc",
    emoji: "💬",
    title: L("Nutq va muloqot", "Речь и общение"),
    intro: L(
      "Bolangiz gapni qanday tushunadi, ismiga javob beradimi va o'z fikrini qanday bildiradi.",
      "Как ребёнок понимает речь, откликается ли на имя и как выражает свои мысли.",
    ),
  },
  {
    id: "play",
    domain: "sc",
    emoji: "🧸",
    title: L("O'yin va taqlid", "Игра и подражание"),
    intro: L(
      "Bolangiz qanday o'ynaydi: taqlid qiladimi, «go'yoki» o'yinlar o'ynaydimi, boshqalar bilan birga o'ynay oladimi.",
      "Как ребёнок играет: подражает ли, играет ли «понарошку», может ли играть вместе с другими.",
    ),
  },
  {
    id: "repetitive",
    domain: "rrb",
    emoji: "🔁",
    title: L("Takroriy harakatlar va qiziqishlar", "Повторяющееся поведение и интересы"),
    intro: L(
      "Ba'zi bolalar bir xil harakatni takrorlaydi yoki bitta narsaga juda qattiq qiziqadi. Bu yerda shuni baholaymiz.",
      "Некоторые дети повторяют одни и те же движения или очень сильно увлечены чем-то одним. Здесь мы оцениваем это.",
    ),
  },
  {
    id: "sameness",
    domain: "rrb",
    emoji: "🧩",
    title: L("O'zgarishlarga moslashish", "Приспособление к изменениям"),
    intro: L(
      "Kun tartibi, joy yoki odatlar o'zgarganda bolangiz qanday qabul qiladi.",
      "Как ребёнок воспринимает изменения распорядка, обстановки или привычек.",
    ),
  },
  {
    id: "sensory",
    domain: "rrb",
    emoji: "👂",
    title: L("Sezgi reaksiyalari", "Сенсорные реакции"),
    intro: L(
      "Ovoz, yorug'lik, teginish, hid va ta'mga bolangiz qanday javob beradi.",
      "Как ребёнок реагирует на звуки, свет, прикосновения, запахи и вкусы.",
    ),
  },
  {
    id: "history",
    domain: "history",
    emoji: "📅",
    title: L("Rivojlanish tarixi", "История развития"),
    intro: L(
      "Oxirgi savol bolangiz rivojlanishidagi muhim o'zgarish haqida. Bu savol ballga qo'shilmaydi, lekin juda muhim.",
      "Последний вопрос — о важном изменении в развитии ребёнка. Он не входит в балл, но очень важен.",
    ),
  },
];

/** Javob shkalasi (oxirgi 1 oy bo'yicha). -1 — "Bilmayman / kuzatmaganman": ballga ta'sir qilmaydi. */
export type FreqAnswer = 0 | 1 | 2 | 3 | -1;

export const FREQ_SCALE: { value: 0 | 1 | 2 | 3; label: Text }[] = [
  { value: 0, label: L("Hech qachon", "Никогда") },
  { value: 1, label: L("Ba'zan", "Иногда") },
  { value: 2, label: L("Ko'pincha", "Часто") },
  { value: 3, label: L("Deyarli doim", "Почти всегда") },
];

export const YESNO_SCALE: { value: 0 | 3; label: Text }[] = [
  { value: 3, label: L("Ha", "Да") },
  { value: 0, label: L("Yo'q", "Нет") },
];

export const UNKNOWN_LABEL = L("Bilmayman / kuzatmaganman", "Не знаю / не наблюдал(а)");

export type Item = {
  id: string;
  section: SectionId;
  /** skill — ko'nikma (ko'p bo'lsa yaxshi), concern — belgi (ko'p bo'lsa e'tibor kerak) */
  direction: "skill" | "concern";
  kind?: "freq" | "yesno";
  bands: Band[];
  /** Faqat shu oydan katta bolalarga beriladi (masalan, ikki so'zli ibora — 24 oydan) */
  minMonths?: number;
  /** Muhim savol: bunda qiyinchilik bo'lsa — alohida hisobga olinadi */
  critical?: Band[];
  /** Regress — natijadan qat'i nazar mutaxassisga yo'llanadi */
  urgent?: boolean;
  text: Text;
  example?: Text;
  /**
   * Aniqlashtiruvchi savollar: muhim ko'nikma bo'yicha "Hech qachon/Ba'zan" deyilsa so'raladi.
   * Birortasiga "Ha" deyilsa — ko'nikma bor deb hisoblanadi (noto'g'ri xavotirni kamaytiradi).
   */
  followUp?: Text[];
};

const ALL: Band[] = ["toddler", "preschool", "school"];
const TP: Band[] = ["toddler", "preschool"];
const PS: Band[] = ["preschool", "school"];

export const ITEMS: Item[] = [
  /* ------------------------- Ijtimoiy aloqa va emotsiyalar ------------------------- */
  {
    id: "SOC_EYE",
    section: "social",
    direction: "skill",
    bands: ALL,
    critical: ALL,
    text: L(
      "Siz bolangiz bilan gaplashganingizda yoki o'ynaganingizda u yuzingizga qaraydimi?",
      "Смотрит ли ребёнок вам в лицо, когда вы с ним разговариваете или играете?",
    ),
    example: L(
      "Masalan: ovqatlantirganda, kiyintirganda yoki birga kulishganda ko'zingizga qaraydi.",
      "Например: смотрит вам в глаза, когда вы его кормите, одеваете или вместе смеётесь.",
    ),
    followUp: [
      L("U bilan birga kulib o'ynaganingizda (masalan, qitiqlaganda) yuzingizga qaraydimi?", "Смотрит ли он вам в лицо, когда вы весело играете вместе (например, щекочете)?"),
      L("Biror narsa so'rab kelganda yuzingizga qaraydimi?", "Смотрит ли он вам в лицо, когда подходит что-то попросить?"),
    ],
  },
  {
    id: "SOC_SMILE",
    section: "social",
    direction: "skill",
    bands: ALL,
    critical: ["toddler"],
    text: L("Siz unga qarab jilmaysangiz, bolangiz ham sizga qarab jilmayadimi?", "Если вы улыбаетесь ребёнку, улыбается ли он вам в ответ?"),
  },
  {
    id: "SOC_SHARE_JOY",
    section: "social",
    direction: "skill",
    bands: ALL,
    critical: ["preschool"],
    text: L(
      "Bolangiz biror narsadan xursand bo'lsa, xursandchiligini siz bilan bo'lishishga harakat qiladimi?",
      "Если ребёнок чему-то радуется, старается ли он разделить эту радость с вами?",
    ),
    example: L(
      "Masalan: kulib sizga qaraydi, oldingizga yuguradi yoki «qarang!» degandek ko'rsatadi.",
      "Например: смеясь, смотрит на вас, подбегает или показывает, будто говорит «смотри!».",
    ),
  },
  {
    id: "SOC_EMPATHY",
    section: "social",
    direction: "skill",
    bands: ALL,
    critical: ["school"],
    text: L(
      "Siz yoki boshqa yaqin odam xafa bo'lsa yoki yig'lasa, bolangiz buni sezib, qandaydir javob qaytaradimi?",
      "Если вы или кто-то из близких расстроены или плачете, замечает ли это ребёнок и как-то реагирует?",
    ),
    example: L(
      "Masalan: yaqin keladi, yuzingizga qaraydi, quchoqlaydi yoki o'yinchog'ini beradi.",
      "Например: подходит ближе, смотрит вам в лицо, обнимает или даёт свою игрушку.",
    ),
  },
  {
    id: "SOC_GREET",
    section: "social",
    direction: "skill",
    bands: TP,
    text: L(
      "Bolangiz tanish odamlar bilan salomlashganda yoki xayrlashganda qo'l silkitadimi yoki boshqa yo'l bilan javob beradimi?",
      "Машет ли ребёнок рукой или как-то иначе отвечает, когда здоровается или прощается со знакомыми?",
    ),
  },
  {
    id: "SOC_PEERS",
    section: "social",
    direction: "skill",
    bands: PS,
    text: L(
      "Bolangiz boshqa bolalar bilan o'ynashga qiziqadimi va ularga o'zi yaqinlashadimi?",
      "Интересно ли ребёнку играть с другими детьми, подходит ли он к ним сам?",
    ),
  },
  {
    id: "SOC_FRIEND",
    section: "social",
    direction: "skill",
    bands: ["school"],
    text: L(
      "Bolangizning o'z yoshidagi do'sti bormi va u bilan birga o'ynashni yoqtiradimi?",
      "Есть ли у ребёнка друг-ровесник, с которым ему нравится играть?",
    ),
  },
  {
    id: "SOC_UNDERSTAND",
    section: "social",
    direction: "skill",
    bands: ["school"],
    text: L(
      "Bolangiz suhbatdoshining holatini (zerikkani, xafa bo'lgani yoki hazillashayotganini) tushunadimi?",
      "Понимает ли ребёнок состояние собеседника (что тому скучно, он расстроен или шутит)?",
    ),
  },

  /* --------------------- Birgalikdagi diqqat va imo-ishoralar --------------------- */
  {
    id: "JA_POINT",
    section: "joint",
    direction: "skill",
    bands: TP,
    critical: TP,
    text: L(
      "Bolangiz biror narsani ko'rsatish yoki so'rash uchun barmog'i bilan ishora qiladimi?",
      "Показывает ли ребёнок пальцем, чтобы что-то показать или попросить?",
    ),
    example: L(
      "Masalan: javondagi o'yinchoqni yoki osmondagi samolyotni barmog'i bilan ko'rsatadi.",
      "Например: показывает пальцем на игрушку на полке или на самолёт в небе.",
    ),
    followUp: [
      L("Qo'li yetmaydigan narsani xohlasa, unga barmog'i yoki butun qo'li bilan ishora qiladimi?", "Если он хочет то, до чего не может дотянуться, показывает ли он на это пальцем или всей рукой?"),
      L("Qiziq narsani ko'rsa, uni ko'rsatib sizga qaraydimi?", "Увидев что-то интересное, показывает ли на это и смотрит ли на вас?"),
    ],
  },
  {
    id: "JA_FOLLOW",
    section: "joint",
    direction: "skill",
    bands: TP,
    critical: TP,
    text: L(
      "Xonaning narigi tomonidagi narsani barmog'ingiz bilan ko'rsatsangiz, bolangiz o'sha tomonga qaraydimi?",
      "Если вы показываете пальцем на что-то в другом конце комнаты, смотрит ли ребёнок туда?",
    ),
    followUp: [
      L("Siz ko'rsatgan narsaga qarab, uni nomlaydi yoki unga qarab yuradimi?", "Посмотрев туда, куда вы показали, называет ли он этот предмет или идёт к нему?"),
      L("«Qara!» deb ko'rsatsangiz, qo'lingizga emas, siz ko'rsatgan narsaga qaraydimi?", "Если вы говорите «смотри!» и показываете, смотрит ли он на предмет, а не на вашу руку?"),
    ],
  },
  {
    id: "JA_SHOW",
    section: "joint",
    direction: "skill",
    bands: ALL,
    critical: ALL,
    text: L(
      "Bolangiz qiziq narsa topsa, uni sizga ko'rsatish uchun olib keladimi yoki ko'tarib ko'rsatadimi (yordam so'rash uchun emas, shunchaki ko'rsatish uchun)?",
      "Если ребёнок находит что-то интересное, приносит ли или поднимает, чтобы показать вам (не за помощью, а просто показать)?",
    ),
  },
  {
    id: "JA_HAND_LEAD",
    section: "joint",
    direction: "concern",
    bands: TP,
    text: L(
      "Bolangiz biror narsani xohlaganda, hech narsa demay va yuzingizga qaramay, qo'lingizdan tortib o'sha narsaga olib boradimi?",
      "Когда ребёнок чего-то хочет, тянет ли он вас за руку к этому предмету, ничего не говоря и не глядя вам в лицо?",
    ),
  },
  {
    id: "JA_NOD",
    section: "joint",
    direction: "skill",
    bands: ALL,
    minMonths: 18,
    text: L(
      "Bolangiz «ha» yoki «yo'q»ni boshini irg'atib yoki chayqab bildiradimi?",
      "Показывает ли ребёнок «да» или «нет» кивком или покачиванием головы?",
    ),
  },
  {
    id: "JA_GESTURES",
    section: "joint",
    direction: "skill",
    bands: ["school"],
    text: L(
      "Gaplashayotganda bolangiz yuz ifodasi va imo-ishoralardan (qo'l harakati, bosh irg'atish) foydalanadimi?",
      "Использует ли ребёнок мимику и жесты (движения рук, кивки), когда разговаривает?",
    ),
  },

  /* ------------------------------- Nutq va muloqot ------------------------------- */
  {
    id: "COM_NAME",
    section: "communication",
    direction: "skill",
    bands: ALL,
    critical: ALL,
    text: L(
      "Bolangizni (u sizni ko'rmay turganda) ismi bilan chaqirsangiz, u qayrilib qaraydimi yoki javob beradimi?",
      "Если позвать ребёнка по имени, когда он вас не видит, оборачивается ли он или отзывается?",
    ),
    example: L(
      "Agar bola ko'pincha javob bermasa, eshitish qobiliyatini ham tekshirtirish tavsiya etiladi.",
      "Если ребёнок часто не откликается, рекомендуется также проверить слух.",
    ),
    followUp: [
      L("Shovqinsiz xonada ismini aytsangiz, sizga qaraydimi?", "Если в тихой комнате вы зовёте его по имени, смотрит ли он на вас?"),
      L("Ismini aytganingizda qilayotgan ishini to'xtatib, sizga e'tibor beradimi?", "Когда вы называете его имя, прекращает ли он своё занятие и обращает на вас внимание?"),
    ],
  },
  {
    id: "COM_FOLLOW_CMD",
    section: "communication",
    direction: "skill",
    bands: ["toddler"],
    text: L(
      "Bolangiz oddiy ko'rsatmalarni qo'l bilan ko'rsatmasangiz ham tushunib bajaradimi?",
      "Выполняет ли ребёнок простые просьбы, даже если вы не показываете жестом?",
    ),
    example: L("Masalan: «Koptokni ber», «Tuflingni olib kel».", "Например: «Дай мячик», «Принеси туфли»."),
  },
  {
    id: "COM_WORDS",
    section: "communication",
    direction: "skill",
    bands: ["toddler"],
    minMonths: 16,
    critical: ["toddler"],
    text: L(
      "Bolangiz bir nechta so'zni (masalan, «ona», «ber», «suv») ma'nosini tushunib ishlatadimi?",
      "Использует ли ребёнок несколько слов осмысленно (например, «мама», «дай», «вода»)?",
    ),
  },
  {
    id: "COM_PHRASES",
    section: "communication",
    direction: "skill",
    bands: ["toddler"],
    minMonths: 24,
    critical: ["toddler"],
    text: L(
      "Bolangiz ikki so'zli iboralarni o'zi tuzib aytadimi (eshitganini takrorlash emas)?",
      "Составляет ли ребёнок сам фразы из двух слов (не просто повторяет услышанное)?",
    ),
    example: L("Masalan: «Ona, ber», «Mashina ketdi», «Yana suv».", "Например: «Мама, дай», «Машина уехала», «Ещё воды»."),
  },
  {
    id: "COM_TELL",
    section: "communication",
    direction: "skill",
    bands: PS,
    text: L(
      "Bolangiz o'zi ko'rgan yoki qilgan narsasi haqida sizga gapirib (yoki ko'rsatib) beradimi?",
      "Рассказывает (или показывает) ли ребёнок вам о том, что видел или делал?",
    ),
  },
  {
    id: "COM_QUESTIONS",
    section: "communication",
    direction: "skill",
    bands: PS,
    text: L(
      "Bolangiz «Nima?», «Qayerda?», «Kim?» kabi savollarga mos javob beradimi?",
      "Отвечает ли ребёнок по смыслу на вопросы «Что?», «Где?», «Кто?»?",
    ),
  },
  {
    id: "COM_ECHO",
    section: "communication",
    direction: "concern",
    bands: PS,
    text: L(
      "Bolangiz eshitgan so'z, ibora yoki multfilmdagi gaplarni o'rinsiz, ma'nosiz takrorlaydimi?",
      "Повторяет ли ребёнок услышанные слова, фразы или реплики из мультфильмов не к месту, без смысла?",
    ),
  },
  {
    id: "COM_CONVERSATION",
    section: "communication",
    direction: "skill",
    bands: ["school"],
    critical: ["school"],
    text: L(
      "Bolangiz suhbatni navbatma-navbat davom ettira oladimi (siz gapirasiz — u javob beradi, u gapiradi — siz javob berasiz)?",
      "Может ли ребёнок поддерживать разговор по очереди (вы говорите — он отвечает, он говорит — вы отвечаете)?",
    ),
  },
  {
    id: "COM_ONE_TOPIC",
    section: "communication",
    direction: "concern",
    bands: ["school"],
    text: L(
      "Bolangiz faqat o'zini qiziqtirgan mavzuda gapirib, suhbatdoshining qiziqishiga e'tibor bermaydimi?",
      "Говорит ли ребёнок только на интересующую его тему, не обращая внимания на интерес собеседника?",
    ),
  },
  {
    id: "COM_PROSODY",
    section: "communication",
    direction: "concern",
    bands: ["school"],
    text: L(
      "Bolangizning gapirish ohangi g'ayrioddiymi (juda bir xil, «robotga o'xshash» yoki kattalardek rasmiy)?",
      "Необычна ли интонация речи ребёнка (очень монотонная, «как у робота» или слишком официальная, как у взрослого)?",
    ),
  },

  /* ------------------------------- O'yin va taqlid ------------------------------- */
  {
    id: "PLAY_IMITATE",
    section: "play",
    direction: "skill",
    bands: TP,
    critical: TP,
    text: L(
      "Bolangiz sizning harakatlaringizni taqlid qiladimi?",
      "Подражает ли ребёнок вашим действиям?",
    ),
    example: L(
      "Masalan: qarsak chalsangiz, qo'l silkitsangiz yoki kulgili yuz qilsangiz, u ham takrorlaydi.",
      "Например: если вы хлопаете в ладоши, машете рукой или корчите смешную рожицу, он повторяет.",
    ),
    followUp: [
      L("Uy ishlaringizni (supurish, telefonda gaplashish) o'yinda takrorlaydimi?", "Повторяет ли он в игре ваши домашние дела (подметает, «говорит по телефону»)?"),
      L("Siz chiqargan tovush yoki so'zni takrorlashga harakat qiladimi?", "Пытается ли он повторить звук или слово за вами?"),
    ],
  },
  {
    id: "PLAY_PRETEND",
    section: "play",
    direction: "skill",
    bands: TP,
    minMonths: 18,
    critical: ["preschool"],
    text: L(
      "Bolangiz «go'yoki» o'ynaydimi?",
      "Играет ли ребёнок «понарошку»?",
    ),
    example: L(
      "Masalan: qo'g'irchoqni ovqatlantiradi, kubikni telefon qilib «gaplashadi» yoki bo'sh piyoladan «ichadi».",
      "Например: кормит куклу, «говорит» по кубику как по телефону или «пьёт» из пустой чашки.",
    ),
  },
  {
    id: "PLAY_SOCIAL_GAMES",
    section: "play",
    direction: "skill",
    bands: TP,
    text: L(
      "Bolangiz siz bilan «ku-ku» yoki quvlashmachoq kabi o'yinlarni yoqtiradimi va yana o'ynashni so'raydimi?",
      "Нравятся ли ребёнку игры с вами вроде «ку-ку» или догонялок, просит ли он поиграть ещё?",
    ),
  },
  {
    id: "PLAY_TURNS",
    section: "play",
    direction: "skill",
    bands: PS,
    critical: ["school"],
    text: L(
      "Bolangiz boshqa bola yoki kattalar bilan navbatma-navbat o'ynay oladimi?",
      "Может ли ребёнок играть по очереди с другим ребёнком или взрослым?",
    ),
  },
  {
    id: "PLAY_ROLES",
    section: "play",
    direction: "skill",
    bands: PS,
    text: L(
      "Bolangiz rolli o'yinlar (do'kon, shifokor, oshpaz va h.k.) o'ynaydimi va o'yinga yangi g'oyalar qo'shadimi?",
      "Играет ли ребёнок в сюжетно-ролевые игры (магазин, врач, повар и т. п.) и придумывает ли новое?",
    ),
  },
  {
    id: "PLAY_RULES",
    section: "play",
    direction: "skill",
    bands: ["school"],
    text: L(
      "Bolangiz qoidali o'yinlarda (berkinmachoq, quvlashmachoq, stol o'yinlari) qoidaga amal qilib qatnasha oladimi?",
      "Может ли ребёнок участвовать в играх с правилами (прятки, догонялки, настольные игры), соблюдая правила?",
    ),
  },

  /* ---------------------- Takroriy harakatlar va qiziqishlar ---------------------- */
  {
    id: "RRB_MOTOR",
    section: "repetitive",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz qo'llarini silkitish, barmoqlarini ko'z oldida qimirlatish, aylanish yoki tebranish kabi bir xil harakatlarni takrorlaydimi?",
      "Повторяет ли ребёнок одни и те же движения: машет руками, шевелит пальцами перед глазами, кружится или раскачивается?",
    ),
  },
  {
    id: "RRB_OBJECTS",
    section: "repetitive",
    direction: "concern",
    bands: TP,
    text: L(
      "Bolangiz o'yinchoqlar bilan g'ayrioddiy usulda o'ynaydimi?",
      "Играет ли ребёнок с игрушками необычным образом?",
    ),
    example: L(
      "Masalan: mashinaning faqat g'ildiragini aylantiradi, narsalarni qatorga teraveradi yoki eshikni ochib-yopaveradi.",
      "Например: только крутит колёса машинки, выстраивает предметы в ряд или постоянно открывает-закрывает дверь.",
    ),
  },
  {
    id: "RRB_INTEREST",
    section: "repetitive",
    direction: "concern",
    bands: PS,
    text: L(
      "Bolangiz bitta mavzu yoki narsaga (raqamlar, harflar, poyezdlar, xaritalar va h.k.) shunchalik qiziqadiki, boshqa narsalarga deyarli e'tibor bermaydimi?",
      "Настолько ли ребёнок увлечён одной темой или предметом (цифры, буквы, поезда, карты и т. п.), что почти не обращает внимания на другое?",
    ),
  },
  {
    id: "RRB_ATTACH",
    section: "repetitive",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz g'ayrioddiy narsalarga (ip, kalit, tayoqcha, qopqoq) qattiq bog'lanib, ularni doim qo'lida olib yuradimi?",
      "Сильно ли ребёнок привязан к необычным предметам (верёвочка, ключ, палочка, крышка) и постоянно носит их с собой?",
    ),
  },

  /* ------------------------- O'zgarishlarga moslashish ------------------------- */
  {
    id: "SAME_ROUTINE",
    section: "sameness",
    direction: "concern",
    bands: ALL,
    text: L(
      "Kundalik tartib biroz o'zgarsa (boshqa yo'ldan yurish, mebel joyi o'zgarishi), bolangiz qattiq bezovta bo'ladimi?",
      "Сильно ли расстраивается ребёнок при небольших изменениях распорядка (другая дорога, перестановка мебели)?",
    ),
  },
  {
    id: "SAME_TRANSITION",
    section: "sameness",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz bir mashg'ulotdan boshqasiga o'tishda (masalan, o'yindan ovqatga) juda qiynaladimi?",
      "Очень ли трудно ребёнку переключаться с одного занятия на другое (например, от игры к еде)?",
    ),
  },
  {
    id: "SAME_ORDER",
    section: "sameness",
    direction: "concern",
    bands: PS,
    text: L(
      "Bolangiz ishlar faqat ma'lum tartibda bajarilishini talab qiladimi va tartib buzilsa uzoq vaqt tinchlanmaydimi?",
      "Требует ли ребёнок, чтобы всё делалось строго в определённом порядке, и долго ли не успокаивается, если порядок нарушен?",
    ),
  },
  {
    id: "SAME_FOOD",
    section: "sameness",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz faqat bir xil ovqat yoki kiyimni tanlab, yangisini qat'iy rad etadimi?",
      "Выбирает ли ребёнок только одну и ту же еду или одежду, категорически отказываясь от новой?",
    ),
  },

  /* ------------------------------ Sezgi reaksiyalari ------------------------------ */
  {
    id: "SENS_SOUND",
    section: "sensory",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz kundalik ovozlardan (changyutgich, fen, bolalar shovqini) quloqlarini berkitadimi yoki qattiq bezovta bo'ladimi?",
      "Закрывает ли ребёнок уши или сильно расстраивается от обычных звуков (пылесос, фен, детский шум)?",
    ),
  },
  {
    id: "SENS_PAIN",
    section: "sensory",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz og'riq, sovuq yoki issiqni odatdagidan ancha kam sezadigandek tuyuladimi?",
      "Кажется ли, что ребёнок чувствует боль, холод или жару гораздо слабее обычного?",
    ),
  },
  {
    id: "SENS_EXPLORE",
    section: "sensory",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz narsalarni g'ayrioddiy darajada hidlaydimi, yalaydimi yoki uzoq vaqt silab-ushlab ko'radimi?",
      "Необычно ли часто ребёнок нюхает, лижет предметы или подолгу их ощупывает?",
    ),
  },
  {
    id: "SENS_VISUAL",
    section: "sensory",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz aylanayotgan narsalarni, o'chib-yonayotgan chiroqni yoki narsalarning chetini ko'z qiri bilan uzoq tomosha qiladimi?",
      "Подолгу ли ребёнок разглядывает вращающиеся предметы, мигающий свет или смотрит на края предметов боковым зрением?",
    ),
  },
  {
    id: "SENS_CARE",
    section: "sensory",
    direction: "concern",
    bands: ALL,
    text: L(
      "Bolangiz soch oldirish, tirnoq olish, yuvinish yoki ayrim kiyimlarni kiyishga juda qattiq qarshilik qiladimi?",
      "Очень ли сильно ребёнок сопротивляется стрижке, подстриганию ногтей, мытью или некоторой одежде?",
    ),
  },

  /* ------------------------------ Rivojlanish tarixi ------------------------------ */
  {
    id: "HIST_REGRESSION",
    section: "history",
    direction: "concern",
    kind: "yesno",
    bands: ALL,
    urgent: true,
    text: L(
      "Bolangiz avval bilgan so'zlarini yoki ko'nikmalarini (qarash, qo'l silkitish, o'ynash) keyinchalik yo'qotganmi?",
      "Терял ли ребёнок слова или навыки, которые уже умел (смотреть в глаза, махать рукой, играть)?",
    ),
    example: L(
      "Masalan: 1,5 yoshda 10 ta so'z aytardi, keyin gapirmay qo'ydi.",
      "Например: в 1,5 года говорил 10 слов, а потом перестал.",
    ),
  },
];

/** Bolaning yoshi (oy) bo'yicha yosh guruhi. 16 oydan kichik bolalar uchun skrining o'tkazilmaydi — null. */
export function bandForMonths(months: number): Band | null {
  if (months < 16) return null;
  if (months <= 30) return "toddler";
  if (months <= 59) return "preschool";
  return "school";
}

/** Shu bola uchun savollar — bo'limlar tartibida. */
export function itemsFor(band: Band, months: number): Item[] {
  const order = new Map(SECTIONS.map((s, i) => [s.id, i]));
  return ITEMS.filter((i) => i.bands.includes(band) && (i.minMonths === undefined || months >= i.minMonths)).sort(
    (a, b) => (order.get(a.section) ?? 0) - (order.get(b.section) ?? 0),
  );
}

export const BAND_LABEL: Record<Band, Text> = {
  toddler: L("16–30 oylik bolalar uchun", "Для детей 16–30 месяцев"),
  preschool: L("2,5–5 yoshli bolalar uchun", "Для детей 2,5–5 лет"),
  school: L("5–10 yoshli bolalar uchun", "Для детей 5–10 лет"),
};
