import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useResetPasswordMutation } from '../src/features/auth/authApi';
import { Button, TextField } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isTokenError, setIsTokenError] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    if (!token) {
      router.replace('/forgot-password');
    }
  }, [token, router]);

  if (!token) return null;

  const handleSubmit = async () => {
    setPasswordError('');
    setConfirmError('');
    setServerError('');
    setIsTokenError(false);

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setConfirmError('Passwords do not match.');
      return;
    }

    try {
      await resetPassword({ token, password, password_confirmation: confirmation }).unwrap();
      router.replace({ pathname: '/login', params: { resetSuccess: '1' } });
    } catch (err: any) {
      const apiError = err?.data?.error;
      setIsTokenError(err?.status === 422);
      setServerError(apiError ?? 'Something went wrong. Please check your connection and try again.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Set new password</Text>
          <Text style={styles.subtitle}>Choose a password at least 8 characters long.</Text>

          <TextField
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowPassword((v) => !v)} accessibilityLabel="Toggle password visibility">
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </Pressable>
            }
          />
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

          <TextField
            placeholder="Confirm password"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry={!showConfirmation}
            autoCapitalize="none"
            rightIcon={
              <Pressable onPress={() => setShowConfirmation((v) => !v)} accessibilityLabel="Toggle confirm password visibility">
                <Ionicons
                  name={showConfirmation ? 'eye-off' : 'eye'}
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </Pressable>
            }
          />
          {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}

          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
              {isTokenError ? (
                <Pressable
                  onPress={() => router.replace('/forgot-password')}
                  accessibilityLabel="Request a new link"
                  style={styles.newLinkTouch}
                >
                  <Text style={styles.newLinkText}>Request a new link</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Button
            title={isLoading ? 'Resetting...' : 'Reset Password'}
            onPress={handleSubmit}
            disabled={isLoading || !password || !confirmation}
            variant="primary"
            accessibilityLabel={isLoading ? 'Resetting...' : 'Reset Password'}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.pureWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  fieldError: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  serverErrorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  serverErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  newLinkTouch: {
    marginTop: spacing.sm,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
  },
  newLinkText: {
    ...typography.caption,
    color: colors.electricBlueLight,
    textAlign: 'center',
    fontWeight: '600',
  },
});
