import { View, ViewStyle } from 'react-native';
import { spacing, colors } from '../../theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** 'light' = warmGray (dashboard), 'dark' = caller wraps in gradient */
  variant?: 'light';
};

export function Screen({ children, style, variant = 'light' }: ScreenProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          padding: spacing.md,
          paddingTop: spacing.xl,
          backgroundColor: variant === 'light' ? colors.warmGray : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
