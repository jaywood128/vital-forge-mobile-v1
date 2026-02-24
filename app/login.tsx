import { Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLoginMutation } from '../src/features/auth/authApi';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography } from '../src/theme';
import { Card, Button, TextField } from '../src/components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();

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
      colors={[colors.deepNavy, colors.deepNavyLight, colors.electricBlue]}
      style={styles.gradient}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>

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
          title={isLoading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={isLoading}
          variant="primary"
        />

        <Pressable onPress={() => router.push('/signup')} style={styles.linkTouch}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.link}>Sign up</Text>
          </Text>
        </Pressable>
      </Card>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    marginVertical: 0,
  },
  title: {
    ...typography.title,
    color: colors.deepNavy,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  linkTouch: {
    paddingVertical: spacing.md,
    minHeight: spacing.touchMin,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  signupText: {
    ...typography.caption,
    textAlign: 'center',
  },
  link: {
    ...typography.link,
  },
});
