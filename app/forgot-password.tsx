import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useForgotPasswordMutation } from '../src/features/auth/authApi';
import { Button, TextField } from '../src/components/ui';
import { colors, spacing, typography } from '../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await forgotPassword({ email }).unwrap();
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
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
          {submitted ? (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.body}>
                If that address is registered, a reset link is on its way.
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                style={styles.linkTouch}
                accessibilityLabel="Back to login"
              >
                <Text style={styles.link}>Back to login</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Forgot password?</Text>
              <Text style={styles.subtitle}>
                {"Enter your email and we'll send you a reset link."}
              </Text>
              <TextField
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title={isSubmitting ? 'Sending...' : 'Send Reset Link'}
                onPress={handleSubmit}
                disabled={isSubmitting || !email}
                variant="primary"
                accessibilityLabel={isSubmitting ? 'Sending...' : 'Send Reset Link'}
              />
              <Pressable
                onPress={() => router.push('/login')}
                style={styles.linkTouch}
                accessibilityLabel="Back to login"
              >
                <Text style={styles.link}>Back to login</Text>
              </Pressable>
            </>
          )}
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
  body: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  linkTouch: {
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  link: {
    ...typography.caption,
    color: colors.electricBlueLight,
    textAlign: 'center',
    fontWeight: '600',
  },
});
