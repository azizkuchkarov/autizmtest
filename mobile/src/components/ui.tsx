import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { BRAND_MARK_SVG } from '@/constants/brand-mark';
import { BottomTabInset, FontFamily, MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

export type IconName = SymbolViewProps['name'];

/** iOS / Android / web uchun bir xil ikonka nomini qisqa yozish. */
export function sym(ios: string, android: string): IconName {
  return { ios, android, web: android } as IconName;
}

/* ------------------------------- Layout ------------------------------- */

export function Screen({
  children,
  withTabBar = false,
  contentStyle,
  ...rest
}: ScrollViewProps & { children: ReactNode; withTabBar?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.screenContent,
        { paddingBottom: insets.bottom + Spacing.five + (withTabBar ? BottomTabInset : 0) },
        contentStyle,
      ]}
      {...rest}>
      {children}
    </ScrollView>
  );
  // Tab ekranlarida sarlavha yo'q: surilgan matn soat va batareya ustiga chiqmasligi uchun tepada fon qatlami
  if (!withTabBar) return scroll;
  return (
    <View style={{ flex: 1 }}>
      {scroll}
      <LinearGradient
        pointerEvents="none"
        colors={[theme.background, theme.background, `${theme.background}00`]}
        locations={[0, 0.7, 1]}
        style={[styles.statusFade, { height: insets.top + Spacing.four }]}
      />
    </View>
  );
}

/** Tab ekranlari uchun katta sarlavha. */
export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={[styles.pageHeader, { paddingTop: Spacing.three }]}>
      <View style={{ flex: 1, gap: Spacing.one }}>
        <ThemedText type="title">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="body" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="heading" style={{ flex: 1 }}>
        {title}
      </ThemedText>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <ThemedText type="smallBold" themeColor="tint">
            {action}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------ Pressables ------------------------------ */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Bosilganda yumshoq kichrayadigan va haptic beradigan Pressable. */
export function PressableScale({
  children,
  style,
  onPress,
  haptic = true,
  scaleTo = 0.97,
  ...rest
}: Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  scaleTo?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) haptics.tap();
        onPress?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}

/* -------------------------------- Surfaces -------------------------------- */

export function useCardShadow(): ViewStyle {
  const theme = useTheme();
  return {
    shadowColor: theme.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
}

export function Card({
  children,
  style,
  onPress,
  tone = 'backgroundElement',
  flat = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: ThemeColor;
  flat?: boolean;
}) {
  const theme = useTheme();
  const shadow = useCardShadow();
  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: theme[tone], borderColor: theme.border },
    !flat && shadow,
    style,
  ];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <PressableScale onPress={onPress} style={base}>
      {children}
    </PressableScale>
  );
}

export function GradientCard({
  colors,
  children,
  style,
  onPress,
}: {
  colors: readonly [string, string, ...string[]];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const content = (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientCard, style]}>
      {children}
    </LinearGradient>
  );
  if (!onPress) return content;
  return <PressableScale onPress={onPress}>{content}</PressableScale>;
}

/* -------------------------------- Buttons -------------------------------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  size = 'lg',
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  size?: 'md' | 'lg';
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const height = size === 'lg' ? 56 : 44;
  const fg =
    variant === 'primary' ? theme.onTint : variant === 'light' ? '#312E81' : variant === 'ghost' ? theme.tint : theme.text;

  const inner = (
    <View style={[styles.buttonInner, { height }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <SymbolView name={icon} size={18} tintColor={fg} /> : null}
          <ThemedText type="heading" style={{ color: fg, fontSize: size === 'lg' ? 16.5 : 15 }}>
            {title}
          </ThemedText>
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={onPress}
      style={[{ borderRadius: Radius.md, overflow: 'hidden' }, inactive && { opacity: 0.45 }]}>
      {variant === 'primary' ? (
        <LinearGradient colors={['#4F46E5', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={
            variant === 'secondary'
              ? { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.border, borderRadius: Radius.md }
              : variant === 'light'
                ? { backgroundColor: '#FFFFFF', borderRadius: Radius.md }
                : { backgroundColor: theme.tintSoft, borderRadius: Radius.md }
          }>
          {inner}
        </View>
      )}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.iconButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <SymbolView name={icon} size={20} tintColor={theme.text} />
    </PressableScale>
  );
}

/* ------------------------------ Small pieces ------------------------------ */

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const theme = useTheme();
  return <SymbolView name={name} size={size} tintColor={color ?? theme.tint} />;
}

/** Yumshoq fonli kvadrat ichidagi ikonka. */
export function IconBadge({
  name,
  color,
  background,
  size = 46,
}: {
  name: IconName;
  color: string;
  background: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <SymbolView name={name} size={size * 0.48} tintColor={color} />
    </View>
  );
}

export function Pill({ label, color, background }: { label: string; color: string; background: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <ThemedText type="smallBold" style={{ color, fontSize: 12.5 }}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Tanlov kartasi (yosh, jins va h.k.) */
export function OptionChip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      haptic={false}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.tintSoft : theme.backgroundElement,
          borderColor: selected ? theme.tint : theme.border,
        },
        style,
      ]}>
      {icon ? <SymbolView name={icon} size={18} tintColor={selected ? theme.tint : theme.textSecondary} /> : null}
      <ThemedText type="smallBold" style={{ color: selected ? theme.tint : theme.text, fontSize: 14.5 }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const theme = useTheme();
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, value)), { duration: 600 });
  }, [value, width]);
  const animated = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.backgroundMuted, height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color ?? theme.tint, borderRadius: height / 2 }, animated]} />
    </View>
  );
}

/** Ma'lumot yuklanayotganda pulslanuvchi joy egallovchi blok. */
export function Skeleton({ height, width = '100%', radius = Radius.md }: { height: number; width?: ViewStyle['width']; radius?: number }) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ height, width, borderRadius: radius, backgroundColor: theme.backgroundMuted }, animated]} />;
}

export function EmptyState({
  icon,
  title,
  body,
  actionTitle,
  onAction,
  color,
  background,
}: {
  icon: IconName;
  title: string;
  body?: string;
  actionTitle?: string;
  onAction?: () => void;
  color?: string;
  background?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: background ?? theme.tintSoft }]}>
        <SymbolView name={icon} size={34} tintColor={color ?? theme.tint} />
      </View>
      <ThemedText type="heading" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
      {body ? (
        <ThemedText type="body" themeColor="textSecondary" style={{ textAlign: 'center', maxWidth: 300 }}>
          {body}
        </ThemedText>
      ) : null}
      {actionTitle && onAction ? (
        <View style={{ marginTop: Spacing.two, minWidth: 180 }}>
          <Button title={actionTitle} variant="ghost" size="md" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { flex: 1, backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.tint} />
    </View>
  );
}

/** Brend yozuvi: "autizm" to'q + "test" indigo — domen bilan bir xil. */
export function Wordmark({ size = 20 }: { size?: number }) {
  const theme = useTheme();
  return (
    <ThemedText style={{ fontFamily: FontFamily.extrabold, fontSize: size, lineHeight: size * 1.25, letterSpacing: -size * 0.03 }}>
      autizm<ThemedText style={{ fontFamily: FontFamily.extrabold, fontSize: size, color: theme.tint }}>test</ThemedText>
    </ThemedText>
  );
}

/** Brend belgisi: pazl-yurak logotipi. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return <SvgXml xml={BRAND_MARK_SVG} width={size} height={size} />;
}

/** Sozlamalar uslubidagi ro'yxat qatori. */
export function ListRow({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  value,
  onPress,
  last,
}: {
  icon: IconName;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  const content = (
    <View style={styles.listRow}>
      <IconBadge name={icon} color={iconColor} background={iconBackground} size={36} />
      <View
        style={[
          styles.listRowBody,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        ]}>
        <View style={{ flex: 1 }}>
          <ThemedText type="default">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
        {value ? (
          <ThemedText type="small" themeColor="textSecondary">
            {value}
          </ThemedText>
        ) : null}
        {onPress ? <SymbolView name={sym('chevron.right', 'chevron_right')} size={14} tintColor={theme.textTertiary} /> : null}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { backgroundColor: theme.backgroundMuted }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  screenContent: {
    paddingHorizontal: 20,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three + 2,
    gap: Spacing.two,
  },
  gradientCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.three,
  },
  listRowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 14,
    paddingRight: Spacing.three,
  },
});

/** iOS uslubidagi segment tanlagich. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  const shadow = useCardShadow();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundMuted, borderRadius: Radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptics.select();
              onChange(o.value);
            }}
            style={[
              { flex: 1, height: 42, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
              selected && [{ backgroundColor: theme.backgroundElement }, shadow],
            ]}>
            <ThemedText type="smallBold" style={{ fontSize: 14.5, color: selected ? theme.text : theme.textSecondary }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
