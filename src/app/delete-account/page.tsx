import type { Metadata } from "next";

/*
 * Akkaunt va ma'lumotlarni o'chirish — Google Play Data safety talab qiladigan ochiq sahifa (https://autizmtest.uz/delete-account).
 * Matn DELETE /api/mobile/me haqiqatan o'chiradigan narsalarga mos: o'zgarsa shu yerda ham yangilang.
 */

export const metadata: Metadata = {
  title: "Akkaunt va ma'lumotlarni o'chirish",
  description: "AutizmTest akkauntini va ma'lumotlarini qanday o'chirish mumkin, nima o'chadi va qancha vaqt oladi.",
};

const CONTACT_EMAIL = "aziz.kuchkarov91@gmail.com";

type Section = { title: string; items: string[] };
type Page = { id: string; lang: string; title: string; intro: string; sections: Section[] };

const PAGES: Page[] = [
  {
    id: "uz",
    lang: "O'zbekcha",
    title: "AutizmTest: akkaunt va ma'lumotlarni o'chirish",
    intro: "AutizmTest ilovasi yoki saytidagi akkauntingizni va ma'lumotlaringizni istalgan vaqtda o'chirishingiz mumkin.",
    sections: [
      {
        title: "1-usul. Ilovada yoki saytda (darhol)",
        items: ["Ilovani yoki saytni oching va akkauntingizga kiring.", "Profil bo'limiga o'ting.", "«Akkauntni o'chirish» tugmasini bosing va tasdiqlang."],
      },
      {
        title: "2-usul. Email orqali (30 kun ichida)",
        items: [
          `Akkauntga kira olmasangiz yoki akkauntni saqlab, faqat ayrim ma'lumotlarni o'chirmoqchi bo'lsangiz, ${CONTACT_EMAIL} manziliga yozing.`,
          "Xatda ro'yxatdan o'tgan telefon raqamingizni va nimani o'chirish kerakligini ko'rsating.",
          "Raqam sizniki ekanini tasdiqlashni so'rashimiz mumkin. So'rov 30 kun ichida bajariladi.",
        ],
      },
      {
        title: "Nima o'chiriladi",
        items: [
          "Telefon raqami va akkaunt, Telegram bog'lanishi (Telegram ID va chat ID).",
          "Bola profili: ismi, tug'ilgan yili va oyi, jinsi, avatari.",
          "Test javoblari va natijalari, kundalik, mashg'ulotlar tarixi, ko'rilgan videolar, video mashqlar, eslatma sozlamalari.",
          "Bildirishnoma tokenlari, sessiyalar, kirish kodlari va shu raqam bilan yuborilgan murojaatlar.",
        ],
      },
      {
        title: "Nima qoladi",
        items: [
          "Serverimizda akkauntingizga bog'langan ma'lumot qolmaydi; akkaunt o'chirilgach, uni tiklab bo'lmaydi.",
          "Telegram chatingizdagi bot xabarlarini o'zingiz o'chirasiz. SMS yuborish yozuvlari Eskiz.uz qoidalari bo'yicha saqlanadi.",
          "Telefon raqamisiz va akkauntsiz saytda to'ldirilgan anonim testlar kimga tegishli ekanini aniqlab bo'lmagani uchun o'chirilmaydi.",
          "Rasmli kartalar uchun rasm va ovozlar faqat telefoningizda turadi: ular ilovani telefondan o'chirganda o'chadi.",
        ],
      },
    ],
  },
  {
    id: "ru",
    lang: "Русский",
    title: "AutizmTest: удаление аккаунта и данных",
    intro: "Вы можете в любой момент удалить свой аккаунт и данные в приложении или на сайте AutizmTest.",
    sections: [
      {
        title: "Способ 1. В приложении или на сайте (сразу)",
        items: ["Откройте приложение или сайт и войдите в аккаунт.", "Перейдите в раздел «Профиль».", "Нажмите «Удалить аккаунт» и подтвердите."],
      },
      {
        title: "Способ 2. По email (в течение 30 дней)",
        items: [
          `Если вы не можете войти в аккаунт или хотите сохранить его и удалить только часть данных, напишите на ${CONTACT_EMAIL}.`,
          "Укажите в письме номер телефона, на который зарегистрирован аккаунт, и что именно нужно удалить.",
          "Мы можем попросить подтвердить, что номер принадлежит вам. Запрос выполняется в течение 30 дней.",
        ],
      },
      {
        title: "Что удаляется",
        items: [
          "Номер телефона и аккаунт, привязка Telegram (Telegram ID и ID чата).",
          "Профиль ребёнка: имя, год и месяц рождения, пол, аватар.",
          "Ответы и результаты тестов, дневник, история занятий, просмотренные видео, видеоупражнения, настройки напоминаний.",
          "Токены уведомлений, сессии, коды входа и обращения, отправленные с этим номером.",
        ],
      },
      {
        title: "Что остаётся",
        items: [
          "На нашем сервере не остаётся данных, связанных с вашим аккаунтом; восстановить удалённый аккаунт нельзя.",
          "Сообщения бота в вашем чате Telegram вы удаляете сами. Записи об отправке SMS хранятся по правилам Eskiz.uz.",
          "Анонимные тесты, пройденные на сайте без номера и аккаунта, не удаляются: нельзя определить, кому они принадлежат.",
          "Фото и голосовые записи для карточек хранятся только на вашем телефоне и удаляются вместе с приложением.",
        ],
      },
    ],
  },
  {
    id: "en",
    lang: "English",
    title: "AutizmTest: delete your account and data",
    intro: "You can delete your AutizmTest account and data at any time, in the app or on the website.",
    sections: [
      {
        title: "Option 1. In the app or on the website (immediately)",
        items: ["Open the app or website and sign in.", "Go to Profile.", "Tap “Delete account” (“Akkauntni o'chirish”) and confirm."],
      },
      {
        title: "Option 2. By email (within 30 days)",
        items: [
          `If you cannot sign in, or want to keep your account and delete only some data, email ${CONTACT_EMAIL}.`,
          "Include the phone number of your account and tell us what to delete.",
          "We may ask you to confirm that the number is yours. Requests are completed within 30 days.",
        ],
      },
      {
        title: "What is deleted",
        items: [
          "Your phone number and account, and your Telegram link (Telegram ID and chat ID).",
          "Child profile: first name, birth year and month, gender, avatar.",
          "Test answers and results, diary, practice history, watched videos, video exercises, reminder settings.",
          "Notification tokens, sessions, sign-in codes and messages you sent us with this number.",
        ],
      },
      {
        title: "What is kept",
        items: [
          "No data linked to your account remains on our server; a deleted account cannot be restored.",
          "You delete the bot's messages in your own Telegram chat. SMS delivery records are kept under Eskiz.uz's rules.",
          "Anonymous tests taken on the website without a phone number or account are not deleted, because we cannot tell whose they are.",
          "Photos and voice recordings for picture cards stay only on your phone and are removed with the app.",
        ],
      },
    ],
  },
];

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[15px] leading-relaxed text-slate-800">
      <nav className="mb-8 flex gap-3 text-sm">
        {PAGES.map((p) => (
          <a key={p.id} href={`#${p.id}`} className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100">
            {p.lang}
          </a>
        ))}
      </nav>
      {PAGES.map((p) => (
        <section key={p.id} id={p.id} lang={p.id} className="mb-14 scroll-mt-6">
          <h1 className="text-2xl font-bold text-slate-900">{p.title}</h1>
          <p className="mt-4">{p.intro}</p>
          {p.sections.map((s) => (
            <div key={s.title} className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {s.items.map((line) => (
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
