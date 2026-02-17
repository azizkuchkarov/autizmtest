/**
 * Eski ScreeningConfig ni yangi TestSchema ga o'girish
 */

import type { ScreeningConfig } from "@/lib/screening-types";
import type { TestSchema, Block, Question } from "@/lib/screening-v2-types";
import type { AgeGroupId } from "../index";

export function convertScreeningToV2(
  oldConfig: ScreeningConfig,
  ageGroupId: AgeGroupId
): TestSchema {
  const blocksMap = new Map<string, Block>();

  // Har bir domain uchun block yaratish
  for (const domain of oldConfig.domains) {
    blocksMap.set(domain.id, {
      id: domain.id,
      title: domain.title,
      questions: [],
    });
  }

  // Savollarni bloklarga qo'shish
  for (const oldQ of oldConfig.questions) {
    const block = blocksMap.get(oldQ.domain);
    if (!block) continue;

    const helpParts: string[] = [];
    if (oldQ.example) helpParts.push(`Misol: ${oldQ.example}`);
    if (oldQ.explanation) helpParts.push(oldQ.explanation);
    const help = helpParts.length > 0 ? helpParts.join("\n\n") : undefined;

    // Professional savollar uchun mantiq:
    // - A va B sohalari: savollar asosan ijobiy ko‘nikmalar haqida → yuqori javob = yaxshi,
    //   shuning uchun risk past bo‘lishi kerak → reverse = true (risk = 3 - javob).
    // - C sohasi: cheklangan / takroriy / sezgi xatti-harakatlari → yuqori javob = ko‘proq belgi,
    //   shuning uchun risk to‘g‘ridan-to‘g‘ri oshadi → reverse = false (risk = javob).
    const isPositiveSkillDomain = oldQ.domain === "A" || oldQ.domain === "B";

    // Red-flag: A va B da past javob (Yo'q/Kamdan-kam) = xavf; C da yuqori javob (Ko'pincha/Doim) = xavf
    const redFlagTrigger = oldQ.isRedFlag
      ? isPositiveSkillDomain
        ? { operator: "<=" as const, value: 1 } // A/B: javob 0 yoki 1 bo'lsa red-flag
        : { operator: ">=" as const, value: 2 } // C: javob 2 yoki 3 bo'lsa red-flag
      : undefined;

    const newQ: Question = {
      id: oldQ.id,
      text: oldQ.text,
      help,
      ageGroupIds: [ageGroupId],
      weight: oldQ.weight,
      reverse: isPositiveSkillDomain,
      isRedFlag: oldQ.isRedFlag || undefined,
      redFlagTrigger,
    };

    block.questions.push(newQ);
  }

  const blocks = Array.from(blocksMap.values());

  return {
    version: "2.0",
    scale: { min: 0, max: 3 },
    blocks,
    scoring: {},
  };
}
