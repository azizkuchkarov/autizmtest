import { SoundSetList } from '@/components/sounds';
import { Screen } from '@/components/ui';

/** Barcha ovozli mashqlar to'plami (Mashqlar bo'limidan ochiladi). */
export default function SoundSetsScreen() {
  return (
    <Screen>
      <SoundSetList />
    </Screen>
  );
}
