import { Pressable, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

export function Button({ title, onPress, disabled, variant = 'primary', style }: ButtonProps) {
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          { opacity: disabled ? 0.6 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={[colors.energeticOrange, '#f07c0a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            Platform.select({
              ios: {
                shadowColor: colors.energeticOrange,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              },
              android: { elevation: 6 },
            }),
          ]}
        >
          <Text style={[styles.text, { color: colors.pureWhite }]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  const borderColor = variant === 'destructive' ? colors.brightRed : colors.electricBlueLight;
  const textColor = variant === 'destructive' ? colors.brightRed : colors.electricBlueLight;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles.outlined,
        {
          borderColor,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: spacing.touchMin,
    borderRadius: radius.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    paddingVertical: spacing.md,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
});
