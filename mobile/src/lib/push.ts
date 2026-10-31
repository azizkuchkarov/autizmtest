import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';

import { deletePushToken, savePushToken } from '@/lib/api';
import { getReminderPermission, openNotificationTarget } from '@/lib/reminders';
import type { Locale } from '@/shared/lib/locale';

/*
 * Server push (admin paneldan yuboriladigan xabarlar) — Firebase Cloud Messaging orqali (iOS ham, Android ham).
 * Qurilmaning FCM tokeni akkauntga bog'lanadi; server firebase-admin bilan yuboradi (src/lib/push.ts).
 * Ruxsat eslatmalar bilan bir xil — alohida so'ralmaydi. Bosilganda ochiladigan ekran: data.url.
 *
 * Firebase native moduli faqat GoogleService-Info.plist / google-services.json bilan qayta build qilingan
 * ilovada bor. Eski build'da modul topilmasa, push jim o'chadi — ilova ishlashda davom etadi.
 */

type MessagingModule = typeof import('@react-native-firebase/messaging');

function firebaseMessaging(): { mod: MessagingModule; messaging: ReturnType<MessagingModule['getMessaging']> } | null {
  // Modul yuklanayotganda native qismni talab qiladi: avval build'da borligini tekshiramiz, aks holda ilova yiqiladi
  if (!TurboModuleRegistry.get('NativeRNFBTurboApp')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/messaging') as MessagingModule;
    return { mod, messaging: mod.getMessaging() };
  } catch {
    return null;
  }
}

let currentToken: string | null = null;

/** Chiqishdan oldin chaqiriladi: bu qurilmaga boshqa xabar kelmasligi uchun. */
export async function unregisterPushToken() {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  await deletePushToken(token).catch(() => {});
}

/**
 * Ildiz navigatorda: kirgan foydalanuvchi uchun FCM tokenni serverga yozadi (til o'zgarsa yoki token yangilansa ham),
 * ilova ochiq paytda kelgan xabarni banner qilib ko'rsatadi va bosilgan xabardagi ekranni ochadi.
 */
export function usePushRegistration(signedIn: boolean, locale: Locale, ready: boolean, remindersOn: boolean | undefined) {
  useEffect(() => {
    if (!ready || !signedIn) return;
    const fb = firebaseMessaging();
    if (!fb) return;
    const { mod, messaging } = fb;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    let cancelled = false;

    const save = async (token: string) => {
      if (cancelled) return;
      currentToken = token;
      await savePushToken(token, platform, locale);
    };

    (async () => {
      if ((await getReminderPermission()) !== 'granted') return;
      await save(await mod.getToken(messaging));
    })().catch(() => {});

    const unsubscribeRefresh = mod.onTokenRefresh(messaging, (token) => {
      save(token).catch(() => {});
    });
    // Ilova ochiq bo'lsa tizim FCM xabarini ko'rsatmaydi — mahalliy banner qilib chiqaramiz
    const unsubscribeMessage = mod.onMessage(messaging, (message) => {
      if (!message.notification) return;
      Notifications.scheduleNotificationAsync({
        content: { title: message.notification.title ?? '', body: message.notification.body ?? '', data: message.data ?? {} },
        trigger: null,
      }).catch(() => {});
    });
    // Ilova fonda bo'lganda yoki yopiq bo'lganda xabar bosilsa
    const unsubscribeOpened = mod.onNotificationOpenedApp(messaging, (message) => openNotificationTarget(message.data?.url));
    mod
      .getInitialNotification(messaging)
      .then((message) => message && openNotificationTarget(message.data?.url))
      .catch(() => {});

    return () => {
      cancelled = true;
      unsubscribeRefresh();
      unsubscribeMessage();
      unsubscribeOpened();
    };
  }, [ready, signedIn, locale, remindersOn]);
}
