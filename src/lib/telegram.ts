/*
 * Telegram bot orqali kirish kodi: SMS'ga muqobil (bepul).
 * Bot telefon raqami bo'yicha o'zi yoza olmaydi — ota-ona botni havola orqali ochadi va
 * Telegram'ning "kontakt yuborish" tugmasi bilan raqamini tasdiqlaydi; keyingi safar kod darhol yuboriladi.
 * .env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_USERNAME (ixtiyoriy, default: autizmtestbot)
 */

export type BotLocale = "uz" | "ru";

export function botUsername() {
  return (process.env.TELEGRAM_BOT_USERNAME || "autizmtestbot").replace(/^@/, "");
}

/** Botni ochadigan havola: start parametri kodni shu so'rovga bog'laydi. */
export function botStartLink(token: string) {
  return `https://t.me/${botUsername()}?start=${token}`;
}

type ReplyMarkup =
  | { keyboard: { text: string; request_contact?: boolean }[][]; resize_keyboard: boolean; one_time_keyboard: boolean }
  | { remove_keyboard: true };

export async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: ReplyMarkup) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN .env da belgilanmagan.");
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup: replyMarkup }),
  });
  if (!res.ok) throw new Error(`Telegram xato (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

export const BOT_TEXT = {
  uz: {
    code: (code: string) => `🔐 AutizmTest'ga kirish kodi: <b>${code}</b>\n\nKod 5 daqiqa amal qiladi. Uni hech kimga bermang.`,
    askContact:
      "Assalomu alaykum! 👋\n\nKirish kodini olish uchun pastdagi «📱 Raqamni yuborish» tugmasini bosing — ilovaga kiritgan raqamingiz bilan bir xil bo'lishi kerak.",
    contactButton: "📱 Raqamni yuborish",
    notOwnContact: "Iltimos, o'z raqamingizni pastdagi «📱 Raqamni yuborish» tugmasi orqali yuboring.",
    mismatch: (phone: string) =>
      `Bu raqam ilovaga kiritilgan raqamga mos kelmadi (${phone}). Ilovada to'g'ri raqamni kiritib, «Telegram orqali kod olish»ni qayta bosing.`,
    expired: "Havolaning muddati tugagan. Ilovaga qaytib, «Telegram orqali kod olish»ni qayta bosing.",
    welcome:
      "Assalomu alaykum! Bu AutizmTest ilovasining rasmiy boti. Kirish kodini olish uchun ilovada raqamingizni kiriting va «Telegram orqali kod olish»ni bosing.",
  },
  ru: {
    code: (code: string) => `🔐 Код для входа в AutizmTest: <b>${code}</b>\n\nКод действует 5 минут. Никому его не сообщайте.`,
    askContact:
      "Здравствуйте! 👋\n\nЧтобы получить код, нажмите кнопку «📱 Отправить номер» ниже — номер должен совпадать с тем, что вы ввели в приложении.",
    contactButton: "📱 Отправить номер",
    notOwnContact: "Пожалуйста, отправьте свой номер кнопкой «📱 Отправить номер» ниже.",
    mismatch: (phone: string) =>
      `Этот номер не совпадает с номером в приложении (${phone}). Введите правильный номер в приложении и снова нажмите «Получить код в Telegram».`,
    expired: "Срок действия ссылки истёк. Вернитесь в приложение и снова нажмите «Получить код в Telegram».",
    welcome:
      "Здравствуйте! Это официальный бот приложения AutizmTest. Чтобы получить код входа, введите номер в приложении и нажмите «Получить код в Telegram».",
  },
} as const;

export function botLocale(value: string | null | undefined): BotLocale {
  return value === "ru" ? "ru" : "uz";
}
