import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type TextFieldProps = TextInputProps & {
  ref?: React.Ref<TextInput>;
  variant?: 'light' | 'dark';
};

export function TextField({ ref, variant = 'dark', ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputStyle = variant === 'dark' ? styles.inputDark : styles.inputLight;
  const focusStyle = variant === 'dark' ? styles.inputDarkFocused : styles.inputLightFocused;

  return (
    <TextInput
      ref={ref}
      {...props}
      style={[inputStyle, focused && focusStyle, props.style]}
      placeholderTextColor={
        variant === 'dark' ? 'rgba(255,255,255,0.35)' : colors.mediumGray
      }
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

const base = {
  padding: spacing.md,
  borderRadius: radius.sm,
  marginBottom: spacing.md,
  fontSize: 16,
  borderWidth: 2,
  borderColor: 'transparent' as const,
};

const styles = StyleSheet.create({
  inputDark: {
    ...base,
    backgroundColor: colors.navyInput,
    color: colors.pureWhite,
  },
  inputDarkFocused: {
    borderColor: colors.electricBlue,
  },
  inputLight: {
    ...base,
    backgroundColor: colors.warmGray,
    color: colors.darkCharcoal,
  },
  inputLightFocused: {
    borderColor: colors.electricBlue,
  },
});
