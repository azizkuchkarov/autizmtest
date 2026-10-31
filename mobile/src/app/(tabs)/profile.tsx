import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ListRow, PageHeader, PressableScale, Screen, SectionHeader, Segmented, sym, useCardShadow } from '@/components/ui';
import { SHOW_CENTERS } from '@/constants/features';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useProfile } from '@/contexts/profile';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { formatAge } from '@/lib/age';
import { listAssessments } from '@/lib/history';
import type { TranslationKey } from '@/lib/i18n';
import { ageInMonths } from '@/shared/lib/screening-v3/score';

/** +998901234567 → "+998 90 123 45 67" */
function prettyPhone(phone: string) {
  const d = phone.replace(/\D/g, '').slice(3);
  return d.length === 9 ? `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}` : phone;
}

export default function ProfileTab() {
  const { t, locale, setLocale } = useLocale();
  const { child, phone, signOut, deleteAccount, signedIn } = useProfile();
  const theme = useTheme();
  const shadow = useCardShadow();
  const test = useAccent('test');
  const lessons = useAccent('lessons');
  const exercises = useAccent('exercises');
  const centers = useAccent('centers');
  const [testsCount, setTestsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listAssessments().then((items) => setTestsCount(items.length));
    }, []),
  );

  const details = [
    child ? String(child.birthYear) : null,
    child ? formatAge(ageInMonths(child.birthYear, child.birthMonth), locale) : null,
    child ? t(`gender.${child.gender}` as TranslationKey) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const confirmLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccount'),
        style: 'destructive',
        onPress: () => deleteAccount().catch(() => Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountFailed'))),
      },
    ]);
  };

  return (
    <Screen withTabBar>
      <PageHeader title={t('profile.title')} />

      <View style={[styles.childCard, shadow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <PressableScale onPress={() => router.push('/start/avatar')}>
            <Avatar id={child?.avatar} size={84} />
            <View style={[styles.editBadge, { backgroundColor: theme.tint, borderColor: theme.backgroundElement }]}>
              <ThemedText style={{ color: '#fff', fontSize: 12 }}>✎</ThemedText>
            </View>
          </PressableScale>
          <View style={{ flex: 1 }}>
            <ThemedText type="caption" themeColor="textTertiary">
              {t('profile.childCard')}
            </ThemedText>
            <ThemedText type="subtitle">{child?.name || t('profile.noName')}</ThemedText>
            {details ? (
              <ThemedText type="small" themeColor="textSecondary">
                {details}
              </ThemedText>
            ) : null}
          </View>
        </View>
        <View style={[styles.statRow, { backgroundColor: theme.backgroundMuted }]}>
          <ThemedText type="number">{testsCount}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('profile.testsCount')}
          </ThemedText>
        </View>
        <Button
          title={t('profile.editChild')}
          variant="ghost"
          size="md"
          icon={sym('pencil', 'edit')}
          onPress={() => router.push({ pathname: '/start/child', params: { edit: '1' } })}
        />
      </View>

      <SectionHeader title={t('profile.language')} />
      <Segmented
        options={[
          { value: 'uz', label: "O'zbekcha" },
          { value: 'ru', label: 'Русский' },
        ]}
        value={locale}
        onChange={setLocale}
      />

      <SectionHeader title={t('profile.sectionApp')} />
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <ListRow
          icon={sym('book.fill', 'menu_book')}
          iconColor={theme.tint}
          iconBackground={theme.tintSoft}
          title={t('profile.guide')}
          onPress={() => router.push({ pathname: '/start/guide', params: { again: '1' } })}
        />
        <ListRow
          icon={sym('bell.fill', 'notifications')}
          iconColor={exercises.fg}
          iconBackground={exercises.soft}
          title={t('profile.routine')}
          value={child?.practiceTime ?? undefined}
          onPress={() => router.push({ pathname: '/start/routine', params: { edit: '1' } })}
        />
        <ListRow
          icon={sym('book.closed.fill', 'edit_note')}
          iconColor={test.fg}
          iconBackground={test.soft}
          title={t('diary.title')}
          onPress={() => router.push('/diary')}
        />
        <ListRow
          icon={sym('chart.bar.fill', 'bar_chart')}
          iconColor={test.fg}
          iconBackground={test.soft}
          title={t('profile.history')}
          value={String(testsCount)}
          onPress={() => router.navigate('/test')}
        />
        <ListRow
          icon={sym('play.rectangle.fill', 'smart_display')}
          iconColor={lessons.fg}
          iconBackground={lessons.soft}
          title={t('lessons.title')}
          onPress={() => router.navigate('/lessons')}
        />
        <ListRow
          icon={sym('figure.and.child.holdinghands', 'family_restroom')}
          iconColor={exercises.fg}
          iconBackground={exercises.soft}
          title={t('exercises.title')}
          onPress={() => router.navigate('/exercises')}
          last={!SHOW_CENTERS}
        />
        {SHOW_CENTERS ? (
          <ListRow
            icon={sym('building.2.fill', 'apartment')}
            iconColor={centers.fg}
            iconBackground={centers.soft}
            title={t('profile.centers')}
            onPress={() => router.push('/centers')}
            last
          />
        ) : null}
      </Card>

      <SectionHeader title={t('profile.about')} />
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        {phone ? (
          <ListRow
            icon={sym('phone.fill', 'call')}
            iconColor={theme.textSecondary}
            iconBackground={theme.backgroundMuted}
            title={t('profile.phone')}
            value={prettyPhone(phone)}
          />
        ) : null}
        <ListRow
          icon={sym('info.circle.fill', 'info')}
          iconColor={theme.textSecondary}
          iconBackground={theme.backgroundMuted}
          title={t('profile.version')}
          value={Constants.expoConfig?.version ?? '1.0.0'}
          last
        />
      </Card>
      <ThemedText type="small" themeColor="textTertiary" style={{ paddingHorizontal: Spacing.one }}>
        {t('profile.aboutBody')} {t('home.disclaimer')}
      </ThemedText>

      <Button title={t('profile.logout')} variant="secondary" size="md" icon={sym('rectangle.portrait.and.arrow.right', 'logout')} onPress={confirmLogout} />
      {signedIn ? (
        <PressableScale onPress={confirmDeleteAccount} style={{ alignSelf: 'center', padding: Spacing.two }}>
          <ThemedText type="small" style={{ color: theme.danger }}>
            {t('profile.deleteAccount')}
          </ThemedText>
        </PressableScale>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  childCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
});
