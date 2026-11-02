import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  ApiError,
  createChild,
  deleteAccount as deleteAccountRequest,
  fetchMe,
  logoutSession,
  setAuthToken,
  setGuideSeen,
  updateChild,
  type ChildInput,
  type ChildRecord,
} from '@/lib/api';
import { clearAssessments } from '@/lib/history';
import { clearVideoProgress } from '@/lib/video-progress';
import { unregisterPushToken } from '@/lib/push';
import { ageGroupFromBirthYear, type AgeGroupId } from '@/lib/screening';

const TOKEN_KEY = 'autizm_session_token';
const STATE_KEY = 'autizm_session_v2';

/** Qurilmada saqlanadigan holat (token SecureStore'da alohida). */
type StoredState = {
  introSeen: boolean;
  offerAccepted: boolean;
  phone: string;
  child: ChildRecord | null;
  /** Ota-onalar qo'llanmasi ko'rilgan (serverda ham saqlanadi) */
  guideSeen: boolean;
};

const EMPTY: StoredState = { introSeen: false, offerAccepted: false, phone: '', child: null, guideSeen: false };

type SessionContextValue = StoredState & {
  loaded: boolean;
  signedIn: boolean;
  /** Bolaning yoshiga mos test guruhi */
  ageGroup: AgeGroupId | null;
  markIntroSeen: () => void;
  acceptOffer: () => void;
  /** SMS tasdiqlangandan keyin: tokenni saqlaydi va serverdan bola profilini oladi. */
  signIn: (token: string, phone: string) => Promise<ChildRecord | null>;
  saveChild: (input: ChildInput) => Promise<ChildRecord>;
  /** Bolaning bir nechta maydonini yangilash (masalan, mashg'ulot vaqti) */
  updateChildFields: (patch: Partial<ChildInput>) => Promise<ChildRecord | null>;
  markGuideSeen: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Akkauntni serverda o'chiradi va qurilmadagi barcha ma'lumotlarni tozalaydi. */
  deleteAccount: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<StoredState>(EMPTY);

  const persist = useCallback((next: StoredState) => {
    setState(next);
    AsyncStorage.setItem(STATE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const update = useCallback(
    (patch: Partial<StoredState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(STATE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const [storedToken, raw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY).catch(() => null),
        AsyncStorage.getItem(STATE_KEY).catch(() => null),
      ]);
      const stored: StoredState = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
      setAuthToken(storedToken);
      setToken(storedToken);
      setState(stored);
      setLoaded(true);

      // Fonda serverdagi profilni yangilaymiz; internet bo'lmasa keshdagisi qoladi
      if (storedToken) {
        fetchMe()
          .then((me) => update({ phone: me.user.phone, child: me.children[0] ?? null, guideSeen: !!me.user.guideSeen }))
          .catch((e) => {
            if (e instanceof ApiError && e.status === 401) {
              SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
              setAuthToken(null);
              setToken(null);
            }
          });
      }
    })();
  }, [update]);

  const signIn = useCallback(
    async (newToken: string, phone: string) => {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setAuthToken(newToken);
      setToken(newToken);
      const me = await fetchMe().catch(() => null);
      const child = me?.children[0] ?? null;
      update({ phone, child, guideSeen: !!me?.user.guideSeen });
      return child;
    },
    [update],
  );

  const saveChild = useCallback(
    async (input: ChildInput) => {
      const res = state.child ? await updateChild(state.child.id, input) : await createChild(input);
      update({ child: res.child });
      return res.child;
    },
    [state.child, update],
  );

  const updateChildFields = useCallback(
    async (patch: Partial<ChildInput>) => {
      if (!state.child) return null;
      const res = await updateChild(state.child.id, patch);
      update({ child: res.child });
      return res.child;
    },
    [state.child, update],
  );

  const markGuideSeen = useCallback(async () => {
    update({ guideSeen: true });
    await setGuideSeen(true).catch(() => {});
  }, [update]);

  const signOut = useCallback(async () => {
    await unregisterPushToken();
    await logoutSession().catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    clearVideoProgress();
    setAuthToken(null);
    setToken(null);
    // Tanishtiruv va oferta qayta ko'rsatilmaydi
    persist({ ...EMPTY, introSeen: true, offerAccepted: true });
  }, [persist]);

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest();
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await clearAssessments().catch(() => {});
    clearVideoProgress();
    setAuthToken(null);
    setToken(null);
    persist({ ...EMPTY, introSeen: true, offerAccepted: true });
  }, [persist]);

  const value: SessionContextValue = {
    ...state,
    loaded,
    signedIn: !!token,
    ageGroup: state.child ? ageGroupFromBirthYear(state.child.birthYear) : null,
    markIntroSeen: () => update({ introSeen: true }),
    acceptOffer: () => update({ offerAccepted: true }),
    signIn,
    saveChild,
    updateChildFields,
    markGuideSeen,
    signOut,
    deleteAccount,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
