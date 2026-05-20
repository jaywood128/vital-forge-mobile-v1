import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

type TextFieldProps = TextInputProps & {
  ref?: React.Ref<TextInput>;
  variant?: 'light' | 'dark';
  rightIcon?: React.ReactNode;
};

export function TextField({ ref, variant = 'dark', rightIcon, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputStyle = variant === 'dark' ? styles.inputDark : styles.inputLight;
  const focusStyle = variant === 'dark' ? styles.inputDarkFocused : styles.inputLightFocused;

  if (rightIcon) {
    return (
      <View style={[styles.wrapper, inputStyle, focused && focusStyle]}>
        <TextInput
          ref={ref}
          {...props}
          style={[styles.inputInner, props.style]}
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
        <View style={styles.rightIcon}>{rightIcon}</View>
      </View>
    );
  }

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
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    color: colors.pureWhite,
  },
  rightIcon: {
    paddingRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: spacing.touchMin,
    minHeight: spacing.touchMin,
  },
});
