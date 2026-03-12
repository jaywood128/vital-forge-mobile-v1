import { View, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.pureWhite,
          borderRadius: radius.card,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.warmGray2,
          ...shadows.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
