import { View, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'light' | 'dark';
};

export function Card({ children, style, variant = 'dark' }: CardProps) {
  const baseStyle: ViewStyle =
    variant === 'dark'
      ? {
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: radius.card,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
        }
      : {
          backgroundColor: colors.pureWhite,
          borderRadius: radius.card,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.warmGray2,
          ...shadows.card,
        };

  return <View style={[baseStyle, style]}>{children}</View>;
}
