import { Redirect } from 'expo-router';

import { Questionnaire } from '@/components/questionnaire';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { createAssessmentV3 } from '@/lib/api';
import { newLocalId } from '@/lib/history';
import { saveSkillsRecord } from '@/lib/skills-store';
import { ageInMonths, scoreSkills, skillsBand } from '@/shared/lib/screening-v3/score';
import { skillItemsFor, SKILL_SECTIONS } from '@/shared/lib/screening-v3/skills';

/** Oylik ko'nikmalar testi: mashg'ulotlar natijasini "oldin → keyin" o'lchash uchun. */
export default function SkillsRunScreen() {
  const { t, locale } = useLocale();
  const { child } = useProfile();
  if (!child) return <Redirect href="/" />;

  const months = ageInMonths(child.birthYear, child.birthMonth);
  const items = skillItemsFor(skillsBand(months), months);

  return (
    <Questionnaire
      draftKey={`autizm_skills_draft_v1:${child.id}`}
      welcome={{
        title: t('sk.introTitle'),
        body: t('sk.introBody').replace('{n}', String(items.length)),
        tips: [t('sk.introTip'), t('v3.tip1'), t('v3.tip2')],
      }}
      sections={SKILL_SECTIONS.map((s) => ({ id: s.id, emoji: s.emoji, title: s.title[locale] }))}
      items={items.map((i) => ({ id: i.id, section: i.section, text: i.text[locale] }))}
      onSubmit={async (answers) => {
        const result = scoreSkills({ months, answers });
        let serverId: string | null = null;
        try {
          serverId = (await createAssessmentV3({ testType: 'skills', ageMonths: months, answers, childId: child.id })).assessmentId;
        } catch {
          serverId = null;
        }
        const id = serverId ?? newLocalId();
        saveSkillsRecord(child.id, { id, serverId, createdAt: new Date().toISOString(), result });
        return `/skills/${id}`;
      }}
    />
  );
}
