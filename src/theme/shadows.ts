import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

/**
 * Shadow presets – Rails-style depth.
 * iOS uses shadow*; Android uses elevation.
 */
export const shadows: Record<string, ViewStyle> = {
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.darkCharcoal,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.darkCharcoal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  })!,
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.darkCharcoal,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    android: { elevation: 6 },
    default: {},
  })!,
};
