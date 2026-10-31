import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, FontFamily } from '@/constants/theme';
import { LocaleProvider, useLocale } from '@/contexts/locale';
import { ProfileProvider, useProfile } from '@/contexts/profile';
import { usePushRegistration } from '@/lib/push';
import { useProgressReminders, useReminders } from '@/lib/reminders';
import { pullSkillsHistory } from '@/lib/skills-store';

SplashScreen.preventAutoHideAsync();

function RootStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { t, locale } = useLocale();
  const { loaded, child, signedIn } = useProfile();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const ready = fontsLoaded && loaded;
  useReminders(signedIn ? child : null, t, ready);
  useProgressReminders(signedIn ? child : null, t, ready);
  usePushRegistration(signedIn, locale, ready, child?.remindersOn);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Ko'nikmalar testi natijalari akkauntda saqlanadi — boshqa qurilmada topshirilganlari ham tiklanadi
  const childId = signedIn ? child?.id : undefined;
  useEffect(() => {
    if (childId) pullSkillsHistory(childId).catch(() => {});
  }, [childId]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontFamily: FontFamily.bold, fontSize: 17 },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="start/intro" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="start/offer" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="start/phone" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="start/verify" options={{ headerShown: false }} />
      <Stack.Screen name="start/child" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="start/avatar" options={{ headerShown: false }} />
      <Stack.Screen name="start/routine" options={{ headerShown: false }} />
      <Stack.Screen name="start/guide" options={{ headerShown: false }} />
      <Stack.Screen name="start/done" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="screening/run" options={{ title: '', gestureEnabled: false }} />
      <Stack.Screen name="result/[id]" options={{ title: t('result.title') }} />
      <Stack.Screen name="skills/run" options={{ title: '', gestureEnabled: false }} />
      <Stack.Screen name="skills/[id]" options={{ title: t('sk.resultTitle') }} />
      <Stack.Screen name="video/[id]" options={{ title: '' }} />
      <Stack.Screen name="sounds/[id]" options={{ title: '' }} />
      <Stack.Screen name="centers" options={{ title: t('centers.title') }} />
      <Stack.Screen name="talk" options={{ title: t('talk.title') }} />
      <Stack.Screen name="diary" options={{ title: t('diary.title') }} />
      <Stack.Screen name="progress" options={{ title: t('progress.title') }} />
      <Stack.Screen name="play/index" options={{ title: t('play.title') }} />
      <Stack.Screen name="play/[id]" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocaleProvider>
        <ProfileProvider>
          <RootStack fontsLoaded={fontsLoaded} />
        </ProfileProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
