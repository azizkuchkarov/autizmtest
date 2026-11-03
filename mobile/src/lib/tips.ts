import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import type { TranslationKey } from '@/lib/i18n';

const TIP_COUNT = 30;
const KEY = 'autizm_tip_index_v1';

/** Maslahat: ilovaga har kirganda navbatdagisi; 30 tasi tugagach boshidan boshlanadi. */
export function useTip(): TranslationKey | null {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const next = () => {
      AsyncStorage.getItem(KEY)
        .then((raw) => {
          const value = raw === null ? 0 : (Number(raw) + 1) % TIP_COUNT;
          setIndex(value);
          return AsyncStorage.setItem(KEY, String(value));
        })
        .catch(() => setIndex((i) => ((i ?? -1) + 1) % TIP_COUNT));
    };
    next();
    let state = AppState.currentState;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && state !== 'active') next();
      state = nextState;
    });
    return () => sub.remove();
  }, []);

  return index === null ? null : (`home.tip${index + 1}` as TranslationKey);
}
