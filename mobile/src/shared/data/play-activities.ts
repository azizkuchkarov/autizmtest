/*
 * "Bugungi 5 daqiqa": ota-ona va bola uchun kunlik qisqa o'yin mashqlari.
 * Ota-ona orqali olib boriladigan, tabiiy o'yinga asoslangan yondashuvlar (WHO Caregiver Skills Training,
 * JASPER, ESDM, PACT) tamoyillari asosida tuzilgan: bolaning qiziqishiga ergashish, yuzma-yuz o'tirish,
 * kutish va har qanday urinishni darhol rag'batlantirish.
 *
 * Bu fayl web va mobil ilovada bir xil (mobile/src/shared/data/play-activities.ts) — o'zgartirsangiz ikkalasini ham yangilang.
 */

export type PlaySkill = 'attention' | 'imitation' | 'turns' | 'requesting' | 'play' | 'daily' | 'calm';

export const PLAY_SKILLS: PlaySkill[] = ['attention', 'imitation', 'turns', 'requesting', 'play', 'daily', 'calm'];

/** Ko'nikma rangi (kartadagi belgi va filtr uchun) */
export const SKILL_COLORS: Record<PlaySkill, string> = {
  attention: '#2563EB',
  imitation: '#7C3AED',
  turns: '#EA580C',
  requesting: '#DB2777',
  play: '#16A34A',
  daily: '#0891B2',
  calm: '#64748B',
};

export type PlayText = {
  title: string;
  /** Nima uchun kerak — bir gap */
  goal: string;
  materials: string[];
  steps: string[];
  tip: string;
  /** Bola qiynalsa */
  easier: string;
  /** Bola uddalasa */
  harder: string;
};

export type PlayActivity = {
  id: string;
  emoji: string;
  skill: PlaySkill;
  /** Necha yoshdan (yil) */
  minAge: number;
  uz: PlayText;
  ru: PlayText;
};

/** Bir mashq davomiyligi (soniya) */
export const PLAY_SECONDS = 5 * 60;

/** Har bir mashqdan oldin eslatiladigan oltin qoidalar. */
export const PLAY_RULES: { uz: string[]; ru: string[] } = {
  uz: [
    "Bola bilan yuzma-yuz, uning ko'zi darajasida o'tiring",
    "Bolaning qiziqishiga ergashing — o'yinni u tanlasin",
    "Gapirmasdan 5 soniya kuting: bolaga javob berishga imkon bering",
    "Har qanday urinishni darhol maqtang yoki so'raganini bering",
  ],
  ru: [
    'Сядьте лицом к ребёнку, на уровне его глаз',
    'Следуйте за интересом ребёнка — пусть игру выбирает он',
    'Подождите 5 секунд молча: дайте ребёнку шанс ответить',
    'Сразу хвалите или давайте желаемое за любую попытку',
  ],
};

export const PLAY_ACTIVITIES: PlayActivity[] = [
  {
    id: 'bubbles',
    emoji: '🫧',
    skill: 'requesting',
    minAge: 1.5,
    uz: {
      title: 'Pufakchalar',
      goal: "Bola ko'z, tovush yoki imo bilan «yana» deb so'rashni o'rganadi.",
      materials: ['Pufakcha puflagich'],
      steps: [
        "Bola oldida bir necha marta pufakcha puflang, quvonch bilan «puf!» deng.",
        "Keyin puflagichni yuzingiz oldida ushlab, to'xtang va bolaga qarab kuting.",
        "Bola qarasa, tovush chiqarsa yoki qo'l cho'zsa — darhol «yana!» deb puflang.",
        "Shu aylanani 5 daqiqa davomida takrorlang.",
      ],
      tip: "Puflagichni o'z yuzingiz yonida ushlang — bola sizga qarashga o'rganadi.",
      easier: "Bola qarashi bilanoq puflang, uzoq kutmang.",
      harder: "«Puf» yoki «yana» so'zining boshini aytishini kuting.",
    },
    ru: {
      title: 'Мыльные пузыри',
      goal: 'Ребёнок учится просить «ещё» взглядом, звуком или жестом.',
      materials: ['Мыльные пузыри'],
      steps: [
        'Выдуйте несколько пузырей перед ребёнком и радостно скажите «пуф!».',
        'Затем держите палочку у своего лица, остановитесь и смотрите на ребёнка.',
        'Если ребёнок посмотрел, издал звук или потянулся — сразу скажите «ещё!» и выдуйте.',
        'Повторяйте этот цикл 5 минут.',
      ],
      tip: 'Держите палочку рядом со своим лицом — так ребёнок учится смотреть на вас.',
      easier: 'Дуйте сразу, как только ребёнок посмотрит, не ждите долго.',
      harder: 'Ждите, пока ребёнок скажет начало слова «пуф» или «ещё».',
    },
  },
  {
    id: 'ready-go',
    emoji: '🚗',
    skill: 'attention',
    minAge: 1.5,
    uz: {
      title: 'Tayyor... diqqat... ket!',
      goal: "Bola kutishni va kattalar bilan birga harakat qilishni o'rganadi.",
      materials: ['Mashina, koptok yoki dumalaydigan o\'yinchoq'],
      steps: [
        "Mashinani qo'lingizda ushlang va «Tayyor... diqqat...» deng.",
        "«Ket!» deyishdan oldin to'xtab, bolaning ko'ziga qarang.",
        "Bola qarasa yoki harakat qilsa — «Ket!» deb mashinani unga dumalating.",
        "Mashinani qaytarishini so'rang va o'yinni takrorlang.",
      ],
      tip: "Bir necha marta takrorlangach, bola «ket»ni o'zi kuta boshlaydi — bu yaxshi belgi.",
      easier: "Pauzani qisqa qiling va mashinani bolaning qo'liga yaqin dumalating.",
      harder: "«Ke...» deb to'xtang — bola so'zni o'zi tugatsin.",
    },
    ru: {
      title: 'На старт... внимание... марш!',
      goal: 'Ребёнок учится ждать и действовать вместе со взрослым.',
      materials: ['Машинка, мяч или катящаяся игрушка'],
      steps: [
        'Держите машинку и скажите «На старт... внимание...».',
        'Перед словом «марш!» остановитесь и посмотрите ребёнку в глаза.',
        'Если ребёнок посмотрел или пошевелился — скажите «Марш!» и прокатите машинку к нему.',
        'Попросите вернуть машинку и повторите игру.',
      ],
      tip: 'После нескольких повторов ребёнок начнёт сам ждать «марш» — это хороший знак.',
      easier: 'Делайте паузу короче и катите машинку ближе к рукам ребёнка.',
      harder: 'Скажите «Ма...» и остановитесь — пусть ребёнок закончит слово сам.',
    },
  },
  {
    id: 'copy-child',
    emoji: '🪞',
    skill: 'imitation',
    minAge: 1.5,
    uz: {
      title: 'Bolaga taqlid qiling',
      goal: "Bola sizni sezadi va o'yinga sizni qo'sha boshlaydi — taqlidning birinchi qadami.",
      materials: ["Bir xil o'yinchoqdan ikkitadan (2 qoshiq, 2 kubik, 2 mashina)"],
      steps: [
        "Bola nima bilan o'ynasa, o'sha o'yinchoqning ikkinchisini oling.",
        "Bola nima qilsa, siz ham xuddi shunday qiling: taqillatsa — taqillating, dumalatsa — dumalating.",
        "Bola tovush chiqarsa, o'sha tovushni takrorlang.",
        "Bola sizga qarasa, jilmayib, harakatni yana takrorlang.",
      ],
      tip: "Savol bermang va ko'rsatma bermang — shunchaki uning «ko'zgusi» bo'ling.",
      easier: "Bolaning yonida emas, qarshisida o'tiring — shunda u sizni ko'radi.",
      harder: "Harakatni biroz o'zgartiring (sekinroq yoki boshqacha) — bola sizni kuzatadimi?",
    },
    ru: {
      title: 'Подражайте ребёнку',
      goal: 'Ребёнок замечает вас и начинает включать в игру — первый шаг к подражанию.',
      materials: ['По две одинаковые игрушки (2 ложки, 2 кубика, 2 машинки)'],
      steps: [
        'Возьмите вторую такую же игрушку, как у ребёнка.',
        'Делайте то же, что ребёнок: стучит — стучите, катает — катайте.',
        'Если ребёнок издаёт звук, повторите этот звук.',
        'Если ребёнок посмотрел на вас — улыбнитесь и повторите действие.',
      ],
      tip: 'Не задавайте вопросов и не давайте указаний — просто будьте его «зеркалом».',
      easier: 'Сядьте не рядом, а напротив ребёнка — так он вас видит.',
      harder: 'Слегка измените действие (медленнее или иначе) — заметит ли ребёнок?',
    },
  },
  {
    id: 'copy-me',
    emoji: '🥁',
    skill: 'imitation',
    minAge: 2,
    uz: {
      title: 'Mendan keyin takrorla',
      goal: "Bola kattalar harakatini ko'rib takrorlashni o'rganadi — barcha o'rganishning asosi.",
      materials: ["Baraban yoki qopqoqli qozon, qoshiq, kubiklar"],
      steps: [
        "Bolaning qiziqarli o'yinchog'ini oling va oddiy harakat qiling: qoshiq bilan 2 marta taqillating.",
        "«Sen ham!» deb o'yinchoqni bolaga bering va kuting.",
        "Takrorlasa — darhol maqtang: «Zo'r, taqillatding!».",
        "Takrorlamasa — qo'lini yengil yo'naltirib birga qiling, keyin maqtang.",
      ],
      tip: "Bir harakatni 3–4 marta takrorlang, keyin yangisiga o'ting.",
      easier: "Bola allaqachon qiladigan harakatdan boshlang.",
      harder: "Ikki harakatni ketma-ket qiling: taqillat, keyin ko'tar.",
    },
    ru: {
      title: 'Повтори за мной',
      goal: 'Ребёнок учится повторять действия взрослого — основа любого обучения.',
      materials: ['Барабан или кастрюля с крышкой, ложка, кубики'],
      steps: [
        'Возьмите интересную ребёнку игрушку и сделайте простое действие: дважды постучите ложкой.',
        'Скажите «Теперь ты!», дайте игрушку ребёнку и подождите.',
        'Если повторил — сразу хвалите: «Здорово, постучал!».',
        'Если нет — мягко направьте его руку, сделайте вместе и похвалите.',
      ],
      tip: 'Повторяйте одно действие 3–4 раза, потом переходите к новому.',
      easier: 'Начните с действия, которое ребёнок уже умеет.',
      harder: 'Сделайте два действия подряд: постучи, потом подними.',
    },
  },
  {
    id: 'faces',
    emoji: '😮',
    skill: 'imitation',
    minAge: 2,
    uz: {
      title: "Ko'zgu oldida yuz ifodalari",
      goal: "Bola yuzga qarashni va his-tuyg'ularni taqlid qilishni o'rganadi.",
      materials: ["Katta ko'zgu"],
      steps: [
        "Bola bilan ko'zgu oldiga o'tiring.",
        "Bitta ifoda qiling: kuling, og'zingizni katta oching, tilingizni chiqaring.",
        "Ifodani nomlang: «Xursand!», «Voy!» — va bolaning takrorlashini kuting.",
        "Har qanday urinishni kulgi va olqish bilan qarshi oling.",
      ],
      tip: "Ifodalarni bo'rttirib, kulgili qiling — bola uchun o'yin bo'lsin.",
      easier: "Faqat bitta oson ifoda bilan boshlang (og'izni ochish).",
      harder: "«Xafa bo'lganda qanday bo'lamiz?» deb so'rang va bola o'zi ko'rsatsin.",
    },
    ru: {
      title: 'Рожицы у зеркала',
      goal: 'Ребёнок учится смотреть на лицо и подражать эмоциям.',
      materials: ['Большое зеркало'],
      steps: [
        'Сядьте с ребёнком перед зеркалом.',
        'Покажите одно выражение: улыбнитесь, широко откройте рот, высуньте язык.',
        'Назовите его: «Радость!», «Ой!» — и подождите, повторит ли ребёнок.',
        'Встречайте любую попытку смехом и аплодисментами.',
      ],
      tip: 'Преувеличивайте выражения, делайте их смешными — пусть это будет игра.',
      easier: 'Начните с одного простого выражения (открыть рот).',
      harder: 'Спросите «А как мы грустим?» — пусть ребёнок покажет сам.',
    },
  },
  {
    id: 'tower',
    emoji: '🧱',
    skill: 'turns',
    minAge: 2,
    uz: {
      title: 'Navbat bilan minora',
      goal: "Bola navbat kutishni va birga ishlashni o'rganadi.",
      materials: ['Kubiklar yoki plastik stakanlar'],
      steps: [
        "Kubiklarni o'zingiz yoningizda ushlang — bola ularni sizdan olsin.",
        "«Mening navbatim» deb bitta kubik qo'ying.",
        "«Sening navbating» deb bitta kubikni bolaga bering.",
        "Minora qulasa — birga «Voy!» deb kuling va qaytadan boshlang.",
      ],
      tip: "Navbat so'zlarini har safar bir xil ayting — bola ularni tez o'rganadi.",
      easier: "Bolaga 2 ta kubik berib, siz 1 ta qo'ying — kutish qisqaroq bo'ladi.",
      harder: "Rang bo'yicha navbat: «Endi qizil kubik».",
    },
    ru: {
      title: 'Башня по очереди',
      goal: 'Ребёнок учится ждать своей очереди и действовать вместе.',
      materials: ['Кубики или пластиковые стаканчики'],
      steps: [
        'Держите кубики рядом с собой — пусть ребёнок берёт их у вас.',
        'Скажите «Моя очередь» и поставьте один кубик.',
        'Скажите «Твоя очередь» и дайте один кубик ребёнку.',
        'Если башня упала — вместе скажите «Ой!», посмейтесь и начните снова.',
      ],
      tip: 'Каждый раз говорите одни и те же слова очереди — ребёнок быстро их выучит.',
      easier: 'Давайте ребёнку 2 кубика, а сами ставьте 1 — ждать меньше.',
      harder: 'Очередь по цвету: «Теперь красный кубик».',
    },
  },
  {
    id: 'ball',
    emoji: '⚽',
    skill: 'turns',
    minAge: 1.5,
    uz: {
      title: 'Koptokni dumalat',
      goal: "Bola «berish — olish» almashinuvini, ya'ni suhbatning asosini o'rganadi.",
      materials: ['Yumshoq koptok'],
      steps: [
        "Polda bir-biringizga qarab, oyoqlarni kerib o'tiring.",
        "«Senga!» deb koptokni bolaga dumalating.",
        "Qo'lingizni cho'zib «Menga!» deng va kuting.",
        "Koptok qaytsa — quvonch bilan maqtang va yana dumalating.",
      ],
      tip: "Bolaning ismini aytib dumalating — u ismiga javob berishni ham o'rganadi.",
      easier: "Yaqinroq o'tiring yoki ikkinchi kattaning yordamida bolaning qo'lini yo'naltiring.",
      harder: "Uchinchi odamni qo'shing: navbat uch kishi o'rtasida.",
    },
    ru: {
      title: 'Покати мяч',
      goal: 'Ребёнок учится обмену «дать — взять», основе диалога.',
      materials: ['Мягкий мяч'],
      steps: [
        'Сядьте на пол лицом друг к другу, расставив ноги.',
        'Скажите «Тебе!» и прокатите мяч ребёнку.',
        'Протяните руки, скажите «Мне!» и подождите.',
        'Если мяч вернулся — радостно похвалите и катите снова.',
      ],
      tip: 'Называйте имя ребёнка, когда катите, — он учится отзываться на имя.',
      easier: 'Сядьте ближе или попросите второго взрослого помочь направить руки ребёнка.',
      harder: 'Добавьте третьего человека: очередь на троих.',
    },
  },
  {
    id: 'choice',
    emoji: '🍎',
    skill: 'requesting',
    minAge: 1.5,
    uz: {
      title: 'Ikkitadan birini tanla',
      goal: "Bola ko'rsatish yoki so'z bilan tanlov qilishni o'rganadi.",
      materials: ["Bola yaxshi ko'radigan 2 ta narsa (masalan, olma va pechenye)"],
      steps: [
        "Ikkala narsani bolaning ko'zi oldida, qo'li yetmaydigan joyda ushlang.",
        "Ularni nomlang: «Olmami yoki pechenyemi?»",
        "Bola qarasa, ko'rsatsa yoki aytsa — nomini qaytarib, darhol bering: «Olma!».",
        "Kun davomida ovqat, o'yinchoq va kiyim tanlashda takrorlang.",
      ],
      tip: "Kichik bo'laklar bering — shunda bola yana so'rashga imkon topadi.",
      easier: "Biri yoqadigan, biri yoqmaydigan narsani taklif qiling — tanlash osonlashadi.",
      harder: "Ko'rsatgandan keyin so'zning boshini aytishini kuting.",
    },
    ru: {
      title: 'Выбери одно из двух',
      goal: 'Ребёнок учится делать выбор жестом или словом.',
      materials: ['2 любимые вещи ребёнка (например, яблоко и печенье)'],
      steps: [
        'Держите оба предмета на виду у ребёнка, но вне досягаемости.',
        'Назовите их: «Яблоко или печенье?»',
        'Если ребёнок посмотрел, показал или сказал — повторите название и сразу дайте: «Яблоко!».',
        'Повторяйте в течение дня с едой, игрушками и одеждой.',
      ],
      tip: 'Давайте маленькие кусочки — так у ребёнка будет повод попросить ещё.',
      easier: 'Предложите одну любимую и одну нелюбимую вещь — выбрать проще.',
      harder: 'После жеста ждите начало слова.',
    },
  },
  {
    id: 'jar',
    emoji: '🫙',
    skill: 'requesting',
    minAge: 2,
    uz: {
      title: 'Yordam ber!',
      goal: "Bola qiynalganda yig'lash o'rniga yordam so'rashni o'rganadi.",
      materials: ["Shaffof qopqoqli idish, ichida sevimli o'yinchoq yoki mazali narsa"],
      steps: [
        "Sevimli narsani bola ko'z oldida idishga solib, qopqog'ini yoping.",
        "Idishni bolaga bering va kuting.",
        "Bola ochishga urinib, sizga idishni bersa yoki qarasa — «Yordam ber!» deb ayting va oching.",
        "Har safar bir xil so'z bilan takrorlang.",
      ],
      tip: "Bola asabiylashishdan oldin yordam bering — maqsad qiynash emas.",
      easier: "Qopqoqni bo'sh yoping — bola biroz urinib ko'rsin, keyin yordam bering.",
      harder: "Bola «yordam» so'zini yoki imosini o'zi qilishini kuting.",
    },
    ru: {
      title: 'Помоги!',
      goal: 'Ребёнок учится просить помощи вместо плача.',
      materials: ['Прозрачная банка с крышкой, внутри любимая игрушка или лакомство'],
      steps: [
        'На глазах у ребёнка положите любимую вещь в банку и закройте.',
        'Дайте банку ребёнку и подождите.',
        'Если ребёнок пытается открыть, протягивает банку или смотрит на вас — скажите «Помоги!» и откройте.',
        'Каждый раз повторяйте одними и теми же словами.',
      ],
      tip: 'Помогайте до того, как ребёнок расстроится, — цель не в том, чтобы мучить.',
      easier: 'Закройте крышку слабо — пусть ребёнок попробует, потом помогите.',
      harder: 'Ждите, пока ребёнок сам скажет «помоги» или покажет жестом.',
    },
  },
  {
    id: 'peekaboo',
    emoji: '🙈',
    skill: 'attention',
    minAge: 1.5,
    uz: {
      title: "Ku-ku (yashirinmachoq)",
      goal: "Bola sizning yuzingizga qarashni va o'yinni davom ettirishni so'rashni o'rganadi.",
      materials: ['Yengil sharf yoki ro\'mol'],
      steps: [
        "Sharf bilan yuzingizni yopib «Oyim qani?» deng.",
        "Sharfni ochib quvnoq «Ku-ku!» deng.",
        "Bir necha martadan keyin sharfni yuzingizda ushlab kuting — bola tortsa yoki tovush chiqarsa, oching.",
        "Keyin sharfni bolaning boshiga yopib, «Qani u?» deb navbat bering.",
      ],
      tip: "Bola uchun eng qiziq narsa — sizning quvongan yuzingiz.",
      easier: "Shaffof ro'moldan foydalaning — bola sizni ko'rib turadi.",
      harder: "O'yinchoqni sharf ostiga yashiring — bola uni topsin va sizga ko'rsatsin.",
    },
    ru: {
      title: 'Ку-ку (прятки)',
      goal: 'Ребёнок учится смотреть на ваше лицо и просить продолжить игру.',
      materials: ['Лёгкий шарф или платок'],
      steps: [
        'Закройте лицо шарфом и скажите «Где мама?»',
        'Откройте и весело скажите «Ку-ку!»',
        'Через несколько раз держите шарф на лице и ждите — если ребёнок потянет или издаст звук, откройтесь.',
        'Потом накройте шарфом голову ребёнка: «Где же он?» — его очередь.',
      ],
      tip: 'Самое интересное для ребёнка — ваше радостное лицо.',
      easier: 'Используйте прозрачный платок — ребёнок видит вас.',
      harder: 'Спрячьте игрушку под шарф — пусть ребёнок найдёт и покажет вам.',
    },
  },
  {
    id: 'point-book',
    emoji: '📖',
    skill: 'attention',
    minAge: 2,
    uz: {
      title: "Ko'rsat va nomla",
      goal: "Bola barmog'i bilan ko'rsatishni va diqqatini siz bilan bo'lishishni o'rganadi.",
      materials: ["Katta rasmli kitob (hayvonlar, ovqatlar)"],
      steps: [
        "Kitobni bola bilan birga ko'ring, sahifani u tanlasin.",
        "Bola qaragan rasmni barmog'ingiz bilan ko'rsatib, bitta so'z bilan nomlang: «Mushuk!».",
        "Hayvon ovozini qo'shing: «Miyov!» — va bolaga qarang.",
        "Bola ko'rsatsa — uning qo'li yo'nalgan rasmni nomlang va xursand bo'ling.",
      ],
      tip: "Uzoq gapirmang — bitta rasm, bitta so'z, bitta ovoz.",
      easier: "Bolaning barmog'ini yengil yo'naltirib rasmga tekkizing.",
      harder: "«Kuchuk qani?» deb so'rang — bola o'zi topib ko'rsatsin.",
    },
    ru: {
      title: 'Покажи и назови',
      goal: 'Ребёнок учится указывать пальцем и делить с вами внимание.',
      materials: ['Большая книга с картинками (животные, еда)'],
      steps: [
        'Смотрите книгу вместе, страницу пусть выбирает ребёнок.',
        'Покажите пальцем картинку, на которую он смотрит, и назовите одним словом: «Кошка!».',
        'Добавьте звук: «Мяу!» — и посмотрите на ребёнка.',
        'Если ребёнок показал — назовите картинку и порадуйтесь.',
      ],
      tip: 'Не говорите длинно — одна картинка, одно слово, один звук.',
      easier: 'Мягко направьте палец ребёнка к картинке.',
      harder: 'Спросите «Где собачка?» — пусть ребёнок найдёт и покажет сам.',
    },
  },
  {
    id: 'song',
    emoji: '🎵',
    skill: 'imitation',
    minAge: 1.5,
    uz: {
      title: "Harakatli qo'shiq",
      goal: "Bola qo'shiq orqali imo-ishoralarni taqlid qiladi va so'zlarni to'ldiradi.",
      materials: ["Hech narsa kerak emas — bolaga tanish qo'shiq"],
      steps: [
        "Oddiy harakatli qo'shiqni tanlang (qarsak, qo'l silkitish, boshni qimirlatish).",
        "Qo'shiqni sekin kuylab, har bir harakatni aniq ko'rsating.",
        "Bir necha martadan keyin qo'shiqni muhim joyda to'xtating va bolaga qarab kuting.",
        "Bola harakat qilsa yoki tovush chiqarsa — qo'shiqni davom ettiring.",
      ],
      tip: "Har kuni bir xil qo'shiq — takrorlash bolaga xavfsizlik va zavq beradi.",
      easier: "Bolaning qo'llarini ushlab, harakatlarni birga qiling.",
      harder: "Qatorning oxirgi so'zini aytmay qoldiring — bola to'ldirsin.",
    },
    ru: {
      title: 'Песенка с движениями',
      goal: 'Через песню ребёнок подражает жестам и договаривает слова.',
      materials: ['Ничего не нужно — знакомая ребёнку песенка'],
      steps: [
        'Выберите простую песенку с движениями (хлопки, махи руками, кивки).',
        'Пойте медленно и чётко показывайте каждое движение.',
        'Через несколько раз остановитесь в важном месте и подождите, глядя на ребёнка.',
        'Если ребёнок сделал движение или издал звук — продолжайте песню.',
      ],
      tip: 'Каждый день одна и та же песня — повторение даёт ребёнку безопасность и радость.',
      easier: 'Держите руки ребёнка и делайте движения вместе.',
      harder: 'Не допевайте последнее слово строчки — пусть ребёнок договорит.',
    },
  },
  {
    id: 'doll-feed',
    emoji: '🧸',
    skill: 'play',
    minAge: 2,
    uz: {
      title: "Ayiqchani ovqatlantiramiz",
      goal: "Bola «go'yo» o'ynashni o'rganadi — tasavvur va nutq uchun muhim.",
      materials: ["Ayiqcha yoki qo'g'irchoq, qoshiq, likopcha"],
      steps: [
        "Ayiqchani o'tqazib «Ayiqcha och!» deng.",
        "Qoshiq bilan ayiqchani «ovqatlantiring»: «Am-am, mazali!».",
        "Qoshiqni bolaga bering: «Sen ham ber!» — va kuting.",
        "Keyin ayiqchani uxlating, yuvintiring — bola tanlagan harakatni davom ettiring.",
      ],
      tip: "Bola boshqacha o'ynasa (qoshiqni taqillatsa) — unga qo'shiling, keyin yana ko'rsating.",
      easier: "Haqiqiy narsalar bilan boshlang (haqiqiy qoshiq, haqiqiy likopcha).",
      harder: "Kubikni «olma» qilib ko'rsating — narsani boshqa narsa o'rnida ishlatish.",
    },
    ru: {
      title: 'Покормим мишку',
      goal: 'Ребёнок учится играть «понарошку» — это важно для воображения и речи.',
      materials: ['Мишка или кукла, ложка, тарелка'],
      steps: [
        'Посадите мишку и скажите «Мишка голодный!»',
        '«Покормите» мишку ложкой: «Ам-ам, вкусно!».',
        'Дайте ложку ребёнку: «Теперь ты!» — и подождите.',
        'Потом уложите мишку спать, умойте — продолжайте то, что выбрал ребёнок.',
      ],
      tip: 'Если ребёнок играет иначе (стучит ложкой) — присоединитесь, потом снова покажите.',
      easier: 'Начните с настоящих предметов (настоящая ложка, тарелка).',
      harder: 'Покажите кубик как «яблоко» — замещение одного предмета другим.',
    },
  },
  {
    id: 'mystery-bag',
    emoji: '👜',
    skill: 'play',
    minAge: 2.5,
    uz: {
      title: 'Sehrli xalta',
      goal: "Bola qiziqish bilan kutishni va narsalarni nomlashni o'rganadi.",
      materials: ["Xalta yoki quti, ichida 4–5 ta tanish narsa (qoshiq, koptok, mashina)"],
      steps: [
        "Xaltani silkitib, sirli ovozda «Ichida nima bor?» deng.",
        "Bola qo'lini solib bitta narsani olsin.",
        "Narsani birga nomlang va u bilan bir oz o'ynang.",
        "«Xayr, qoshiq!» deb xaltaga qaytaring va keyingisini oling.",
      ],
      tip: "Sirli ovoz va kutish — bolaning diqqatini eng yaxshi ushlaydi.",
      easier: "Faqat 2–3 ta eng sevimli narsadan boshlang.",
      harder: "Bola qaramasdan, ushlab ko'rib narsani topsin.",
    },
    ru: {
      title: 'Волшебный мешочек',
      goal: 'Ребёнок учится ждать с интересом и называть предметы.',
      materials: ['Мешочек или коробка, внутри 4–5 знакомых предметов (ложка, мяч, машинка)'],
      steps: [
        'Потрясите мешочек и таинственно скажите «Что там внутри?»',
        'Пусть ребёнок засунет руку и достанет один предмет.',
        'Вместе назовите предмет и немного поиграйте с ним.',
        'Скажите «Пока, ложка!», верните в мешочек и достаньте следующий.',
      ],
      tip: 'Таинственный голос и ожидание лучше всего удерживают внимание ребёнка.',
      easier: 'Начните с 2–3 самых любимых предметов.',
      harder: 'Пусть ребёнок найдёт предмет на ощупь, не глядя.',
    },
  },
  {
    id: 'sort',
    emoji: '🎨',
    skill: 'play',
    minAge: 2.5,
    uz: {
      title: 'Juftini top',
      goal: "Bola bir xil narsalarni ajratish va ko'rsatmaga amal qilishni o'rganadi.",
      materials: ['Bir necha juft paypoq yoki rangli qopqoqlar'],
      steps: [
        "Paypoqlarni aralashtirib polga yoying.",
        "Bitta paypoqni olib «Juftini topamiz!» deng.",
        "Bola bir xilini topsa — ularni birga taxlang va maqtang.",
        "Navbat bilan davom eting: bir safar siz, bir safar bola.",
      ],
      tip: "Uy ishiga qo'shilish — bola uchun ham o'yin, ham foydali ko'nikma.",
      easier: "Faqat 2 juftdan, juda farqli ranglardan boshlang.",
      harder: "«Qizilini ber» deb rang bo'yicha so'rang.",
    },
    ru: {
      title: 'Найди пару',
      goal: 'Ребёнок учится находить одинаковое и следовать инструкции.',
      materials: ['Несколько пар носков или цветные крышки'],
      steps: [
        'Перемешайте носки и разложите на полу.',
        'Возьмите один носок и скажите «Найдём пару!»',
        'Если ребёнок нашёл такой же — сложите их вместе и похвалите.',
        'Продолжайте по очереди: раз вы, раз ребёнок.',
      ],
      tip: 'Участие в домашних делах — для ребёнка и игра, и полезный навык.',
      easier: 'Начните с 2 пар очень разных цветов.',
      harder: 'Просите по цвету: «Дай красный».',
    },
  },
  {
    id: 'hands',
    emoji: '🧼',
    skill: 'daily',
    minAge: 2,
    uz: {
      title: "Qo'l yuvish qadamlari",
      goal: "Bola kundalik ishni qadam-baqadam mustaqil bajarishni o'rganadi.",
      materials: ['Sovun, sochiq; xohlasangiz qadamlar rasmi'],
      steps: [
        "Har safar bir xil tartibda: suvni och → qo'lni ho'lla → sovun surt → yuv → suvni yop → art.",
        "Har bir qadamni bitta so'z bilan ayting va kerak bo'lsa qo'lini yo'naltiring.",
        "Oxirgi qadamni (qo'lni artish) bolaning o'zi qilsin va katta maqtang.",
        "Bola uddalagan sari yordamni oxiridan boshlab kamaytiring.",
      ],
      tip: "Bu «teskari zanjir» usuli: bola doim muvaffaqiyat bilan tugatadi va ishonchi oshadi.",
      easier: "Faqat bitta qadamni bola qilsin, qolganini siz qiling.",
      harder: "Qadamlar rasmiga qarab, bola o'zi bajarsin.",
    },
    ru: {
      title: 'Моем руки по шагам',
      goal: 'Ребёнок учится выполнять бытовое дело шаг за шагом самостоятельно.',
      materials: ['Мыло, полотенце; по желанию картинки шагов'],
      steps: [
        'Каждый раз в одном порядке: открыть воду → намочить → намылить → потереть → закрыть воду → вытереть.',
        'Называйте каждый шаг одним словом и при необходимости направляйте руки.',
        'Последний шаг (вытереть руки) пусть сделает ребёнок сам — и громко похвалите.',
        'По мере успехов убирайте помощь, начиная с конца.',
      ],
      tip: 'Это метод «обратной цепочки»: ребёнок всегда заканчивает с успехом и становится увереннее.',
      easier: 'Пусть ребёнок делает только один шаг, остальное — вы.',
      harder: 'Пусть ребёнок выполняет сам, глядя на картинки шагов.',
    },
  },
  {
    id: 'socks',
    emoji: '🧦',
    skill: 'daily',
    minAge: 2.5,
    uz: {
      title: 'Paypoqni o\'zim kiyaman',
      goal: "Bola kiyinishda mustaqillikka o'rganadi.",
      materials: ["Kengroq, yumshoq paypoq"],
      steps: [
        "Paypoqni deyarli to'liq kiydiring, faqat tovondan tortish qolsin.",
        "«Tort!» deb bolaga oxirgi harakatni qildiring va maqtang.",
        "Bir necha kundan keyin paypoqni barmoqlargacha kiydiring — bola qolganini tortsin.",
        "Asta-sekin bola butun paypoqni o'zi kiyadigan bo'ladi.",
      ],
      tip: "Shoshilmaydigan vaqtni tanlang — ertalabki shoshilinch payt mos emas.",
      easier: "Bola o'tirgan holda, oyog'ini sizning tizzangizga qo'yib mashq qiling.",
      harder: "Shim yoki kurtka bilan ham xuddi shu usulni qo'llang.",
    },
    ru: {
      title: 'Носок надеваю сам',
      goal: 'Ребёнок учится самостоятельности в одевании.',
      materials: ['Свободный мягкий носок'],
      steps: [
        'Наденьте носок почти полностью, оставьте только подтянуть с пятки.',
        'Скажите «Тяни!» — пусть ребёнок сделает последнее движение — и похвалите.',
        'Через несколько дней надевайте только на пальцы — остальное ребёнок тянет сам.',
        'Постепенно ребёнок будет надевать носок целиком.',
      ],
      tip: 'Выбирайте спокойное время — утренняя спешка не подходит.',
      easier: 'Занимайтесь сидя, поставив ногу ребёнка себе на колено.',
      harder: 'Применяйте тот же способ со штанами или курткой.',
    },
  },
  {
    id: 'breath',
    emoji: '🕯️',
    skill: 'calm',
    minAge: 3,
    uz: {
      title: 'Shamni puflaymiz',
      goal: "Bola nafas orqali tinchlanishni o'rganadi — bezovtalanganda yordam beradi.",
      materials: ["Barmoq «sham» yoki pat, qog'oz bo'lagi"],
      steps: [
        "Barmog'ingizni sham qilib ko'rsating: «Mana sham!».",
        "Burundan sekin nafas oling (gulni hidlaganday), og'izdan sekin puflang.",
        "Bola puflasa — barmog'ingizni «o'chiring» va kuling.",
        "3–5 marta takrorlang. Bola tinch paytda mashq qiling — keyin bezovtalanganda ishlating.",
      ],
      tip: "Bu mashqni bola xotirjam bo'lganda o'rganing, tantrum paytida emas.",
      easier: "Qog'oz bo'lagi yoki patni stoldan puflab uchiring — natija ko'rinadi.",
      harder: "«Gulni hidla — shamni o'chir» deb faqat so'z bilan eslating.",
    },
    ru: {
      title: 'Задуваем свечку',
      goal: 'Ребёнок учится успокаиваться через дыхание — помогает при волнении.',
      materials: ['«Свечка» из пальца или пёрышко, кусочек бумаги'],
      steps: [
        'Покажите палец как свечку: «Вот свечка!»',
        'Медленно вдохните носом (будто нюхаете цветок), медленно выдохните ртом.',
        'Если ребёнок подул — «погасите» палец и посмейтесь.',
        'Повторите 3–5 раз. Тренируйтесь, когда ребёнок спокоен, — потом используйте при волнении.',
      ],
      tip: 'Учите это упражнение, когда ребёнок спокоен, а не во время истерики.',
      easier: 'Сдувайте со стола бумажку или пёрышко — результат виден.',
      harder: 'Напоминайте только словами: «Понюхай цветок — задуй свечку».',
    },
  },
  {
    id: 'fast-slow',
    emoji: '🐢',
    skill: 'calm',
    minAge: 2.5,
    uz: {
      title: 'Tez — sekin',
      goal: "Bola o'z harakatini boshqarishni va to'xtashni o'rganadi.",
      materials: ["Baraban yoki stol, musiqa"],
      steps: [
        "«Quyon» deb tez taqillating yoki yuguring, «toshbaqa» deb juda sekin.",
        "Bola siz bilan birga harakat qilsin.",
        "«To'xta!» deb qotib qoling — bola ham qotsin, keyin kuling.",
        "Navbatni bolaga bering: endi u «tez» yoki «sekin» deb buyursin.",
      ],
      tip: "Har bir o'yinni tinch harakat bilan tugating — bola osoyishta holatga qaytadi.",
      easier: "Faqat «to'xta — yur» bilan boshlang.",
      harder: "Musiqa to'xtaganda qotib qolish (musiqali haykal).",
    },
    ru: {
      title: 'Быстро — медленно',
      goal: 'Ребёнок учится управлять движением и останавливаться.',
      materials: ['Барабан или стол, музыка'],
      steps: [
        'Скажите «Зайчик» и стучите или бегите быстро, «черепаха» — очень медленно.',
        'Пусть ребёнок двигается вместе с вами.',
        'Скажите «Стоп!» и замрите — пусть ребёнок тоже замрёт, потом посмейтесь.',
        'Отдайте очередь ребёнку: теперь он командует «быстро» или «медленно».',
      ],
      tip: 'Заканчивайте каждую игру спокойным движением — ребёнок вернётся в спокойное состояние.',
      easier: 'Начните только со «стоп — иди».',
      harder: 'Замирать, когда останавливается музыка (музыкальные статуи).',
    },
  },
];

/** Bolaning yoshi (yil) — tug'ilgan yildan; noma'lum bo'lsa 3. */
export function childAge(birthYear: number | null | undefined, now = new Date()) {
  return birthYear ? Math.max(1, now.getFullYear() - birthYear) : 3;
}

/** Yoshga mos mashqlar (hech biri mos kelmasa — hammasi). */
export function activitiesForAge(age: number) {
  const list = PLAY_ACTIVITIES.filter((a) => a.minAge <= age + 0.5);
  return list.length ? list : PLAY_ACTIVITIES;
}

/** Hafta kunlari qisqa nomi (Yakshanbadan boshlab, Date.getDay() tartibida) — brauzerda o'zbekcha Intl bo'lmasligi mumkin */
export const WEEKDAYS: { uz: string[]; ru: string[] } = {
  uz: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

/** Mahalliy sana kaliti: "2026-10-19" */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayNumber(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/**
 * Bugungi mashq: har kuni navbatdagisi, oxirgi 7 kunda bajarilganlari o'tkazib yuboriladi.
 * `shift` — ota-ona «boshqasini» bosgan marta.
 */
export function pickToday(age: number, doneRecently: Set<string>, key = dayKey(), shift = 0): PlayActivity {
  const list = activitiesForAge(age);
  const fresh = list.filter((a) => !doneRecently.has(a.id));
  const pool = fresh.length ? fresh : list;
  return pool[(dayNumber(key) + shift) % pool.length];
}

/** Oxirgi n kun kalitlari, bugundan orqaga. */
export function lastDays(n: number, from = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    return dayKey(d);
  });
}

/** Joriy hafta: Dushanbadan Yakshanbagacha (kelajakdagi kunlar ham kiradi). */
export function currentWeek(now = new Date()) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dayKey(d);
  });
}

/* ------------------------------- Natijalar ------------------------------- */

/** Ota-ona belgilaydi: o'yin qanday o'tdi */
export type PlayRating = 'great' | 'ok' | 'hard';

export type PlayEntry = { day: string; id: string; rating: PlayRating };

/** Bitta bola uchun saqlanadigan ma'lumot (faqat qurilmada). */
export type ChildPlay = { entries: PlayEntry[]; shift?: { day: string; n: number } };

export function playSummary(data: ChildPlay | undefined, age: number, now = new Date()) {
  const entries = data?.entries ?? [];
  const today = dayKey(now);
  const week = lastDays(7, now);
  const days = new Set(entries.map((e) => e.day));
  const recent = new Set(entries.filter((e) => week.includes(e.day) && e.day !== today).map((e) => e.id));
  const shift = data?.shift?.day === today ? data.shift.n : 0;

  // Ketma-ket kunlar: bugun hali bajarilmagan bo'lsa, kechagidan sanaladi
  let streak = 0;
  const back = lastDays(366, now);
  for (let i = days.has(today) ? 0 : 1; i < back.length && days.has(back[i]); i++) streak++;

  return {
    today: pickToday(age, recent, today, shift),
    doneToday: entries.filter((e) => e.day === today),
    /** Joriy hafta, Dushanbadan Yakshanbagacha */
    week: currentWeek(now).map((day) => ({ day, done: days.has(day) })),
    streak,
    total: entries.length,
    /** Mashq id → necha marta bajarilgan */
    counts: entries.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.id]: (acc[e.id] ?? 0) + 1 }), {}),
  };
}

export function addPlayEntry(data: ChildPlay | undefined, id: string, rating: PlayRating, now = new Date()): ChildPlay {
  // Juda katta bo'lib ketmasligi uchun oxirgi 500 tasi
  return { ...data, entries: [...(data?.entries ?? []), { day: dayKey(now), id, rating }].slice(-500) };
}

export function shiftToday(data: ChildPlay | undefined, now = new Date()): ChildPlay {
  const today = dayKey(now);
  const n = data?.shift?.day === today ? data.shift.n + 1 : 1;
  return { entries: data?.entries ?? [], shift: { day: today, n } };
}
