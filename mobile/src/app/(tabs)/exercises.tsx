import { ContentList } from '@/components/content-list';
import { TodayPlayCard } from '@/components/play';
import { TalkPromo } from '@/components/talk/promo';
import { useLocale } from '@/contexts/locale';

export default function ExercisesTab() {
  const { t } = useLocale();
  return <ContentList kind="exercise" accent="exercises" title={t('exercises.title')} subtitle={t('exercises.subtitle')} extra={
        <>
          <TodayPlayCard />
          <TalkPromo />
        </>
      }
    />;
}
