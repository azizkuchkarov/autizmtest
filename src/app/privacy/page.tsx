import type { Metadata } from "next";

/*
 * Maxfiylik siyosati — App Store va Google Play talab qiladigan ochiq sahifa (https://autizmtest.uz/privacy).
 * Matn ilova haqiqatan yig'adigan ma'lumotlarga mos: o'zgarsa (yangi ma'lumot, yangi xizmat) shu yerda ham yangilang.
 */

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "AutizmTest ilovasi va sayti qanday ma'lumot yig'adi, nima uchun ishlatadi va qanday o'chiriladi.",
};

const CONTACT_EMAIL = "aziz.kuchkarov91@gmail.com";
const UPDATED = "2026-11-01";

type Section = { title: string; body: string[] };
type Policy = { id: string; lang: string; title: string; updated: string; intro: string; sections: Section[] };

const POLICIES: Policy[] = [
  {
    id: "uz",
    lang: "O'zbekcha",
    title: "Maxfiylik siyosati",
    updated: `Oxirgi yangilanish: ${UPDATED}`,
    intro:
      "AutizmTest — ota-onalar uchun bola rivojlanishi skriningi va uyda mashg'ulotlar ilovasi. Bu sahifa ilova va sayt qanday ma'lumot yig'ishini, nima uchun ishlatishini va uni qanday o'chirish mumkinligini tushuntiradi.",
    sections: [
      {
        title: "1. Qanday ma'lumot yig'iladi",
        body: [
          "Telefon raqamingiz — tizimga kirish uchun (kod SMS yoki Telegram orqali yuboriladi). Telegram orqali kirsangiz, Telegram ID va chat ID ham saqlanadi.",
          "Bola profili: ismi, tug'ilgan yili va oyi, jinsi, tanlangan avatar.",
          "Skrining va ko'nikmalar testlaridagi javoblar va natijalar.",
          "Ertalabki kundalik: uyqu, kayfiyat, ovqatlanish, xulq, dori qabul qilish kabi belgilaringiz.",
          "Mashg'ulotlar tarixi: bajarilgan o'yinlar, ovozli darslar javoblari, rasmli muloqot kartalaridan foydalanish soni.",
          "Eslatma sozlamalari (vaqtlar) va bildirishnomalar uchun qurilma tokeni, platforma (iOS/Android) va til.",
        ],
      },
      {
        title: "2. Faqat telefoningizda qoladigan ma'lumotlar",
        body: [
          "Rasmli muloqot kartalari uchun olingan suratlar, galereyadan tanlangan rasmlar va yozib olingan ovozlar serverga yuborilmaydi — ular faqat qurilmangizda saqlanadi. Kamera, mikrofon va galereyaga ruxsat faqat shu maqsadda so'raladi.",
        ],
      },
      {
        title: "3. Ma'lumotlar nima uchun ishlatiladi",
        body: [
          "Test natijasini hisoblash va ko'rsatish, bolaning o'sishini kuzatish, mashg'ulotlarni tavsiya qilish, eslatmalar yuborish va telefon almashtirilganda tarixni tiklash uchun.",
          "Biz reklama ko'rsatmaymiz, foydalanuvchilarni boshqa ilova va saytlarda kuzatmaymiz (tracking yo'q) va ma'lumotlarni sotmaymiz.",
        ],
      },
      {
        title: "4. Uchinchi tomon xizmatlari",
        body: [
          "Eskiz.uz — tizimga kirish kodi bilan SMS yuborish uchun telefon raqamingiz uzatiladi.",
          "Telegram — bot orqali kirishni tanlasangiz, kirish kodi Telegram orqali yuboriladi; raqamingizni tasdiqlash uchun kontaktingizni o'zingiz ulashasiz.",
          "OpenAI — ixtiyoriy AI xulosa uchun test natijalari (ballar, yosh guruhi) yuboriladi; telefon raqami va bola ismi yuborilmaydi.",
          "Google Firebase Cloud Messaging va Apple Push Notification service — bildirishnomalarni yetkazish uchun qurilma tokeni ishlatiladi.",
          "Ma'lumotlar xizmat serverlarimizda saqlanadi.",
        ],
      },
      {
        title: "5. Saqlash muddati va o'chirish",
        body: [
          "Ma'lumotlar akkauntingiz mavjud ekan saqlanadi. Ilovada Profil → «Akkauntni o'chirish» orqali akkauntni va unga bog'liq barcha ma'lumotlarni (bola profili, testlar, kundalik, mashg'ulotlar tarixi, qurilma tokenlari) istalgan vaqtda butunlay o'chirishingiz mumkin.",
          `Ma'lumotlaringiz nusxasini olish yoki o'chirish bo'yicha savollar uchun ${CONTACT_EMAIL} manziliga yozing. Batafsil: https://autizmtest.uz/delete-account`,
        ],
      },
      {
        title: "6. Bolalar",
        body: [
          "Ilova ota-onalar (vasiylar) uchun mo'ljallangan. Akkauntni ota-ona ochadi va bola haqidagi ma'lumotlarni o'zi kiritadi; bolalar uchun alohida akkaunt yo'q.",
        ],
      },
      {
        title: "7. Tibbiy tashxis emas",
        body: [
          "Ilova natijalari skrining xarakteriga ega va tibbiy tashxis hisoblanmaydi. Yakuniy xulosa uchun mutaxassisga murojaat qiling.",
        ],
      },
      {
        title: "8. Xavfsizlik va o'zgarishlar",
        body: [
          "Ma'lumotlar shifrlangan ulanish (HTTPS) orqali uzatiladi va faqat xizmatni ko'rsatish uchun zarur bo'lgan xodimlarga ochiq.",
          "Siyosat o'zgarsa, yangi tahriri shu sahifada sanasi bilan e'lon qilinadi.",
          `Aloqa: ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },
  {
    id: "ru",
    lang: "Русский",
    title: "Политика конфиденциальности",
    updated: `Последнее обновление: ${UPDATED}`,
    intro:
      "AutizmTest — приложение для родителей: скрининг развития ребёнка и занятия дома. Здесь описано, какие данные собирают приложение и сайт, зачем они используются и как их удалить.",
    sections: [
      {
        title: "1. Какие данные собираются",
        body: [
          "Номер телефона — для входа (код приходит по SMS или в Telegram). При входе через Telegram также сохраняются Telegram ID и ID чата.",
          "Профиль ребёнка: имя, год и месяц рождения, пол, выбранный аватар.",
          "Ответы и результаты скрининга и теста навыков.",
          "Утренний дневник: сон, настроение, питание, поведение, приём лекарств — то, что вы отмечаете.",
          "История занятий: выполненные игры, ответы в звуковых уроках, количество использований карточек.",
          "Настройки напоминаний (время) и для уведомлений — токен устройства, платформа (iOS/Android) и язык.",
        ],
      },
      {
        title: "2. Данные, которые остаются только на телефоне",
        body: [
          "Фото, снятые для карточек, изображения из галереи и записанный голос не отправляются на сервер — они хранятся только на устройстве. Доступ к камере, микрофону и галерее запрашивается только для этого.",
        ],
      },
      {
        title: "3. Зачем используются данные",
        body: [
          "Чтобы рассчитать и показать результат теста, отслеживать прогресс ребёнка, рекомендовать занятия, присылать напоминания и восстанавливать историю на новом телефоне.",
          "Мы не показываем рекламу, не отслеживаем пользователей в других приложениях и на сайтах (нет трекинга) и не продаём данные.",
        ],
      },
      {
        title: "4. Сторонние сервисы",
        body: [
          "Eskiz.uz — для отправки SMS с кодом входа передаётся номер телефона.",
          "Telegram — если вы выбрали вход через бота, код отправляется в Telegram; для подтверждения номера вы сами делитесь своим контактом.",
          "OpenAI — для необязательного AI-заключения передаются результаты теста (баллы, возрастная группа); номер телефона и имя ребёнка не передаются.",
          "Google Firebase Cloud Messaging и Apple Push Notification service — токен устройства для доставки уведомлений.",
          "Данные хранятся на серверах сервиса.",
        ],
      },
      {
        title: "5. Срок хранения и удаление",
        body: [
          "Данные хранятся, пока существует аккаунт. В приложении: Профиль → «Удалить аккаунт» — аккаунт и все связанные данные (профиль ребёнка, тесты, дневник, история занятий, токены устройств) удаляются полностью.",
          `По вопросам получения копии или удаления данных пишите на ${CONTACT_EMAIL}. Подробнее: https://autizmtest.uz/delete-account`,
        ],
      },
      {
        title: "6. Дети",
        body: [
          "Приложение предназначено для родителей (опекунов). Аккаунт создаёт родитель и сам вводит данные о ребёнке; отдельных аккаунтов для детей нет.",
        ],
      },
      {
        title: "7. Не медицинский диагноз",
        body: ["Результаты носят скрининговый характер и не являются медицинским диагнозом. За заключением обратитесь к специалисту."],
      },
      {
        title: "8. Безопасность и изменения",
        body: [
          "Данные передаются по защищённому соединению (HTTPS) и доступны только сотрудникам, которым это нужно для работы сервиса.",
          "При изменении политики новая редакция публикуется на этой странице с датой.",
          `Контакт: ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },
  {
    id: "en",
    lang: "English",
    title: "Privacy Policy",
    updated: `Last updated: ${UPDATED}`,
    intro:
      "AutizmTest is an app for parents: child development screening and home practice. This page explains what data the app and website collect, why, and how to delete it.",
    sections: [
      {
        title: "1. Data we collect",
        body: [
          "Your phone number — to sign in (we send a code by SMS or Telegram). If you sign in with Telegram, your Telegram ID and chat ID are also stored.",
          "Child profile: first name, birth year and month, gender, chosen avatar.",
          "Answers and results of the screening and skills tests.",
          "Morning diary: sleep, mood, meals, behaviour and medication entries you record.",
          "Practice history: games completed, sound lesson answers, picture-board usage counts.",
          "Reminder settings (times) and, for notifications, a device token, platform (iOS/Android) and language.",
        ],
      },
      {
        title: "2. Data that stays on your phone",
        body: [
          "Photos taken for picture cards, images chosen from your library and voice recordings are not uploaded — they are stored only on your device. Camera, microphone and photo access are requested only for this.",
        ],
      },
      {
        title: "3. How we use data",
        body: [
          "To calculate and show test results, track your child's progress, recommend activities, send reminders and restore your history on a new phone.",
          "We do not show ads, do not track you across other apps or websites, and do not sell data.",
        ],
      },
      {
        title: "4. Third-party services",
        body: [
          "Eskiz.uz — receives your phone number to deliver the sign-in SMS.",
          "Telegram — if you choose to sign in with the bot, the code is sent via Telegram; you share your own contact to confirm your number.",
          "OpenAI — receives test results (scores, age group) for the optional AI summary; your phone number and the child's name are not sent.",
          "Google Firebase Cloud Messaging and Apple Push Notification service — use a device token to deliver notifications.",
          "Data is stored on our service's servers.",
        ],
      },
      {
        title: "5. Retention and deletion",
        body: [
          "Data is kept while your account exists. In the app, Profile → “Delete account” permanently deletes the account and all related data (child profile, tests, diary, practice history, device tokens).",
          `For a copy of your data or deletion requests, email ${CONTACT_EMAIL}. Details: https://autizmtest.uz/delete-account`,
        ],
      },
      {
        title: "6. Children",
        body: [
          "The app is intended for parents and guardians. The parent creates the account and enters information about the child; children do not have their own accounts.",
        ],
      },
      {
        title: "7. Not a medical diagnosis",
        body: ["Results are a screening, not a medical diagnosis. Please consult a specialist for a final assessment."],
      },
      {
        title: "8. Security and changes",
        body: [
          "Data is transferred over encrypted connections (HTTPS) and is accessible only to staff who need it to run the service.",
          "If this policy changes, the new version will be published on this page with its date.",
          `Contact: ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[15px] leading-relaxed text-slate-800">
      <nav className="mb-8 flex gap-3 text-sm">
        {POLICIES.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100">
            {p.lang}
          </a>
        ))}
      </nav>
      {POLICIES.map((p) => (
        <section key={p.id} id={p.id} lang={p.id} className="mb-14 scroll-mt-6">
          <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{p.updated}</p>
          <p className="mt-4">{p.intro}</p>
          {p.sections.map((s) => (
            <div key={s.title} className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {s.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
