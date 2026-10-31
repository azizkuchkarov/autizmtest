"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";

import { translations, type TranslationKey } from "@/lib/app-i18n";
import {
  ApiError,
  createChild,
  deleteAccount as deleteAccountRequest,
  fetchMe,
  logoutSession,
  setGuideSeen,
  updateChild,
  type ChildInput,
  type ChildRecord,
} from "@/lib/app/api";
import { clearAssessments } from "@/lib/app/history";
import { ageGroupFromBirthYear, type AgeGroupId } from "@/lib/app/screening";
import { createLocalStore, useHydrated, useLocalStore } from "@/lib/app/local-store";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "@/lib/locale";

/* --------------------------------- Til --------------------------------- */

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const localeStore = createLocalStore<Locale>(LOCALE_STORAGE_KEY, DEFAULT_LOCALE, (raw) => (raw === "ru" ? "ru" : "uz"));

function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLocalStore(localeStore);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => localeStore.set(next), []);

  const t = useCallback((key: TranslationKey) => translations[locale][key] ?? key, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside AppProviders");
  return ctx;
}

/* ------------------------------ Profil/sessiya ------------------------------ */

const STATE_KEY = "autizm_session_v2";

/** Brauzerda saqlanadigan holat (sessiya httpOnly cookie'da). */
type StoredState = {
  introSeen: boolean;
  offerAccepted: boolean;
  signedIn: boolean;
  phone: string;
  child: ChildRecord | null;
  /** Ota-ona qo'llanmasi ko'rib chiqilganmi (serverda saqlanadi) */
  guideSeen: boolean;
};

const EMPTY: StoredState = { introSeen: false, offerAccepted: false, signedIn: false, phone: "", child: null, guideSeen: false };

type ProfileContextValue = StoredState & {
  loaded: boolean;
  /** Bolaning yoshiga mos test guruhi */
  ageGroup: AgeGroupId | null;
  markIntroSeen: () => void;
  acceptOffer: () => void;
  /** SMS tasdiqlangandan keyin: serverdan bola profilini oladi. */
  signIn: (phone: string) => Promise<ChildRecord | null>;
  saveChild: (input: ChildInput) => Promise<ChildRecord>;
  /** Bolaning bir nechta maydonini yangilash (masalan, mashg'ulot vaqti) */
  updateChildFields: (patch: Partial<ChildInput>) => Promise<ChildRecord | null>;
  markGuideSeen: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Akkauntni serverda o'chiradi va brauzerdagi barcha ma'lumotlarni tozalaydi. */
  deleteAccount: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const profileStore = createLocalStore<StoredState>(STATE_KEY, EMPTY, (raw) => ({ ...EMPTY, ...JSON.parse(raw) }));

function ProfileProvider({ children }: { children: ReactNode }) {
  const loaded = useHydrated();
  const state = useLocalStore(profileStore);

  const update = useCallback((patch: Partial<StoredState>) => profileStore.set({ ...profileStore.get(), ...patch }), []);

  useEffect(() => {
    // Serverdagi profilni yangilaymiz; cookie muddati tugagan bo'lsa qayta kirish so'raladi
    fetchMe()
      .then((me) => update({ signedIn: true, phone: me.user.phone, child: me.children[0] ?? null, guideSeen: !!me.user.guideSeen }))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) update({ signedIn: false, child: null });
      });
  }, [update]);

  const signIn = useCallback(
    async (phone: string) => {
      const me = await fetchMe().catch(() => null);
      const child = me?.children[0] ?? null;
      update({ signedIn: true, phone, child, guideSeen: !!me?.user.guideSeen });
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
    await logoutSession().catch(() => {});
    // Tanishtiruv va oferta qayta ko'rsatilmaydi
    profileStore.set({ ...EMPTY, introSeen: true, offerAccepted: true });
  }, []);

  const deleteAccount = useCallback(async () => {
    await deleteAccountRequest();
    await clearAssessments();
    profileStore.set({ ...EMPTY, introSeen: true, offerAccepted: true });
  }, []);

  const value: ProfileContextValue = {
    ...state,
    loaded,
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

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside AppProviders");
  return ctx;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </LocaleProvider>
  );
}

/** Kirish oqimining keyingi kerakli qadami (mobil tablar tekshiruvi bilan bir xil). */
export function nextOnboardingStep(p: Pick<StoredState, "introSeen" | "offerAccepted" | "signedIn" | "child" | "guideSeen">): string | null {
  if (!p.introSeen) return "/start/intro";
  if (!p.offerAccepted) return "/start/offer";
  if (!p.signedIn) return "/start/phone";
  if (!p.child) return "/start/child";
  // Mashg'ulot vaqti tanlanmagan bo'lsa — bir marta so'raymiz (eski foydalanuvchilarga ham)
  if (!p.child.practiceTime) return "/start/routine";
  if (!p.guideSeen) return "/start/guide";
  return null;
}
