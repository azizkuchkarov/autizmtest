import type { Locale } from "@/shared/lib/locale";

/*
 * "Manbalar va test haqida" sahifasi: ilovadagi barcha tibbiy ma'lumot manbalari (havolali), skrining tuzilishi va cheklovlari (App Store 1.4.1 talabi).
 * Batafsil: docs/skrining-v3.md. Test o'zgarsa yoki ilmiy tekshiruv o'tkazilsa — shu matn ham yangilanadi.
 * Asl fayl: src/content/about-test.ts (web). Ikkala nusxa birga o'zgartiriladi.
 */

export type AboutSection = { title: string; items: string[] };
export type Source = { text: string; url: string };
export type SourceGroup = { title: string; note?: string; sources: Source[] };
export type AboutTest = { intro: string; sections: AboutSection[]; sourcesTitle: string; sourcesIntro: string; sourceGroups: SourceGroup[] };

/** Skrining testi va natijadagi tavsiyalar manbalari. */
const SCREENING: Source[] = [
  { text: "American Psychiatric Association. DSM-5: Diagnostic and Statistical Manual of Mental Disorders, 2013.", url: "https://www.psychiatry.org/psychiatrists/practice/dsm" },
  { text: "CDC. Learn the Signs. Act Early. — Developmental milestones.", url: "https://www.cdc.gov/act-early/" },
  { text: "Zubler JM, et al. Evidence-Informed Milestones for Developmental Surveillance Tools. Pediatrics, 2022.", url: "https://doi.org/10.1542/peds.2021-052138" },
  { text: "Hyman SL, et al. Identification, Evaluation, and Management of Children With Autism Spectrum Disorder (AAP). Pediatrics, 2020.", url: "https://doi.org/10.1542/peds.2019-3447" },
  { text: "Filipek PA, et al. Practice parameter: screening and diagnosis of autism (AAN). Neurology, 2000.", url: "https://doi.org/10.1212/WNL.55.4.468" },
  { text: "Zwaigenbaum L, et al. Early Identification of Autism Spectrum Disorder: Recommendations for Practice and Research. Pediatrics, 2015.", url: "https://doi.org/10.1542/peds.2014-3667C" },
];

/** Kun maslahatlari, "Bugungi 5 daqiqa" mashqlari va ko'nikmalar testi manbalari. */
const PRACTICE: Source[] = [
  { text: "World Health Organization. Caregiver skills training for families of children with developmental delays or disabilities, 2022.", url: "https://www.who.int/publications/i/item/9789240048836" },
  { text: "World Health Organization. Autism — fact sheet.", url: "https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders" },
  { text: "Hyman SL, et al. Identification, Evaluation, and Management of Children With Autism Spectrum Disorder (AAP). Pediatrics, 2020.", url: "https://doi.org/10.1542/peds.2019-3447" },
  { text: "Kasari C, et al. Randomized controlled caregiver mediated joint engagement intervention for toddlers with autism (JASPER). J Autism Dev Disord, 2010.", url: "https://doi.org/10.1007/s10803-010-0955-5" },
  { text: "Dawson G, et al. Randomized, controlled trial of an intervention for toddlers with autism: the Early Start Denver Model. Pediatrics, 2010.", url: "https://doi.org/10.1542/peds.2009-0958" },
  { text: "Green J, et al. Parent-mediated communication-focused treatment in children with autism (PACT). Lancet, 2010.", url: "https://doi.org/10.1016/S0140-6736(10)60587-9" },
];

export const ABOUT_TEST: Record<Locale, AboutTest> = {
  uz: {
    intro:
      "Bu ota-onalar uchun skrining savolnomasi. U bolani mutaxassisga ko'rsatish kerakligini aniqlashga yordam beradi. Tashxis qo'ymaydi.",
    sections: [
      {
        title: "Test qanday tuzilgan",
        items: [
          "16 oylikdan 10 yoshgacha bo'lgan bolalar uchun. Savollar bolaning aniq yoshiga moslanadi (28–34 savol).",
          "7 bo'lim: ijtimoiy aloqa, birgalikdagi diqqat va imo-ishoralar, nutq, o'yin va taqlid, takroriy harakatlar, o'zgarishlarga moslashish, sezgi reaksiyalari.",
          "Tuzilishi DSM-5 mezonlari tartibiga, yoshga mos ko'nikmalar CDC bosqichlariga, xavf belgilari AAP va AAN tavsiyalariga asoslangan.",
          "Savollar shu ilova uchun o'z so'zlarimiz bilan yozilgan, boshqa testlardan ko'chirilmagan.",
        ],
      },
      {
        title: "Natija qanday hisoblanadi",
        items: [
          "Javoblar oxirgi 1 oydagi kuzatuvingizga asoslanadi. «Bilmayman» javobi hisobga olinmaydi.",
          "Eng muhim ko'nikmalar alohida tekshiriladi. Bola avval bilgan so'z yoki ko'nikmasini yo'qotgan bo'lsa, natijadan qat'i nazar mutaxassisga borish tavsiya etiladi.",
          "Natija 3 darajadan biri bo'ladi: kam, ba'zi yoki ko'p belgilar kuzatildi.",
        ],
      },
      {
        title: "Testning aniqligi va cheklovlari",
        items: [
          "Bu test hali klinik tadqiqotda tasdiqlanmagan: uning aniqligi (sezgirlik va o'ziga xoslik) o'lchanmagan. Darajalar chegarasi dastlabki.",
          "Natija ota-onaning javoblariga bog'liq va noto'g'ri bo'lishi mumkin. «Kam belgilar» autizm yo'qligini, «ko'p belgilar» esa autizm borligini anglatmaydi.",
          "Testdan qat'i nazar, bolaning rivojlanishi sizni xavotirga solsa, mutaxassisga murojaat qiling.",
          "Tashxisni faqat mutaxassis (bolalar nevrologi, psixiatri yoki rivojlanish mutaxassisi) qo'yadi.",
        ],
      },
    ],
    sourcesTitle: "Manbalar",
    sourcesIntro: "Ilovadagi tibbiy ma'lumot va tavsiyalar quyidagi manbalarga asoslangan. Manbani ochish uchun ustiga bosing.",
    sourceGroups: [
      { title: "Skrining testi va natijadagi tavsiyalar", sources: SCREENING },
      { title: "Kun maslahatlari, «Bugungi 5 daqiqa» mashqlari va ko'nikmalar testi", sources: PRACTICE },
      {
        title: "Video darslar",
        note: "Video darslarni mutaxassislar yuqoridagi tavsiyalar asosida tayyorlagan. Ular shifokor maslahati yoki davolash o'rnini bosmaydi.",
        sources: [],
      },
    ],
  },
  ru: {
    intro:
      "Это скрининговый опросник для родителей. Он помогает понять, нужно ли показать ребёнка специалисту. Диагноз он не ставит.",
    sections: [
      {
        title: "Как устроен тест",
        items: [
          "Для детей от 16 месяцев до 10 лет. Вопросы подбираются по точному возрасту ребёнка (28–34 вопроса).",
          "7 разделов: социальный контакт, совместное внимание и жесты, речь, игра и подражание, повторяющееся поведение, адаптация к изменениям, сенсорные реакции.",
          "Структура основана на порядке критериев DSM-5, возрастные навыки — на этапах CDC, тревожные признаки — на рекомендациях AAP и AAN.",
          "Вопросы написаны своими словами для этого приложения и не скопированы из других тестов.",
        ],
      },
      {
        title: "Как считается результат",
        items: [
          "Ответы основаны на ваших наблюдениях за последний месяц. Ответ «Не знаю» не учитывается.",
          "Ключевые навыки проверяются отдельно. Если ребёнок потерял слова или навыки, которые уже умел, обратиться к специалисту рекомендуется независимо от результата.",
          "Результат — один из 3 уровней: признаков мало, есть отдельные признаки или признаков много.",
        ],
      },
      {
        title: "Точность и ограничения теста",
        items: [
          "Тест пока не подтверждён клиническим исследованием: его точность (чувствительность и специфичность) не измерена. Границы уровней предварительные.",
          "Результат зависит от ответов родителя и может быть неверным. «Признаков мало» не означает отсутствие аутизма, а «признаков много» — его наличие.",
          "Независимо от теста обратитесь к специалисту, если развитие ребёнка вызывает у вас беспокойство.",
          "Диагноз ставит только специалист (детский невролог, психиатр или специалист по развитию).",
        ],
      },
    ],
    sourcesTitle: "Источники",
    sourcesIntro: "Медицинская информация и рекомендации в приложении основаны на следующих источниках. Нажмите на источник, чтобы открыть его.",
    sourceGroups: [
      { title: "Скрининговый тест и рекомендации в результате", sources: SCREENING },
      { title: "Советы дня, упражнения «5 минут сегодня» и тест навыков", sources: PRACTICE },
      {
        title: "Видеоуроки",
        note: "Видеоуроки подготовлены специалистами на основе рекомендаций выше. Они не заменяют консультацию врача или лечение.",
        sources: [],
      },
    ],
  },
};
