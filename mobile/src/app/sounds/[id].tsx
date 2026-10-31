import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { LevelPicker, SoundGame, useVisibleCards } from '@/components/sounds';
import { EmptyState, Screen, Skeleton, sym } from '@/components/ui';
import { useLocale } from '@/contexts/locale';
import { useTheme } from '@/hooks/use-theme';
import { fetchSoundSet, type SoundSet } from '@/lib/api';
import { LEVEL_OPTIONS, type SoundLevel } from '@/lib/sound-progress';

function parseLevel(v: string | undefined): SoundLevel | null {
  const n = Number(v);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}

/** Ovoz to'plami: darajani tanlash (?level yo'q) yoki mashq (?level=1..4). */
export default function SoundSetScreen() {
  const { id, level: levelParam } = useLocalSearchParams<{ id: string; level?: string }>();
  const { t, locale } = useLocale();
  const theme = useTheme();
  const [set, setSet] = useState<SoundSet | null>(null);
  const [error, setError] = useState(false);
  const cards = useVisibleCards(set);
  const requested = parseLevel(levelParam);
  const level = requested && cards.length >= LEVEL_OPTIONS[requested] ? requested : null;

  const load = useCallback(() => {
    setError(false);
    fetchSoundSet(id, locale)
      .then((res) => setSet(res.set))
      .catch(() => setError(true));
  }, [id, locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('wifi.slash', 'wifi_off')} title={t('common.offlineTitle')} body={t('common.offline')} actionTitle={t('common.retry')} onAction={load} />
      </View>
    );

  if (!set)
    return (
      <Screen>
        <Skeleton height={80} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={120} />
        ))}
      </Screen>
    );

  return (
    <Screen>
      <Stack.Screen options={{ title: level ? set.title : '' }} />
      {level ? (
        <SoundGame key={level} cards={cards} level={level} onExit={() => router.back()} />
      ) : (
        <LevelPicker set={set} onPick={(l) => router.push({ pathname: '/sounds/[id]', params: { id, level: String(l) } })} />
      )}
    </Screen>
  );
}
