"use client";

import { useRouter } from "next/navigation";

import { AppSplash, useOnboardingGate } from "@/components/app/app-shell";
import { useLocale, useProfile } from "@/components/app/providers";
import { Questionnaire } from "@/components/app/questionnaire";
import { createAssessmentV3 } from "@/lib/app/api";
import { newLocalId } from "@/lib/app/history";
import { saveSkillsRecord } from "@/lib/app/skills-store";
import { ageInMonths, scoreSkills, skillsBand } from "@/lib/screening-v3/score";
import { skillItemsFor, SKILL_SECTIONS } from "@/lib/screening-v3/skills";

/** Oylik ko'nikmalar testi: mashg'ulotlar natijasini "oldin → keyin" o'lchash uchun. */
function SkillsRun() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const { child } = useProfile();
  if (!child) return null;

  const months = ageInMonths(child.birthYear, child.birthMonth);
  const items = skillItemsFor(skillsBand(months), months);

  return (
    <Questionnaire
      draftKey={`autizm_skills_draft_v1:${child.id}`}
      exitHref="/progress"
      welcome={{
        title: t("sk.introTitle"),
        body: t("sk.introBody").replace("{n}", String(items.length)),
        tips: [t("sk.introTip"), t("v3.tip1"), t("v3.tip2")],
      }}
      sections={SKILL_SECTIONS.map((s) => ({ id: s.id, emoji: s.emoji, title: s.title[locale] }))}
      items={items.map((i) => ({ id: i.id, section: i.section, text: i.text[locale] }))}
      onSubmit={async (answers) => {
        const result = scoreSkills({ months, answers });
        let serverId: string | null = null;
        try {
          serverId = (await createAssessmentV3({ testType: "skills", ageMonths: months, answers, childId: child.id })).assessmentId;
        } catch {
          serverId = null;
        }
        const id = serverId ?? newLocalId();
        saveSkillsRecord(child.id, { id, serverId, createdAt: new Date().toISOString(), result });
        router.replace(`/progress/skills/${id}`);
      }}
    />
  );
}

export default function SkillsPage() {
  const ready = useOnboardingGate();
  if (!ready) return <AppSplash />;
  return <SkillsRun />;
}
