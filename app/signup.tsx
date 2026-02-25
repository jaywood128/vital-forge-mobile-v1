import { Text, Pressable, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignupMutation } from '../src/features/auth/authApi';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography } from '../src/theme';
import { Card, Button, TextField } from '../src/components/ui';

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [signup, { isLoading }] = useSignupMutation();
  const router = useRouter();

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d\s\-\(\)\+]/g, '');
    setPhoneNumber(cleaned);
    if (phoneError) setPhoneError(null);
  };

  const handleSignup = async () => {
    setConfirmError(null);
    setEmailError(null);
    setPasswordError(null);
    if (!email || !password || !passwordConfirmation || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address (e.g. name@example.com)');
      return;
    }
    if (password !== passwordConfirmation) {
      setConfirmError('Passwords do not match');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }
    if (!validatePhone(phoneNumber)) {
      setPhoneError('Enter at least 10 digits (e.g. 555-123-4567)');
      return;
    }

    try {
      const result = await signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber.trim(),
        password_confirmation: passwordConfirmation,
      }).unwrap();

      if (result.token) {
        await SecureStore.setItemAsync('authToken', result.token);
      }
      router.replace('/goal-selection');
    } catch (error: any) {
      const errors = error?.data?.errors as Record<string, string[]> | undefined;
      const firstError =
        error?.data?.error ??
        (errors ? Object.values(errors)[0]?.[0] : undefined) ??
        'Could not create account';
      Alert.alert('Signup Failed', firstError);
    }
  };

  return (
    <LinearGradient
      colors={[colors.deepNavy, colors.deepNavyLight, colors.electricBlue]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(null); }}
              onBlur={() => { if (email && !validateEmail(email)) setEmailError('Enter a valid email address (e.g. name@example.com)'); }}
              autoCapitalize="none"
              keyboardType="email-address"
              style={emailError ? styles.inputError : undefined}
            />
            {emailError ? <Text style={styles.phoneError}>{emailError}</Text> : null}

            <TextField
              placeholder="Phone number (required)"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              style={phoneError ? styles.inputError : undefined}
            />
            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}

            <TextField
              placeholder="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(null); if (confirmError) setConfirmError(null); }}
              onBlur={() => { if (password && password.length < 6) setPasswordError('Password must be at least 6 characters'); }}
              secureTextEntry
              style={passwordError ? styles.inputError : undefined}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            <TextField
              placeholder="Confirm Password"
              value={passwordConfirmation}
              onChangeText={(v) => { setPasswordConfirmation(v); if (confirmError) setConfirmError(null); }}
              onBlur={() => { if (passwordConfirmation && password !== passwordConfirmation) setConfirmError('Passwords do not match'); }}
              secureTextEntry
              style={confirmError ? styles.inputError : undefined}
            />
            {confirmError ? <Text style={styles.phoneError}>{confirmError}</Text> : null}

            <Button
              title={isLoading ? 'Creating Account...' : 'Sign Up'}
              onPress={handleSignup}
              disabled={isLoading}
              variant="primary"
            />

            <Pressable onPress={() => router.push('/login')} style={styles.linkTouch}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.link}>Log in</Text>
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  inputError: {
    borderColor: colors.brightRed,
  },
  phoneError: {
    ...typography.caption,
    color: colors.brightRed,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldError: {
    ...typography.caption,
    color: colors.brightRed,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
});
