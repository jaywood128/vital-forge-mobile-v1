import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
};

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.energeticOrange, text: colors.pureWhite },
  secondary: { bg: 'transparent', text: colors.electricBlue, border: colors.electricBlue },
  destructive: { bg: 'transparent', text: colors.brightRed, border: colors.brightRed },
};

export function Button({ title, onPress, disabled, variant = 'primary', style }: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderWidth: v.border ? 2 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
});