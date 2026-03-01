import { NextResponse } from "next/server";

/** Mijoz "Yordam 24/7" orqali yuborgan xabar — admin Telegram ID siga yuboriladi */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Xabar matni kiritilishi shart." },
        { status: 400 }
      );
    }

    const adminChatId = process.env.ADMIN_TELEGRAM_ID?.trim();
    if (!adminChatId) {
      console.error("[help] ADMIN_TELEGRAM_ID mavjud emas");
      return NextResponse.json(
        { error: "Yordam xizmati hozircha sozlanmagan." },
        { status: 500 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Yordam xizmati hozircha sozlanmagan." },
        { status: 500 }
      );
    }

    const lines = [
      "🆘 Yordam 24/7 — yangi murojaat",
      "",
      name ? `Ism: ${name}` : null,
      phone ? `Telefon: ${phone}` : null,
      "",
      "Xabar:",
      message,
    ].filter(Boolean);

    const text = lines.join("\n");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
      }),
    });

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { description?: string };
      console.error("[help] Telegram API:", res.status, errData);
      return NextResponse.json(
        { error: "Xabar yuborish amalga oshmadi. Keyinroq urinib ko‘ring." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[help]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
