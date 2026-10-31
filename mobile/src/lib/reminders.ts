import * as Notifications from 'expo-notifications';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { useAacLog } from '@/lib/aac-store';
import type { ChildRecord } from '@/lib/api';
import { assessmentTier, listAssessments, nextScreeningDate } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';
import { useChildPlay } from '@/lib/play-store';
import { useSkillsHistory } from '@/lib/skills-store';
import { useSoundLog } from '@/lib/sound-progress';
import { SKILLS_INTERVAL_DAYS } from '@/shared/lib/screening-v3/skills';

/*
 * Qurilmada rejalashtiriladigan eslatmalar (server kerak emas):
 *  - har kuni: mashg'ulotdan 15 daqiqa oldin va ertalabki kundalik vaqtida;
 *  - bir martalik: ko'nikmalar testi vaqti, skriningni qayta topshirish sanasi, 2 kunlik tanaffus.
 * Vaqt, natija yoki mashg'ulotlar o'zgarganda qayta rejalashtiriladi. Server push — lib/push.ts.
 */

const PRACTICE_ID = 'autizm-reminder-practice';
const DIARY_ID = 'autizm-reminder-diary';
const SKILLS_ID = 'autizm-reminder-skills';
const SCREENING_ID = 'autizm-reminder-screening';
const NUDGE_ID = 'autizm-reminder-nudge';
const CHANNEL_ID = 'reminders';
/** Bir martalik eslatmalar shu vaqtda chiqadi (mashg'ulot vaqti noma'lum bo'lsa) */
const DEFAULT_MINUTES = 10 * 60;
/** Tanaffus eslatmasi: oxirgi mashg'ulotdan necha kun keyin va soat nechada */
const NUDGE_AFTER_DAYS = 2;
const NUDGE_MINUTES = 19 * 60;
/** Mashg'ulotdan necha daqiqa oldin eslatiladi */
const PRACTICE_LEAD_MINUTES = 15;

type ReminderTarget = '/diary' | '/exercises' | '/skills/run' | '/test';
/** Bosilganda ochiladigan ekranlar; server push ham shu ro'yxatdan foydalanadi (src/lib/push.ts). */
const TARGETS = ['/', '/diary', '/exercises', '/lessons', '/skills/run', '/test'] as const;

/** Bildirishnomadagi data.url bo'yicha ekranni ochadi (ro'yxatda bo'lmasa — hech narsa qilmaydi). */
export function openNotificationTarget(url: unknown) {
  const target = TARGETS.find((x) => x === url);
  if (target) router.push(target);
}

// Ilova ochiq bo'lganda ham eslatma banner bo'lib ko'rinadi
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

function toPermission(status: Notifications.NotificationPermissionsStatus): ReminderPermission {
  if (status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  return toPermission(await Notifications.requestPermissionsAsync());
}

/** "HH:MM" → daqiqalar soni; noto'g'ri bo'lsa null. */
function parseTime(time: string | null | undefined) {
  const m = time?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes >= 0 && minutes < 24 * 60 ? minutes : null;
}

async function scheduleDaily(identifier: string, minutes: number, title: string, body: string, url: ReminderTarget) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, data: { url }, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(minutes / 60),
      minute: minutes % 60,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

/** Avvalgi eslatmalarni bekor qiladi va bola sozlamalariga ko'ra qaytadan rejalashtiradi. */
export async function syncReminders(child: ChildRecord | null, t: (key: TranslationKey) => string) {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(PRACTICE_ID).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(DIARY_ID).catch(() => {}),
  ]);
  if (!child || child.remindersOn === false) return;
  if ((await getReminderPermission()) !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: t('routine.reminders'),
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const name = child.name || '';
  const practice = parseTime(child.practiceTime);
  if (practice !== null) {
    const at = (practice - PRACTICE_LEAD_MINUTES + 24 * 60) % (24 * 60);
    await scheduleDaily(PRACTICE_ID, at, t('reminder.practiceTitle'), t('reminder.practiceBody').replace('{name}', name), '/exercises');
  }
  const diary = parseTime(child.diaryTime);
  if (diary !== null) {
    await scheduleDaily(DIARY_ID, diary, t('reminder.diaryTitle'), t('reminder.diaryBody').replace('{name}', name), '/diary');
  }
}

/**
 * Ildiz navigatorda bir marta ishlatiladi: bola sozlamalari yoki til o'zgarsa eslatmalarni yangilaydi,
 * eslatma bosilganda tegishli ekranni ochadi.
 */
export function useReminders(child: ChildRecord | null, t: (key: TranslationKey) => string, ready: boolean) {
  const practiceTime = child?.practiceTime;
  const diaryTime = child?.diaryTime;
  const remindersOn = child?.remindersOn;
  const name = child?.name;

  useEffect(() => {
    if (!ready) return;
    syncReminders(child, t).catch(() => {});
    // Faqat eslatmaga ta'sir qiladigan maydonlar o'zgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, !!child, practiceTime, diaryTime, remindersOn, name, t]);

  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!ready || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = response.notification.request.content.data?.url;
    // Bir xil bosish qayta ishlanmasligi uchun darhol tozalanadi
    Notifications.clearLastNotificationResponse();
    openNotificationTarget(url);
  }, [ready, response]);
}

/** Sana (ISO yoki "YYYY-MM-DD") + kunlar, belgilangan daqiqada; o'tib ketgan bo'lsa null. */
function dateAt(base: string, addDays: number, minutes: number) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(base) ? new Date(`${base}T00:00:00`) : new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime() > Date.now() ? d : null;
}

async function scheduleOnce(identifier: string, date: Date | null, title: string, body: string, url: ReminderTarget) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  if (!date) return;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, data: { url }, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

type ProgressDates = { lastSkills: string | null; nextScreening: string | null; lastActivity: string | null };

/** Bir martalik eslatmalarni bola tarixiga qarab qayta rejalashtiradi. */
async function syncProgressReminders(child: ChildRecord | null, dates: ProgressDates, t: (key: TranslationKey) => string) {
  const ids = [SKILLS_ID, SCREENING_ID, NUDGE_ID];
  if (!child || child.remindersOn === false || (await getReminderPermission()) !== 'granted') {
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    return;
  }
  const name = child.name || '';
  const at = parseTime(child.practiceTime) ?? DEFAULT_MINUTES;
  await scheduleOnce(
    SKILLS_ID,
    dates.lastSkills ? dateAt(dates.lastSkills, SKILLS_INTERVAL_DAYS, at) : null,
    t('reminder.skillsTitle'),
    t('reminder.skillsBody').replace('{name}', name),
    '/skills/run',
  );
  await scheduleOnce(
    SCREENING_ID,
    dates.nextScreening ? dateAt(dates.nextScreening, 0, at) : null,
    t('reminder.screeningTitle'),
    t('reminder.screeningBody').replace('{name}', name),
    '/test',
  );
  await scheduleOnce(
    NUDGE_ID,
    dates.lastActivity ? dateAt(dates.lastActivity, NUDGE_AFTER_DAYS, NUDGE_MINUTES) : null,
    t('reminder.nudgeTitle'),
    t('reminder.nudgeBody').replace('{name}', name),
    '/exercises',
  );
}

/**
 * Ildiz navigatorda: ko'nikmalar testi, skrining sanasi va tanaffus eslatmalari.
 * Mashg'ulot bajarilsa tanaffus eslatmasi avtomatik keyinga suriladi.
 */
export function useProgressReminders(child: ChildRecord | null, t: (key: TranslationKey) => string, ready: boolean) {
  const key = child?.id ?? 'default';
  const skills = useSkillsHistory(key);
  const play = useChildPlay(key);
  const sounds = useSoundLog(key);
  const aac = useAacLog(key);
  const pathname = usePathname();
  const [nextScreening, setNextScreening] = useState<string | null>(null);

  // Skrining natijalari AsyncStorage'da: ekran almashganda (masalan, test tugagach) qayta o'qiladi
  useEffect(() => {
    if (!ready) return;
    listAssessments()
      .then((items) => setNextScreening(items[0] ? nextScreeningDate(items[0].createdAt, assessmentTier(items[0])) : null))
      .catch(() => {});
  }, [ready, pathname]);

  const lastSkills = skills.at(-1)?.createdAt ?? null;
  const lastActivity = useMemo(() => {
    const days = [
      ...(play?.entries.map((e) => e.day) ?? []),
      ...sounds.map((e) => e.day),
      ...Object.entries(aac)
        .filter(([, log]) => log.taps > 0)
        .map(([day]) => day),
    ];
    return days.length ? days.reduce((a, b) => (a > b ? a : b)) : null;
  }, [play, sounds, aac]);

  const practiceTime = child?.practiceTime;
  const remindersOn = child?.remindersOn;
  const name = child?.name;
  useEffect(() => {
    if (!ready) return;
    syncProgressReminders(child, { lastSkills, nextScreening, lastActivity }, t).catch(() => {});
    // Faqat eslatmaga ta'sir qiladigan maydonlar o'zgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, !!child, practiceTime, remindersOn, name, lastSkills, nextScreening, lastActivity, t]);
}
