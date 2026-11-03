import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors, FontFamily } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';

export default function TabsLayout() {
  const { t } = useLocale();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { introSeen, offerAccepted, signedIn, child, guideSeen } = useProfile();

  // Kirish oqimi: tanishtiruv → oferta → telefon/SMS → bola profili → mashg'ulot vaqti → qo'llanma
  if (!introSeen) return <Redirect href="/start/intro" />;
  if (!offerAccepted) return <Redirect href="/start/offer" />;
  if (!signedIn) return <Redirect href="/start/phone" />;
  if (!child) return <Redirect href="/start/child" />;
  // Mashg'ulot vaqti tanlanmagan bo'lsa — bir marta so'raymiz (eski foydalanuvchilarga ham)
  if (!child.practiceTime) return <Redirect href="/start/routine" />;
  if (!guideSeen) return <Redirect href="/start/guide" />;

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      labelVisibilityMode="labeled"
      indicatorColor={colors.tintSoft}
      tintColor={colors.tint}
      labelStyle={{ fontFamily: FontFamily.semibold, selected: { color: colors.tint } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="lessons">
        <NativeTabs.Trigger.Label>{t('tabs.lessons')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'play.rectangle', selected: 'play.rectangle.fill' }} md="smart_display" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exercises">
        <NativeTabs.Trigger.Label>{t('tabs.exercises')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'figure.and.child.holdinghands', selected: 'figure.and.child.holdinghands' }} md="family_restroom" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{t('tabs.progress')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} md="monitoring" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
