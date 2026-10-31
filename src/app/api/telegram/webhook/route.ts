import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BOT_TEXT, botLocale, sendTelegramMessage } from "@/lib/telegram";

/*
 * Telegram bot webhook (setWebhook: scripts/telegram-set-webhook.mjs).
 * Oqim: ilova "Telegram orqali kod olish" → t.me/<bot>?start=<tgToken> → /start <tgToken> → bot kontakt so'raydi →
 * ota-ona o'z kontaktini yuboradi → raqam ilovadagi bilan mos bo'lsa, kod yuboriladi va raqam chatga bog'lanadi.
 */

type TgUser = { id: number; language_code?: string };
type TgMessage = {
  chat: { id: number; type: string };
  from?: TgUser;
  text?: string;
  contact?: { phone_number: string; user_id?: number };
};

export async function POST(req: Request) {
  // Faqat Telegram'dan kelgan so'rovlar (setWebhook'dagi secret_token)
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as { message?: TgMessage } | null;
  const message = update?.message;
  // Faqat shaxsiy chat: guruhlarda kod yuborilmaydi
  if (!message || message.chat.type !== "private") return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  try {
    if (message.contact) await handleContact(chatId, message);
    else if (message.text?.startsWith("/start")) await handleStart(chatId, message);
  } catch (e) {
    // Telegram javobni qayta yubormasligi uchun 200 qaytariladi; xato logga yoziladi
    console.error("[telegram webhook]", e instanceof Error ? e.message : e);
  }
  return NextResponse.json({ ok: true });
}

/** Kod hali amal qiladigan, shu chatga yoki shu havolaga bog'langan oxirgi Telegram so'rovi. */
function activeOtp(where: { tgToken: string } | { tgChatId: string }) {
  return prisma.otpCode.findFirst({
    where: { ...where, channel: "telegram", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

async function handleStart(chatId: string, message: TgMessage) {
  const token = message.text!.split(/\s+/)[1];
  const fallbackLocale = botLocale(message.from?.language_code === "ru" ? "ru" : "uz");
  if (!token) {
    await sendTelegramMessage(chatId, BOT_TEXT[fallbackLocale].welcome);
    return;
  }
  const otp = await activeOtp({ tgToken: token });
  if (!otp) {
    await sendTelegramMessage(chatId, BOT_TEXT[fallbackLocale].expired);
    return;
  }
  const t = BOT_TEXT[botLocale(otp.locale)];
  // Raqam shu chatga avval bog'langan bo'lsa — kontaktni qayta so'ramasdan kod yuboriladi
  const linked = await prisma.telegramLink.findUnique({ where: { phone: otp.phone } });
  if (linked?.chatId === chatId) {
    await sendTelegramMessage(chatId, t.code(otp.code), { remove_keyboard: true });
    return;
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { tgChatId: chatId } });
  await sendTelegramMessage(chatId, t.askContact, {
    keyboard: [[{ text: t.contactButton, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  });
}

async function handleContact(chatId: string, message: TgMessage) {
  const otp = await activeOtp({ tgChatId: chatId });
  const t = BOT_TEXT[botLocale(otp?.locale ?? (message.from?.language_code === "ru" ? "ru" : "uz"))];
  if (!otp) {
    await sendTelegramMessage(chatId, t.expired, { remove_keyboard: true });
    return;
  }
  // Faqat o'z kontakti: boshqa odamning raqamini ulashib kod olib bo'lmaydi
  if (!message.from || message.contact!.user_id !== message.from.id) {
    await sendTelegramMessage(chatId, t.notOwnContact);
    return;
  }
  // Telegram raqamni "998901234567" yoki "+998901234567" ko'rinishida beradi
  const phone = `+${message.contact!.phone_number.replace(/\D/g, "")}`;
  if (phone !== otp.phone) {
    await sendTelegramMessage(chatId, t.mismatch(otp.phone), { remove_keyboard: true });
    return;
  }
  await prisma.telegramLink.upsert({
    where: { phone },
    create: { phone, chatId, tgUserId: String(message.from.id) },
    update: { chatId, tgUserId: String(message.from.id) },
  });
  await sendTelegramMessage(chatId, t.code(otp.code), { remove_keyboard: true });
}
