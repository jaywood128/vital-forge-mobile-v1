import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, colors } from '../../theme';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'dark';
};

export function Screen({ children, style, variant = 'dark' }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const contentStyle: ViewStyle = {
    flex: 1,
    padding: spacing.md,
    paddingTop: insets.top + spacing.md,
  };

  if (variant === 'dark') {
    return (
      <LinearGradient
        colors={[colors.navyDeep, colors.navyMid]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={[contentStyle, style]}>{children}</View>
      </LinearGradient>
    );
  }

  return (
    <View style={[contentStyle, { backgroundColor: colors.warmGray }, style]}>
      {children}
    </View>
  );
}
