import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { PlayDetail } from '@/components/play';
import { EmptyState, Screen, sym } from '@/components/ui';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { PLAY_ACTIVITIES } from '@/shared/data/play-activities';

/** Bitta o'yin: qadamlar, maslahatlar va 5 daqiqalik taymer. */
export default function PlayActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLocale();
  const theme = useTheme();
  const activity = PLAY_ACTIVITIES.find((a) => a.id === id);

  if (!activity)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('puzzlepiece', 'extension')} title={t('play.notFound')} actionTitle={t('play.all')} onAction={() => router.replace('/play')} />
      </View>
    );

  return (
    <Screen>
      <PlayDetail activity={activity} />
    </Screen>
  );
}
