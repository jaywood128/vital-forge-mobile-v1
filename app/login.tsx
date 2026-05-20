import { Text, Pressable, StyleSheet, Alert, View } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoginMutation } from '../src/features/auth/authApi';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography } from '../src/theme';
import { Button, TextField } from '../src/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const { resetSuccess } = useLocalSearchParams<{ resetSuccess?: string }>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      const result = await login({ email, password }).unwrap();
      if (result.token) {
        await SecureStore.setItemAsync('authToken', result.token);
      }
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        {resetSuccess === '1' ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Password updated — please log in.</Text>
          </View>
        ) : null}
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextField
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title={isLoading ? 'Logging in...' : 'Log In'}
          onPress={handleLogin}
          disabled={isLoading}
          variant="primary"
        />

        <Pressable
          onPress={() => router.push('/forgot-password')}
          style={styles.linkTouch}
          accessibilityLabel="Forgot your password?"
        >
          <Text style={styles.link}>Forgot your password?</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/signup')} style={styles.linkTouch}>
          <Text style={styles.linkText}>
            {"Don't have an account? "}
            <Text style={styles.link}>Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 32,
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
  linkTouch: {
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  linkText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  link: {
    color: colors.electricBlueLight,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '600',
  },
});
