/**
 * Ommaviy oferta (public offer) — skrining xizmati uchun umumiy huquqiy matn.
 * Kerak bo‘lsa, kompaniya nomi / rekvizitlar / aloqa bo‘limini yangilang.
 */

export type PublicOfferBlock = {
  title: string;
  body: string;
};

export type PublicOfferDocument = {
  title: string;
  subtitle: string;
  updated: string;
  preamble: string;
  sections: PublicOfferBlock[];
  footerNote: string;
};

export const publicOfferUz: PublicOfferDocument = {
  title: "Ommaviy oferta",
  subtitle: "Autizm skrining onlayn xizmatidan foydalanish shartlari",
  updated: "2 aprel 2026",
  preamble:
    "Ushbu hujjat Autizm skrining veb-platformasi orqali taqdim etiladigan onlayn skrining (so‘rovnoma) xizmatidan foydalanish tartibini belgilaydi. Xizmatdan foydalanishni boshlash bilan siz ushbu ofertaning shartlarini to‘liq o‘qigan va ularga rozilik bildirgan deb hisoblanasiz.",
  sections: [
    {
      title: "1. Atamalar va tomonlar",
      body:
        "Xizmat ko‘rsatuvchi — Autizm skrining platformasini boshqaruvchi yuridik yoki jismoniy shaxs (keyingi o‘rinlarda — «Biz», «Platforma»). Foydalanuvchi — ofertani qabul qilib, Platformada ro‘yxatdan o‘tgan yoki testdan foydalangan jismoniy shaxs. Kontent — test savollari, natijalar, sun’iy intellekt yordamida shakllantirilgan matnlar, PDF va boshqa materiallar.",
    },
    {
      title: "2. Xizmatning predmeti",
      body:
        "Platforma ota-onalar (yoki vasiylar) uchun bolaning rivojlanishi bo‘yicha skrining so‘rovnomasini to‘ldirish, avtomatik baholash natijalarini shakllantirish, qo‘shimcha xizmatlar (masalan, AI xulosa, PDF eksport) va to‘lov orqali to‘liq natijaga kirish imkonini beradi. Xizmat masofadan — internet orqali ko‘rsatiladi. Platforma funksiyalari va narxlari axborot sifatida e’lon qilingan holatda amal qiladi.",
    },
    {
      title: "3. Tibbiy tashxis emasligi",
      body:
        "Skrining natijalari tibbiy tashxis, davolovchi yoki rasmiy xulosalar o‘rnini bosmaydi. Ularning maqsadi — rivojlanish bo‘yicha ehtimoliy xavf zonalarini umumiy ko‘rinishda ko‘rsatish va keyingi qadamlar haqida ma’lumot berishdir. Yakuniy baho, tashxis va davolash rejasi faqat malakali mutaxassis (pediatr, bolalar nevrologi, rivojlanish mutaxassisi va hokazo) bilan maslahat asosida belgilanadi. Foydalanuvchi o‘z tashvishlari va qarorlari uchun mustaqil javobgarlikni o‘z zimmasiga oladi.",
    },
    {
      title: "4. Foydalanuvchining majburiyatlari",
      body:
        "Foydalanuvchi to‘g‘ri va to‘liq ma’lumot kiritishga, boshqa shaxslarning huquqlarini buzmaslikka, Platformani buzish, avtomatlashtirish orqali suiiste’mol qilmaslikka, texnik vositalar yordamida tizimga ruxsatsiz aralashmaslikka majbur. Yosh va boshqa dastlabki ma’lumotlarning aniqligi natijalarning mazmuniy muhimligi uchun Foydalanuvchi mas’uliyatidadir.",
    },
    {
      title: "5. Shaxsiy ma’lumotlar va maxfiylik",
      body:
        "Platforma jarayonida telefon raqami, test javoblari, natijalar va texnik loglar qayd etilishi mumkin. Ma’lumotlar xizmatni ko‘rsatish, to‘lovlarni hisob-kitob qilish, qonuniy talablarga rioya etish va xavfsizlikni ta’minlash maqsadida qayta ishlanadi. Ma’lumotlarni uchinchi shaxslarga faqat qonunda nazarda tutilgan hollarda yoki anonimlashtirilgan/statistik shaklda uzatish mumkin. Batafsil maxfiylik siyosati alohida hujjatda yoki saytning tegishli bo‘limida joylashtirilishi mumkin.",
    },
    {
      title: "6. To‘lov va Click orqali hisob-kitob",
      body:
        "Ayrim natijalar va funksiyalar pulli bo‘lishi mumkin. To‘lovlar joriy tariflar asosida amalga oshiriladi. Click va boshqa to‘lov tizimlari orqali amalga oshirilgan operatsiyalar ularning qoidalariga muvofiq. To‘lov muvaffaqiyatli yakunlangach, Foydalanuvchiga e’lon qilingan hajmda kontent va xizmatlar taqdim etiladi. Agar texnik xatolik yoki xizmat ko‘rsatilmagan bo‘lsa, adolatli e’tirozlar qonun va Platforma ichki tartibiga muvofiq ko‘rib chiqiladi.",
    },
    {
      title: "7. Intellektual mulk",
      body:
        "Platformadagi testlar, dizayn, dasturiy kod, matnlar, AI promptlari va boshqa materiallar intellektual mulk huquqlari bilan himoyalanadi. Ularni ruxsatsiz nusxalash, tarqatish yoki tijorat maqsadida qayta ishlash taqiqlanadi. Foydalanuvchi o‘z shaxsiy foydalanishi uchun natijalarni saqlash va mutaxassisga ko‘rsatish huquqiga ega.",
    },
    {
      title: "8. Javobgarlikni cheklash",
      body:
        "Platforma «boricha» va mavjud texnologiyalar doirasida taqdim etiladi. Uchinchi tomon xizmatlari (to‘lov tizimlari, hosting, AI provayderlari) uzilishlari uchun Bizning javobgarligimiz ularning xizmat shartlariga bo‘g‘liq. Platforma Foydalanuvchining tibbiy, moddiy yoki boshqa bilvosita zararlar uchun javobgarlikni qonunda ruxsat etilgan chegaradan oshmaydi.",
    },
    {
      title: "9. Ofertaning o‘zgarishi va bekor qilinishi",
      body:
        "Biz ushbu ofertani yangilangan tahriri bilan saytga joylashtirish orqali o‘zgartirish huquqini o‘zida saqlaymiz. Muhim o‘zgarishlar haqida mumkin bo‘lgan darajada oldindan xabar beriladi. Yangi tahrir e’lon qilingandan keyin xizmatdan foydalanish yangi shartlarni qabul qilish bilan bog‘liq hisoblanadi. Biz bir tomonlama tartibda texnik yoki huquqiy sabablarga ko‘ra xizmatni vaqtincha to‘xtatish yoki tugatish huquqiga egamiz.",
    },
    {
      title: "10. Aloqa va murojaat",
      body:
        "Oferta, to‘lov yoki xizmat bo‘yicha savollar uchun saytda ko‘rsatilgan «Yordam» / aloqa kanallari orqali murojaat qilishingiz mumkin. Rekvizitlar va rasmiy manzillar veb-saytda yangilanishi mumkin.",
    },
  ],
  footerNote:
    "Huquqiy masalalar bo‘yicha yakuniy talqin uchun professional yuridik maslahat olish tavsiya etiladi.",
};

export const publicOfferRu: PublicOfferDocument = {
  title: "Публичная оферта",
  subtitle: "Условия использования онлайн-сервиса скрининга аутизма",
  updated: "2 апреля 2026",
  preamble:
    "Настоящий документ определяет порядок использования онлайн-сервиса скрининга (анкеты), предоставляемого через веб-платформу Autizm skrining. Начиная пользоваться сервисом, вы подтверждаете, что ознакомились с условиями оферты и принимаете их в полном объёме.",
  sections: [
    {
      title: "1. Термины и стороны",
      body:
        "Исполнитель — лицо, администрирующее платформу Autizm skrining (далее — «Мы», «Платформа»). Пользователь — физическое лицо, принявшее оферту и прошедшее анкету или оплату на Платформе. Контент — вопросы теста, результаты, тексты с использованием ИИ, PDF и иные материалы.",
    },
    {
      title: "2. Предмет услуги",
      body:
        "Платформа позволяет родителям (или законным представителям) заполнить скринговую анкету по развитию ребёнка, получить автоматически сформированные оценки, дополнительные функции (например, заключение ИИ, экспорт в PDF) и полный доступ к результатам после оплаты. Услуга оказывается дистанционно через интернет. Состав функций и тарифы действуют в редакции, размещённой на сайте.",
    },
    {
      title: "3. Отсутствие медицинского диагноза",
      body:
        "Результаты скрининга не являются медицинским диагнозом, не заменяют заключения врача и не используются как основание для самостоятельного назначения лечения. Они носят информационный характер. Окончательная оценка, диагноз и план действий определяются только квалифицированным специалистом. Пользователь несёт самостоятельную ответственность за решения, принятые на основе материалов Платформы.",
    },
    {
      title: "4. Обязанности пользователя",
      body:
        "Пользователь обязуется предоставлять достоверные данные, не нарушать права третьих лиц, не использовать Платформу во вред её работе (включая автоматизированный сбор данных и попытки несанкционированного доступа). Точность возраста и исходных данных влияет на содержательную интерпретацию результатов и является зоной ответственности пользователя.",
    },
    {
      title: "5. Персональные данные и конфиденциальность",
      body:
        "В процессе могут обрабатываться номер телефона, ответы на вопросы, результаты и технические журналы. Обработка осуществляется для оказания услуг, учёта платежей, соблюдения законодательства и обеспечения безопасности. Передача третьим лицам — в случаях, предусмотренных законом, либо в обезличенном виде. Подробная политика конфиденциальности может размещаться отдельно на сайте.",
    },
    {
      title: "6. Оплата и расчёты через Click",
      body:
        "Отдельные результаты и функции могут быть платными в соответствии с действующими тарифами. Платежи через Click и иные платёжные системы регулируются их правилами. После успешной оплаты пользователю предоставляется заявленный объём контента и функций. Споры по техническим сбоям или неоказанной услуге рассматриваются в рамках закона и внутреннего порядка Платформы.",
    },
    {
      title: "7. Интеллектуальная собственность",
      body:
        "Тесты, дизайн, программный код, тексты, промпты ИИ и иные материалы охраняются правами на интеллектуальную собственность. Копирование, распространение или коммерческое использование без разрешения запрещено. Пользователь вправе сохранять результаты для личного использования и показа специалисту.",
    },
    {
      title: "8. Ограничение ответственности",
      body:
        "Платформа предоставляется «как есть» в рамках доступных технологий. За сбои сторонних сервисов (платежи, хостинг, провайдеры ИИ) ответственность ограничивается условиями таких сервисов. Ответственность Исполнителя за прямой или косвенный вред не превышает пределов, установленных законом.",
    },
    {
      title: "9. Изменение и прекращение оферты",
      body:
        "Мы вправе изменять оферту, размещая обновлённую редакцию на сайте. О существенных изменениях по возможности сообщается заранее. Продолжение использования после публикации новой редакции означает согласие с ней. Мы вправе приостановить или прекратить сервис по техническим или правовым причинам.",
    },
    {
      title: "10. Контакты",
      body:
        "По вопросам оферты, оплаты или сервиса вы можете обратиться через раздел «Помощь» / контакты на сайте. Реквизиты и официальные адреса могут обновляться на веб-ресурсе.",
    },
  ],
  footerNote:
    "Для окончательной правовой оценки рекомендуется получить консультацию профессионального юриста.",
};

export function getPublicOffer(locale: "uz" | "ru"): PublicOfferDocument {
  return locale === "ru" ? publicOfferRu : publicOfferUz;
}
