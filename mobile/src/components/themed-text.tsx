import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'display' | 'title' | 'subtitle' | 'heading' | 'default' | 'body' | 'small' | 'smallBold' | 'caption' | 'number';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: FontFamily.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: FontFamily.bold,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  default: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  small: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    lineHeight: 19,
  },
  smallBold: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    lineHeight: 19,
  },
  caption: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  number: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
});
