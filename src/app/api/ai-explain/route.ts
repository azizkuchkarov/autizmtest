// src/app/api/ai-explain/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AiResponse = {
  text: string;
};

function fallbackAi(message?: string): AiResponse {
  return {
    text:
      message ??
      "AI xulosasi hozircha tayyor bo‘lmadi. Keyinroq qayta urinib ko‘ring.\n\nBu tibbiy tashxis emas. Skrining natijasi yo‘naltiruvchi ma’lumot beradi.",
  };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(fallbackAi("OPENAI_API_KEY topilmadi (.env.local)."), { status: 200 });
    }

    const input = await req.json();

    const system = `
Siz klinik skrining natijalarini tushuntiradigan professional yordamchisiz.
Vazifa: foydalanuvchiga (ota-onaga) autizm skriningi natijasini aniq, ehtiyotkor va tushunarli qilib izohlash.

QAT’IY QOIDALAR:
1) Siz TASHXIS qo‘ymaysiz. “Autizm bor” yoki “yo‘q” demang. Faqat “xavf darajasi / ehtimol / skrining natijasi” deysiz.
2) Vahima uyg‘otmang. Juda yumshatib yubormang ham. Balansli, professional tilda yozing.
3) Har doim quyidagi disclaimer bo‘lsin: “Bu tibbiy tashxis emas. Skrining natijasi yo‘naltiruvchi ma’lumot beradi.”
4) Tavsiyalar konkret bo‘lsin: kimga murojaat qilish (pediatr / bolalar nevrologi / bolalar psixiatri / klinik psixolog / ABA mutaxassis), qanday kuzatishlar, nimalarni yozib borish.
5) Natija tuzilmasi doim bir xil:
   - Qisqa xulosa (2-3 gap)
   - Kuchli kuzatilgan sohalar (top 2 blok)
   - Kundalik hayotga ta’siri (agar bo‘lsa)
   - Keyingi qadamlar (3-6 band, juda aniq)
   - Disclaimer (majburiy)
6) Til: O‘zbek (lotin). Tibbiy terminlar minimal. Juda uzun bo‘lmang (200-350 so‘z).
7) Agar redFlagCount >= 1 bo‘lsa: “erta baholashni tezlashtirish” tavsiyasi kuchliroq bo‘lsin.
8) Agar risk tier LOW bo‘lsa ham: “rivoj kuzatuvi” va “agar alomat kuchaysa murojaat” deyiladi.

KIRITMA (INPUT) — sizga JSON beriladi, shunga tayanasiz:
{
  "ageBand": "2-3|4-5|6-7",
  "riskTier": "LOW|WATCH|MODERATE|HIGH",
  "riskScorePercent": 0-100,
  "topDomains": ["social","communication","repetitive","sensory","play","daily"],
  "domainSeverities": { "social":0-100, "communication":0-100, "repetitive":0-100, "sensory":0-100, "play":0-100, "daily":0-100 },
  "redFlagCount": number,
  "parentNotes": "ota-onaning ixtiyoriy izohi (bo‘lsa)"
}

CHIQISH (OUTPUT):
- Faqat tayyor xulosa matni (sarlavha bilan).
- Hech qanday JSON qaytarmang.
`.trim();

    const user = `INPUT JSON: ${JSON.stringify(input)}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json(fallbackAi(`AI xatolik: ${resp.status}. Keyinroq qayta urinib ko‘ring.`), {
        status: 200,
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(fallbackAi("AI javobi bo‘sh keldi."), { status: 200 });
    }

    return NextResponse.json({ text: content.trim() }, { status: 200 });
  } catch {
    return NextResponse.json(fallbackAi("Server xatoligi. Qayta urinib ko‘ring."), { status: 200 });
  }
}
