import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ScoreResponse, ScreeningV2Result, AiSummaryPayload } from "@/types/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;

    // Demo (namunaviy) natijalar — real bazaga tegmaydi
    if (
      assessmentId === "demo-0-20" ||
      assessmentId === "demo-20-40" ||
      assessmentId === "demo-40-60" ||
      assessmentId === "demo-60-80" ||
      assessmentId === "demo-80-100"
    ) {
      const demoTotal =
        assessmentId === "demo-0-20"
          ? 10
          : assessmentId === "demo-20-40"
            ? 30
            : assessmentId === "demo-40-60"
              ? 50
              : assessmentId === "demo-60-80"
                ? 70
                : 90;
      const demoRiskLabel: ScreeningV2Result["riskLabel"] =
        demoTotal <= 30 ? "Past xavf" : demoTotal <= 60 ? "O'rtacha xavf" : "Yuqori xavf";

      let demoRiskText: string;
      if (demoTotal <= 20) {
        demoRiskText =
          "0–20% oralig‘idagi natija bolaning autizm belgilari bo‘yicha riski juda past ekanini ko‘rsatadi. Javoblarga ko‘ra, ijtimoiy aloqa, muloqot va xatti-harakatlar hozircha yoshiga mos diapazonda.";
      } else if (demoTotal <= 40) {
        demoRiskText =
          "20–40% oralig‘idagi natija umumiy risk past ekanini bildiradi, lekin ayrim sohalarda kuzatuv davom ettirilishi maqsadga muvofiq. Ba’zi savollarda sezilarli bo‘lmagan, lekin e’tibor qilish mumkin bo‘lgan nuqtalar bor.";
      } else if (demoTotal <= 60) {
        demoRiskText =
          "40–60% oralig‘idagi natija o‘rta darajadagi riskni ko‘rsatadi. Bu albatta autizm tashxisi degani emas, lekin ijtimoiy aloqa, muloqot yoki takroriy xatti-harakatlar bo‘yicha ayrim belgilarga e’tibor qaratish kerakligini anglatadi.";
      } else if (demoTotal <= 80) {
        demoRiskText =
          "60–80% oralig‘idagi natija yuqori riskni bildiradi. Javoblar asosida bir nechta asosiy sohalarda (ijtimoiy aloqa, muloqot yoki takroriy xatti-harakatlar) namoyon bo‘layotgan belgilar ko‘rinmoqda.";
      } else {
        demoRiskText =
          "80–100% oralig‘idagi natija juda yuqori riskni ko‘rsatadi. Bu bola rivojlanishida autizmga xos bo‘lishi mumkin bo‘lgan belgilar bir nechta asosiy sohalarda ancha yaqqol ko‘rinayotganini anglatadi.";
      }

      const demoAiPayload: AiSummaryPayload = {
        summary: {
          shortConclusion: demoRiskText,
          whyThisLevel:
            demoTotal <= 30
              ? "Savollarga berilgan javoblar bo‘yicha bola ijtimoiy aloqa o‘rnatishi, kattalar bilan munosabatga kirishi va atrof-muhitga qiziqishi tabiiy va yoshiga mos ko‘rinadi. Autizmga xos keskin chekinish yoki takroriy xatti-harakatlar kuzatilmaydi."
              : demoTotal <= 40
                ? "Ba’zi savollarda ijtimoiy aloqa va muloqotda kichik qiyinchiliklar yoki odatdagidan biroz farq qiluvchi javoblar bor, lekin umumiy manzara baribir past risk diapazonida. Bu holat ko‘pincha individuallik yoki temperament farqlari bilan bog‘liq bo‘lishi mumkin."
                : demoTotal <= 60
                  ? "Natija ayrim sohalarda (masalan, ko‘z bilan aloqa, ismga javob berish, qo‘shma o‘yin, takroriy harakatlar) bo‘yicha e’tibor talab qiladigan belgilar borligini ko‘rsatadi. Bu belgilar barqaror va ko‘p vaziyatlarda kuzatilsa, mutaxassis bilan maslahat muhim."
                  : demoTotal <= 80
                    ? "Ko‘plab savollarda ijtimoiy aloqa cheklanganligi, muloqotning yetarli emasligi yoki takrorlanadigan xatti-harakatlar ustunligi qayd etilgan. Bu bola rivojlanishi bo‘yicha chuqurroq klinik baholash o‘tkazishni talab qiladi."
                    : "Javoblar asosida ijtimoiy aloqa, muloqot va xatti-harakatning bir necha blokida yuqori ballar to‘plangan. Bu kombinatsiya autizm spektri bo‘yicha jiddiy risk mavjudligini ko‘rsatadi va iloji boricha tezroq diagnostik baholash zarur.",
        },
        strengths: {
          examples:
            demoTotal <= 40
              ? [
                  "Bola qiziqqan odamlar bilan aloqa qilishga harakat qiladi va o‘yin davomida kattalar ishtirokini qabul qiladi.",
                  "Atrof-muhitdagi o‘yinchoqlar, tovushlar va yuz ifodalariga nisbatan tabiiy qiziqish namoyon bo‘ladi.",
                ]
              : [
                  "Ba’zi vaziyatlarda bola yaqin odamlarga mehr ifoda etishi yoki qulay sharoitda muloqotga kirishishi mumkin.",
                  "Kuzatuvlarda ma’lum o‘yin turlari yoki qiziqish sohalari bo‘yicha ijobiy dinamika ko‘rinadi.",
                ],
        },
        needsFocus: {
          priority:
            demoTotal <= 30
              ? [
                  "Ijtimoiy o‘yin va birgalikda faoliyatga vaqt ajratish orqali ijobiy rivojlanish traektoriyasini saqlab qolish.",
                  "Bolada paydo bo‘ladigan yangi xatti-harakatlarni muntazam kuzatib borish.",
                ]
              : demoTotal <= 40
                ? [
                    "Ayrim vaziyatlarda ismga javob berish yoki ko‘z bilan aloqa qisqa bo‘lishi mumkin — bu holat tez-tez takrorlansa, qayd qilib borish muhim.",
                    "Kundalik hayotda oddiy ijtimoiy o‘yinlar (navbat bilan o‘ynash, birga qaror qabul qilish)ga ko‘proq e’tibor qaratish.",
                  ]
                : demoTotal <= 60
                  ? [
                      "Ko‘z bilan aloqa va birgalikda diqqat (masalan, bir narsaga birga qarash, ko‘rsatish) vaziyatlarini ko‘paytirish.",
                      "Takrorlanadigan harakatlar (masalan, bir xil o‘yinchoqni uzoq vaqt aylantirish) soni va davomiyligini kuzatish.",
                      "Muloqotda oddiy so‘zlar, ishoralar va kundalik iboralardan foydalanishni rag‘batlantirish.",
                    ]
                  : demoTotal <= 80
                    ? [
                        "Ijtimoiy vaziyatlarda bolani sekin-asta qo‘llab-quvvatlab, qiyinlashadigan holatlarni qayd etish (masalan, jamoat joylari, yangi odamlar bilan uchrashuv).",
                        "Til va muloqot bo‘yicha logoped yoki rivojlanish bo‘yicha mutaxassis bilan dastlabki suhbatni rejalashtirish.",
                        "Qayta-qayta takrorlanadigan xatti-harakatlarga yumshoq chegaralar qo‘yib, e’tiborni boshqa faoliyatlarga yo‘naltirish.",
                      ]
                    : [
                        "Rivojlanish yoki autizm bo‘yicha ixtisoslashgan markazda batafsil diagnostik baholashni imkon qadar tezroq o‘tkazish.",
                        "Ijtimoiy aloqa va muloqot bo‘yicha strukturali dastur (masalan, ABA, rivojlanish terapiyalari) ni boshlash haqida o‘ylash.",
                        "Oilada kundalik rutinalarni barqaror qilish va bolaning o‘zini xavfsiz his qiladigan muhitni yaratish.",
                      ],
        },
        nextSteps: {
          homePlan: [
            {
              title:
                demoTotal <= 40
                  ? "Birgalikdagi o‘yinlar orqali ijtimoiy aloqani mustahkamlash"
                  : "Kundalik hayotda ijtimoiy aloqa va muloqotni oshirish",
              why:
                demoTotal <= 40
                  ? "Hozir risk past bo‘lsa ham, ota-ona bilan sifatli muloqot va o‘yin bolaning kelgusi rivojlanishi uchun eng muhim omillardan biridir."
                  : "Natija ayrim ijtimoiy va muloqot sohalarida qiyinchiliklar borligini ko‘rsatadi, uy sharoitida kichik, lekin muntazam qadamlar orqali bolaning o‘sishini qo‘llab-quvvatlash mumkin.",
              how:
                demoTotal <= 60
                  ? [
                      "Kuniga kamida 10–15 daqiqa vaqtni faqat bola bilan birga, telefon va boshqa chalg‘ituvchi omillarsiz o‘tkazish.",
                      "Bola biror narsaga qiziqsa (o‘yinchoq, kitob, multfilm), shu mavzuda savollar berib va izohlar aytib, birgalikda muloqot qilish.",
                      "Bolaga nimanidir ko‘rsatganingizda (masalan, o‘yinchoq yoki rasmlar), undan “qaragin”, “ko‘rdingmi?” kabi iboralar bilan birgalikda diqqatni bo‘lishishni taklif qilish.",
                    ]
                  : [
                      "Har kuni bir xil va bashorat qilinadigan kichik ritual yaratish (masalan, kechki ovqatdan oldin qisqa o‘yin, ertalab salomlashish marosimi).",
                      "Kundalik vazifalarni (kiyinish, ovqatlanish, yurish) kichik bosqichlarga bo‘lib, har bosqichni oddiy so‘zlar va ishoralar bilan tushuntirish.",
                      "Agar bola ma’lum vaziyatlarda (mehmonlar, yangi joylar) juda qiynalsa, bu holatlarni yozib borish va mutaxassisga ko‘rsatish.",
                    ],
            },
          ],
        },
        disclaimer: {
          text:
            "Bu AI xulosa — skrining natijalariga asoslangan avtomatik tavsif bo‘lib, tibbiy tashxis o‘rnini bosa olmaydi. Yakuniy baho va reja uchun pediatr, bolalar nevrologi yoki rivojlanish bo‘yicha mutaxassis bilan muloqot qilish tavsiya etiladi.",
        },
      };

      const scoring: ScreeningV2Result = {
        ageGroupId: "AGE_3_4",
        totalScore: demoTotal,
        riskLabel: demoRiskLabel,
        redFlagCount: demoTotal >= 60 ? 3 : demoTotal >= 40 ? 1 : 0,
        redFlags:
          demoTotal >= 60
            ? [
                { questionId: "RF1", text: "Bola ismi bilan murojaat qilinganda ko‘p hollarda javob bermaydi." },
                { questionId: "RF2", text: "Ko‘z bilan aloqa juda qisqa yoki deyarli yo‘q." },
                { questionId: "RF3", text: "Bola qiziquvchan narsalarni ko‘rsatish o‘rniga kattalarning qo‘lini tortadi." },
              ]
            : demoTotal >= 40
              ? [{ questionId: "RF1", text: "Bola ba’zan ismiga javob bermaydi yoki reaktsiya sust." }]
              : [],
        blocks: [
          {
            blockId: "SOCIAL",
            title: "Ijtimoiy aloqa",
            score: demoTotal,
            redFlags: [],
            topIssues: [],
          },
          {
            blockId: "COMM",
            title: "Muloqot",
            score: Math.min(100, demoTotal + 5),
            redFlags: [],
            topIssues: [],
          },
          {
            blockId: "RRB",
            title: "Takroriy xatti-harakat / rigidlik",
            score: Math.max(0, demoTotal - 5),
            redFlags: [],
            topIssues: [],
          },
        ],
        topOverall: [],
      };

      const response: ScoreResponse = {
        testType: "screening",
        scoring,
        aiSummary: {
          status: "ready",
          payload: demoAiPayload,
          error: null,
        },
        aiSummaryLocale: "uz",
        completedAt: new Date().toISOString(),
        ageGroup: "AGE_3_4",
        answers: null,
        paidAmount: null,
      };

      return NextResponse.json(response, { status: 200 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { payment: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment topilmadi." }, { status: 404 });
    }

    const rawScoring = assessment.scoring;
    if (rawScoring === null || rawScoring === undefined) {
      return NextResponse.json(
        { error: "Natija saqlanmagan yoki o‘chirilgan." },
        { status: 404 }
      );
    }
    const scoring = rawScoring as unknown as ScoreResponse["scoring"];
    const answersRaw = assessment.answers;
    const answers =
      answersRaw && typeof answersRaw === "object" && !Array.isArray(answersRaw)
        ? (answersRaw as Record<string, number>)
        : null;

    const response: ScoreResponse = {
      testType: (assessment.testType as "screening" | "progress") ?? "screening",
      scoring,
      aiSummary: {
        status: assessment.aiSummaryStatus as "pending" | "ready" | "failed",
        payload: (assessment.aiSummaryPayload as ScoreResponse["aiSummary"]["payload"]) ?? null,
        error: assessment.aiSummaryError ?? null,
      },
      aiSummaryLocale: assessment.aiSummaryLocale ?? null,
      completedAt: assessment.createdAt?.toISOString?.() ?? null,
      ageGroup: assessment.ageGroup ?? null,
      answers,
      paidAmount: assessment.payment?.amount ?? null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server xatoligi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
