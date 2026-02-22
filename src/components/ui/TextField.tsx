import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors, radius, spacing } from '../../theme';

type TextFieldProps = TextInputProps;

export function TextField(props: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[styles.input, focused && styles.inputFocused, props.style]}
      placeholderTextColor={colors.mediumGray}
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

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.warmGray,
    color: colors.darkCharcoal,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: colors.electricBlue,
  },
});