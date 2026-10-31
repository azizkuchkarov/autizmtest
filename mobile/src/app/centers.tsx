import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, EmptyState, Icon, IconBadge, OptionChip, Screen, Skeleton, sym } from '@/components/ui';
import { SHOW_CENTERS } from '@/constants/features';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/contexts/locale';
import { useAccent, useTheme } from '@/hooks/use-theme';
import { absoluteUrl, fetchAbaCenters, type AbaCenter } from '@/lib/api';

function CenterCard({ c }: { c: AbaCenter }) {
  const { t } = useLocale();
  const theme = useTheme();
  const accent = useAccent('centers');
  const image = absoluteUrl(c.imageUrl);
  const location = [c.district, c.address].filter(Boolean).join(', ');

  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      {image ? <Image source={{ uri: image }} style={{ width: '100%', aspectRatio: 16 / 8 }} contentFit="cover" transition={200} /> : null}
      <View style={{ padding: Spacing.three + 2, gap: Spacing.two }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          {!image ? <IconBadge name={sym('building.2.fill', 'apartment')} color={accent.fg} background={accent.soft} size={44} /> : null}
          <ThemedText type="heading" style={{ flex: 1 }}>
            {c.name}
          </ThemedText>
        </View>
        {location ? (
          <View style={styles.meta}>
            <Icon name={sym('mappin.and.ellipse', 'location_on')} size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
              {location}
            </ThemedText>
          </View>
        ) : null}
        {c.note ? (
          <ThemedText type="body" numberOfLines={3}>
            {c.note}
          </ThemedText>
        ) : null}
        <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one }}>
          {c.phone ? (
            <View style={{ flex: 1 }}>
              <Button title={t('centers.call')} size="md" icon={sym('phone.fill', 'call')} onPress={() => Linking.openURL(`tel:${c.phone}`)} />
            </View>
          ) : null}
          {c.instagram ? (
            <Button title="Instagram" size="md" variant="secondary" onPress={() => Linking.openURL(c.instagram!)} />
          ) : c.url ? (
            <Button title="Web" size="md" variant="secondary" icon={sym('safari', 'public')} onPress={() => Linking.openURL(c.url!)} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/** Bo'lim hozircha yopiq: havola orqali kirilsa bosh sahifaga qaytaradi. */
export default function CentersRoute() {
  if (!SHOW_CENTERS) return <Redirect href="/" />;
  return <CentersScreen />;
}

function CentersScreen() {
  const { t } = useLocale();
  const theme = useTheme();
  const [items, setItems] = useState<AbaCenter[] | null>(null);
  const [error, setError] = useState(false);
  const [region, setRegion] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    fetchAbaCenters()
      .then((res) => setItems(res.items))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const regions = useMemo(() => Array.from(new Set(items?.map((c) => c.region) ?? [])), [items]);
  const visible = items?.filter((c) => !region || c.region === region) ?? [];

  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}>
        <EmptyState icon={sym('wifi.slash', 'wifi_off')} title={t('common.offlineTitle')} body={t('common.offline')} actionTitle={t('common.retry')} onAction={load} />
      </View>
    );

  return (
    <Screen>
      <ThemedText type="body" themeColor="textSecondary">
        {t('centers.subtitle')}
      </ThemedText>

      {!items ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={180} radius={Radius.lg} />)
      ) : items.length === 0 ? (
        <EmptyState icon={sym('building.2', 'apartment')} title={t('centers.empty')} />
      ) : (
        <>
          {regions.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: Spacing.two }}>
              <OptionChip label={t('centers.all')} selected={region === null} onPress={() => setRegion(null)} style={styles.chip} />
              {regions.map((r) => (
                <OptionChip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} style={styles.chip} />
              ))}
            </ScrollView>
          )}
          {visible.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(350)}>
              <CenterCard c={c} />
            </Animated.View>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingVertical: 10,
  },
});
