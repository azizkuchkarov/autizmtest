// src/lib/i18n.ts
import type { BlockId } from "./questions";

export type Lang = "uz" | "ru";

export const I18N = {
  uz: {
    app: {
      loading: "Iltimos, bir lahza...",
      sectionStart: "Boshlanmoqda...",
      continue: "Davom etish",
    },
    blocks: {
      social: {
        title: "Ijtimoiy aloqa",
        desc:
          "Bu bo‘limda bola odamlar bilan ijtimoiy aloqasi tekshiriladi: ismga javob, ko‘z kontakt va emotsional bo‘lishish.",
        focus: ["Ismga javob", "Ko‘z kontakt", "Joint attention", "Tengdoshlar", "Empatiya"],
      },
      communication: {
        title: "Nutq va muloqot",
        desc:
          "Bu bo‘limda nutq va muloqot tekshiriladi: maqsadli nutq, savol-javob, intonatsiya va suhbatni ushlash.",
        focus: ["Maqsadli nutq", "Savol-javob", "Intonatsiya", "Tashabbus", "Mavzuni saqlash"],
      },
      repetitive: {
        title: "Takroriy harakatlar",
        desc:
          "Bu bo‘limda takroriy xulq va rutinalar tekshiriladi: stereotipiya, rigidlik, cheklangan qiziqishlar.",
        focus: ["Stereotipiya", "Rigidlik", "Tor qiziqish", "Takroriy o‘yin", "Stressda kuchayish"],
      },
      sensory: {
        title: "Sensor sezgirlik",
        desc:
          "Bu bo‘limda sensor sezgirlik tekshiriladi: tovush, kiyim, ovqat teksturasi, yorug‘lik va hid.",
        focus: ["Tovush", "Kiyim", "Ovqat teksturasi", "Yorug‘lik", "Hid/og‘riq"],
      },
      play: {
        title: "O‘yin va tasavvur",
        desc:
          "Bu bo‘limda rol o‘yinlari, syujet, qoidalar va ijtimoiy o‘yin tekshiriladi.",
        focus: ["Rol o‘yinlari", "Syujet", "Qoidalar", "Ijtimoiy o‘yin", "Moslashuvchanlik"],
      },
      daily: {
        title: "Kundalik hayot",
        desc:
          "Bu bo‘limda kundalik hayot ko‘nikmalari tekshiriladi: ovqat, uyqu, tartib va emotsional regulyatsiya.",
        focus: ["Ovqat/uyqu", "Rejim", "Moslashuv", "Mustaqillik", "Stress nazorati"],
      },
    } as Record<BlockId, { title: string; desc: string; focus: string[] }>,
  },

  ru: {
    app: {
      loading: "Пожалуйста, подождите...",
      sectionStart: "Начинаем...",
      continue: "Продолжить",
    },
    blocks: {
      social: {
        title: "Социальное общение",
        desc:
          "В этом блоке оценивается социальное взаимодействие: отклик на имя, зрительный контакт и разделение эмоций.",
        focus: ["Отклик на имя", "Зрительный контакт", "Joint attention", "Сверстники", "Эмпатия"],
      },
      communication: {
        title: "Речь и коммуникация",
        desc:
          "В этом блоке оцениваются речь и общение: целевая речь, ответы на вопросы, интонация и удержание темы.",
        focus: ["Целевая речь", "Вопрос-ответ", "Интонация", "Инициатива", "Удержание темы"],
      },
      repetitive: {
        title: "Повторяющиеся действия",
        desc:
          "В этом блоке оценивается повторяющееся поведение и рутины: стереотипии, ригидность, узкие интересы.",
        focus: ["Стереотипии", "Ригидность", "Узкие интересы", "Повторяющаяся игра", "Усиление при стрессе"],
      },
      sensory: {
        title: "Сенсорная чувствительность",
        desc:
          "В этом блоке оцениваются сенсорные реакции: звуки, одежда, текстуры еды, свет и запахи.",
        focus: ["Звуки", "Одежда", "Текстуры еды", "Свет", "Запах/боль"],
      },
      play: {
        title: "Игра и воображение",
        desc:
          "В этом блоке оцениваются ролевые игры, сюжет, правила и социальная игра.",
        focus: ["Ролевые игры", "Сюжет", "Правила", "Социальная игра", "Гибкость"],
      },
      daily: {
        title: "Повседневная жизнь",
        desc:
          "В этом блоке оцениваются навыки повседневной жизни: питание, сон, режим и эмоциональная регуляция.",
        focus: ["Питание/сон", "Режим", "Адаптация", "Самостоятельность", "Контроль стресса"],
      },
    } as Record<BlockId, { title: string; desc: string; focus: string[] }>,
  },
} as const;

export function tBlock(lang: Lang, blockId: BlockId) {
  return I18N[lang].blocks[blockId];
}
