import { TodayPlayCard } from '@/components/play';
import { TodaySoundsCard } from '@/components/sounds';
import { TalkPromo } from '@/components/talk/promo';
import { PageHeader, Screen } from '@/components/ui';
import { VideoExercisesEntry } from '@/components/video-exercises';
import { useLocale } from '@/contexts/locale';

export default function ExercisesTab() {
  const { t } = useLocale();
  return (
    <Screen withTabBar>
      <PageHeader title={t('exercises.title')} subtitle={t('exercises.subtitle')} />
      <TodayPlayCard />
      <VideoExercisesEntry />
      <TodaySoundsCard />
      <TalkPromo />
    </Screen>
  );
}
