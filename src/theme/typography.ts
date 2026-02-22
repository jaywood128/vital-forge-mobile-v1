import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Typography scale – system font stack, consistent with Rails.
 */
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 32,
} as const;

export const fontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography: Record<string, TextStyle> = {
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    color: colors.deepNavy,
  },
  titleLight: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    color: colors.pureWhite,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.mediumGray,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.darkCharcoal,
  },
  bodyLight: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    color: colors.pureWhite,
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    color: colors.mediumGray,
  },
  link: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.electricBlue,
  },
  button: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
};
