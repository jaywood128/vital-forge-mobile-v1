import { Text, StyleSheet, Alert } from 'react-native';
import { useGetCurrentUserQuery, useLogoutMutation } from '../src/features/auth/authApi';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { spacing, typography } from '../src/theme';
import { Screen, Card, Button } from '../src/components/ui';

export default function HomeScreen() {
  const { data: user, isLoading } = useGetCurrentUserQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {}
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch {}
    Alert.alert('Logged out', 'You have been logged out.');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.card}>
        <Text style={styles.title}>Welcome!</Text>
        {user && <Text style={styles.subtitle}>{user.email}</Text>}
        <Text style={styles.body}>Ready to work out?</Text>
      </Card>

      <Button
        title={isLoggingOut ? 'Logging out...' : 'Logout'}
        onPress={handleLogout}
        disabled={isLoggingOut}
        variant="destructive"
        style={styles.logoutButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
  },
  loadingText: {
    ...typography.body,
    textAlign: 'center',
  },
  logoutButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
});
