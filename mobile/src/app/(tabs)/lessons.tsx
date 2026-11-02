import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { LessonSections } from '@/components/lesson-sections';
import { SoundSetList } from '@/components/sounds';
import { PageHeader, Screen, Segmented } from '@/components/ui';
import { useLocale } from '@/contexts/locale';

type Tab = 'video' | 'sounds';

/** Darslar ikki ko'rinishda: video darslar va ovozli darslar. */
export default function LessonsTab() {
  const { t } = useLocale();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'sounds' ? 'sounds' : 'video');

  // Boshqa ekrandan "ovozli darslar"ga yuborilganda (masalan, Rivojlanish bo'limidan)
  useEffect(() => {
    if (params.tab === 'sounds' || params.tab === 'video') setTab(params.tab);
  }, [params.tab]);

  const tabs = (
    <Segmented<Tab>
      options={[
        { value: 'video', label: t('lessons.tabVideo') },
        { value: 'sounds', label: t('lessons.tabSounds') },
      ]}
      value={tab}
      onChange={setTab}
    />
  );

  if (tab === 'video') return <LessonSections tabs={tabs} />;

  return (
    <Screen withTabBar>
      <PageHeader title={t('lessons.title')} subtitle={t('sounds.intro')} />
      {tabs}
      <SoundSetList />
    </Screen>
  );
}
