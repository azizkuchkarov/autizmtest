import { NextResponse } from "next/server";
import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/user-auth";
import { sendSms } from "@/lib/eskiz";
import { BOT_TEXT, botLocale, botStartLink, sendTelegramMessage } from "@/lib/telegram";
import { clientIp, hit, tooManyRequests } from "@/lib/rate-limit";

const OTP_TTL_MINUTES = 5;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
 * Cheklovlar (kodni taxmin qilib topish va pullik SMS'ni suiiste'mol qilishga qarshi):
 *  - bitta raqam va kanal: daqiqasiga 1 ta, soatiga 5 ta kod;
 *  - bitta raqam: kuniga jami 20 ta kod (REVIEW_PHONE bundan mustasno — do'kon tekshiruvchisi bloklanmasin);
 *  - bitta IP: soatiga 30 ta so'rov (eng yaxshi harakat, src/lib/rate-limit.ts).
 * Har bir kodga 5 tadan ortiq urinish yo'q (verify).
 */
const PER_CHANNEL_HOURLY = 5;
const PER_PHONE_DAILY = 20;
const PER_IP_HOURLY = 30;

/** 6 xonali kod (mobil ilova aynan 6 ta raqam kutadi); kriptografik tasodifiy */
function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const phone = normalizePhone(String(body?.phone || ""));
    // Kod qayerga yuboriladi: SMS (Eskiz) yoki Telegram bot
    const channel = body?.channel === "telegram" ? "telegram" : "sms";
    const locale = botLocale(body?.locale);

    if (!/^\+998\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak." },
        { status: 400 }
      );
    }

    const ip = await clientIp();
    if (ip && !hit(`otp-request:${ip}`, PER_IP_HOURLY, HOUR)) return tooManyRequests();

    // App Store / Google Play tekshiruvchilari uchun demo akkaunt: SMS yuborilmaydi, kod .env dan olinadi
    const reviewPhone = process.env.REVIEW_PHONE ? normalizePhone(process.env.REVIEW_PHONE) : "";
    const reviewCode = process.env.REVIEW_OTP_CODE?.trim();
    const isReview = !!reviewPhone && phone === reviewPhone && !!reviewCode && /^(\d{4}|\d{6})$/.test(reviewCode);

    const now = Date.now();
    const recent = await prisma.otpCode.findMany({
      where: { phone, createdAt: { gte: new Date(now - DAY) } },
      select: { channel: true, createdAt: true },
    });
    const sameChannel = recent.filter((r) => r.channel === channel);
    if (sameChannel.some((r) => r.createdAt.getTime() > now - MINUTE)) {
      return NextResponse.json({ error: "Keyinroq urinib ko‘ring (1 daqiqadan keyin)." }, { status: 429 });
    }
    if (
      !isReview &&
      (sameChannel.filter((r) => r.createdAt.getTime() > now - HOUR).length >= PER_CHANNEL_HOURLY || recent.length >= PER_PHONE_DAILY)
    ) {
      return tooManyRequests("Kod juda ko‘p so‘raldi. Birozdan keyin qayta urinib ko‘ring.");
    }

    // Eski yozuvlar tozalanadi (cheklovlar faqat so'nggi 24 soatni hisoblaydi)
    await prisma.otpCode.deleteMany({ where: { createdAt: { lt: new Date(now - DAY) } } }).catch(() => {});

    const devCode = process.env.OTP_DEV_CODE?.trim();
    const useDevCode = process.env.NODE_ENV !== "production" && !!devCode && /^\d{4,6}$/.test(devCode);

    const code = isReview ? reviewCode : useDevCode ? devCode : generateCode();
    const expiresAt = new Date(now + OTP_TTL_MINUTES * MINUTE);

    const tgToken = channel === "telegram" ? randomBytes(16).toString("hex") : null;
    const otp = await prisma.otpCode.create({
      data: { phone, code, expiresAt, channel, locale, tgToken },
    });

    if (channel === "telegram") {
      const link = botStartLink(tgToken!);
      if (isReview || useDevCode) {
        return NextResponse.json({ ok: true, channel, sent: true, link, ...(useDevCode ? { devCode } : {}) });
      }
      // Raqam avval bot bilan tasdiqlangan bo'lsa — kod darhol yuboriladi; aks holda ota-ona botni havola orqali ochadi
      const linked = await prisma.telegramLink.findUnique({ where: { phone } });
      if (linked) {
        try {
          await sendTelegramMessage(linked.chatId, BOT_TEXT[locale].code(code));
          return NextResponse.json({ ok: true, channel, sent: true, link });
        } catch (tgErr) {
          // Bot bloklangan yoki chat o'chirilgan: havola orqali qayta bog'lanadi
          console.error("[OTP telegram]", tgErr instanceof Error ? tgErr.message : tgErr);
        }
      }
      return NextResponse.json({ ok: true, channel, sent: false, link });
    }

    if (isReview) {
      return NextResponse.json({ ok: true, message: "SMS yuborildi. Kodni kiriting." });
    }

    if (useDevCode) {
      return NextResponse.json({
        ok: true,
        message: "Test rejimida SMS yuborilmadi. Quyidagi kodni kiriting.",
        devCode,
      });
    }

    // Eskiz shabloni bilan mos: "autizmtest.uz saytiga ro'yxatdan o'tish uchun tasdiqlash kodi: 0000"
    const message = `autizmtest.uz saytiga ro'yxatdan o'tish uchun tasdiqlash kodi: ${code}`;
    try {
      await sendSms(phone, message);
    } catch (smsErr: unknown) {
      // Yuborilmagan kod cheklovlarga hisoblanmasin va ishlatilmasin
      await prisma.otpCode.deleteMany({ where: { id: otp.id } }).catch(() => {});
      const smsMsg = smsErr instanceof Error ? smsErr.message : String(smsErr);
      if (
        smsMsg.includes("Для теста") ||
        smsMsg.includes("only one of these texts") ||
        smsMsg.includes("test from Eskiz")
      ) {
        console.error("[OTP request] Eskiz test rejimida:", smsMsg);
        return NextResponse.json(
          {
            error:
              "Eskiz test rejimida — ixtiyoriy matn yuborish faqat to‘liq faollashtirilgandan keyin ishlaydi. my.eskiz.uz da akkauntni faollashtiring yoki .env ga OTP_DEV_CODE=123456 qo‘shing va shu kod bilan tasdiqlang.",
          },
          { status: 400 }
        );
      }
      throw smsErr;
    }

    return NextResponse.json({
      ok: true,
      message: "SMS yuborildi. Kodni kiriting.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server xatoligi.";
    console.error("[OTP request]", message);

    // Foydalanuvchiga tushunarli xabar: sabab ma'lum bo'lsa (ichki tafsilotlar faqat server logida)
    let userError = "SMS yuborilmadi.";
    if (message.includes("ESKIZ_EMAIL") || message.includes("ESKIZ_PASSWORD")) {
      userError =
        "SMS sozlanmagan. Serverda .env da ESKIZ_EMAIL va ESKIZ_PASSWORD to'ldirilishi kerak (Eskiz.uz akkaunt).";
    } else if (message.includes("Eskiz auth xato") || message.includes("Eskiz SMS xato")) {
      userError = "SMS xizmati vaqtincha ishlamayapti. Keyinroq urinib ko'ring yoki administrator bilan bog'laning.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
