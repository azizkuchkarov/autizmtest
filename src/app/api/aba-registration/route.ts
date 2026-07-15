import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const AGE_GROUP_LABELS: Record<string, string> = {
  AGE_1_5_2: "1,5–2 yosh",
  AGE_3_4: "3–4 yosh",
  AGE_5_6: "5–6 yosh",
  AGE_7_9: "7–9 yosh",
};

/** Mijoz "Ro'yxatga yozilish" bosganda: assessment + markaz ma'lumotlarini Telegramga yuboradi */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : null;
    const centerId = typeof body?.centerId === "string" ? body.centerId.trim() : null;

    if (!assessmentId || !centerId) {
      return NextResponse.json(
        { error: "assessmentId va centerId kerak." },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Natija topilmadi." }, { status: 404 });
    }

    const center = await prisma.abaCenter.findUnique({
      where: { id: centerId },
    });
    if (!center) {
      return NextResponse.json({ error: "Markaz topilmadi." }, { status: 404 });
    }
    if (!center.telegramId?.trim()) {
      return NextResponse.json(
        { error: "Ushbu markaz uchun Telegram ID kiritilmagan. Admin panelda kiriting." },
        { status: 400 }
      );
    }

    const phone = assessment.phone ?? "—";
    const ageLabel = AGE_GROUP_LABELS[assessment.ageGroup] ?? assessment.ageGroup ?? "—";
    const gender = assessment.childGender ?? "—";

    const text = [
      "📋 Ro'yxatga yozilish (skrining natijasi)",
      "",
      `Markaz: ${center.name}`,
      `Mijoz telefoni: ${phone}`,
      `Bolaning yoshi: ${ageLabel}`,
      `Bolaning jinsi: ${gender}`,
      "",
      `Xulosa ID: ${assessmentId}`,
    ].join("\n");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[aba-registration] TELEGRAM_BOT_TOKEN mavjud emas");
      return NextResponse.json(
        { error: "Telegram bot sozlanmagan. TELEGRAM_BOT_TOKEN ni .env da kiriting." },
        { status: 500 }
      );
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: center.telegramId.trim(),
        text,
      }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { description?: string; error_code?: number };
      const desc = (errData?.description ?? "").toLowerCase();
      console.error("[aba-registration] Telegram API:", res.status, errData);

      let userMessage = "Telegramga xabar yuborish amalga oshmadi. Markazning Telegram ID sini tekshiring.";
      if (res.status === 401) {
        userMessage = "Bot token noto‘g‘ri. .env da TELEGRAM_BOT_TOKEN ni tekshiring.";
      } else if (res.status === 400 && (desc.includes("chat not found") || desc.includes("chat_id"))) {
        userMessage =
          "Chat topilmadi. Markaz vakili avval botga /start yuborgan yoki bot guruhga qo‘shilgan bo‘lishi kerak. Telegram ID ni qayta tekshiring.";
      } else if (res.status === 403) {
        userMessage = "Bot bloklangan yoki xabar yuborish taqiqlangan.";
      } else if (errData?.description) {
        userMessage = `Telegram: ${errData.description}`;
      }

      return NextResponse.json({ error: userMessage }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[aba-registration]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
