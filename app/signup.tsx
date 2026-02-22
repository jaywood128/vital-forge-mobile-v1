import { Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignupMutation } from '../src/features/auth/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../src/theme';
import { Card, Button, TextField } from '../src/components/ui';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signup, { isLoading }] = useSignupMutation();
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const result = await signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        password_confirmation: password,
      }).unwrap();

      if (result.token) {
        await AsyncStorage.setItem('authToken', result.token);
      }
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Signup Failed', error?.data?.error || 'Could not create account');
    }
  };

  return (
    <LinearGradient
      colors={[colors.deepNavy, colors.deepNavyLight, colors.electricBlue]}
      style={styles.gradient}
    >
      <Card style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextField
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <TextField
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

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
          title={isLoading ? 'Creating Account...' : 'Sign Up'}
          onPress={handleSignup}
          disabled={isLoading}
          variant="primary"
        />

        <Pressable onPress={() => router.back()} style={styles.linkTouch}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.link}>Log in</Text>
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
  loginText: {
    ...typography.caption,
    textAlign: 'center',
  },
  link: {
    ...typography.link,
  },
});
